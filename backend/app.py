import traceback
import boto3 # Added for AWS Textract
from botocore.exceptions import NoRegionError
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import os
import csv # DBS CSV reader
from datetime import datetime
import openpyxl
import pdfplumber  # DBS PDF Reader
import pandas as pd  # Standard chart XLSV Readers
import re

from decimal import Decimal, InvalidOperation
from dateutil import parser as dateparser

from gevent.pool import pass_value

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Change this to a secure key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expense_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

CORS(app)
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Initialize AWS Textract client
# Ensure your AWS credentials are configured (e.g., via environment variables or ~/.aws/credentials)
# try:
#     textract_client = boto3.client('textract')
# except Exception as e:
#     # print(f"Error initializing Textract client: {e}")
#     textract_client = None # Handle case where client cannot be initialized

def _make_textract_client():
    region = (
        os.getenv("AWS_REGION")
        or os.getenv("AWS_DEFAULT_REGION")
        or "ap-southeast-1"   # change if you use another region
    )
    return boto3.client("textract", region_name=region)

try:
    textract_client = _make_textract_client()
except NoRegionError:
    raise RuntimeError(
        "AWS region not configured. Set AWS_REGION or AWS_DEFAULT_REGION (e.g. ap-southeast-1)."
    )
except Exception as e:
    raise RuntimeError(f"Failed to init Textract client: {e}")

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class BankFileFormat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)


class UserFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    bank_file_format_id = db.Column(db.Integer, db.ForeignKey('bank_file_format.id'), nullable=False)
    file_url = db.Column(db.String(200), nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_date = db.Column(db.DateTime, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    remarks_1 = db.Column(db.String(200))
    remarks_2 = db.Column(db.String(200))
    user_file_id = db.Column(db.Integer, db.ForeignKey('user_file.user_id'), nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)


# Create tables and initialize file formats
with app.app_context():
    # db.drop_all()  # Deletes all tables
    db.create_all()  # Recreates tables with the new schema

    
    if BankFileFormat.query.count() == 0:
        db.session.add(BankFileFormat(name='DBS Savings Account (CSV)'))
        db.session.add(BankFileFormat(name='DBS Credit Card (PDF)'))
        db.session.add(BankFileFormat(name='Standard Chartered Credit Card (XSLX)'))
        db.session.commit()


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"message": "Invalid email format"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully!"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    if user and bcrypt.check_password_hash(user.password, data["password"]):
        access_token = create_access_token(identity=user.email)
        refresh_token = create_refresh_token(identity=user.email)
        return jsonify(access_token=access_token, refresh_token=refresh_token)
    return jsonify({"error": "Invalid email or password"}), 401


def get_current_user():
    """Retrieve the currently authenticated user from JWT."""
    user_email = get_jwt_identity()
    return User.query.filter_by(email=user_email).first()

@app.route("/bank-file-formats", methods=["GET"])
def get_bank_file_formats():
    bank_file_formats = BankFileFormat.query.all()
    return jsonify([{"id": bff.id, "name": bff.name} for bff in bank_file_formats])


def _get_user_file(f):
    transactions = Transaction.query.filter_by(user_file_id=f.id).all()
    transactions_data = [{
        "id": t.id,
        "transaction_date": t.transaction_date.strftime('%Y-%m-%d'),
        "amount": t.amount,
        "remarks_1": t.remarks_1,
        "remarks_2": t.remarks_2
    } for t in transactions]

    return {
            "id": f.id,
            "file_format": BankFileFormat.query.get(f.bank_file_format_id).name,
            "file_url": f.file_url,
            "created_on": f.created_on.strftime('%Y-%m-%d'),
            "transactions": transactions_data,
            "no_of_transactions": len(transactions_data)
        }

@app.route("/user-files", methods=["GET"])
@app.route("/user-files/<int:user_file_id>", methods=["GET"])
@app.route("/user-files/<int:user_file_id>", methods=["DELETE"])
@jwt_required()
def get_user_files(user_file_id=None):
    user = get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user_file_id:
        if request.method == 'GET':
            f = UserFile.query.filter_by(id=user_file_id, user_id=user.id).first()
            return jsonify(_get_user_file(f))
        elif request.method == 'DELETE':
            Transaction.query.filter_by(user_file_id=user_file_id).delete()
            user_file = UserFile.query.filter_by(id=user_file_id, user_id=user.id)
            os.remove(user_file.first().file_url)
            user_file.delete()
            db.session.commit()
            return jsonify({"message": "File deletion success"}), 200
        else:
            return f"invalid request", 400

    else:
        file_uploads = UserFile.query.filter_by(user_id=user.id).all()
        result = []
        for f in file_uploads:
            result.append(_get_user_file(f))

        return jsonify(result)

@app.route("/upload-user-file", methods=["POST"])
@jwt_required()
def upload_user_file():
    user = get_current_user()
    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files['file']
    bank_file_format_id = request.form.get('bank_file_format_id')

    if not bank_file_format_id or not bank_file_format_id.isdigit():
        return jsonify({"message": "Invalid file format"}), 400

    bank_file_format_id = int(bank_file_format_id)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = os.path.join(app.config['UPLOAD_FOLDER'], f"{timestamp}_{file.filename}")
    file.save(filename)

    # After saving, you might want to check if the file was actually saved
    if not os.path.exists(filename):
        return jsonify({"message": "Failed to save the file"}), 500


    try:
        user_file = UserFile(user_id=user.id, bank_file_format_id=bank_file_format_id, file_url=filename)
        db.session.add(user_file)
        db.session.commit()

        if bank_file_format_id == 1:
            parse_dbs_csv_transactions(user_file.id, filename)
        elif bank_file_format_id == 2:
            parse_sc_transactions(user_file.id, filename)
        elif bank_file_format_id == 3:
            parse_dbs_pdf_transactions(user_file.id, filename)
    except Exception as e:
        print(e)
        print(traceback.format_exc())
        if os.path.exists(filename):
            os.remove(file_path) # Corrected to remove the saved file
        return f"An error occurred: {str(e)}", 500
        # pass
        # todo: to remove the file in case any error happens

    print("befopre commit")
    db.session.commit()

    # return jsonify({"message": "File uploaded and processed", "file_id": new_upload.id})
    return jsonify({"message": "File uploaded and processed"})

# --- New Endpoint for Receipt Parsing ---
@app.route("/parse-receipt", methods=["POST"])
@jwt_required()
def parse_receipt():
    """
    Handles receipt file upload, sends it to Amazon Textract for analysis,
    and returns structured expense data.
    """
    user = get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    f = request.files.get("receipt")
    if not f:
        return jsonify({"message": "No receipt file uploaded"}), 400

    file_bytes = f.read()
    try:
        # Call Amazon Textract API
        resp = textract_client.analyze_expense(Document={"Bytes": file_bytes})
    except Exception as e:
        return jsonify({"message": f"Error calling Textract: {e}"}), 500

    # --- Start of the updated parsing logic ---
    try:
        docs = resp.get("ExpenseDocuments", [])
        if not docs:
            return jsonify({"message": "No expense documents found in the response."}), 400

        summary = docs[0].get("SummaryFields", [])

        # Helper function to find a field's value by its type
        def _get(type_name: str):
            for sf in summary:
                if (sf.get("Type") or {}).get("Text") == type_name:
                    return (sf.get("ValueDetection") or {}).get("Text")
            return None

        # 1. Define more comprehensive key lists (ordered by priority)
        TOTAL_KEYS = ["TOTAL", "GRAND_TOTAL", "AMOUNT_DUE", "TOTAL_DUE", "AMOUNT"]
        DATE_KEYS = ["INVOICE_RECEIPT_DATE", "PURCHASE_DATE", "TRANSACTION_DATE", "DATE", "DUE_DATE"]
        RECEIPT_ID_KEYS = ["INVOICE_RECEIPT_ID", "RECEIPT_NO", "INVOICE_ID", "REFERENCE_NUMBER"]
        VENDOR_KEYS = ["VENDOR_NAME", "MERCHANT_NAME", "STORE_NAME", "VENDOR"]
        CURRENCY_KEYS = ["CURRENCY", "CURRENCY_CODE"]

        # Helper to find the first value from a list of possible keys
        def find_first_value(keys_list):
            for key in keys_list:
                value = _get(key)
                if value:
                    return value
            return None

        # 2. Find the raw text for each field
        total_text = find_first_value(TOTAL_KEYS)
        date_text = find_first_value(DATE_KEYS)
        receipt_id_text = find_first_value(RECEIPT_ID_KEYS)
        vendor_text = find_first_value(VENDOR_KEYS)
        currency_text = find_first_value(CURRENCY_KEYS)

        # 3. Parse and clean the extracted text
        total_amount = None
        if total_text:
            # Find the first decimal number in the string to handle cases like "CASH $15.50"
            match = re.search(r'(\d{1,3}(?:,\d{3})*(\.\d{2})?|\d+(\.\d{2})?)', total_text)
            if match:
                try:
                    amount_str = match.group(1).replace(",", "")
                    total_amount = float(Decimal(amount_str))
                except (InvalidOperation, ValueError):
                    total_amount = None

        receipt_date = None
        if date_text:
            try:
                # 'PREFER_DATES_FROM': 'past' helps resolve dates like "Aug 20" correctly
                parsed_dt = dateparser.parse(date_text, settings={'PREFER_DATES_FROM': 'past'})
                if parsed_dt:
                    receipt_date = parsed_dt.date().isoformat()
            except Exception:
                receipt_date = date_text  # Fallback to raw text

        currency = currency_text.strip() if currency_text else None
        if not currency and total_text:
            if '$' in total_text: currency = 'USD'
            elif '€' in total_text: currency = 'EUR'
            elif '£' in total_text: currency = 'GBP'
            else:
                match = re.search(r'\b([A-Z]{3})\b', total_text)
                if match:
                    currency = match.group(1)

        receipt_id = receipt_id_text.strip() if receipt_id_text else None
        vendor_name = vendor_text.strip() if vendor_text else None

    except Exception as e:
        return jsonify({"message": f"Error processing receipt response: {e}"}), 500

    # 4. Return the final structured data
    return jsonify({
        "vendor_name": vendor_name,
        "receipt_id": receipt_id,
        "date": receipt_date,
        "amount": total_amount,
        "currency": currency
    })

def parse_date(date_str):
    """Convert a date string to a datetime object."""
    return datetime.strptime(date_str, '%d %b %Y')

def parse_dbs_pdf_date(date_str):
    """Convert a date string to a datetime object."""
    dt = datetime.strptime(date_str, "%d %b")
    return dt.replace(year=datetime.now().year)
    # return datetime.strptime(date_str, '%d %b')

def parse_sc_date(date_str):
    try:
        # Use pandas to parse dates as it's more robust and can handle multiple formats
        return datetime.strptime(date_str, '%d %b')
    except Exception as e:
        print(f"Error parsing date: {e}")
        return None

def parse_dbs_csv_transactions(user_file_id, file_path):
    # Check if the file exists
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return "File not found", 400

    transactions = []
    with open(file_path, 'r', newline='' , encoding='utf-8') as csvfile:
        reader = csv.reader((line for line in csvfile if line.strip()), delimiter=',')
        next(reader)
        for row_number, row in enumerate(reader, start=2):  # Start from row 2 for Google Sheets
            if len(row) >= 8:
                try:
                    date = row[0].strip()
                    debit = float(row[2].strip()) if row[2].strip() else 0.0
                    credit = float(row[3].strip()) if row[3].strip() else 0.0
                    amount = credit - debit
                    remarks = row[4].strip()
                    transaction = Transaction(
                        transaction_date=parse_date(date),
                        amount=amount,
                        remarks_1=remarks,
                        user_file_id=user_file_id
                    )

                    db.session.add(transaction)
                except Exception as e:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    return f"An error occurred: {str(e)}", 500


def parse_dbs_pdf_transactions(user_file_id, file_path):
    # Check if the file exists
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return "File not found", 400
    
    transactions = []
    with pdfplumber.open(file_path) as pdf_file:
        # Loop through each page of the PDF
        for page in pdf_file.pages:
            text = page.extract_text()

            # Split the text into individual lines
            lines = text.split('\n')

            # Define a regex pattern to find transaction lines
            # A transaction line starts with a date (e.g., "DD MMM") and ends with a dollar amount
            # The pattern is: Date (DD MMM) + Description + Amount ($) + optional 'CR'
            pattern = re.compile(r'(\d{2} [A-Z]{3})\s+([A-Z\s\d.-/]+?)\s+([\d,]+\.\d{2})\s*(CR)?')

            for line in lines:
                match = pattern.search(line.strip())
                if match:
                    # Extract date, description, amount, and type (Credit/Debit)
                    date = match.group(1)
                    print(date)
                    description = match.group(2).strip()
                    amount = float(match.group(3).replace(',', ''))

                    # Check if it's a credit or debit based on the 'CR' at the end of the line
                    is_credit = bool(match.group(4))
                    if is_credit:
                        amount = amount * -1

                    transaction = Transaction(
                        transaction_date=parse_dbs_pdf_date(date),
                        amount=amount,
                        remarks_1=description,
                        user_file_id=user_file_id
                    )
                    print("inserting")
                    print(transaction)

                    db.session.add(transaction)

    

#  parse standard charted bank xlxs file

# Function to process amount and handle 'CR'
def process_amount(value):
    """Convert 'CR' to positive (credited) and others to negative (debited)."""
    if isinstance(value, str) and "CR" in value:
        value = value.replace(',', '').replace('CR', '').strip()
        return abs(float(value.strip()))
    try:
        return -abs(float(value))  # Debit amounts are negative
    except ValueError:
        return 0.0  # Handle errors gracefully

# Read all sheets from the XLSX file


required_columns = {'Posting Date', 'Description'}  # Set for quick comparison

# Column indexes for Table 1 and Table 2
column_indexs = {
    "Table 1": {
        "transaction_date": 0,
        "description_1": 3,
        "description_2": 10,
        "amount": 14,
    },
    "Table 2": {
        "transaction_date": 0,
        "description_1": 2,
        "description_2": 3,
        "amount": 4,
    }
}



def parse_sc_transactions(user_file_id, file_path):
    xls = pd.ExcelFile(file_path, engine='openpyxl')
    # Process each sheet
    for sheet_name in xls.sheet_names:
        print(f"Processing sheet: {sheet_name}")
        if False and not sheet_name == 'Table 2':
            print("skipping {}".format(sheet_name))
            continue

        df = pd.read_excel(xls, sheet_name=sheet_name, engine='openpyxl')
        column_indexs = {
            "Table 1": {
                "transaction_date": 0,
                "description_1": 3,
                "description_2": 10,
                "amount": 14,
            },
            "Table 2": {
                "transaction_date": 0,
                "description_1": 2,
                "description_2": 3,
                "amount": 4,
            }
        }
        transactions = []
        if sheet_name in column_indexs:
            for idx, row in df.iterrows():
                try:
                    raw_date= row.iloc[column_indexs[sheet_name]['transaction_date']]
                    transaction_date = parse_sc_date(str(raw_date))  # Expects format like "16 Nov"
                    if not transaction_date:
                        print(f"Failed to parse date {raw_date} in row {idx + 1} of {sheet_name}")
                        continue
                except ValueError:
                    transaction_date = None
                except TypeError:
                    transaction_date = None
                if transaction_date:
                    values = []
                    # Convert date properly
                    if isinstance(transaction_date, str):
                        try:
                            transaction_date = datetime.strptime(transaction_date, "%d %b").strftime(
                                '%Y-%m-%d')  # Format like "16 Nov"
                        except ValueError:
                            print(f"Invalid date format in row {idx + 2} of {sheet_name}: {transaction_date}")
                            transaction_date = ""
                    elif pd.notna(transaction_date):
                        transaction_date = pd.to_datetime(transaction_date, errors='coerce').strftime('%Y-%m-%d')
                    else:
                        transaction_date = ""

                    date = transaction_date
                    description = row.iloc[column_indexs[sheet_name]['description_1']]
                    values.append(description)
                    money = row.iloc[column_indexs[sheet_name]['amount']]
                    # Process amount correctly
                    if money != "nan" or money != " ":
                        amount = process_amount(money)
                    # transactions.append([date, amount, description])

                    transaction = Transaction(
                        transaction_date=transaction_date,
                        amount=amount,
                        remarks_1=description,
                        user_file_id=user_file_id
                    )

                    db.session.add(transaction)

    # df = pd.read_excel(file_path, engine='openpyxl')
    # for _, row in df.iterrows():
    #     date = datetime.strptime(row.iloc[0], '%d %b')
    #     description = row.iloc[2]
    #     amount = float(row.iloc[4]) if pd.notna(row.iloc[4]) else 0.0
    #     transaction = Transaction(transaction_date=date, amount=amount, remarks_1=description,
    #                               user_file_id=user_file_id)
    #     db.session.add(transaction)


if __name__ == "__main__":
    app.run(debug=True)

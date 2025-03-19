from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import re
import os
import pandas as pd
import csv
from datetime import datetime

from gevent.pool import pass_value

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Change this to a secure key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expense_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

CORS(app)
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class FileFormat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)


class FileUpload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    file_format_id = db.Column(db.Integer, db.ForeignKey('file_format.id'), nullable=False)
    file_url = db.Column(db.String(200), nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_date = db.Column(db.DateTime, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    remarks_1 = db.Column(db.String(200))
    remarks_2 = db.Column(db.String(200))
    file_upload_id = db.Column(db.Integer, db.ForeignKey('file_upload.id'), nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)


# Create tables and initialize file formats
with app.app_context():
    # db.drop_all()  # Deletes all tables
    db.create_all()  # Recreates tables with the new schema
    if FileFormat.query.count() == 0:
        db.session.add(FileFormat(name='DBS Savings Account'))
        db.session.add(FileFormat(name='Standard Chartered Credit Card'))
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
    return jsonify({"message": "Invalid credentials"}), 401


def get_current_user():
    """Retrieve the currently authenticated user from JWT."""
    user_email = get_jwt_identity()
    return User.query.filter_by(email=user_email).first()

@app.route("/file-formats", methods=["GET"])
def get_file_formats():
    formats = FileFormat.query.all()
    return jsonify([{"id": f.id, "name": f.name} for f in formats])


def _get_file_upload(f):
    transactions = Transaction.query.filter_by(file_upload_id=f.id).all()
    transactions_data = [{
        "id": t.id,
        "transaction_date": t.transaction_date.strftime('%Y-%m-%d'),
        "amount": t.amount,
        "remarks_1": t.remarks_1,
        "remarks_2": t.remarks_2
    } for t in transactions]

    return {
            "id": f.id,
            "file_format": FileFormat.query.get(f.file_format_id).name,
            "file_url": f.file_url,
            "created_on": f.created_on.strftime('%Y-%m-%d'),
            "transactions": transactions_data
        }

@app.route("/file-uploads", methods=["GET"])
@app.route("/file-uploads/<int:file_id>", methods=["GET"])
@jwt_required()
def get_file_uploads(file_id=None):
    user = get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    if file_id:
        f = FileUpload.query.filter_by(id=file_id, user_id=user.id).first()
        return jsonify(_get_file_upload(f))
    else:
        file_uploads = FileUpload.query.filter_by(user_id=user.id).all()
        result = []
        for f in file_uploads:
            result.append(_get_file_upload(f))

        return jsonify(result)

@app.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    user = get_current_user()
    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files['file']
    file_format_id = request.form.get('file_format_id')

    if not file_format_id or not file_format_id.isdigit():
        return jsonify({"message": "Invalid file format"}), 400

    file_format_id = int(file_format_id)
    filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filename)

    try:
        new_upload = FileUpload(user_id=user.id, file_format_id=file_format_id, file_url=filename)
        db.session.add(new_upload)

        if file_format_id == 1:
            parse_dbs_transactions(new_upload.id, filename)
        elif file_format_id == 2:
            parse_sc_transactions(new_upload.id, filename)
    except Exception as e:
        pass
        # todo: to remove the file in case any error happens


    db.session.commit()

    return jsonify({"message": "File uploaded and processed", "file_id": new_upload.id})


def parse_dbs_transactions(file_upload_id, file_path):
    transactions = []
    with open(file_path, mode='r', newline='') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)
        for row in reader:
            date = datetime.strptime(row[0].strip(), '%Y-%m-%d')
            debit = float(row[2].strip()) if row[2].strip() else 0.0
            credit = float(row[3].strip()) if row[3].strip() else 0.0
            amount = credit - debit
            remarks = row[4].strip()
            transaction = Transaction(transaction_date=date, amount=amount, remarks_1=remarks,
                                      file_upload_id=file_upload_id)
            db.session.add(transaction)


def parse_sc_transactions(file_upload_id, file_path):
    df = pd.read_excel(file_path, engine='openpyxl')
    for _, row in df.iterrows():
        date = datetime.strptime(row.iloc[0], '%d %b')
        description = row.iloc[2]
        amount = float(row.iloc[4]) if pd.notna(row.iloc[4]) else 0.0
        transaction = Transaction(transaction_date=date, amount=amount, remarks_1=description,
                                  file_upload_id=file_upload_id)
        db.session.add(transaction)


if __name__ == "__main__":
    app.run(debug=True)

import math

import pandas as pd
import openpyxl
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import numpy as np

# Configuration
XLSX_FILE_PATH = "/Users/arulvasukisrinivasan/PycharmProjects/xlsx/eStatement_Standard Chartered Credit Card_9960_SGD_Nov_2024.xlsx"
CREDENTIALS_FILE = "/Users/arulvasukisrinivasan/PycharmProjects/expenses-tracker-450506-d060c70cd70b.json"
SHEET_NAME = "family_expense_2025_sheet"
NEW_SHEET_TITLE = "Standard_chartered_CSV"

# Authenticate and open Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/spreadsheets",
         "https://www.googleapis.com/auth/drive"]
credentials = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scope)
client = gspread.authorize(credentials)
spreadsheet = client.open(SHEET_NAME)

# Check if the worksheet exists, else create it
try:
    sheet = spreadsheet.worksheet(NEW_SHEET_TITLE)
except gspread.exceptions.WorksheetNotFound:
    sheet = spreadsheet.add_worksheet(title=NEW_SHEET_TITLE, rows="100", cols="20")

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
xls = pd.ExcelFile(XLSX_FILE_PATH, engine='openpyxl')

transactions = []
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
                transaction_date = row.iloc[column_indexs[sheet_name]['transaction_date']]
                transaction_date = datetime.strptime(transaction_date, "%d %b")  # Expects format like "16 Nov"
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
                transactions.append([date, amount, description])


    # Write headers
    headers = [["Date", "Amount", "Remarks"]]
    sheet.update(range_name="A1:C1", values=headers)

    # Write transactions to Google Sheets
    if transactions:
        start_row = 2
        data_range = f"A{start_row}:C{start_row + len(transactions) - 1}"
        # sheet.update(range_name=data_range, values=transactions)
        batch_size = 100  # Adjust batch size if needed
        start_row = 2  # Data starts from row 2

        for i in range(0, len(transactions), batch_size):
            batch = [[str(item) if pd.notna(item) else "" for item in row] for row in transactions[i: i + batch_size]]
            row_range = f"A{start_row + i}:C{start_row + i + len(batch) - 1}"
            sheet.update(range_name=row_range, values=batch)
            # print(f"Updated rows {start_row + i} to {start_row + i + len(batch) - 1}")

        # Calculate totals
        # debited_sum = sum(abs(t[1]) for t in transactions if t[1] < 0)
        # credited_sum = sum(t[1] for t in transactions if t[1] > 0)
        # total_spent = debited_sum
        #
        # # Write summary values
        # summary_row = len(transactions) + start_row
        # summary_values = [
        #     ["Debited", debited_sum],
        #     ["Credited Money", credited_sum],
        #     ["Total Money Spent (This Month)", total_spent]
        # ]
        # sheet.update(range_name=f"A{summary_row}:B{summary_row + 2}", values=summary_values)

        print(f"Processing completed; {len(transactions)} rows added to Google Sheets.")
    else:
        print("No valid transactions found.")









#     # Process valid rows
#     for idx, row in df.iterrows():
#         try:
#             transaction_date = None
#             # Convert date properly
#             if isinstance(transaction_date, str):
#                 try:
#                     transaction_date = datetime.strptime(transaction_date, "%d %b").strftime(
#                         '%Y-%m-%d')  # Format like "16 Nov"
#                 except ValueError:
#                     print(f"Invalid date format in row {idx + 2} of {sheet_name}: {transaction_date}")
#                     transaction_date = ""
#             elif pd.notna(transaction_date):
#                 transaction_date = pd.to_datetime(transaction_date, errors='coerce').strftime('%Y-%m-%d')
#             else:
#                 transaction_date = ""
#
#             if transaction_date:
#                 # Extract other columns
#                 description_1 = str(row.iloc[column_indexs[sheet_name]['description_1']]).strip()
#                 description_2 = str(row.iloc[column_indexs[sheet_name]['description_2']]).strip()
#
#                 # Process amount correctly
#                 amount_index = column_indexs[sheet_name]['amount']
#                 amount = process_amount(str(row.iloc[amount_index]) if pd.notna(row.iloc[amount_index]) else "0")
#
#                 # Prepare remarks
#                 remarks = description_1 if description_1 else description_2 if description_2 else "credited" if amount > 0 else "debit"
#
#                 # Append transaction
#                 transactions.append([transaction_date, amount, remarks])
#                 print(f"Added transaction: {transaction_date}, {amount}, {remarks}")
#                 print("total transactions - {}".format(len(transactions)))
#
#         except (ValueError, IndexError) as e:
#             print(f"Skipping invalid row {idx + 2} in sheet '{sheet_name}': {e}")
#
# # Write headers
# headers = [["Date", "Amount", "Remarks"]]
# sheet.update(range_name="A1:C1", values=headers)
#
# # Write transactions to Google Sheets
# if transactions:
#     start_row = 2
#     data_range = f"A{start_row}:C{start_row + len(transactions) - 1}"
#     sheet.update(range_name=data_range, values=transactions)
#
#     # Calculate totals
#     debited_sum = sum(abs(t[1]) for t in transactions if t[1] < 0)
#     credited_sum = sum(t[1] for t in transactions if t[1] > 0)
#     total_spent = debited_sum
#
#     # Write summary values
#     summary_row = len(transactions) + start_row
#     summary_values = [
#         ["Debited", debited_sum],
#         ["Credited Money", credited_sum],
#         ["Total Money Spent (This Month)", total_spent]
#     ]
#     sheet.update(range_name=f"A{summary_row}:B{summary_row + 2}", values=summary_values)
#
#     print("Data successfully written to Google Sheets.")
# else:
#     print("No valid transactions found.")

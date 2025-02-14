# import csv
# import gspread
# from google.oauth2.service_account import Credentials
#
# # Configuration
# CSV_FILE_PATH = '/Users/arulvasukisrinivasan/PycharmProjects/csv/c37f5e607f0a3967f9a0f43ff87c2612.P000000026720420.csv'
# CREDENTIALS_FILE = '/Users/arulvasukisrinivasan/PycharmProjects/expenses-tracker-450506-d060c70cd70b.json'
# SHEET_NAME = 'family_expense_2025_sheet'
#
# # Authenticate and open Google Sheets
# scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/spreadsheets",
#          "https://www.googleapis.com/auth/drive"]
# credentials = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scope)
# client = gspread.authorize(credentials)
# sheet = client.open(SHEET_NAME).sheet1
#
# transactions = []
#
# # Read CSV data
# with open(CSV_FILE_PATH, mode='r', newline='') as csvfile:
#     reader = csv.reader(csvfile)
#     next(reader)  # Skip the header row if present
#     for row_number, row in enumerate(reader, start=2):  # Start from row 2 for Google Sheets
#         print(f"Row {row_number}: {row}")  # Debugging to inspect rows
#
#         if len(row) >= 7:  # Ensure there are enough columns in each row
#             try:
#                 date = row[0].strip()
#                 description = row[1].strip()
#                 debit = float(row[2].strip()) if row[2].strip() else 0.0
#                 credit = float(row[3].strip()) if row[3].strip() else 0.0
#                 amount = credit - debit
#                 remarks = f"{row[4].strip()} {row[5].strip()} {row[6].strip()}".strip()
#                 transactions.append([date, amount, remarks])
#             except ValueError:
#                 print(f"Skipping invalid row {row_number}: {row}")
#                 continue
#
# # Write transactions to Google Sheets
# if transactions:
#     start_row = 2  # Assuming row 1 has headers
#     data_range = f"A{start_row}:C{start_row + len(transactions) - 1}"
#     sheet.update(range_name=data_range, values=transactions)
#
#     # Calculate and write totals
#     total_amount = sum(t[1] for t in transactions)
#     total_row = len(transactions) + start_row
#     sheet.update(range_name=f"A{total_row}:B{total_row}", values=[["Total", total_amount]])
#
#     print("Data successfully written to Google Sheets.")
# else:
#     print("No valid transactions found.")


################################################

import csv
import gspread
from google.oauth2.service_account import Credentials

# Configuration
CSV_FILE_PATH = '/Users/arulvasukisrinivasan/PycharmProjects/csv/c37f5e607f0a3967f9a0f43ff87c2612.P000000026720420.csv'
CREDENTIALS_FILE = '/Users/arulvasukisrinivasan/PycharmProjects/expenses-tracker-450506-d060c70cd70b.json'
SHEET_NAME = 'family_expense_2025_sheet'

# Authenticate and open Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/spreadsheets",
         "https://www.googleapis.com/auth/drive"]
credentials = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scope)
client = gspread.authorize(credentials)
sheet = client.open(SHEET_NAME).sheet1

transactions = []

# Read CSV data
with open(CSV_FILE_PATH, mode='r', newline='') as csvfile:
    reader = csv.reader(csvfile)
    next(reader)  # Skip the header row if present
    for row_number, row in enumerate(reader, start=2):  # Start from row 2 for Google Sheets
        if len(row) >= 7:  # Ensure there are enough columns in each row
            try:
                date = row[0].strip()
                description = row[1].strip()
                debit = float(row[2].strip()) if row[2].strip() else 0.0
                credit = float(row[3].strip()) if row[3].strip() else 0.0
                amount = credit - debit
                remarks = f"{row[4].strip()} {row[5].strip()} {row[6].strip()}".strip()
                transactions.append([date, amount, remarks])
            except ValueError:
                print(f"Skipping invalid row {row_number}: {row}")
                continue

# Write headers
headers = [["Date", "Amount", "Remarks"]]
sheet.update("A1:C1", headers)

# Write transactions to Google Sheets
if transactions:
    start_row = 2  # Data starts after headers
    data_range = f"A{start_row}:C{start_row + len(transactions) - 1}"
    sheet.update(range_name=data_range, values=transactions)

    # Calculate totals
    debited_sum = sum(abs(t[1]) for t in transactions if t[1] < 0)
    credited_sum = sum(t[1] for t in transactions if t[1] > 0)
    total_spent = debited_sum

    # Write summary values
    summary_row = len(transactions) + start_row
    summary_values = [
        ["Debited", debited_sum],
        ["Credited Money", credited_sum],
        ["Total Money Spent (This Month)", total_spent]
    ]
    sheet.update(f"A{summary_row}:B{summary_row + 2}", summary_values)

    print("Data successfully written to Google Sheets.")
else:
    print("No valid transactions found.")


# Standard charteed bank credit card csv format
import csv
from datetime import datetime

import gspread
from google.oauth2.service_account import Credentials

# Configuration
CSV_FILE_PATH = '/Users/arulvasukisrinivasan/PycharmProjects/csv/eStatement_Standard Chartered Credit Card_9960_SGD_Nov_2024.csv'
CREDENTIALS_FILE = '/Users/arulvasukisrinivasan/PycharmProjects/expenses-tracker-450506-d060c70cd70b.json'
SHEET_NAME = 'family_expense_2025_sheet'
NEW_SHEET_TITLE = 'Standard_chartered_CSV'  # Name for Sheet 2

# Authenticate and open Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/spreadsheets",
         "https://www.googleapis.com/auth/drive"]
credentials = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scope)
client = gspread.authorize(credentials)
spreadsheet = client.open(SHEET_NAME)
#sheet = client.open(SHEET_NAME).sheet1

# Check if Sheet 2 exists, else create it
try:
    sheet = spreadsheet.worksheet(NEW_SHEET_TITLE)
except gspread.exceptions.WorksheetNotFound:
    sheet = spreadsheet.add_worksheet(title=NEW_SHEET_TITLE, rows="100", cols="20")

transactions = []

def process_amount(value):
    """Process the value if value have CR convert to postive number(credited)"""
    if "CR" in value:
        #Remove 'CR' and convert to postive value
        return abs(float(value.replace(" CR", "").strip()))
    else:
        # Convert to negative value
        return -abs(float(value.strip()))


# Read CSV data
with open(CSV_FILE_PATH, mode='r', newline='') as csvfile:
    reader = csv.reader(csvfile)
    # Skip the first 15 rows
    for _ in range(16):
        next(reader)
    # next(reader)  # Skip the header row if present
    for row_number, row in enumerate(reader, start=17):  # Start from row 2 for Google Sheets
        if len(row) >= 15:  # Ensure there are enough columns in each row
            try:

                date = row[0].strip()
                description = row[3].strip()
                amount = process_amount(row[14]) if row[14].strip() else 0.0
                remarks = description if description else "credited" if amount < 0 else "debit"

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
    total_spent = debited_sum + credited_sum  # Sum to get net spend

    # Write summary values
    summary_row = len(transactions) + start_row
    summary_values = [
        ["Debited", debited_sum],
        ["Credited Money", credited_sum],
        ["Total Money Spent (This Month)", total_spent]
    ]
    sheet.update(f"A{summary_row}:B{summary_row + 2}", summary_values)

    print(f"Data successfully written to '{NEW_SHEET_TITLE}'.")
else:
    print("No valid transactions found.")


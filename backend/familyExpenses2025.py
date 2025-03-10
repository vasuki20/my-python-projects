import pandas as pd #csv reader
import pdfplumber  #pdf reader
import gspread # google sheet
from google.oauth2.service_account import Credentials

# Google Sheets setup
SHEET_NAME = 'family_expense_2025_sheet'  #google sheet name
CREDENTIALS_FILE = '/Users/arulvasukisrinivasan/PycharmProjects/expenses-tracker-450506-d060c70cd70b.json'

# Define your spending categories
CATEGORIES = ['Travel', 'Food', 'Outings', 'Entertainment', 'shopping', 'Medical', 'Grocery', 'PUB', 'Mobile & Internet', 'School fees', 'Misc']

# Load Google Sheets
credentials = Credentials.from_service_account_file(CREDENTIALS_FILE)
scoped_credentials = credentials.with_scopes([
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
])
client = gspread.authorize(scoped_credentials)
sheet = client.open(SHEET_NAME).sheet1

# Read CSV Data
def read_csv_file(file_path):
    df = pd.read_csv(file_path)
    df = df.fillna('')
    print("CSV Data:\n", df.head())
    return df

# Extract Data from PDF
def read_pdf_file(file_path):
    pdf_data = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pdf_data.extend(text.split('\n'))
    print("PDF Data:\n", pdf_data[:5])  # Display sample data
    return pdf_data

# Categorize and summarize expenses
def categorize_expenses(data, categories):
    category_totals = {category: 0 for category in categories}

    for entry in data:
        entry_lower = entry.lower()
        for category in categories:
            if category.lower() in entry_lower:
                # Extract amount (assuming last element in entry is the amount)
                amount = extract_amount(entry)
                category_totals[category] += amount

    return category_totals

# Extract numeric amounts from text
def extract_amount(text):
    import re
    match = re.search(r'\d+(\.\d{1,2})?', text)
    return float(match.group()) if match else 0.0

# Write data to Google Sheets
def update_google_sheet(sheet, data):
    sheet.clear()
    sheet.append_row(["Category", "Amount"])
    for category, amount in data.items():
        sheet.append_row([category, amount])
    print("Data successfully written to Google Sheets!")

# Main Function
def main():
    #csv_file_path = '/Users/arulvasukisrinivasan/PycharmProjects/expense_csv_files/expense.csv'
    pdf_file_path = '/Users/arulvasukisrinivasan/PycharmProjects/pdf/f2a7fc22-3a6b-42e8-8621-95acbc42d975.pdf'

    # Read and process files
    #csv_data = read_csv_file(csv_file_path)
    pdf_data = read_pdf_file(pdf_file_path)

    # Combine data for categorization
   # all_data = csv_data.values.flatten().tolist() + pdf_data
    #all_data = csv_data.values.flatten().tolist() # csv only
    all_data = pdf_data #pdf only

    # Categorize expenses
    categorized_expenses = categorize_expenses(all_data, CATEGORIES)
    print("Categorized Expenses:\n", categorized_expenses)

    # Update Google Sheet
    update_google_sheet(sheet, categorized_expenses)

if __name__ == '__main__':
    main()


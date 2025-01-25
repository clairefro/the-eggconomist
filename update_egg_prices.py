import requests
import csv
from datetime import datetime
import os

# Constants
CSV_URL = "https://raw.githubusercontent.com/clairefro/the-eggconomist/refs/heads/main/egg_prices.csv"  
CSV_FILE = "egg_prices.csv"

def fetch_latest_csv():
    """Fetch the latest version of the CSV file from the GitHub raw URL."""
    response = requests.get(CSV_URL)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception("Failed to fetch CSV file from GitHub")

def get_last_row(csv_data):
    """Get the last row of the CSV data and extract {{year}}{{period}}."""
    reader = csv.reader(csv_data.strip().splitlines())
    rows = list(reader)
    if len(rows) > 1:  
        last_row = rows[-1]
        year, period = last_row[0], last_row[1] 
        return f"{year}{period}"
    else:
        return None  # no data in CSV yet

def fetch_egg_prices(api_key):
    """Fetch egg price data from the API."""
    eggs_series_id = "APU0000708111"  # BLS Series ID for Average Price: Eggs, Grade A, Large (Cost per Dozen) in U.S. City Average
    api_url = f"https://api.bls.gov/publicAPI/v2/timeseries/data/{eggs_series_id}?registrationkey={api_key}" 
    response = requests.get(api_url)
    if response.status_code == 200:
        return response.json()["Results"]["series"][0]["data"]  
    else:
        raise Exception("Failed to fetch data from API")

def get_latest_egg_price(egg_data):
    """Sort the egg data to get the latest entry based on year and period."""
    sorted_data = sorted(egg_data, key=lambda x: (x["year"], x["period"]), reverse=True)
    return sorted_data[0]  # Latest entry

def update_csv(file_path, new_data):
    """Append new data to the CSV file."""
    with open(file_path, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([new_data["year"], new_data["period"], new_data["value"], datetime.now().isoformat()])
    print("New data added:", new_data)

def commit_changes():
    """Commit changes to the CSV file."""
    import subprocess

    if os.getenv("GITHUB_ACTIONS") == "true":
        print("Running in GitHub Actions. Committing changes...")
        subprocess.run(["git", "config", "--global", "user.name", "GitHub Actions"])
        subprocess.run(["git", "config", "--global", "user.email", "actions@github.com"])
        subprocess.run(["git", "add", "egg_prices.csv"])
        subprocess.run(["git", "commit", "-m", "Update egg prices"])
        subprocess.run(["git", "push"])
    else:
        print("Not running in GitHub Actions. Skipping commit.")

def main():
    try:
        # Fetch the BLS API key from environment variables
        api_key = os.getenv("BLS_API_KEY")
        if not api_key:
            raise Exception("BLS_API_KEY environment variable is not set")

        # Fetch the latest CSV data from GitHub
        csv_data = fetch_latest_csv()
        last_row_key = get_last_row(csv_data)

        # Fetch egg price data from the BLS API
        egg_data = fetch_egg_prices(api_key)
        latest_egg_price_record = get_latest_egg_price(egg_data)
        latest_egg_key = f"{latest_egg_price_record['year']}{latest_egg_price_record['period']}"

        print(f"Latest egg price record: {latest_egg_price_record}")

        # Compare and update CSV if new data is available
        if not last_row_key or latest_egg_key > last_row_key:
            print(f"Result: Found new egg price, adding to csv: {latest_egg_price_record['year']}{latest_egg_price_record['period']} - {latest_egg_price_record['value']}")            
            update_csv(CSV_FILE, latest_egg_price_record)
            commit_changes()
        else:
            print("Result: No new data to add.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
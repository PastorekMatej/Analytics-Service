import requests
import json

url = "http://127.0.0.1:7860/api/v1/run/b6bb16ef-b9b6-4989-9f22-6bc0609ff6f6"
headers = {
    "Content-Type": "application/json"
}

# Request payload configuration
payload = {
    "input_value": "hello world!",  # The input value to be processed by the flow
    "output_type": "chat",  # Specifies the expected output format
    "input_type": "chat"  # Specifies the input format
            }

#Send API request
response = requests.request("POST", url,  headers = headers, json=payload)
# Status code
print(response.status_code)  # e.g., 200 for success

response.raise_for_status()  # Raise exception for bad status codes


data = response.json()  # Parse JSON string to Python dict
print(json.dumps(data, indent=4))  # Pretty print with 4-space indentation
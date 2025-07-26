import requests
import json

url = "http://localhost:5001/api/file"
headers = {
    "Content-Type": "application/json"
}

student_id = 'matejpastorek'

# Open and read the JSON file
with open(student_id + '.json','r') as file:
    messages = json.load(file)

# First create the input value object
input_value_obj = {
    "email": student_id,
    "messages": messages
}

# Convert it to a JSON string
payload = {
    "input_type": "chat",
    "input_value": json.dumps(input_value_obj),  # Convert to string
    "output_component": "StructuredOutput-O4NbH"
}


#Send API request
response = requests.request("POST", url,  headers = headers, json=payload)
# Status code
print(response.status_code)  # e.g., 200 for success

response.raise_for_status()  # Raise exception for bad status codes

data = response.json()  # Parse JSON string to Python dict
uploaded_path = data["uploaded_path"]
#print(json.dumps(data["outputs"][0]["outputs"][0]["outputs"]["message"]["message"], indent=4))  # Pretty print with 4-space indentation
print(uploaded_path)  # Pretty print with 4-space indentation

# Print the errors from the structured output
#print("\nErrors:")
#print(json.dumps(data["data"]["outputs"][0]["outputs"][0]["outputs"]["structured_output"]["message"]["results"][0]["errors"], indent=4))

run_url = "http://localhost:5001/api/run"
run_payload = {
    "input_value": "CHAT_INPUT",
    "output_type": "chat",
    "input_type": "chat",
    "tweaks": {
        "File-0y00S": {
            "path": uploaded_path
        }
    }
}

#Send API request
response = requests.request("POST", run_url,  headers = headers, json=run_payload)
data = response.json()  # Parse JSON string to Python dict
print(data)
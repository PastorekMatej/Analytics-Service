from fastapi import FastAPI 
from pydantic import BaseModel
import json
import requests
import os

app = FastAPI()

class AnalyticsRequests(BaseModel):
    input_type: str    
    input_value: str
    output_component: str



@app.post ("/api/file")
def Upload_file(payload: AnalyticsRequests):
    """
    Functions to read messages and store them in JSON file 
    database and transfer the file to an external LangFlow depository
    return the depisitory file path

    args:
    payload(AnalyticsRequest): JSON file received from REST client.
    These raw data are forwarded to the Langflow API Analytics module 

    return:
    data(dict):  forwarded data from  API Langflow Analytics module
    to the REST client

    """
    #Read the email adresse from the incomping FrontEnd JSON file
    access_email = json.loads(payload.input_value) #acess input value with . method cause payload and input value are pydantic FastAPI object
    #print(access_email["email"]) # accessing email adress using dictionnary method

    #Read messages from the incomping FrontEnd JSON file using hybrid pydantic and dict approach
    access_messages = json.loads(payload.input_value)["messages"]["conversations"] #acess input value with . method cause payload and input value are pydantic FastAPI object

    file_name = access_email["email"] + "_main_database.json"
    
    try:
        if os.path.exists(file_name) and os.path.getsize(file_name) > 0:
            print("File exists")
            #store new messages from the latest conversation sent by FrontEnd JSON file to the main JSON file 
            with open(file_name, "r") as outfile:          
                data = json.load(outfile)
                data["conversations"].extend(access_messages)

        else :
            print ("File does not exist or is empty")
            data = json.loads(payload.input_value)["messages"]   
            print(data)

    except json.JSONDecodeError as e:
        print(f"Error reading JSON file: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")   


    with open(file_name, "w") as outfile:
        json.dump(data, outfile, indent=2)
        print("JSON file saved successfully")

    print ("Hello0")
    urlfile="http://127.0.0.1:7860/api/v2/files/"
    payload_file = {}
    files = [
    ('file', ('matejpastorek.json', open('matejpastorek.json', 'rb'), 'application/octet-stream'))
    ]
    headers = {
    'Accept': 'application/json',
    }

    # 3. Upload the file to Langflow
    response = requests.request("POST", urlfile, headers=headers, data=payload_file, files=files)
    print(response.text)
    print("Hello2")

    # 4. Get the uploaded file path from the response
    uploaded_data = response.json()
    uploaded_path = uploaded_data.get('path')
    print(uploaded_path)
    print("Hello2")


    url = "http://127.0.0.1:7860/api/v1/run/b6bb16ef-b9b6-4989-9f22-6bc0609ff6f6"
    headers = {
    "Content-Type": "application/json"
    }

    response = requests.request("POST", url,  headers = headers, json = payload.dict())
    data = response.json()  # Parse JSON string to Python dict
    return {"data": data,"uploaded_path":uploaded_path}
    

    #print(json.dumps(data["outputs"][0]["outputs"][0]["outputs"]["message"]["message"], indent=4))  # Pretty print with 4-space indentation
    #print(json.dumps(data, indent=4))  # Pretty print with 4-space indentation

    # Print the errors from the structured output
    #print("\nErrors:")
    #print(json.dumps(data["outputs"][0]["outputs"][0]["outputs"]["structured_output"]["message"]["results"][0]["errors"], indent=4))


#Send API request
#response = requests.request("POST", url,  headers = headers, json=payload)
# Status code
#print(response.status_code)  # e.g., 200 for success

#response.raise_for_status()  # Raise exception for bad status codes

@app.post ("/api/run")
def Analytics_request(payload: AnalyticsRequests):
    response = requests.request("POST", url,  headers = headers, json = payload.dict())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("API_calls_FastAPI_upload_run:app", host = "0.0.0.0", port = 5001, reload = True)
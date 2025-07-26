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

@app.post ("/api/chat")
def Analytics_request(payload: AnalyticsRequests):

    #Read the email adresse from the incomping FrontEnd JSON file
    access_email = json.loads(payload.input_value) #acess input value with . method cause payload and input value are pydantic FastAPI object
    print(access_email["email"]) # accessing email adress using dictionnary method

    #Read messages from the incomping FrontEnd JSON file using hybrid pydantic and dict approach
    access_messages = json.loads(payload.input_value)["messages"]["conversations"] #acess input value with . method cause payload and input value are pydantic FastAPI object
    print(access_messages) # acessing email adress using dictionnary method
    
    
    file_path = access_email["email"] + "_main_database.json"
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        print("File exists")
        #store new messages from the latest conversation sent by FrontEnd JSON file to the main JSON file 
        with open(file_path, "r") as outfile:            
            data = json.load(outfile)
            #Python can work with dict format and not with JSON
            #append is not extend
            print(data["conversations"].extend(access_messages))
            outfile.close()
    else :
        print ("File does not exist or is empty")
        data = json.loads(payload.input_value)["messages"]   
        print (data)

    with open(file_path, "w") as outfile:
        json.dump(data, outfile, indent=2)
        outfile.close()

    url = "http://127.0.0.1:7860/api/v1/run/b6bb16ef-b9b6-4989-9f22-6bc0609ff6f6"
    urlfile="http://127.0.0.1:7860/api/v2/files/"
    headers = {
    "Content-Type": "application/json"
    } 
    
    response = requests.request("POST", urlfile,  headers = headers, json = file_path)

    response = requests.request("POST", url,  headers = headers, json = payload.dict())
    data = response.json()  # Parse JSON string to Python dict
    return {"data": data}
    


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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("API_calls_FastAPI:app", host = "0.0.0.0", port = 5001, reload = True)
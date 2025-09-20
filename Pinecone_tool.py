from pinecone import Pinecone
from clients import client_pinecone

class pinecone_db():
    def __init__(self):
        self.client, self.deployment = client_pinecone()
        self.pc = self.client

    def create_index(self, student_id:str, index_id:str, batch_text:str, category:str,name_space : str):
        index_name = student_id
        # check if index already exists (it shouldn't if this is first time)
        if not self.pc.has_index(index_name):
            self.pc.create_index_for_model(
                name=index_name,
                cloud="aws",
                region="us-east-1",
                embed={
                    "model":self.deployment,
                    "field_map":{"text": "chunk_text"}
                }
            )
        # Connect to index
        print("connection to index")
        index = self.pc.Index(index_name)
        
        """
        # Try to fetch the specific record by ID
        fetch_response = index.fetch(ids=[index_id], namespace="ns1")
        # Check if the record was found
        if index_id in fetch_response.get('vectors', {}):
            print(f"Record with ID '{index_id}' already exists in index '{index_name}'")
        else:
            print(f"Record with ID '{index_id}' does not exist in index '{index_name}'")
        """

        existing = index.fetch(ids=[index_id], namespace=name_space)
        if existing.vectors:
            print("Vektor už existuje")
        else:
            # View index stats
            index.describe_index_stats()
            records=[]
            print("vytvaranie vektora")
            records.append({"_id":index_id,"chunk_text": batch_text,"category": category})            
            batch_size = 1  # Adjust this number based on your data size
            for i in range(0, len(records), batch_size):
                batch = records[i:i+batch_size]
                index.upsert_records(name_space, batch)

        # View stats for the index
        print("statistics of the indexes:")
        stats = index.describe_index_stats()

    def query(self,student_id,query,name_space):
        index_name = student_id
        print("connection to index")
        index = self.pc.Index(index_name)
        results = index.search(
        namespace=name_space,
        query={
            "top_k": 5,
            "inputs": {
                'text': query
            }
        }
        )
        print(results)
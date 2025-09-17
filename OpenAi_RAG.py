"""
TASK 7
Improve retrieval by grouping small texts.

First improvement of our large dataset search would be to merge
verses into batches, so we don't look for mostsimilar verse,
but rather for most similar passage of the bible. When we take
10-20 verses at once, it is much easier to differentiate between
such groups.

Here copy your code from Task 6 and change the dict flattening part
so it merges multiple verses into one embedded and indexed element.
The metadata will now be different as you are saving multiple verses
under one embedding. Also the print of the retrieved items may be
different.

Compare subjective quality of results with Task 6 (it won't be great,
but you will see some improvement)
"""


from clients import client_ada_002

import numpy as np
import faiss
from pinecone import Pinecone
import re
import json
from typing import Dict, List, Literal



def load_bible_dict() -> Dict[str, Dict[str, Dict[str, str]]]:
    """
    Load bible text file to dictionary which you can easily search in.

    Args:
        -

    Returns:
        Nested dictionary with all bible verses in structure:
                        {
                         "Old testament": { bookX: {verseY1: text1,
                                                    verseY2: text2},
                                            bookX2: {...},},
                         "New testament": { bookX3: {verseY3: text3,
                                                     verseY4: text4},
                                            bookX4: {...},},
                        }
    """
    the_bible_dictionary: Dict[str, Dict[str, Dict[str, str]]] = {"Old testament": {},"New testament": {}}


    counter_empty_lines = 0
    with open("bible.txt","r") as file:
        book = ""
        verse = []
        verse_key = ""
        Verse_true= 0
        #Read all at once
        all_lines = file.readlines()

        #Pydantic way to itarate through lines with index and line data
        for i, line in enumerate(all_lines):
            if "The Old Testament of the King James Version of the Bible" in line:
                testament = "Old testament"
                counter_empty_lines=0 #reset the counter if the testament or book is reached
                Verse_true=0 #we are no more in a verse
                continue

            if "The New Testament of the King James Bible" in line:
                testament = "New testament"
                counter_empty_lines=0 #reset the counter if the testament or book is reached
                Verse_true=0 #we are no more in a verse
                continue

            if  counter_empty_lines == 4: #We are in the book line
                book = all_lines[i]
                the_bible_dictionary[testament][book] = {}
                counter_empty_lines=0 #reset the counter if the testament or book is reached
                Verse_true=0 #we are no more in a verse
                continue

            if "\n" == line:
                counter_empty_lines+=1 # counter will allows us to identify the book line
                Verse_true=0 #we are no more in a verse
                continue

            #Use Regex library to isolate the verse data format XX:XX
            line_verse = [re.match("^[0-9]+:[0-9]+$", s).group() for s in line.split() if re.match("^[0-9]+:[0-9]+", s)]
            if len(line_verse) != 0:
                verse = line_verse
            verse_pattern1 = r'\d+:\d+'


            split_line=line.split()

            #We test the data format XX:XX
            match1 = re.search(verse_pattern1,split_line[0])
            if match1: #If true we load data
                Verse_true=1 #we start to read a verse
                verse_key=verse[0] #We save verse_key
                the_bible_dictionary[testament][book][verse_key] = "" #initialisation of the dictionnary
                text = all_lines[i].strip() #removal of the \n
                the_bible_dictionary[testament][book][verse_key] += text + " " # Append text with space
                counter_empty_lines=0 #we are in the line and there is no empty line
                continue


            if Verse_true == 1: #we are still within the block of the verse and not outside
                parts = re.split(verse_pattern1, all_lines[i], maxsplit=1) #split the line into 1 and then into 2 parts)
                if len(parts)==1: #if the line is only one part
                    text=parts[0].strip() #removal of \n
                    the_bible_dictionary[testament][book][verse_key] += text + " " #we write to the dictionnary

                if len(parts)==2:
                    text=parts[0].strip() #removal of \n
                    the_bible_dictionary[testament][book][verse_key] += text + " "  #we write to the dictyionnar
                    line_verse = [re.match("^[0-9]+:[0-9]+$", s).group() for s in line.split() if re.match("^[0-9]+:[0-9]+", s)]
                    verse_key=line_verse[0]
                    the_bible_dictionary[testament][book][verse_key] = ""
                    #because we have loaded a new value of the verse_key the dictionnary need to be initialised with the new value

                    text=parts[1].strip() #removal of \n
                    the_bible_dictionary[testament][book][verse_key] += text + " " #we write to the dictionnary
            counter_empty_lines=0 # after reading the verse line the counter is set to 0

    with open("new_bible.txt","w") as file:
         json.dump(the_bible_dictionary, file)

    return the_bible_dictionary




if __name__ == "__main__":
    """
    Embed all the verses and prepare simple similar retrieval as in task 5.
    """


    # We load the bible dictionary and we
    bible = load_bible_dict()






    # prepare embedding client
    client, model = client_ada_002()
  
    # Prepare faiss cosine similarity index
    index = faiss.IndexFlatL2(1536)

    # Flatten the dictionary to list of texts for embedding and list of metadata so we can access original data
    # from retrieved indices (indices refer to embeddings, but we can keep the information in metadata list)
    metadata: List[Dict[str, str]] = []
    texts = []


   # flatten how?
   # text.append(verse) - verse will be then embedded

   # metadata.append({'testament': testament, 'book': book, 'verse': verse})
    counter=0
    for testament in bible.keys():
        for book in bible[testament].keys():
            for verse in bible[testament][book].keys():
                counter+=1
                texts.append(bible[testament][book][verse])
                metadata.append({'testament': testament, 'book': book, 'verse': verse})

    total=len(texts)
    counter=0
    all_embeddings = []  # Create a list to store all embeddings
    #cause to embed the whole bible would take a long time we embed just a range
    batch_text=[]
    batch_metadata=[]
    print(len(texts))

    #here the text is embedded into small batches containing around 20 verses. Each batch is a string
    # and together they form a list batch_text
    for j in range (0,len(texts)//20):
        batch_string = ""
        batch_meta  = ""
        for i in range (0,19):
            batch_string += texts[i+20*j]
            batch_metadata +=metadata[i+20*j]
        batch_text.append(batch_string)
        batch_metadata.append(batch_meta)



    print(batch_text[0])
    print(batch_metadata[0])
    print(80*'-')
    print(80*'-')
    print(80*'-')
    print(80*'-')
    print(80*'-')
    print(80*'-')
    total=len(batch_text)
    print(total)
    print(80*'-')
    print(80*'-')
    print(80*'-')


    """
    # attention 300 batch_text are injected together input= batch_text[i:i+300] but they are embedded one by one
    for i in range(0,total,300):
        counter+=1
        # Generate embeddings for all base strings
        embeddings = client.embeddings.create(
            model= model,
            input= batch_text[i:i+300]
        ).data
        print(f'"total: "{total//300} "counter: {counter}')
        # Extract the embedding vector and add to our collection
        embeddings = np.array([e.embedding for e in embeddings])
        all_embeddings.append(embeddings)
        index.add(embeddings)

    # Embed all verses and add the embeddings to the index in correct order
    # to avoid repetitive embedding which can take quite some time, save all vectors
    # in solution i've saved all as numpy array -  all_vstack.npy (it will work only if we have same flattening
    # to keep metadata the same




    # Finally we make user input loop for querying our verse-base (just print what you think is helpful)
    query = ""
    while True:
        query = input("Enter your query: ")
        if query == "quit":
            break
        query_embedding = np.array([client.embeddings.create(
                                    model=model,
                                    input=query
                                ).data[0].embedding])
        D, I = index.search(query_embedding, 5)
        print(index.ntotal)
        print(D, I)

        print(f"top indexes:{I}")
        for j, i in enumerate(I[0]):
            print(i, j)
            print(D[0][j])
            print(80*'-')
            print(batch_text[i])

    """

    index_name = 'openai-youtube-transcriptions'
    # initialize connection to pinecone (get API key at app.pinecone.io)
    pc = Pinecone(api_key="pcsk_7CjQcu_ALbxEpa11Lqm8WP6aGwYEdLJMqRAzp6S957iZMtAKQCcQ4LDbMEmyzPJEGBbsoM")
    # check if index already exists (it shouldn't if this is first time)
    if not pc.has_index(index_name):
        pc.create_index_for_model(
            name=index_name,
            cloud="aws",
            region="us-east-1",
            embed={
                "model":"llama-text-embed-v2",
                "field_map":{"text": "chunk_text"}
            }
        )

    # connect to index
    index = pc.Index(index_name)
    # view index stats
    index.describe_index_stats()

    records=[]

    for i in range(0,100):
        records.append({"_id":str(i),"chunk_text": batch_text[i]})

    print(records[0:2])
    # Use this batched approach:

    """
    batch_size = 30  # Adjust this number based on your data size
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        index.upsert_records("ns1", batch)
    """
    query = "Where is meantioned Earth and Heaven?"

    results = index.search(
        namespace="ns1",
        query={
            "top_k": 5,
            "inputs": {
                'text': query
            }
        }
    )

    print(results)

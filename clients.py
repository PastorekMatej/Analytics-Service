import openai
from pinecone import Pinecone
from typing import Tuple
from conf import OPENAI_API_KEY, PROVIDER, ADMIN_EMAIL,ADMIN_PASSWORD, PINECONE_API_KEY
import os

def get_admin_credentials():
    """Get built-in admin credentials"""
    return {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }

def client_gpt_4o() -> Tuple[openai.AzureOpenAI, str]:
    if  PROVIDER == 'OPENAI':
        deployment = "gpt-4o"
        client = openai.OpenAI(api_key=OPENAI_API_KEY)

    return client, deployment

def client_ada_002() -> Tuple[openai.AzureOpenAI, str]:
    if PROVIDER == 'OPENAI':
        deployment = "text-embedding-ada-002"
        client = openai.OpenAI(api_key=OPENAI_API_KEY)

    return client, deployment


def client_pinecone():
    if PROVIDER == 'OPENAI':
        deployment = "llama-text-embed-v2"
        client = Pinecone(api_key=PINECONE_API_KEY)

    return client, deployment


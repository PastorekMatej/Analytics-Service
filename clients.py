import openai
from typing import Tuple
from conf import OPENAI_API_KEY, PROVIDER


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





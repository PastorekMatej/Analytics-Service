"""
OpenAI client configuration for Matej Language Lab backend
"""
from openai import OpenAI
from .env import OPENAI_API_KEY


def get_openai_client():
    """
    Get OpenAI client instance
    
    Returns:
        OpenAI: OpenAI client instance
    """
    return OpenAI(api_key=OPENAI_API_KEY)


def client_gpt_5():
    """
    Initialize OpenAI client for GPT-5 model
    
    Returns:
        tuple: (OpenAI client instance, model name)
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set or is empty")
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    model = "gpt-5"  # or "gpt-4" if GPT-5 is not available
    return client, model


def client_gpt_4o():
    """
    Initialize OpenAI client for GPT-4o model
    
    Returns:
        tuple: (OpenAI client instance, model name)
    """
    client = OpenAI(api_key=OPENAI_API_KEY)
    model = "gpt-4o"
    return client, model

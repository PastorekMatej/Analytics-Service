"""
OpenAI client configuration for Matej Language Lab
"""
import os
from openai import OpenAI
from typing import Tuple, Optional

# Load API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PROVIDER = os.getenv("PROVIDER", "OPENAI")


def get_openai_client(api_key: Optional[str] = None) -> OpenAI:
    """
    Get OpenAI client instance
    
    Args:
        api_key: Optional API key (uses environment variable if not provided)
        
    Returns:
        OpenAI client instance
    """
    key = api_key or OPENAI_API_KEY
    if not key:
        raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
    
    return OpenAI(api_key=key)


def client_gpt_4o() -> Tuple[OpenAI, str]:
    """
    Get GPT-4 client and model name
    
    Returns:
        Tuple of (client, model_name)
    """
    if PROVIDER == 'OPENAI':
        deployment = "gpt-4o"
        client = get_openai_client()
        return client, deployment
    
    raise ValueError(f"Unsupported provider: {PROVIDER}")


def client_gpt_4() -> Tuple[OpenAI, str]:
    """
    Get GPT-4 client and model name
    
    Returns:
        Tuple of (client, model_name)
    """
    if PROVIDER == 'OPENAI':
        deployment = "gpt-4"
        client = get_openai_client()
        return client, deployment
    
    raise ValueError(f"Unsupported provider: {PROVIDER}")


def client_ada_002() -> Tuple[OpenAI, str]:
    """
    Get embedding client and model name
    
    Returns:
        Tuple of (client, model_name)
    """
    if PROVIDER == 'OPENAI':
        deployment = "text-embedding-ada-002"
        client = get_openai_client()
        return client, deployment
    
    raise ValueError(f"Unsupported provider: {PROVIDER}")


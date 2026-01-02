"""
OpenAI client configuration for Matej Language Lab
"""
from openai import OpenAI
from .config import OPENAI_API_KEY, PROVIDER


def client_gpt_5():
    """
    Returns OpenAI client configured for GPT-5
    Returns:
        tuple: (client, model_name)
    """
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key not configured")

    client = OpenAI(api_key=OPENAI_API_KEY)

    # Use GPT-5 which supports very large context windows (400k+ tokens)
    # This is necessary for analyzing multiple student texts at once
    model = "gpt-5"  # Supports 400k+ context window

    return client, model


def get_openai_client():
    """
    Returns configured OpenAI client
    """
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key not configured")

    return OpenAI(api_key=OPENAI_API_KEY)
"""
Jitsi (JaaS) routes for JWT token generation.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
import logging
import uuid

import jwt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from .. import config
from ..db_service import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jitsi", tags=["jitsi"])


class JitsiTokenRequest(BaseModel):
    """Request payload for JaaS token generation."""

    room_name: str = Field(..., min_length=1)
    user_email: EmailStr
    moderator: Optional[bool] = None


class JitsiTokenResponse(BaseModel):
    """Response payload for JaaS token generation."""

    token: str
    domain: str
    room_name: str
    expires_at: int


def _load_private_key() -> str:
    """Load the RSA private key used to sign JWTs."""
    if not config.JAAS_PRIVATE_KEY_PATH:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JAAS_PRIVATE_KEY_PATH is not configured."
        )

    key_path = Path(config.JAAS_PRIVATE_KEY_PATH)
    if not key_path.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JaaS private key file not found."
        )

    return key_path.read_text(encoding="utf-8")


def _validate_jaas_config() -> None:
    """Ensure required JaaS configuration is present."""
    missing = []
    if not config.JAAS_APP_ID:
        missing.append("JAAS_APP_ID")
    if not config.JAAS_API_KEY_ID:
        missing.append("JAAS_API_KEY_ID")
    if not config.JAAS_DOMAIN:
        missing.append("JAAS_DOMAIN")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing JaaS configuration: {', '.join(missing)}"
        )


def _normalize_room_name(room_name: str) -> str:
    """Ensure room is namespaced with the JaaS AppID tenant."""
    app_id = config.JAAS_APP_ID or ""
    cleaned_room = room_name.strip().lstrip("/")
    prefix = f"{app_id}/"
    if cleaned_room.startswith(prefix):
        return cleaned_room
    return f"{app_id}/{cleaned_room}"


@router.post("/token", response_model=JitsiTokenResponse)
async def create_jitsi_token(request: JitsiTokenRequest) -> JitsiTokenResponse:
    """
    Generate a JaaS JWT token for a specific room and user.

    Args:
        request: Jitsi token generation request payload

    Returns:
        Signed JWT token and meeting domain
    """
    _validate_jaas_config()

    user = db.get_user_by_email(request.user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    user_id = user.get("id") or user.get("email") or str(uuid.uuid4())
    user_name = user.get("name") or request.user_email.split("@")[0]
    is_moderator = (
        request.moderator
        if request.moderator is not None
        else user.get("role") == "teacher"
    )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=config.JAAS_TOKEN_TTL_MINUTES)

    normalized_room = _normalize_room_name(request.room_name)
    payload = {
        "aud": "jitsi",
        "iss": "chat",
        "sub": config.JAAS_APP_ID,
        "room": normalized_room,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "context": {
            "user": {
                "id": str(user_id),
                "name": user_name,
                "email": request.user_email,
                "moderator": str(is_moderator).lower(),
            },
            "features": {
                "recording": False,
                "livestreaming": False,
                "transcription": False,
                "outbound-call": False,
                "file-upload": False,
            },
            "room": {
                "regex": False
            }
        },
    }

    private_key = _load_private_key()
    try:
        token = jwt.encode(
            payload,
            private_key,
            algorithm="RS256",
            headers={
                "kid": config.JAAS_API_KEY_ID,
                "typ": "JWT"
            }
        )
    except Exception as exc:
        logger.error("Failed to sign JaaS JWT: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate JaaS token."
        ) from exc

    return JitsiTokenResponse(
        token=token,
        domain=config.JAAS_DOMAIN,
        room_name=normalized_room,
        expires_at=int(expires_at.timestamp())
    )

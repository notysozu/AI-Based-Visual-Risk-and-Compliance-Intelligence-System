import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
import jwt
import bcrypt

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "vrci-digital-twin-super-secure-jwt-secret-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt and cryptographically secure random salt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify plaintext password against bcrypt hash in constant time."""
    if not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hash of a raw token for secure database storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


import time


def generate_secure_random_token(nbytes: int = 48) -> str:
    """Generate a cryptographically secure random string."""
    return secrets.token_urlsafe(nbytes)


def create_access_token(
    user_id: str,
    role: str = "professional",
    username: Optional[str] = None,
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a short-lived signed JWT access token (15 mins default)."""
    now_ts = int(time.time())
    if expires_delta:
        expire_ts = now_ts + int(expires_delta.total_seconds())
    else:
        expire_ts = now_ts + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "username": username or "",
        "email": email or "",
        "iat": now_ts,
        "exp": expire_ts,
        "jti": secrets.token_hex(16),
        "type": "access"
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise jwt.InvalidTokenError("Invalid token type")
        return payload
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid token: {str(e)}") from e


def create_refresh_token_pair() -> Tuple[str, str, datetime]:
    """
    Generate a long-lived refresh token pair.
    Returns: (raw_token, token_hash, expires_at)
    """
    raw_token = generate_secure_random_token(64)
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at

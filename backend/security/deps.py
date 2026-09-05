from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from database import models, crud
from backend.security.crypto import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_token_from_request(request: Request, bearer_token: Optional[str] = Depends(oauth2_scheme)) -> Optional[str]:
    """Extract token from Authorization header or fallback to query/cookie."""
    if bearer_token:
        return bearer_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return None


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(get_token_from_request)
) -> models.UserDoc:
    """
    Authenticate request via short-lived JWT Access Token.
    Derives user identity securely from verified signature and payload.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject identifier missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    return user


async def get_current_active_user(
    current_user: models.UserDoc = Depends(get_current_user)
) -> models.UserDoc:
    """Ensure user is both authenticated and actively permitted."""
    if hasattr(current_user, "status") and current_user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended by administrator."
        )
    return current_user


async def get_optional_current_user(
    request: Request,
    token: Optional[str] = Depends(get_token_from_request)
) -> Optional[models.UserDoc]:
    """Gracefully resolve user if token is present and valid, otherwise return None."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await crud.get_user(user_id)
        if user and getattr(user, "is_active", True):
            return user
        return None
    except Exception:
        return None


def require_role(*allowed_roles: str) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces that the authenticated user possesses at least one of the specified roles.
    """
    normalized_allowed = {r.lower().strip() for r in allowed_roles}
    
    async def role_checker(
        current_user: models.UserDoc = Depends(get_current_active_user)
    ) -> models.UserDoc:
        user_role = (current_user.role or "professional").lower().strip()
        # Admin or superuser role bypass
        if "admin" in normalized_allowed or user_role == "admin":
            return current_user
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role in {list(allowed_roles)}, current role is '{current_user.role}'."
            )
        return current_user

    return role_checker

import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from database import models, schemas, crud
from backend.security import crypto
from backend.security.deps import get_current_user, get_current_active_user

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1", "yes")
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, raw_token: str, expires_at: datetime):
    """Set hardened HttpOnly cookie containing the raw refresh token."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        expires=int(expires_at.timestamp()),
        path="/"
    )


def _clear_refresh_cookie(response: Response):
    """Clear refresh token cookie on logout or invalidation."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/"
    )


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: schemas.UserRegisterRequest,
    request: Request,
    response: Response
):
    """
    Register a new user account with secure password hashing.
    Issues short-lived JWT access token and HttpOnly refresh token.
    """
    # 1. Validation: check uniqueness
    existing_user = await crud.get_user_by_username(payload.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered."
        )

    existing_email = await crud.get_user_by_email(payload.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )

    # 2. Password complexity check
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    # 3. Create user document with bcrypt password hash
    user_create = schemas.UserCreate(
        username=payload.username,
        email=payload.email,
        role=payload.role or "professional",
        password=payload.password,
        email_verified=False,
        is_active=True,
        status="active"
    )
    user = await crud.create_user(user_create)

    # 4. Generate email verification token
    raw_verify_token = crypto.generate_secure_random_token(48)
    await crud.create_email_verification_token(user.id, raw_verify_token, expires_hours=24)

    # 5. Issue Access Token (15 min) & Refresh Token (7 days)
    access_token = crypto.create_access_token(
        user_id=str(user.id),
        role=user.role,
        username=user.username,
        email=user.email
    )

    token_family = str(uuid.uuid4())
    raw_refresh, refresh_hash, refresh_expires = crypto.create_refresh_token_pair()
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await crud.save_refresh_token(
        user_id=user.id,
        token_hash=refresh_hash,
        token_family=token_family,
        expires_at=refresh_expires,
        ip_address=client_ip,
        device_info=user_agent
    )

    _set_refresh_cookie(response, raw_refresh, refresh_expires)

    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=crypto.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserResponse.model_validate(user)
    )


@router.post("/login", response_model=schemas.TokenResponse)
async def login_user(
    payload: schemas.UserLoginCredentialsRequest,
    request: Request,
    response: Response
):
    """
    Authenticate user via username/email and password.
    Employs generic error responses to prevent account enumeration.
    """
    identifier = payload.identifier.strip()
    user = await crud.get_user_by_username(identifier)
    if not user:
        user = await crud.get_user_by_email(identifier)

    # Generic invalid credential check to protect against user enumeration
    if not user or not user.password_hash or not crypto.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    if not user.is_active or user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated or suspended."
        )

    # Generate new access token
    access_token = crypto.create_access_token(
        user_id=str(user.id),
        role=user.role,
        username=user.username,
        email=user.email
    )

    # Start a new refresh token family for this login session
    token_family = str(uuid.uuid4())
    raw_refresh, refresh_hash, refresh_expires = crypto.create_refresh_token_pair()
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    await crud.save_refresh_token(
        user_id=user.id,
        token_hash=refresh_hash,
        token_family=token_family,
        expires_at=refresh_expires,
        ip_address=client_ip,
        device_info=user_agent
    )

    _set_refresh_cookie(response, raw_refresh, refresh_expires)

    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=crypto.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
    payload: Optional[schemas.RefreshTokenRequest] = None
):
    """
    Exchange a valid Refresh Token for a fresh Access Token and rotated Refresh Token.
    Implements Token Family Tracking and Theft Detection:
    If a previously revoked token is presented (replay attack), the entire family is revoked.
    """
    raw_token = None
    if payload and payload.refresh_token:
        raw_token = payload.refresh_token.strip()
    if not raw_token:
        raw_token = request.cookies.get(REFRESH_COOKIE_NAME)

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found in request cookie or payload."
        )

    token_hash = crypto.hash_token(raw_token)
    token_doc = await crud.get_refresh_token_by_hash(token_hash)

    if not token_doc:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Replay / Theft Detection: A revoked token is being reused
    if token_doc.is_revoked:
        # Cascade revoke entire family
        await crud.revoke_refresh_token_family(token_doc.token_family, revoked_by_ip=client_ip)
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security compromise detected: Attempted reuse of revoked token. All associated sessions terminated."
        )

    # Check expiration
    if token_doc.expires_at < datetime.utcnow():
        await crud.revoke_refresh_token(token_hash, revoked_by_ip=client_ip)
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired. Please re-authenticate."
        )

    # Token is valid: Revoke it as part of single-use rotation
    await crud.revoke_refresh_token(token_hash, revoked_by_ip=client_ip)

    # Fetch user
    user = await crud.get_user(token_doc.user_id)
    if not user or not user.is_active or user.status == "suspended":
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active."
        )

    # Generate new refresh token in the SAME family
    new_raw_refresh, new_refresh_hash, new_refresh_expires = crypto.create_refresh_token_pair()
    await crud.save_refresh_token(
        user_id=user.id,
        token_hash=new_refresh_hash,
        token_family=token_doc.token_family,
        expires_at=new_refresh_expires,
        ip_address=client_ip,
        device_info=user_agent
    )

    # Issue new access token
    new_access_token = crypto.create_access_token(
        user_id=str(user.id),
        role=user.role,
        username=user.username,
        email=user.email
    )

    _set_refresh_cookie(response, new_raw_refresh, new_refresh_expires)

    return schemas.TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=crypto.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserResponse.model_validate(user)
    )


@router.post("/logout")
async def logout_session(
    request: Request,
    response: Response,
    payload: Optional[schemas.RefreshTokenRequest] = None
):
    """
    Invalidate current device refresh token session and remove HttpOnly cookie.
    """
    raw_token = None
    if payload and payload.refresh_token:
        raw_token = payload.refresh_token.strip()
    if not raw_token:
        raw_token = request.cookies.get(REFRESH_COOKIE_NAME)

    if raw_token:
        token_hash = crypto.hash_token(raw_token)
        client_ip = request.client.host if request.client else None
        await crud.revoke_refresh_token(token_hash, revoked_by_ip=client_ip)

    _clear_refresh_cookie(response)
    return {"message": "Session logged out successfully."}


@router.post("/logout-all")
async def logout_all_sessions(
    response: Response,
    current_user: models.UserDoc = Depends(get_current_user)
):
    """
    Revoke all active refresh tokens and sessions across all user devices.
    """
    revoked_count = await crud.revoke_all_user_refresh_tokens(current_user.id)
    _clear_refresh_cookie(response)
    return {
        "message": f"All active sessions ({revoked_count}) revoked successfully.",
        "revoked_count": revoked_count
    }


@router.get("/me", response_model=schemas.UserResponse)
async def get_authenticated_user_profile(
    current_user: models.UserDoc = Depends(get_current_active_user)
):
    """
    Retrieve authenticated user profile derived securely from JWT signature.
    """
    return schemas.UserResponse.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(payload: schemas.ForgotPasswordRequest):
    """
    Request password reset instructions.
    Returns identical response regardless of email existence to prevent user enumeration.
    """
    user = await crud.get_user_by_email(payload.email)
    reset_token = None
    if user:
        raw_token = crypto.generate_secure_random_token(48)
        await crud.create_password_reset_token(user.id, raw_token, expires_minutes=15)
        reset_token = raw_token

    return {
        "message": "If an account matches this email, password reset instructions have been dispatched.",
        "status": "dispatched",
        "debug_token": reset_token if os.getenv("ENVIRONMENT") != "production" else None
    }


@router.post("/reset-password")
async def reset_password(payload: schemas.ResetPasswordRequest):
    """
    Reset account password using single-use cryptographically secure reset token.
    Immediately invalidates all existing user refresh token sessions across all devices.
    """
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    token_doc = await crud.get_password_reset_token(payload.token.strip())
    if not token_doc or token_doc.is_used or token_doc.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already used password reset token."
        )

    # Mark token used
    await crud.mark_password_reset_token_used(token_doc)

    # Fetch user and update password hash
    user = await crud.get_user(token_doc.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Associated user account not found."
        )

    user.password_hash = crypto.hash_password(payload.new_password)
    user.updated_at = datetime.utcnow()
    await user.save()

    # Session Invalidation: Revoke all active sessions on all devices
    await crud.revoke_all_user_refresh_tokens(user.id)

    return {
        "message": "Password reset successfully. All active device sessions have been revoked for security."
    }


@router.post("/change-password")
async def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: models.UserDoc = Depends(get_current_active_user)
):
    """
    Change account password while authenticated.
    Revokes all other existing sessions for security.
    """
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    if not current_user.password_hash or not crypto.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.password_hash = crypto.hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()

    # Invalidate all refresh tokens
    await crud.revoke_all_user_refresh_tokens(current_user.id)

    return {
        "message": "Password changed successfully. All previous sessions invalidated."
    }


@router.post("/verify-email")
async def verify_email(payload: schemas.EmailVerifyRequest):
    """
    Verify account email address via single-use verification token.
    """
    token_doc = await crud.get_email_verification_token(payload.token.strip())
    if not token_doc or token_doc.is_used or token_doc.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already used email verification token."
        )

    await crud.mark_email_verification_token_used(token_doc)

    user = await crud.get_user(token_doc.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Associated user account not found."
        )

    user.email_verified = True
    user.updated_at = datetime.utcnow()
    await user.save()

    return {
        "message": "Email address verified successfully.",
        "email_verified": True
    }


@router.post("/demo-login", response_model=schemas.TokenResponse)
async def demo_persona_login(
    role: Optional[str] = "professional",
    request: Request = None,
    response: Response = None
):
    """
    Convenience login endpoint for demo personas (student, professional, etc.)
    Returns full authentication token pair and HttpOnly cookie.
    """
    user = await crud.get_or_create_demo_user(role=role or "professional")

    access_token = crypto.create_access_token(
        user_id=str(user.id),
        role=user.role,
        username=user.username,
        email=user.email
    )

    token_family = str(uuid.uuid4())
    raw_refresh, refresh_hash, refresh_expires = crypto.create_refresh_token_pair()
    client_ip = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None

    await crud.save_refresh_token(
        user_id=user.id,
        token_hash=refresh_hash,
        token_family=token_family,
        expires_at=refresh_expires,
        ip_address=client_ip,
        device_info=user_agent
    )

    if response:
        _set_refresh_cookie(response, raw_refresh, refresh_expires)

    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=crypto.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserResponse.model_validate(user)
    )

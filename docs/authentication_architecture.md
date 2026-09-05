# Authentication and Security Architecture

## Overview

The AI-Based Visual Risk and Compliance Intelligence System employs a defense-in-depth security model built around 15 core architectural principles. This document outlines the cryptographic standards, token lifecycle, database schemas, authorization dependencies, and threat mitigation mechanisms governing the platform.

---

## 1. Authentication Model

The platform uses a hybrid token authentication model designed for secure Single Page Applications (SPAs) and API consumers:

* **Short-Lived Access Token (JWT)**: Valid for 15 minutes (`exp = iat + 900`). Used for all authenticated API requests. Retained in frontend memory.
* **Long-Lived Refresh Token**: Valid for 7 days (`expires_at = now + 7 days`). Transmitted strictly via an `HttpOnly; Secure; SameSite=Lax; Path=/` cookie to eliminate exposure to Cross-Site Scripting (XSS).
* **Single-Use Rotation**: Every time a refresh token is exchanged for a new access token, the presented refresh token is immediately revoked and replaced with a new one.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as FastAPI Backend
    participant DB as MongoDB Atlas

    User->>API: POST /auth/login {identifier, password}
    API->>DB: Query user by username or email
    API->>API: Verify password hash (constant time bcrypt)
    API->>API: Generate Access Token (15 min) & Refresh Token Pair (7 days)
    API->>DB: Save RefreshTokenDoc with token_family & SHA-256 hash
    API-->>User: 200 OK + Body: {access_token, user} + Set-Cookie: refresh_token (HttpOnly)

    Note over User,API: Subsequent Protected API Requests
    User->>API: GET /auth/me (Authorization: Bearer <access_token>)
    API->>API: Validate signature & claims (exp, sub, jti)
    API-->>User: 200 OK + User Profile JSON
```

---

## 2. Password Security

* **Algorithm**: `bcrypt` (12 rounds) with cryptographically secure random salt generated per hash.
* **Safe Truncation**: Standard 72-byte safe boundary enforcement to avoid internal truncation anomalies.
* **Storage**: Passwords are never stored in plaintext or reversible formats. Stored exclusively as `password_hash` in the `users` MongoDB collection.
* **Verification**: Constant-time comparison prevents timing attacks.

```text
Plaintext Password
  |
  v
UTF-8 Encoding (max 72 bytes)
  |
  v
bcrypt.gensalt(rounds=12)
  |
  v
Stored in MongoDB users.password_hash: $2b$12$...
```

---

## 3. Sessions and Tokens

* **Access Token Payload**:
  * `sub`: MongoDB User Document ID (ObjectId string).
  * `role`: RBAC user role (`professional`, `student`, `freelancer`, `entrepreneur`, `retiree`, `admin`).
  * `username`: Account handle.
  * `email`: Verified or registered email.
  * `type`: Fixed value `"access"`.
  * `jti`: 128-bit cryptographic hex string ensuring per-token uniqueness.
  * `iat` / `exp`: Standardized UTC Unix timestamps.
* **Token Rotation with Family Tracking**: Refresh tokens belong to an immutable `token_family` (UUIDv4). When a token is refreshed, the new token inherits the family identifier.

---

## 4. Secure Storage

* **Access Token**: Stored in client memory (React state / closure). Never written to `localStorage` or `sessionStorage` where malicious third-party scripts could exfiltrate credentials.
* **Refresh Token**: Stored in an `HttpOnly` cookie with `SameSite=Lax` and `Path=/`. JavaScript running in the browser cannot read, inspect, or modify the cookie.
* **Database Storage**: Raw refresh tokens are never persisted in MongoDB. Only the SHA-256 digest (`hash_token(raw_token)`) is indexed and queried.

---

## 5. Login Security and User Enumeration Prevention

* **Generic Responses**: Failed login attempts return a uniform `401 Unauthorized` with the generic message `"Invalid username/email or password."` regardless of whether the identifier exists or the password is wrong.
* **Account Status Enforcement**: Deactivated or suspended accounts are rejected with `403 Forbidden` prior to session issuance.
* **Flexible Identifiers**: Users can authenticate using either their unique `username` or registered `email`.

---

## 6. Registration and Input Validation

* **Password Complexity**: Minimum length of 8 characters enforced at schema level via Pydantic v2.
* **Email Verification Token**: Registration automatically dispatches a 48-byte cryptographically secure single-use email verification token stored in `email_verification_tokens`.
* **Uniqueness Validation**: Prior to insertion, unique index checks guarantee no collision on `username` or `email`.

---

## 7. Password Reset and Session Invalidation

* **Generic Forgot Password**: `POST /auth/forgot-password` returns `"If an account matches this email, password reset instructions have been dispatched."` regardless of email presence.
* **Single-Use Cryptographic Tokens**: Reset tokens expire in 15 minutes and cannot be reused (`is_used: true`).
* **All-Device Session Revocation**: When a password reset or change occurs, all active `RefreshTokenDoc` records for that user are immediately marked `is_revoked: true`.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Attacker
    participant API as FastAPI Backend
    participant DB as MongoDB Atlas

    User->>API: POST /auth/forgot-password {email}
    API->>DB: Lookup user by email
    opt User Exists
        API->>API: Generate 48-byte crypto token
        API->>DB: Save PasswordResetTokenDoc (SHA-256 hash, 15 min exp)
    end
    API-->>User: 200 OK {"message": "If an account matches..."}

    User->>API: POST /auth/reset-password {token, new_password}
    API->>DB: Query token by SHA-256 hash (is_used == false, unexpired)
    API->>API: Hash new password with bcrypt
    API->>DB: Update UserDoc password_hash
    API->>DB: Mark PasswordResetTokenDoc as used
    API->>DB: Invalidate ALL active RefreshTokenDoc for UserDoc
    API-->>User: 200 OK {"message": "Password reset successfully. All sessions revoked."}
```

---

## 8. Multi-Factor Authentication (MFA) Readiness

The authentication router is built to accommodate TOTP (RFC 6238) and WebAuthn/FIDO2 credentials without breaking existing JWT session dependencies:

* User model includes `email_verified` boolean and extensible state flags.
* Single-use token infrastructure in MongoDB (`email_verification_tokens`) provides the foundation for step-up verification.

---

## 9. Authorization vs Authentication (RBAC)

Authentication verifies *who* the caller is; authorization determines *what* they can execute.

* **FastAPI Dependencies**:
  * `get_current_user`: Decodes JWT, validates signature, resolves user from MongoDB.
  * `get_current_active_user`: Confirms user is active and unsuspended.
  * `require_role(*roles)`: Enforces role permissions (e.g. `require_role("admin", "professional")`).

```python
@router.get("/admin/telemetry")
async def get_admin_telemetry(
    current_user: UserDoc = Depends(require_role("admin"))
):
    return {"status": "authorized", "user": current_user.username}
```

---

## 10. Do Not Trust Client-Provided Identity

All protected endpoints resolve the active user identity strictly from the verified JWT `sub` claim inside the authentication middleware:

* Endpoints do not rely on client-provided query parameters (`?user_id=123`) or request body headers for authorization decisions.
* Ownership is verified against the database before mutating or deleting chat sessions, records, or credentials.

---

## 11. Session Invalidation and Token Theft Detection

### Refresh Token Rotation and Cascade Revocation

If a stolen refresh token that has already been rotated is presented again (replay attack), the system detects the anomaly and immediately revokes all tokens belonging to that `token_family`:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Legitimate User
    actor Hacker as Malicious Interceptor
    participant API as FastAPI Backend
    participant DB as MongoDB Atlas

    Note over Client,DB: Normal Session Rotation
    Client->>API: POST /auth/refresh (Cookie: Token A)
    API->>DB: Find Token A (valid, unrevoked)
    API->>DB: Mark Token A as REVOKED
    API->>DB: Issue Token B in same Family
    API-->>Client: 200 OK (New Token B)

    Note over Hacker,DB: Replay Attack (Stolen Token A)
    Hacker->>API: POST /auth/refresh (Cookie: Token A)
    API->>DB: Find Token A -> Status: ALREADY REVOKED!
    API->>DB: Cascade revoke entire Token Family (Revoke Token B)
    API-->>Hacker: 401 Unauthorized (Compromise Detected)

    Note over Client,DB: Legitimate User Tries Token B
    Client->>API: POST /auth/refresh (Cookie: Token B)
    API->>DB: Find Token B -> Status: REVOKED by Family Cascade
    API-->>Client: 401 Unauthorized (Session Expired, Re-login Required)
```

### Logout Endpoints

* **`POST /auth/logout`**: Revokes the single active refresh token for the current device and deletes the cookie.
* **`POST /auth/logout-all`**: Revokes all refresh tokens across all devices belonging to the user.

---

## 12. Database Design

```mermaid
erDiagram
    users ||--o{ refresh_tokens : owns
    users ||--o{ password_reset_tokens : requests
    users ||--o{ email_verification_tokens : verifies
    users ||--o{ financial_records : logs
    users ||--o{ habit_records : tracks
    users ||--o{ study_records : logs
    users ||--o{ chat_sessions : owns

    users {
        ObjectId _id PK
        string username UK
        string email UK
        string password_hash
        string role
        boolean email_verified
        boolean is_active
        string status
        datetime created_at
        datetime updated_at
    }

    refresh_tokens {
        ObjectId _id PK
        string user_id FK
        string token_hash UK
        string token_family
        boolean is_revoked
        datetime revoked_at
        string ip_address
        string device_info
        datetime expires_at
        datetime created_at
    }

    password_reset_tokens {
        ObjectId _id PK
        string user_id FK
        string token_hash UK
        boolean is_used
        datetime used_at
        datetime expires_at
        datetime created_at
    }

    email_verification_tokens {
        ObjectId _id PK
        string user_id FK
        string token_hash UK
        boolean is_used
        datetime used_at
        datetime expires_at
        datetime created_at
    }
```

---

## 13. Security Infrastructure

* **CORS**: Explicit CORS middleware configuration controlling allowed origins, credentials, methods, and headers.
* **CSRF Mitigation**: `SameSite=Lax` cookie configuration ensures browser will not send the refresh token on cross-site requests.
* **NoSQL Injection Immunity**: Pydantic v2 schemas and Beanie ODM parameter binding sanitize all incoming payloads before query construction.

---

## 14. Secure Logging

* Plaintext passwords, raw JWT secrets, and unhashed refresh tokens are never outputted to console logs, log files, or ASGI error middleware.
* MongoDB connection strings mask passwords when reported in startup logs.

---

## 15. Threat Modeling and Mitigation Matrix

| Threat Vector | Potential Impact | Architecture Mitigation |
| :--- | :--- | :--- |
| **XSS Token Exfiltration** | Complete session hijack | Refresh token stored in `HttpOnly` cookie; Access token in memory only. |
| **Refresh Token Theft** | Persistent unauthorized API access | Automatic token rotation + Token Family Cascade Revocation on reuse. |
| **Replay Attacks** | Replay of old authentication payloads | Unique `jti` in JWT access tokens; Single-use refresh and reset tokens. |
| **User Enumeration** | Attacker maps registered emails | Generic responses for login and password reset endpoints. |
| **Credential Stuffing / Brute Force** | Account takeover via dictionary attack | `bcrypt` (12 rounds) high compute cost + account status validation. |
| **JWT Tampering** | Privilege escalation / role spoofing | Cryptographic HMAC-SHA256 signature verification with secret key. |
| **Stale Session Abuse** | Access retained after password change | Instant cascade invalidation of all user refresh tokens on password reset/change. |

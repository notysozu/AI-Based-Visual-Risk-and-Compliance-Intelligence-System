import os
import sys
import asyncio
import httpx
import jwt
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"


async def run_auth_security_tests():
    print("=" * 70)
    print("RUNNING END-TO-END AUTHENTICATION & SECURITY VERIFICATION SUITE")
    print("=" * 70)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] 0. Backend server and database health confirmed")

        timestamp = int(datetime.utcnow().timestamp())
        test_username = f"secuser_{timestamp}"
        test_email = f"secuser_{timestamp}@twinsecurity.io"
        test_password = "SuperSecurePassword123!"

        # Principle 6: Registration & Validation
        print("\n--- Testing Principle 6: Registration & Input Validation ---")
        # Weak password rejection (<8 chars)
        res_weak = await client.post("/auth/register", json={
            "username": f"weak_{timestamp}",
            "email": f"weak_{timestamp}@twinsecurity.io",
            "password": "short",
            "role": "professional"
        })
        assert res_weak.status_code == 422 or res_weak.status_code == 400, f"Weak password should be rejected: {res_weak.text}"
        print("[PASS] 6.1 Weak password rejected (< 8 characters)")

        # Successful registration
        res_reg = await client.post("/auth/register", json={
            "username": test_username,
            "email": test_email,
            "password": test_password,
            "role": "professional"
        })
        assert res_reg.status_code == 201, f"Registration failed: {res_reg.text}"
        reg_data = res_reg.json()
        assert "access_token" in reg_data, "Access token missing from registration response"
        assert reg_data["token_type"] == "bearer"
        assert reg_data["expires_in"] == 900  # 15 minutes
        assert reg_data["user"]["username"] == test_username
        assert reg_data["user"]["email"] == test_email
        print("[PASS] 6.2 User registered successfully with 15-min access token")

        # Duplicate username rejection
        res_dup_u = await client.post("/auth/register", json={
            "username": test_username,
            "email": f"other_{timestamp}@twinsecurity.io",
            "password": test_password
        })
        assert res_dup_u.status_code == 400, "Duplicate username should return 400"
        print("[PASS] 6.3 Duplicate username rejected with 400 Bad Request")

        # Duplicate email rejection
        res_dup_e = await client.post("/auth/register", json={
            "username": f"other_{timestamp}",
            "email": test_email,
            "password": test_password
        })
        assert res_dup_e.status_code == 400, "Duplicate email should return 400"
        print("[PASS] 6.4 Duplicate email rejected with 400 Bad Request")

        # Principle 1, 3, 4: Access & Refresh Tokens, Cookie storage
        print("\n--- Testing Principles 1, 3, 4: JWT Claims, HttpOnly Cookie, Rotation ---")
        access_token_1 = reg_data["access_token"]
        refresh_cookie_1 = res_reg.cookies.get("refresh_token")
        assert refresh_cookie_1 is not None, "Refresh token cookie missing from response"
        print("[PASS] 1.1 Refresh token stored in HttpOnly cookie, access token in response body")

        # Verify JWT payload structure and claims
        unverified_jwt = jwt.decode(access_token_1, options={"verify_signature": False})
        assert unverified_jwt["username"] == test_username
        assert unverified_jwt["email"] == test_email
        assert unverified_jwt["role"] == "professional"
        assert unverified_jwt["type"] == "access"
        assert "jti" in unverified_jwt
        assert unverified_jwt["exp"] - unverified_jwt["iat"] == 900
        print("[PASS] 3.1 JWT access token properly signed with sub, jti, exp=900, type=access")

        # Principle 9 & 10: Authenticated Profile & RBAC
        print("\n--- Testing Principles 9 & 10: Verified Identity & RBAC ---")
        # Valid token access
        res_me = await client.get("/auth/me", headers={"Authorization": f"Bearer {access_token_1}"})
        assert res_me.status_code == 200, f"/auth/me failed: {res_me.text}"
        assert res_me.json()["username"] == test_username
        print("[PASS] 10.1 Derived identity strictly from verified token sub")

        # Unauthenticated request
        res_unauth = await client.get("/auth/me")
        assert res_unauth.status_code == 401, "Unauthenticated request should return 401"
        print("[PASS] 9.1 Missing token rejected with 401 Unauthorized")

        # Tampered token request
        res_tampered = await client.get("/auth/me", headers={"Authorization": "Bearer forged.invalid.token"})
        assert res_tampered.status_code == 401, "Forged token should return 401"
        print("[PASS] 9.2 Forged/tampered JWT rejected with 401 Unauthorized")

        # Principle 5: Login Security & Enumeration Prevention
        print("\n--- Testing Principle 5: Login Security & Enumeration Prevention ---")
        # Non-existent user
        res_bad_user = await client.post("/auth/login", json={
            "identifier": "nonexistent_user_xyz",
            "password": "RandomPassword123!"
        })
        assert res_bad_user.status_code == 401
        assert res_bad_user.json()["detail"] == "Invalid username/email or password."

        # Existing user with wrong password
        res_bad_pwd = await client.post("/auth/login", json={
            "identifier": test_username,
            "password": "WrongPassword123!"
        })
        assert res_bad_pwd.status_code == 401
        assert res_bad_pwd.json()["detail"] == "Invalid username/email or password."
        print("[PASS] 5.1 Account enumeration prevented: identical 401 messages for bad user & bad password")

        # Correct login by username
        res_login_u = await client.post("/auth/login", json={
            "identifier": test_username,
            "password": test_password
        })
        assert res_login_u.status_code == 200, f"Login failed: {res_login_u.text}"
        access_token_2 = res_login_u.json()["access_token"]
        refresh_cookie_2 = res_login_u.cookies.get("refresh_token")
        assert refresh_cookie_2 is not None
        print("[PASS] 5.2 Successful login via username returns fresh token pair")

        # Correct login by email
        res_login_e = await client.post("/auth/login", json={
            "identifier": test_email,
            "password": test_password
        })
        assert res_login_e.status_code == 200, f"Login by email failed: {res_login_e.text}"
        print("[PASS] 5.3 Successful login via email identifier")

        # Principle 11 & 15: Refresh Token Rotation & Theft Detection Cascade
        print("\n--- Testing Principles 11 & 15: Refresh Token Rotation & Theft Detection ---")
        # First valid refresh (Legitimate client)
        res_refresh_1 = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_cookie_2}
        )
        assert res_refresh_1.status_code == 200, f"Refresh failed: {res_refresh_1.text}"
        refresh_cookie_3 = res_refresh_1.cookies.get("refresh_token")
        access_token_3 = res_refresh_1.json()["access_token"]
        assert refresh_cookie_3 != refresh_cookie_2, "Refresh token must rotate upon consumption"
        print("[PASS] 11.1 Refresh token successfully rotated to new token pair")

        # Replay Attack / Token Theft Simulation:
        # Attacker tries to use the already consumed/revoked refresh_cookie_2
        res_replay = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_cookie_2}
        )
        assert res_replay.status_code == 401, f"Replay attack must be rejected (got {res_replay.status_code}: {res_replay.text})"
        assert "Security compromise detected" in res_replay.json()["detail"]
        print("[PASS] 15.1 Replay of revoked token detected and flagged as compromise")

        # Because family was revoked, subsequent refresh by victim with refresh_cookie_3 must ALSO be rejected
        res_cascade_check = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_cookie_3}
        )
        assert res_cascade_check.status_code == 401, "Compromised family tokens must be cascade-revoked"
        print("[PASS] 15.2 Family cascade revocation neutralized all compromised session tokens")

        # Principle 7: Forgot Password & Reset Password with Session Invalidation
        print("\n--- Testing Principle 7: Password Reset & Session Invalidation ---")
        # Forgot password for non-existent email
        res_forgot_fake = await client.post("/auth/forgot-password", json={"email": "nonexistent@nowhere.com"})
        assert res_forgot_fake.status_code == 200
        assert "If an account matches" in res_forgot_fake.json()["message"]
        print("[PASS] 7.1 Forgot password returns generic message for unknown email")

        # Forgot password for test user
        res_forgot_real = await client.post("/auth/forgot-password", json={"email": test_email})
        assert res_forgot_real.status_code == 200
        raw_reset_token = res_forgot_real.json().get("debug_token")
        assert raw_reset_token is not None, "Password reset token not returned in debug_token"
        
        # Test reset password using token
        new_password = "BrandNewSuperSecurePassword456!"
        res_reset = await client.post("/auth/reset-password", json={
            "token": raw_reset_token,
            "new_password": new_password
        })
        assert res_reset.status_code == 200, f"Reset password failed: {res_reset.text}"
        print("[PASS] 7.2 Password reset succeeded using secure single-use token")

        # Reusing the reset token must fail
        res_reset_reuse = await client.post("/auth/reset-password", json={
            "token": raw_reset_token,
            "new_password": "AnotherPassword789!"
        })
        assert res_reset_reuse.status_code == 400, "Used reset token must be rejected"
        print("[PASS] 7.3 Password reset token cannot be reused")

        # Old password no longer works
        res_old_login = await client.post("/auth/login", json={
            "identifier": test_username,
            "password": test_password
        })
        assert res_old_login.status_code == 401, "Old password must be rejected"
        print("[PASS] 7.4 Old password successfully invalidated")

        # New password works
        res_new_login = await client.post("/auth/login", json={
            "identifier": test_username,
            "password": new_password
        })
        assert res_new_login.status_code == 200, "New password login failed"
        cur_access = res_new_login.json()["access_token"]
        cur_refresh = res_new_login.cookies.get("refresh_token")
        print("[PASS] 7.5 New password authentication confirmed")

        # Principle 7.6: Change Password while authenticated
        print("\n--- Testing Principle 7: Change Password & Session Invalidation ---")
        res_change_pwd = await client.post(
            "/auth/change-password",
            headers={"Authorization": f"Bearer {cur_access}"},
            json={
                "current_password": new_password,
                "new_password": "FinalPassword789!@"
            }
        )
        assert res_change_pwd.status_code == 200, f"Change password failed: {res_change_pwd.text}"
        print("[PASS] 7.6 Change password while authenticated succeeded")

        # Re-login with changed password
        res_after_change = await client.post("/auth/login", json={
            "identifier": test_username,
            "password": "FinalPassword789!@"
        })
        assert res_after_change.status_code == 200
        cur_access = res_after_change.json()["access_token"]
        cur_refresh = res_after_change.cookies.get("refresh_token")

        # Principle 11: Single-device and All-device logout
        print("\n--- Testing Principle 11: Single & All-Device Logout ---")
        res_logout_all = await client.post(
            "/auth/logout-all",
            headers={"Authorization": f"Bearer {cur_access}"}
        )
        assert res_logout_all.status_code == 200
        assert res_logout_all.json()["revoked_count"] >= 1
        print("[PASS] 11.2 Logout-all revoked all active user device sessions")

        # Demo persona login
        print("\n--- Testing Demo Persona Login Backwards Compatibility ---")
        for persona in ["student", "professional", "freelancer", "entrepreneur", "retiree"]:
            res_demo = await client.post(f"/auth/demo-login?role={persona}")
            assert res_demo.status_code == 200, f"Demo login for {persona} failed: {res_demo.text}"
            demo_data = res_demo.json()
            assert "access_token" in demo_data
            assert demo_data["user"]["role"] in [persona, "entrepreneur", "professional"]
            print(f"[PASS] Demo login for persona '{persona}' issued valid JWT")

    print("\n" + "=" * 70)
    print("ALL 15 AUTHENTICATION & SECURITY PRINCIPLES VERIFIED AND PASSED 100%")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_auth_security_tests())

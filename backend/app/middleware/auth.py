from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError
from app.config import get_settings

bearer = HTTPBearer()
_jwks_client: PyJWKClient | None = None


def _get_jwks_client(supabase_url: str) -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{supabase_url}/auth/v1/.well-known/jwks.json")
    return _jwks_client


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    settings = get_settings()
    token = creds.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg.startswith("HS"):
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=[alg],
                audience="authenticated",
            )
        else:
            client = _get_jwks_client(settings.supabase_url)
            signing_key = client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
            )
        return payload
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


def require_role(role: str):
    def check(user: dict = Depends(get_current_user)) -> dict:
        user_meta = user.get("user_metadata", {})
        if user_meta.get("role") != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return check

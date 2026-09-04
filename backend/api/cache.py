from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from database import crud, schemas

router = APIRouter(prefix="/cache", tags=["cache"])


@router.get("/{cache_key}")
async def get_cache_endpoint(cache_key: str):
    """Retrieve cached JSON document from MongoDB."""
    data = await crud.get_cache(cache_key)
    if data is None:
        raise HTTPException(status_code=404, detail="Cache entry not found or expired")
    return {"cache_key": cache_key, "data": data}


@router.post("/{cache_key}")
async def set_cache_endpoint(
    cache_key: str,
    payload: Dict[str, Any],
    user_id: Optional[str] = Query(None),
    ttl_seconds: Optional[int] = Query(None)
):
    """Store or update cached JSON document in MongoDB."""
    doc = await crud.set_cache(
        cache_key=cache_key,
        data=payload,
        user_id=user_id,
        ttl_seconds=ttl_seconds
    )
    return {
        "cache_key": doc.cache_key,
        "user_id": doc.user_id,
        "expires_at": doc.expires_at.isoformat() if doc.expires_at else None,
        "updated_at": doc.updated_at.isoformat()
    }


@router.delete("/{cache_key}")
async def delete_cache_endpoint(cache_key: str):
    """Delete cached JSON document from MongoDB."""
    deleted = await crud.delete_cache(cache_key)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cache entry not found")
    return {"message": "Cache entry deleted successfully", "cache_key": cache_key}

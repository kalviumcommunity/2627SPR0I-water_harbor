"""
Configurable in-memory IP rate limiting for anonymous student report submission
and staff authentication protection.

Note on Architecture:
The rate limiter uses an in-memory sliding window keyed by client IP or action key.
For multi-instance / scaled production deployments, replace this in-memory store
with a distributed store such as Redis or a PostgreSQL-backed token bucket.
"""
import math
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """
    Resolve client IP from the direct socket peer.
    Forwarded headers (X-Forwarded-For) are ignored unless the immediate peer
    is explicitly listed in TRUSTED_PROXY_IPS.
    """
    client_host = request.client.host if request.client and request.client.host else "unknown"
    trusted_proxies = set(settings.TRUSTED_PROXY_IPS)

    if client_host in trusted_proxies:
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        if forwarded_for:
            hops = [hop.strip() for hop in forwarded_for.split(",") if hop.strip()]
            for hop in reversed(hops):
                if hop not in trusted_proxies:
                    return hop
            if hops:
                return hops[0]

    return client_host


class SlidingWindowRateLimiter:
    """
    Thread-safe sliding window rate limiter keyed by identifier.
    Periodically purges inactive buckets to prevent unbounded memory growth.
    """

    def __init__(self, cleanup_interval_seconds: int = 300) -> None:
        self._lock = threading.Lock()
        self._buckets: Dict[str, Deque[float]] = defaultdict(deque)
        self._cleanup_interval = cleanup_interval_seconds
        self._last_cleanup = time.monotonic()

    def check_and_record(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
        now: float = None,
    ) -> Tuple[bool, int]:
        current_time = time.monotonic() if now is None else now
        cutoff = current_time - window_seconds

        with self._lock:
            # Periodic cleanup of idle keys to prevent memory leak
            if current_time - self._last_cleanup > self._cleanup_interval:
                self._purge_stale_buckets(current_time)
                self._last_cleanup = current_time

            bucket = self._buckets[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= max_requests:
                oldest = bucket[0]
                retry_after = max(1, math.ceil(oldest + window_seconds - current_time))
                return False, retry_after

            bucket.append(current_time)
            return True, 0

    def _purge_stale_buckets(self, current_time: float) -> None:
        """Purge buckets that have no entries in the last 10 minutes."""
        stale_cutoff = current_time - 600
        keys_to_remove = []
        for key, bucket in self._buckets.items():
            while bucket and bucket[0] <= stale_cutoff:
                bucket.popleft()
            if not bucket:
                keys_to_remove.append(key)
        for key in keys_to_remove:
            del self._buckets[key]

    def reset(self) -> None:
        """Clear all recorded rate-limit state."""
        with self._lock:
            self._buckets.clear()


report_rate_limiter = SlidingWindowRateLimiter()
staff_login_rate_limiter = SlidingWindowRateLimiter()


def enforce_report_rate_limit(request: Request) -> None:
    """FastAPI dependency enforcing IP-based rate limits on POST /api/reports."""
    if not settings.REPORT_RATE_LIMIT_ENABLED:
        return

    client_ip = get_client_ip(request)
    allowed, retry_after = report_rate_limiter.check_and_record(
        key=f"report:{client_ip}",
        max_requests=settings.REPORT_RATE_LIMIT_MAX_REQUESTS,
        window_seconds=settings.REPORT_RATE_LIMIT_WINDOW_SECONDS,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many issue reports submitted from this connection. Please wait before trying again.",
            headers={"Retry-After": str(retry_after)},
        )


def enforce_login_rate_limit(request: Request) -> None:
    """
    Protect staff login against brute-force key attempts.
    Allows up to 10 attempts per minute per client IP.
    """
    client_ip = get_client_ip(request)
    allowed, retry_after = staff_login_rate_limiter.check_and_record(
        key=f"login:{client_ip}",
        max_requests=10,
        window_seconds=60,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many staff login attempts from this connection. Please wait before trying again.",
            headers={"Retry-After": str(retry_after)},
        )

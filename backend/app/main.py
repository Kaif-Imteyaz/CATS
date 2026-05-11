import time
import structlog
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import get_settings
from app.routes import therapy, session, reports, posture, videos, messages, schedule

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger()

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="CATS API", version="1.0.0", docs_url="/docs")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        method=request.method,
        path=request.url.path,
    )
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    log.info("request", status=response.status_code, duration_ms=duration_ms)
    return response


app.include_router(therapy.router, prefix="/therapy", tags=["therapy"])
app.include_router(session.router, prefix="/session", tags=["session"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(posture.router, prefix="/posture", tags=["posture"])
app.include_router(videos.router, prefix="/videos", tags=["videos"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])
app.include_router(schedule.router, prefix="/schedule", tags=["schedule"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

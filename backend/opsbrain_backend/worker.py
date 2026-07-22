import asyncio
import json
import logging
import os

from redis.asyncio import Redis

from .core.config import get_settings
from .core.logging import configure_logging


logger = logging.getLogger(__name__)
STREAM = "opsbrain:jobs"
DEAD_LETTER_STREAM = "opsbrain:jobs:dead"
GROUP = "opsbrain-workers"


async def run_worker() -> None:
    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    consumer = os.getenv("HOSTNAME", "local-worker")
    try:
        await redis.xgroup_create(STREAM, GROUP, id="0", mkstream=True)
    except Exception as error:
        if "BUSYGROUP" not in str(error):
            raise

    logger.info("Worker ready as %s", consumer)
    while True:
        batches = await redis.xreadgroup(GROUP, consumer, {STREAM: ">"}, count=10, block=5000)
        for _stream, messages in batches:
            for message_id, fields in messages:
                job_type = fields.get("type")
                if job_type == "healthcheck":
                    await redis.xack(STREAM, GROUP, message_id)
                    continue
                await redis.xadd(DEAD_LETTER_STREAM, {
                    "original_id": message_id,
                    "reason": "unknown_job_type",
                    "payload": json.dumps(fields),
                })
                await redis.xack(STREAM, GROUP, message_id)


if __name__ == "__main__":
    configure_logging()
    asyncio.run(run_worker())

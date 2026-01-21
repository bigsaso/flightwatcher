from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.api.watches.service import run_all_watches_service
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="EST")

def start_scheduler():
    scheduler.add_job(
        func=run_all_watches_service,
        trigger=CronTrigger(minute=0),  # every hour on the dot
        id="run_all_watches_hourly",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info("Watch scheduler started (hourly)")

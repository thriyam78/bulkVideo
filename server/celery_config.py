from app.tasks.celery_app import celery_app

celery_app.conf.task_routes = {
    'app.tasks.video_processing.process_video': {'queue': 'video_processing'}
}

from fastapi import APIRouter, UploadFile
from app.tasks.video_processing import process_video
from celery.result import AsyncResult
from app.tasks.celery_app import celery_app

router = APIRouter()
import logging

logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_files(files: list[UploadFile]):
    if len(files) != 3:
        return {"error": "You must upload exactly 3 files."}
    
    file_paths = []
    try:
        for file in files:
            file_path = f"app/uploads/{file.filename}"
            with open(file_path, "wb") as f:
                f.write(file.file.read())
            file_paths.append(file_path)
        
        logger.info(f"Files uploaded successfully: {file_paths}")
        task = process_video.delay(file_paths)
        logger.info(f"Task created with ID: {task.id}")
        return {"job_id": task.id}
    except Exception as e:
        logger.error(f"Error in upload_files: {str(e)}", exc_info=True)
        return {"error": f"An error occurred while processing the files: {str(e)}"}

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    task_result = AsyncResult(job_id, app=celery_app)
    
    logger.info(f"Checking status for job {job_id}: {task_result.state}")
    
    if task_result.state == 'PENDING':
        return {"status": "pending"}
    elif task_result.state == 'PROGRESS':
        return {"status": task_result.info.get('status', 'progress')}
    elif task_result.state == 'SUCCESS':
        return {"status": "completed", "result": task_result.result}
    elif task_result.state == 'FAILURE':
        error_info = task_result.info
        if isinstance(error_info, Exception):
            error_message = str(error_info)
        else:
            error_message = error_info.get('error', 'unknown error')
        logger.error(f"Task {job_id} failed: {error_message}")
        return {"status": "failed", "error": error_message}
    else:
        return {"status": task_result.state, "result": str(task_result.info)}

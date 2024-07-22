import logging
from celery import shared_task
import ffmpeg
import os

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def process_video(self, file_paths):
    try:
        logger.info(f"Starting video processing task with file paths: {file_paths}")
        output_file = "app/uploads/output_video.mp4"
        self.update_state(state='PROGRESS', meta={'status': 'processing'})
        
        logger.info("Attempting to run ffmpeg command")
        (
            ffmpeg
            .input(file_paths[0])
            .input(file_paths[1])
            .input(file_paths[2])
            .filter_complex('[0:v][1:v][2:v]concat=n=3:v=1:a=0[outv]', v=1, a=0)
            .output(output_file, vcodec='libx264', crf=23)
            .run(overwrite_output=True)
        )
        logger.info("ffmpeg command completed successfully")
        self.update_state(state='PROGRESS', meta={'status': 'completed'})
        return {"output_file": output_file}
    
    except Exception as e:
        logger.error(f"Error in process_video task: {str(e)}", exc_info=True)
        self.update_state(state='FAILURE', meta={'status': 'failed', 'error': str(e)})
        return {"status": "failed", "error": str(e)}
/* eslint-disable react/prop-types */
import { useState } from 'react';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const Input = styled('input')({
  display: 'none',
});

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [jobId, setJobId] = useState(null);
const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  console.log(import.meta.env.VITE_BACKEND_URL)
  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    console.log("New files:", newFiles);
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles, ...newFiles];
    //   console.log("Updated files state:", updatedFiles);
      return updatedFiles;
    });
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

 
//   console.log(files)
const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
  
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Files uploaded successfully:', response.data);
      setJobId(response.data.job_id);
      checkJobStatus(response.data.job_id);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const checkJobStatus = async (id) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs/${id}`, {
        responseType: 'blob'
      });
      
      if (response.headers['content-type'] === 'video/mp4') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setProcessedVideoUrl(url);
      } else {
        // If the response is not a video, it means the job is still processing
        setTimeout(() => checkJobStatus(id), 5000); // Check again after 5 seconds
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const ProcessedVideo = ({ url }) => {
    if (!url) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Processed Video
        </Typography>
        <video width="100%" controls>
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Box>
    );
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Upload Files
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <label htmlFor="contained-button-file">
                <Input
                  accept="*/*"
                  id="contained-button-file"
                  multiple
                  type="file"
                  onChange={handleFileChange}
                />
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                >
                  Select Files
                </Button>
              </label>
            </Box>
            {files.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {files.length} file(s) selected
                </Typography>
                <List dense>
                  {files.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={file.name} />
                      <Button onClick={() => handleRemoveFile(index)}>Remove</Button>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={uploading || files.length === 0}
              fullWidth
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload Files'}
            </Button>
          </form>
          {jobId && !processedVideoUrl && (
          <Box sx={{ mt: 2 }}>
            <Typography>Processing video... Please wait.</Typography>
            <CircularProgress />
          </Box>
        )}
        
        <ProcessedVideo url={processedVideoUrl} />
        </Paper>
      </Box>
    </Container>
  );
}
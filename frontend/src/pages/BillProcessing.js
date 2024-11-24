import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Stack,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function BillProcessing() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [manualCorrection, setManualCorrection] = useState('');

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
    validateFiles(uploadedFiles);
  };

  const validateFiles = async (uploadedFiles) => {
    setProcessing(true);
    
    // Simulated validation process
    const results = await Promise.all(uploadedFiles.map(async (file) => {
      // In real implementation, this would call the backend API
      const validations = [
        { type: 'format', status: 'success', message: 'File format is valid' },
        { type: 'completeness', status: Math.random() > 0.7 ? 'error' : 'success', 
          message: Math.random() > 0.7 ? 'Missing required fields' : 'All required fields present' },
        { type: 'duplicate', status: Math.random() > 0.9 ? 'warning' : 'success',
          message: Math.random() > 0.9 ? 'Potential duplicate bill detected' : 'No duplicates found' },
        { type: 'anomaly', status: Math.random() > 0.8 ? 'warning' : 'success',
          message: Math.random() > 0.8 ? 'Unusual amount detected' : 'Amount within expected range' }
      ];

      return {
        fileName: file.name,
        validations,
        overallStatus: validations.some(v => v.status === 'error') ? 'error' :
                      validations.some(v => v.status === 'warning') ? 'warning' : 'success'
      };
    }));

    setValidationResults(results);
    setProcessing(false);
  };

  const handleErrorClick = (result, validation) => {
    setSelectedError({
      fileName: result.fileName,
      error: validation
    });
    setShowErrorDialog(true);
  };

  const handleManualCorrection = () => {
    // In real implementation, this would send the correction to the backend
    console.log('Manual correction for', selectedError.fileName, ':', manualCorrection);
    setShowErrorDialog(false);
    setManualCorrection('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bill Processing & Validation
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={processing}
          >
            Upload Bills
            <VisuallyHiddenInput
              type="file"
              multiple
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.csv"
            />
          </Button>

          {processing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {validationResults.length > 0 && (
            <List>
              {validationResults.map((result, index) => (
                <Paper key={index} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {result.fileName}
                    <Chip
                      icon={getStatusIcon(result.overallStatus)}
                      label={result.overallStatus.toUpperCase()}
                      color={getStatusColor(result.overallStatus)}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Typography>
                  <List dense>
                    {result.validations.map((validation, vIndex) => (
                      <ListItem
                        key={vIndex}
                        onClick={() => validation.status !== 'success' && 
                          handleErrorClick(result, validation)}
                        sx={{
                          cursor: validation.status !== 'success' ? 'pointer' : 'default',
                          '&:hover': {
                            bgcolor: validation.status !== 'success' ? 
                              'action.hover' : 'transparent'
                          }
                        }}
                      >
                        <ListItemIcon>
                          {getStatusIcon(validation.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={validation.type.charAt(0).toUpperCase() + 
                            validation.type.slice(1)}
                          secondary={validation.message}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ))}
            </List>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Error Details - {selectedError?.fileName}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {selectedError?.error.message}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Manual Correction"
            value={manualCorrection}
            onChange={(e) => setManualCorrection(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowErrorDialog(false)}>Cancel</Button>
          <Button
            onClick={handleManualCorrection}
            variant="contained"
            color="primary"
          >
            Apply Correction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

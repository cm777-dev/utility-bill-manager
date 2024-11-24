import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const utilityTypes = [
  'Electricity',
  'Water',
  'Gas',
  'Internet',
  'Phone',
  'Cable TV',
  'Other',
];

export default function AddBill() {
  const [formData, setFormData] = useState({
    utility_type: '',
    amount: '',
    usage_amount: '',
    bill_date: null,
    due_date: null,
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a bill file');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('utility_type', formData.utility_type);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('usage_amount', formData.usage_amount);
      formDataToSend.append(
        'bill_date',
        formData.bill_date.toISOString().split('T')[0]
      );
      formDataToSend.append(
        'due_date',
        formData.due_date.toISOString().split('T')[0]
      );

      await axios.post('/api/bills', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/bills');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Bill
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            select
            fullWidth
            label="Utility Type"
            name="utility_type"
            value={formData.utility_type}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          >
            {utilityTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            required
            inputProps={{ step: '0.01', min: '0' }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Usage Amount"
            name="usage_amount"
            type="number"
            value={formData.usage_amount}
            onChange={handleChange}
            inputProps={{ step: '0.01', min: '0' }}
            helperText="e.g., kWh for electricity, gallons for water"
            sx={{ mb: 2 }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Bill Date"
              value={formData.bill_date}
              onChange={(newValue) =>
                setFormData((prev) => ({ ...prev, bill_date: newValue }))
              }
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 2 }} required />
              )}
            />

            <DatePicker
              label="Due Date"
              value={formData.due_date}
              onChange={(newValue) =>
                setFormData((prev) => ({ ...prev, due_date: newValue }))
              }
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 2 }} required />
              )}
            />
          </LocalizationProvider>

          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Upload Bill
            <input
              type="file"
              hidden
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
          </Button>

          {file && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected file: {file.name}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/bills')}
              disabled={loading}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
            >
              Add Bill
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

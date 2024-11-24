import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

export default function BillsList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get('/api/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/bills/${selectedBill.id}`);
      setOpenDialog(false);
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const columns = [
    {
      field: 'utility_type',
      headerName: 'Utility Type',
      flex: 1,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 1,
      renderCell: (params) => `$${params.value.toFixed(2)}`,
    },
    {
      field: 'bill_date',
      headerName: 'Bill Date',
      flex: 1,
      renderCell: (params) =>
        new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      flex: 1,
      renderCell: (params) =>
        new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            color: params.value === 'paid' ? 'success.main' : 'warning.main',
          }}
        >
          {params.value.toUpperCase()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => {
              // Handle view action
            }}
          >
            <ViewIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              // Handle edit action
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              setSelectedBill(params.row);
              setOpenDialog(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Bills</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/bills/add')}
        >
          Add Bill
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <DataGrid
          rows={bills}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          disableSelectionOnClick
          autoHeight
          loading={loading}
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Delete Bill</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this bill? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

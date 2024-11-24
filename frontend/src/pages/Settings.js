import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

export default function Settings() {
  const [settings, setSettings] = useState({
    billProcessing: {
      automaticCapture: true,
      ocrEnabled: true,
      defaultUtilityType: 'electricity',
      duplicateThreshold: 0.9,
      anomalyThreshold: 2.5,
    },
    notifications: {
      emailEnabled: true,
      emailFrequency: 'weekly',
      billDueReminder: 3,
      anomalyAlerts: true,
    },
    customFields: [
      { id: 1, name: 'Account Number', type: 'text', required: true },
      { id: 2, name: 'Meter Reading', type: 'number', required: false },
      { id: 3, name: 'Service Address', type: 'text', required: true },
    ],
    dataRetention: {
      period: 24,
      autoArchive: true,
      archiveLocation: 'cloud',
    },
  });

  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    required: false,
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handleAddField = () => {
    if (editingField) {
      setSettings(prev => ({
        ...prev,
        customFields: prev.customFields.map(field =>
          field.id === editingField.id ? { ...newField, id: field.id } : field
        ),
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        customFields: [
          ...prev.customFields,
          { ...newField, id: Math.max(...prev.customFields.map(f => f.id)) + 1 },
        ],
      }));
    }
    setShowFieldDialog(false);
    setNewField({ name: '', type: 'text', required: false });
    setEditingField(null);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setNewField({
      name: field.name,
      type: field.type,
      required: field.required,
    });
    setShowFieldDialog(true);
  };

  const handleDeleteField = (id) => {
    setSettings(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== id),
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Bill Processing Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bill Processing
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.billProcessing.automaticCapture}
                  onChange={(e) => handleSettingChange('billProcessing', 'automaticCapture', e.target.checked)}
                />
              }
              label="Automatic Data Capture"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.billProcessing.ocrEnabled}
                  onChange={(e) => handleSettingChange('billProcessing', 'ocrEnabled', e.target.checked)}
                />
              }
              label="OCR Processing"
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Default Utility Type</InputLabel>
              <Select
                value={settings.billProcessing.defaultUtilityType}
                label="Default Utility Type"
                onChange={(e) => handleSettingChange('billProcessing', 'defaultUtilityType', e.target.value)}
              >
                <MenuItem value="electricity">Electricity</MenuItem>
                <MenuItem value="water">Water</MenuItem>
                <MenuItem value="gas">Gas</MenuItem>
                <MenuItem value="internet">Internet</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Duplicate Detection Threshold"
              value={settings.billProcessing.duplicateThreshold}
              onChange={(e) => handleSettingChange('billProcessing', 'duplicateThreshold', parseFloat(e.target.value))}
              sx={{ mt: 2 }}
              inputProps={{ step: 0.1, min: 0, max: 1 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Anomaly Detection Threshold (Standard Deviations)"
              value={settings.billProcessing.anomalyThreshold}
              onChange={(e) => handleSettingChange('billProcessing', 'anomalyThreshold', parseFloat(e.target.value))}
              sx={{ mt: 2 }}
              inputProps={{ step: 0.1, min: 0 }}
            />
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.emailEnabled}
                  onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                />
              }
              label="Email Notifications"
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Email Frequency</InputLabel>
              <Select
                value={settings.notifications.emailFrequency}
                label="Email Frequency"
                onChange={(e) => handleSettingChange('notifications', 'emailFrequency', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Bill Due Reminder (Days Before)"
              value={settings.notifications.billDueReminder}
              onChange={(e) => handleSettingChange('notifications', 'billDueReminder', parseInt(e.target.value))}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, max: 30 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.anomalyAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'anomalyAlerts', e.target.checked)}
                />
              }
              label="Anomaly Detection Alerts"
            />
          </Paper>
        </Grid>

        {/* Custom Fields */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Custom Fields
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingField(null);
                  setNewField({ name: '', type: 'text', required: false });
                  setShowFieldDialog(true);
                }}
              >
                Add Field
              </Button>
            </Box>
            <List>
              {settings.customFields.map((field) => (
                <ListItem key={field.id}>
                  <ListItemText
                    primary={field.name}
                    secondary={`Type: ${field.type}, ${field.required ? 'Required' : 'Optional'}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEditField(field)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteField(field.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Data Retention Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Retention
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Retention Period (Months)"
              value={settings.dataRetention.period}
              onChange={(e) => handleSettingChange('dataRetention', 'period', parseInt(e.target.value))}
              sx={{ mb: 2 }}
              inputProps={{ min: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dataRetention.autoArchive}
                  onChange={(e) => handleSettingChange('dataRetention', 'autoArchive', e.target.checked)}
                />
              }
              label="Auto-Archive Old Bills"
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Archive Location</InputLabel>
              <Select
                value={settings.dataRetention.archiveLocation}
                label="Archive Location"
                onChange={(e) => handleSettingChange('dataRetention', 'archiveLocation', e.target.value)}
              >
                <MenuItem value="local">Local Storage</MenuItem>
                <MenuItem value="cloud">Cloud Storage</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      {/* Custom Field Dialog */}
      <Dialog
        open={showFieldDialog}
        onClose={() => {
          setShowFieldDialog(false);
          setEditingField(null);
          setNewField({ name: '', type: 'text', required: false });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingField ? 'Edit Field' : 'Add Custom Field'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Field Name"
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Field Type</InputLabel>
            <Select
              value={newField.type}
              label="Field Type"
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="select">Select</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              />
            }
            label="Required Field"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowFieldDialog(false);
            setEditingField(null);
            setNewField({ name: '', type: 'text', required: false });
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddField}
            variant="contained"
            disabled={!newField.name}
          >
            {editingField ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

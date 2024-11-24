import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

export default function Compliance() {
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDate, setReportDate] = useState(new Date());
  const [reportFormat, setReportFormat] = useState('pdf');

  // Simulated compliance data
  const [complianceData, setComplianceData] = useState({
    requirements: [
      {
        id: 1,
        name: 'Energy Performance Certificate (EPC)',
        status: 'compliant',
        dueDate: '2024-06-15',
        description: 'Annual energy performance certification required by local regulations.',
        lastSubmitted: '2023-06-10',
        documents: ['EPC_2023.pdf'],
      },
      {
        id: 2,
        name: 'Carbon Emissions Report',
        status: 'warning',
        dueDate: '2024-03-01',
        description: 'Quarterly carbon emissions report for environmental compliance.',
        lastSubmitted: '2023-12-15',
        documents: ['CarbonReport_Q4_2023.pdf'],
      },
      {
        id: 3,
        name: 'Water Usage Audit',
        status: 'overdue',
        dueDate: '2024-01-15',
        description: 'Semi-annual water consumption audit for municipal compliance.',
        lastSubmitted: '2023-07-10',
        documents: ['WaterAudit_H1_2023.pdf'],
      },
    ],
    standardReports: [
      {
        id: 1,
        name: 'ENERGY STAR Portfolio Manager',
        type: 'energy',
        frequency: 'monthly',
        lastGenerated: '2024-01-05',
      },
      {
        id: 2,
        name: 'GHG Emissions Report',
        type: 'emissions',
        frequency: 'quarterly',
        lastGenerated: '2023-12-31',
      },
      {
        id: 3,
        name: 'Utility Cost Allocation',
        type: 'financial',
        frequency: 'monthly',
        lastGenerated: '2024-01-05',
      },
    ],
    auditHistory: [
      {
        date: '2024-01-10',
        type: 'Internal Review',
        findings: 'No major issues found',
        status: 'passed',
      },
      {
        date: '2023-10-15',
        type: 'External Audit',
        findings: 'Minor documentation updates needed',
        status: 'passed_with_notes',
      },
      {
        date: '2023-07-20',
        type: 'Regulatory Inspection',
        findings: 'All requirements met',
        status: 'passed',
      },
    ],
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
      case 'passed':
        return 'success';
      case 'warning':
      case 'passed_with_notes':
        return 'warning';
      case 'overdue':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant':
      case 'passed':
        return <CheckCircleIcon color="success" />;
      case 'warning':
      case 'passed_with_notes':
        return <WarningIcon color="warning" />;
      case 'overdue':
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const handleGenerateReport = () => {
    // In real implementation, this would call the backend API
    console.log('Generating report:', {
      report: selectedReport,
      date: reportDate,
      format: reportFormat,
    });
    setShowReportDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Compliance & Reporting
      </Typography>

      {/* Compliance Requirements */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compliance Requirements
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requirement</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Last Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complianceData.requirements.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{req.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {req.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(req.status)}
                      label={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      color={getStatusColor(req.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1 }} fontSize="small" />
                      {new Date(req.dueDate).toLocaleDateString()}
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(req.lastSubmitted).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {req.documents.map((doc, index) => (
                        <IconButton
                          key={index}
                          size="small"
                          color="primary"
                          onClick={() => console.log('Download:', doc)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Standard Reports */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Standard Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={() => {
              setSelectedReport(complianceData.standardReports[0]);
              setShowReportDialog(true);
            }}
          >
            Generate Report
          </Button>
        </Box>
        <Grid container spacing={3}>
          {complianceData.standardReports.map((report) => (
            <Grid item xs={12} md={4} key={report.id}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {report.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Frequency: {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Generated: {new Date(report.lastGenerated).toLocaleDateString()}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setSelectedReport(report);
                    setShowReportDialog(true);
                  }}
                >
                  Generate New
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Audit History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Audit History
        </Typography>
        {complianceData.auditHistory.map((audit, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  {getStatusIcon(audit.status)}
                </Grid>
                <Grid item xs>
                  <Typography variant="subtitle1">
                    {audit.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(audit.date).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Findings: {audit.findings}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Report Generation Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Generate Report - {selectedReport?.name}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <DatePicker
                label="Report Date"
                value={reportDate}
                onChange={(newValue) => setReportDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
              <FormControl fullWidth>
                <InputLabel>Report Format</InputLabel>
                <Select
                  value={reportFormat}
                  label="Report Format"
                  onChange={(e) => setReportFormat(e.target.value)}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            color="primary"
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  MenuItem,
  TextField,
  Button,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import axios from 'axios';
import * as XLSX from 'xlsx';
import regression from 'regression';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const [bills, setBills] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [comparisonYear, setComparisonYear] = useState(null);
  const [selectedUtilityType, setSelectedUtilityType] = useState('all');
  const [predictions, setPredictions] = useState([]);
  const [predictionModel, setPredictionModel] = useState('linear');
  const [showComparison, setShowComparison] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [savingsTarget, setSavingsTarget] = useState(null);
  const [showSavingsDialog, setShowSavingsDialog] = useState(false);
  const [showForecastDialog, setShowForecastDialog] = useState(false);
  const [forecastMonths, setForecastMonths] = useState(12);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    overview: true,
    monthlyTrends: true,
    utilityBreakdown: true,
    budgetAnalysis: true,
    savingsProgress: true,
    anomalies: true,
    predictions: true,
    yearComparison: false,
  });
  const [reportFormat, setReportFormat] = useState('pdf');

  useEffect(() => {
    fetchBills();
    fetchBudgets();
    fetchSavingsTarget();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get('/api/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await axios.get('/api/budgets');
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchSavingsTarget = async () => {
    try {
      const response = await axios.get('/api/savings-target');
      setSavingsTarget(response.data);
    } catch (error) {
      console.error('Error fetching savings target:', error);
    }
  };

  const getYears = () => {
    const years = new Set(
      bills.map((bill) => new Date(bill.bill_date).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  const getUtilityTypes = () => {
    const types = new Set(bills.map((bill) => bill.utility_type));
    return ['all', ...Array.from(types)];
  };

  const filterBills = () => {
    return bills.filter((bill) => {
      const year = new Date(bill.bill_date).getFullYear();
      return (
        year === selectedYear &&
        (selectedUtilityType === 'all' ||
          bill.utility_type === selectedUtilityType)
      );
    });
  };

  const predictSpending = (data, model) => {
    if (data.length < 2) return [];

    const points = data.map((bill, index) => [index, parseFloat(bill.amount)]);

    let result;
    switch (model) {
      case 'exponential':
        result = regression.exponential(points);
        break;
      case 'polynomial':
        result = regression.polynomial(points, { order: 2 });
        break;
      default:
        result = regression.linear(points);
    }

    return Array(6).fill().map((_, i) => ({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000)
        .toLocaleString('default', { month: 'short' }),
      amount: result.predict(data.length + i)[1],
    }));
  };

  const calculatePredictions = (filteredBills) => {
    if (filteredBills.length < 2) return [];
    setPredictions(predictSpending(filteredBills, predictionModel));
  };

  const getComparisonData = () => {
    if (!comparisonYear) return null;

    const currentYearBills = bills.filter(
      (bill) =>
        new Date(bill.bill_date).getFullYear() === selectedYear &&
        (selectedUtilityType === 'all' ||
          bill.utility_type === selectedUtilityType)
    );

    const comparisonYearBills = bills.filter(
      (bill) =>
        new Date(bill.bill_date).getFullYear() === comparisonYear &&
        (selectedUtilityType === 'all' ||
          bill.utility_type === selectedUtilityType)
    );

    const monthlyTotals = {
      current: Array(12).fill(0),
      comparison: Array(12).fill(0),
    };

    currentYearBills.forEach((bill) => {
      const month = new Date(bill.bill_date).getMonth();
      monthlyTotals.current[month] += bill.amount;
    });

    comparisonYearBills.forEach((bill) => {
      const month = new Date(bill.bill_date).getMonth();
      monthlyTotals.comparison[month] += bill.amount;
    });

    return monthlyTotals;
  };

  const getMonthlyData = () => {
    const monthlyTotals = Array(12).fill(0);
    const filteredBills = filterBills();
    const comparisonData = showComparison ? getComparisonData() : null;

    filteredBills.forEach((bill) => {
      const month = new Date(bill.bill_date).getMonth();
      monthlyTotals[month] += bill.amount;
    });

    calculatePredictions(filteredBills);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const datasets = [
      {
        label: `${selectedYear} Spending`,
        data: monthlyTotals,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ];

    if (comparisonData) {
      datasets.push({
        label: `${comparisonYear} Spending`,
        data: comparisonData.comparison,
        borderColor: 'rgba(153, 102, 255, 0.8)',
        tension: 0.1,
      });
    }

    if (predictions.length > 0) {
      datasets.push({
        label: 'Predicted Spending',
        data: [...Array(12).fill(null), ...predictions.map((p) => p.amount)],
        borderColor: 'rgba(255, 99, 132, 0.8)',
        borderDash: [5, 5],
        tension: 0.1,
      });
    }

    if (budgets[selectedUtilityType]) {
      const monthlyBudget = budgets[selectedUtilityType] / 12;
      datasets.push({
        label: 'Monthly Budget',
        data: Array(12).fill(monthlyBudget),
        borderColor: 'rgba(255, 159, 64, 0.8)',
        borderDash: [10, 5],
        tension: 0,
      });
    }

    return {
      labels: [
        ...months,
        ...predictions.map((p) => p.month + ' (Predicted)'),
      ],
      datasets,
    };
  };

  const getUtilityTypeData = () => {
    const typeTotals = {};
    const filteredBills = filterBills();

    filteredBills.forEach((bill) => {
      typeTotals[bill.utility_type] =
        (typeTotals[bill.utility_type] || 0) + bill.amount;
    });

    return {
      labels: Object.keys(typeTotals),
      datasets: [
        {
          data: Object.values(typeTotals),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
          ],
        },
      ],
    };
  };

  const getQuarterlyData = () => {
    const quarterlyTotals = [0, 0, 0, 0];
    const filteredBills = filterBills();

    filteredBills.forEach((bill) => {
      const month = new Date(bill.bill_date).getMonth();
      const quarter = Math.floor(month / 3);
      quarterlyTotals[quarter] += bill.amount;
    });

    return {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Quarterly Spending',
          data: quarterlyTotals,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
      ],
    };
  };

  const detectAnomalies = (data) => {
    if (data.length < 3) return [];

    const amounts = data.map((bill) => bill.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length
    );

    const threshold = 2;
    return data.filter((bill) => {
      const zScore = Math.abs(bill.amount - mean) / stdDev;
      return zScore > threshold;
    }).map((bill) => ({
      ...bill,
      expected: mean,
      deviation: ((bill.amount - mean) / mean) * 100,
    }));
  };

  const getBudgetVariance = () => {
    const filteredBills = filterBills();
    if (!budgets[selectedUtilityType]) return null;

    const totalSpent = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
    const budget = budgets[selectedUtilityType];
    const variance = totalSpent - budget;
    const percentageVariance = (variance / budget) * 100;

    return {
      budget,
      spent: totalSpent,
      variance,
      percentageVariance,
    };
  };

  useEffect(() => {
    const filteredBills = filterBills();
    setAnomalies(detectAnomalies(filteredBills));
  }, [bills, selectedYear, selectedUtilityType]);

  const exportToExcel = () => {
    const filteredBills = filterBills();

    const worksheet = XLSX.utils.json_to_sheet(
      filteredBills.map((bill) => ({
        Date: new Date(bill.bill_date).toLocaleDateString(),
        'Utility Type': bill.utility_type,
        Amount: bill.amount,
        Status: bill.status,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');

    const predictionsWS = XLSX.utils.json_to_sheet(
      predictions.map((p) => ({
        Month: p.month,
        'Predicted Amount': p.amount.toFixed(2),
      }))
    );
    XLSX.utils.book_append_sheet(workbook, predictionsWS, 'Predictions');

    XLSX.writeFile(workbook, 'utility-bills-analysis.xlsx');
  };

  const getSpendingStats = () => {
    const filteredBills = filterBills();
    if (filteredBills.length === 0) return null;

    const amounts = filteredBills.map((bill) => bill.amount);
    return {
      average: amounts.reduce((a, b) => a + b, 0) / amounts.length,
      max: Math.max(...amounts),
      min: Math.min(...amounts),
      total: amounts.reduce((a, b) => a + b, 0),
    };
  };

  // Calculate budget forecast
  const calculateBudgetForecast = () => {
    const filteredBills = filterBills();
    if (filteredBills.length < 3) return null;

    // Calculate monthly spending trend
    const monthlySpending = Array(12).fill(0);
    filteredBills.forEach(bill => {
      const month = new Date(bill.bill_date).getMonth();
      monthlySpending[month] += bill.amount;
    });

    // Calculate average monthly increase/decrease
    const changes = [];
    for (let i = 1; i < monthlySpending.length; i++) {
      if (monthlySpending[i-1] !== 0 && monthlySpending[i] !== 0) {
        changes.push((monthlySpending[i] - monthlySpending[i-1]) / monthlySpending[i-1]);
      }
    }

    const avgChange = changes.length > 0 
      ? changes.reduce((a, b) => a + b, 0) / changes.length 
      : 0;

    // Project future spending
    const lastMonth = monthlySpending.findLast(amount => amount !== 0) || 0;
    return Array(forecastMonths).fill(0).map((_, i) => ({
      month: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000)
        .toLocaleString('default', { month: 'short', year: 'numeric' }),
      amount: lastMonth * Math.pow(1 + avgChange, i + 1),
    }));
  };

  // Calculate savings progress
  const calculateSavingsProgress = () => {
    if (!savingsTarget) return null;

    const currentYear = new Date().getFullYear();
    const lastYearBills = bills.filter(bill => 
      new Date(bill.bill_date).getFullYear() === currentYear - 1
    );
    const thisYearBills = bills.filter(bill => 
      new Date(bill.bill_date).getFullYear() === currentYear
    );

    const lastYearTotal = lastYearBills.reduce((sum, bill) => sum + bill.amount, 0);
    const thisYearTotal = thisYearBills.reduce((sum, bill) => sum + bill.amount, 0);
    
    const savings = lastYearTotal - thisYearTotal;
    const progress = (savings / savingsTarget.amount) * 100;

    return {
      target: savingsTarget.amount,
      saved: savings,
      progress: Math.min(Math.max(progress, 0), 100),
      remaining: Math.max(savingsTarget.amount - savings, 0),
    };
  };

  // Update savings target
  const updateSavingsTarget = async (newTarget) => {
    try {
      await axios.post('/api/savings-target', { amount: newTarget });
      setSavingsTarget({ amount: newTarget });
      setShowSavingsDialog(false);
    } catch (error) {
      console.error('Error updating savings target:', error);
    }
  };

  // Generate report data
  const generateReportData = () => {
    const data = {
      timestamp: new Date().toLocaleString(),
      overview: reportOptions.overview ? {
        totalBills: filterBills().length,
        totalSpent: getSpendingStats()?.total || 0,
        averageSpent: getSpendingStats()?.average || 0,
        highestBill: getSpendingStats()?.max || 0,
        lowestBill: getSpendingStats()?.min || 0,
      } : null,
      monthlyTrends: reportOptions.monthlyTrends ? getMonthlyData() : null,
      utilityBreakdown: reportOptions.utilityBreakdown ? getUtilityTypeData() : null,
      budgetAnalysis: reportOptions.budgetAnalysis ? getBudgetVariance() : null,
      savingsProgress: reportOptions.savingsProgress ? calculateSavingsProgress() : null,
      anomalies: reportOptions.anomalies ? anomalies : null,
      predictions: reportOptions.predictions ? calculateBudgetForecast() : null,
      yearComparison: reportOptions.yearComparison ? getYearOverYearChanges() : null,
    };
    return data;
  };

  // Generate PDF report
  const generatePDFReport = async () => {
    const data = generateReportData();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.276, 841.890]); // A4 size
    const { width, height } = page.getSize();
    
    let yOffset = height - 50;
    const leftMargin = 50;
    const lineHeight = 20;

    // Helper function to add text
    const addText = (text, size = 12, isBold = false) => {
      page.drawText(text, {
        x: leftMargin,
        y: yOffset,
        size,
        color: rgb(0, 0, 0),
      });
      yOffset -= lineHeight;
    };

    // Title
    addText('Utility Bill Analysis Report', 24, true);
    addText(`Generated on ${data.timestamp}`, 12);
    yOffset -= 20;

    // Overview Section
    if (data.overview) {
      addText('Overview', 18, true);
      yOffset -= 10;
      addText(`Total Bills: ${data.overview.totalBills}`);
      addText(`Total Spent: $${data.overview.totalSpent.toFixed(2)}`);
      addText(`Average Bill: $${data.overview.averageSpent.toFixed(2)}`);
      addText(`Highest Bill: $${data.overview.highestBill.toFixed(2)}`);
      addText(`Lowest Bill: $${data.overview.lowestBill.toFixed(2)}`);
      yOffset -= 20;
    }

    // Budget Analysis
    if (data.budgetAnalysis) {
      addText('Budget Analysis', 18, true);
      yOffset -= 10;
      addText(`Budget: $${data.budgetAnalysis.budget.toFixed(2)}`);
      addText(`Actual Spending: $${data.budgetAnalysis.spent.toFixed(2)}`);
      addText(`Variance: $${Math.abs(data.budgetAnalysis.variance).toFixed(2)} ` +
        `(${data.budgetAnalysis.variance >= 0 ? 'Over' : 'Under'})`);
      yOffset -= 20;
    }

    // Savings Progress
    if (data.savingsProgress) {
      addText('Savings Progress', 18, true);
      yOffset -= 10;
      addText(`Target: $${data.savingsProgress.target.toFixed(2)}`);
      addText(`Saved: $${Math.max(data.savingsProgress.saved, 0).toFixed(2)}`);
      addText(`Progress: ${data.savingsProgress.progress.toFixed(1)}%`);
      yOffset -= 20;
    }

    // Anomalies
    if (data.anomalies && data.anomalies.length > 0) {
      addText('Spending Anomalies', 18, true);
      yOffset -= 10;
      data.anomalies.forEach(anomaly => {
        addText(`Date: ${new Date(anomaly.bill_date).toLocaleDateString()}`);
        addText(`Amount: $${anomaly.amount.toFixed(2)} (${anomaly.deviation.toFixed(1)}% deviation)`);
        yOffset -= 10;
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'utility-bill-analysis.pdf';
    link.click();
  };

  // Generate Excel report
  const generateExcelReport = () => {
    const data = generateReportData();
    const workbook = XLSX.utils.book_new();

    // Overview sheet
    if (data.overview) {
      const overviewData = [
        ['Overview'],
        ['Total Bills', data.overview.totalBills],
        ['Total Spent', data.overview.totalSpent],
        ['Average Bill', data.overview.averageSpent],
        ['Highest Bill', data.overview.highestBill],
        ['Lowest Bill', data.overview.lowestBill],
      ];
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
    }

    // Monthly trends
    if (data.monthlyTrends) {
      const trendsData = data.monthlyTrends.labels.map((month, index) => ({
        Month: month,
        Spending: data.monthlyTrends.datasets[0].data[index],
      }));
      const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Monthly Trends');
    }

    // Budget analysis
    if (data.budgetAnalysis) {
      const budgetData = [
        ['Budget Analysis'],
        ['Budget', data.budgetAnalysis.budget],
        ['Actual Spending', data.budgetAnalysis.spent],
        ['Variance', data.budgetAnalysis.variance],
        ['Percentage Variance', data.budgetAnalysis.percentageVariance],
      ];
      const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
      XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget Analysis');
    }

    // Predictions
    if (data.predictions) {
      const predictionsSheet = XLSX.utils.json_to_sheet(data.predictions);
      XLSX.utils.book_append_sheet(workbook, predictionsSheet, 'Forecast');
    }

    XLSX.writeFile(workbook, 'utility-bill-analysis.xlsx');
  };

  // Generate report based on selected format
  const generateReport = () => {
    if (reportFormat === 'pdf') {
      generatePDFReport();
    } else {
      generateExcelReport();
    }
    setShowReportDialog(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {getYears().map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Comparison Year</InputLabel>
            <Select
              value={comparisonYear}
              label="Comparison Year"
              onChange={(e) => {
                setComparisonYear(e.target.value);
                setShowComparison(!!e.target.value);
              }}
            >
              <MenuItem value={null}>None</MenuItem>
              {getYears()
                .filter((year) => year !== selectedYear)
                .map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Prediction Model</InputLabel>
            <Select
              value={predictionModel}
              label="Prediction Model"
              onChange={(e) => setPredictionModel(e.target.value)}
            >
              <MenuItem value="linear">Linear</MenuItem>
              <MenuItem value="exponential">Exponential</MenuItem>
              <MenuItem value="polynomial">Polynomial</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={exportToExcel}
            >
              Export to Excel
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={9}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<SavingsIcon />}
              onClick={() => setShowSavingsDialog(true)}
            >
              Set Savings Target
            </Button>
            <Button
              variant="outlined"
              startIcon={<TrendingUpIcon />}
              onClick={() => setShowForecastDialog(true)}
            >
              View Budget Forecast
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => setShowReportDialog(true)}
            >
              Generate Report
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {getSpendingStats() && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Average Spending
              </Typography>
              <Typography variant="h6">
                ${getSpendingStats().average.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Highest Bill
              </Typography>
              <Typography variant="h6">
                ${getSpendingStats().max.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Lowest Bill
              </Typography>
              <Typography variant="h6">
                ${getSpendingStats().min.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Spending
              </Typography>
              <Typography variant="h6">
                ${getSpendingStats().total.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {showComparison && getYearOverYearChanges() && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Year-over-Year Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Change
                  </Typography>
                  <Typography
                    variant="h6"
                    color={
                      getYearOverYearChanges().percentageChange >= 0
                        ? 'error'
                        : 'success'
                    }
                  >
                    {getYearOverYearChanges().percentageChange.toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {selectedYear} Total
                  </Typography>
                  <Typography variant="h6">
                    ${getYearOverYearChanges().currentTotal.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {comparisonYear} Total
                  </Typography>
                  <Typography variant="h6">
                    ${getYearOverYearChanges().comparisonTotal.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {anomalies.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Alert 
              severity="warning"
              action={
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => setShowAnomalyDetails(true)}
                >
                  <InfoIcon />
                </IconButton>
              }
            >
              {anomalies.length} spending anomalies detected in the selected period
            </Alert>
          </Grid>
        </Grid>
      )}

      {getBudgetVariance() && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Budget Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Budget
                  </Typography>
                  <Typography variant="h6">
                    ${getBudgetVariance().budget.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Actual Spending
                  </Typography>
                  <Typography variant="h6">
                    ${getBudgetVariance().spent.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Variance
                  </Typography>
                  <Typography 
                    variant="h6"
                    color={getBudgetVariance().variance >= 0 ? 'error' : 'success'}
                  >
                    ${Math.abs(getBudgetVariance().variance).toFixed(2)}
                    {getBudgetVariance().variance >= 0 ? ' Over' : ' Under'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Percentage Variance
                  </Typography>
                  <Typography 
                    variant="h6"
                    color={getBudgetVariance().percentageVariance >= 0 ? 'error' : 'success'}
                  >
                    {Math.abs(getBudgetVariance().percentageVariance).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {calculateSavingsProgress() && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Savings Progress
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateSavingsProgress().progress}
                    sx={{ height: 10, mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Target
                  </Typography>
                  <Typography variant="h6">
                    ${calculateSavingsProgress().target.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Saved
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${Math.max(calculateSavingsProgress().saved, 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Remaining
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    ${calculateSavingsProgress().remaining.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Spending Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={getMonthlyData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending by Utility Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie
                data={getUtilityTypeData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quarterly Spending
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={getQuarterlyData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={showAnomalyDetails}
        onClose={() => setShowAnomalyDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Spending Anomalies</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {anomalies.map((anomaly, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography>
                        {new Date(anomaly.bill_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography color="error">
                        ${anomaly.amount.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Deviation
                      </Typography>
                      <Typography color="error">
                        {anomaly.deviation > 0 ? '+' : ''}
                        {anomaly.deviation.toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Expected Range
                      </Typography>
                      <Typography>
                        ${(anomaly.expected * 0.8).toFixed(2)} - ${(anomaly.expected * 1.2).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnomalyDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showSavingsDialog}
        onClose={() => setShowSavingsDialog(false)}
      >
        <DialogTitle>Set Savings Target</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Set your annual savings target for utility bills
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Target Amount"
            value={savingsTarget?.amount || ''}
            onChange={(e) => setSavingsTarget({ amount: Number(e.target.value) })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSavingsDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => updateSavingsTarget(savingsTarget.amount)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showForecastDialog}
        onClose={() => setShowForecastDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Budget Forecast</DialogTitle>
        <DialogContent>
          <Typography gutterBottom sx={{ mb: 2 }}>
            Forecast your utility spending based on historical patterns
          </Typography>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography gutterBottom>Forecast Period (months)</Typography>
            <Slider
              value={forecastMonths}
              onChange={(e, newValue) => setForecastMonths(newValue)}
              min={3}
              max={24}
              marks={[
                { value: 3, label: '3m' },
                { value: 12, label: '1y' },
                { value: 24, label: '2y' },
              ]}
            />
          </FormControl>
          {calculateBudgetForecast() && (
            <Grid container spacing={2}>
              {calculateBudgetForecast().map((forecast, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {forecast.month}
                    </Typography>
                    <Typography variant="h6">
                      ${forecast.amount.toFixed(2)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForecastDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Analysis Report</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select the sections to include in your report
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.overview}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    overview: e.target.checked,
                  })}
                />
              }
              label="Overview"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.monthlyTrends}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    monthlyTrends: e.target.checked,
                  })}
                />
              }
              label="Monthly Trends"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.utilityBreakdown}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    utilityBreakdown: e.target.checked,
                  })}
                />
              }
              label="Utility Type Breakdown"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.budgetAnalysis}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    budgetAnalysis: e.target.checked,
                  })}
                />
              }
              label="Budget Analysis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.savingsProgress}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    savingsProgress: e.target.checked,
                  })}
                />
              }
              label="Savings Progress"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.anomalies}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    anomalies: e.target.checked,
                  })}
                />
              }
              label="Spending Anomalies"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.predictions}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    predictions: e.target.checked,
                  })}
                />
              }
              label="Spending Predictions"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.yearComparison}
                  onChange={(e) => setReportOptions({
                    ...reportOptions,
                    yearComparison: e.target.checked,
                  })}
                />
              }
              label="Year-over-Year Comparison"
            />
          </FormGroup>
          <Divider sx={{ my: 2 }} />
          <FormControl fullWidth>
            <InputLabel>Report Format</InputLabel>
            <Select
              value={reportFormat}
              label="Report Format"
              onChange={(e) => setReportFormat(e.target.value)}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button 
            onClick={generateReport}
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

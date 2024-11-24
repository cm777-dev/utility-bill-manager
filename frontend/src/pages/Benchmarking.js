import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Chip,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export default function Benchmarking() {
  const [loading, setLoading] = useState(true);
  const [utilityType, setUtilityType] = useState('electricity');
  const [timeframe, setTimeframe] = useState('monthly');
  const [region, setRegion] = useState('all');
  const [industryType, setIndustryType] = useState('all');
  const [buildingSize, setBuildingSize] = useState('all');
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Simulated benchmark data
  const generateBenchmarkData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yourData = months.map(() => Math.random() * 100 + 50);
    const industryAvg = months.map(() => 75);
    const topPerformers = months.map(() => 45);
    
    return {
      consumption: {
        labels: months,
        datasets: [
          {
            label: 'Your Usage',
            data: yourData,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
          {
            label: 'Industry Average',
            data: industryAvg,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Top Performers',
            data: topPerformers,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      },
      metrics: {
        usage: {
          current: yourData.reduce((a, b) => a + b, 0) / 12,
          industryAvg: 75,
          percentile: 65,
        },
        cost: {
          current: (yourData.reduce((a, b) => a + b, 0) / 12) * 0.15,
          industryAvg: 75 * 0.15,
          percentile: 58,
        },
        efficiency: {
          score: 72,
          potential: 15,
          rank: 'B',
        },
      },
      recommendations: [
        {
          title: 'Peak Demand Management',
          potential: 8,
          difficulty: 'medium',
        },
        {
          title: 'Equipment Upgrades',
          potential: 12,
          difficulty: 'high',
        },
        {
          title: 'Usage Schedule Optimization',
          potential: 5,
          difficulty: 'low',
        },
      ],
    };
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBenchmarkData(generateBenchmarkData());
      setLoading(false);
    }, 1500);
  }, [utilityType, timeframe, region, industryType, buildingSize]);

  const getPerformanceColor = (percentile) => {
    if (percentile >= 75) return 'success';
    if (percentile >= 50) return 'warning';
    return 'error';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
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
        Benchmarking & Comparison
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Utility Type</InputLabel>
              <Select
                value={utilityType}
                label="Utility Type"
                onChange={(e) => setUtilityType(e.target.value)}
              >
                <MenuItem value="electricity">Electricity</MenuItem>
                <MenuItem value="water">Water</MenuItem>
                <MenuItem value="gas">Gas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Region</InputLabel>
              <Select
                value={region}
                label="Region"
                onChange={(e) => setRegion(e.target.value)}
              >
                <MenuItem value="all">All Regions</MenuItem>
                <MenuItem value="northeast">Northeast</MenuItem>
                <MenuItem value="southeast">Southeast</MenuItem>
                <MenuItem value="midwest">Midwest</MenuItem>
                <MenuItem value="west">West</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Industry Type</InputLabel>
              <Select
                value={industryType}
                label="Industry Type"
                onChange={(e) => setIndustryType(e.target.value)}
              >
                <MenuItem value="all">All Industries</MenuItem>
                <MenuItem value="commercial">Commercial</MenuItem>
                <MenuItem value="industrial">Industrial</MenuItem>
                <MenuItem value="residential">Residential</MenuItem>
                <MenuItem value="retail">Retail</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Building Size</InputLabel>
              <Select
                value={buildingSize}
                label="Building Size"
                onChange={(e) => setBuildingSize(e.target.value)}
              >
                <MenuItem value="all">All Sizes</MenuItem>
                <MenuItem value="small">Small (&lt;10,000 sq ft)</MenuItem>
                <MenuItem value="medium">Medium (10,000-50,000 sq ft)</MenuItem>
                <MenuItem value="large">Large (&gt;50,000 sq ft)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Performance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                  {benchmarkData.metrics.usage.current.toFixed(1)}
                </Typography>
                <Chip
                  label={`${benchmarkData.metrics.usage.percentile}th percentile`}
                  color={getPerformanceColor(benchmarkData.metrics.usage.percentile)}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Industry Average: {benchmarkData.metrics.usage.industryAvg.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Performance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                  ${benchmarkData.metrics.cost.current.toFixed(2)}
                </Typography>
                <Chip
                  label={`${benchmarkData.metrics.cost.percentile}th percentile`}
                  color={getPerformanceColor(benchmarkData.metrics.cost.percentile)}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Industry Average: ${benchmarkData.metrics.cost.industryAvg.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Efficiency Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                  {benchmarkData.metrics.efficiency.score}
                </Typography>
                <Chip
                  label={`Grade ${benchmarkData.metrics.efficiency.rank}`}
                  color={getPerformanceColor(benchmarkData.metrics.efficiency.score)}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Improvement Potential: {benchmarkData.metrics.efficiency.potential}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Consumption Comparison Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Consumption Comparison
        </Typography>
        <Box sx={{ height: 400 }}>
          <Line
            data={benchmarkData.consumption}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Consumption (kWh)',
                  },
                },
              },
            }}
          />
        </Box>
      </Paper>

      {/* Recommendations */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Improvement Recommendations
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Recommendation</TableCell>
                <TableCell align="right">Savings Potential</TableCell>
                <TableCell align="right">Implementation Difficulty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {benchmarkData.recommendations.map((rec, index) => (
                <TableRow key={index}>
                  <TableCell>{rec.title}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                      {rec.potential}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={rec.difficulty.charAt(0).toUpperCase() + rec.difficulty.slice(1)}
                      color={getDifficultyColor(rec.difficulty)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

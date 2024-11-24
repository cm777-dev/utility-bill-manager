import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  CircularProgress,
  Divider,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import EcoIcon from '@mui/icons-material/Eco';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WaterIcon from '@mui/icons-material/Water';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Sustainability() {
  const [loading, setLoading] = useState(true);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly');
  const [sustainabilityData, setSustainabilityData] = useState(null);
  const [newGoal, setNewGoal] = useState({
    type: 'carbon',
    target: '',
    deadline: '',
  });

  // Simulated sustainability data
  const generateSustainabilityData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const carbonData = months.map(() => Math.random() * 100 + 50);
    
    return {
      carbonFootprint: {
        current: carbonData[carbonData.length - 1],
        trend: -5.2,
        historical: {
          labels: months,
          datasets: [{
            label: 'Carbon Emissions (tons CO2e)',
            data: carbonData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          }],
        },
      },
      breakdown: {
        labels: ['Electricity', 'Natural Gas', 'Water', 'Waste'],
        datasets: [{
          data: [40, 30, 20, 10],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
          ],
        }],
      },
      goals: [
        {
          id: 1,
          type: 'carbon',
          target: -15,
          progress: 35,
          deadline: '2024-12-31',
          status: 'on_track',
        },
        {
          id: 2,
          type: 'energy',
          target: -20,
          progress: 45,
          deadline: '2024-06-30',
          status: 'at_risk',
        },
        {
          id: 3,
          type: 'water',
          target: -10,
          progress: 80,
          deadline: '2024-09-30',
          status: 'on_track',
        },
      ],
      initiatives: [
        {
          name: 'LED Lighting Upgrade',
          impact: 'Reduces electricity consumption by 60%',
          status: 'in_progress',
          completion: 75,
        },
        {
          name: 'Water Recovery System',
          impact: 'Reduces water consumption by 30%',
          status: 'planned',
          completion: 0,
        },
        {
          name: 'Solar Panel Installation',
          impact: 'Offsets 40% of electricity usage',
          status: 'completed',
          completion: 100,
        },
      ],
    };
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSustainabilityData(generateSustainabilityData());
      setLoading(false);
    }, 1500);
  }, [timeframe]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track':
      case 'completed':
        return 'success';
      case 'at_risk':
      case 'in_progress':
        return 'warning';
      case 'behind':
      case 'planned':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAddGoal = () => {
    // In real implementation, this would call the backend API
    console.log('Adding new goal:', newGoal);
    setShowGoalDialog(false);
    setNewGoal({ type: 'carbon', target: '', deadline: '' });
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
        Sustainability Dashboard
      </Typography>

      {/* Carbon Footprint Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Carbon Footprint
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ flexGrow: 1 }}>
                  {sustainabilityData.carbonFootprint.current.toFixed(1)}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  tons CO2e
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {sustainabilityData.carbonFootprint.trend < 0 ? (
                  <TrendingDownIcon color="success" />
                ) : (
                  <TrendingUpIcon color="error" />
                )}
                <Typography
                  variant="body2"
                  color={sustainabilityData.carbonFootprint.trend < 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 1 }}
                >
                  {Math.abs(sustainabilityData.carbonFootprint.trend)}% vs. last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Carbon Emissions Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={sustainabilityData.carbonFootprint.historical}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emissions Breakdown */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emissions Breakdown
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut
                data={sustainabilityData.breakdown}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Sustainability Goals
              </Typography>
              <Button
                variant="contained"
                startIcon={<EcoIcon />}
                onClick={() => setShowGoalDialog(true)}
              >
                Add Goal
              </Button>
            </Box>
            <List>
              {sustainabilityData.goals.map((goal) => (
                <ListItem key={goal.id}>
                  <ListItemIcon>
                    {goal.type === 'carbon' && <LocalFloristIcon />}
                    {goal.type === 'energy' && <BoltIcon />}
                    {goal.type === 'water' && <WaterIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${Math.abs(goal.target)}% ${goal.type} reduction`}
                    secondary={`Due: ${new Date(goal.deadline).toLocaleDateString()}`}
                  />
                  <Box sx={{ minWidth: 100 }}>
                    <CircularProgress
                      variant="determinate"
                      value={goal.progress}
                      color={getStatusColor(goal.status)}
                      size={40}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Sustainability Initiatives */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sustainability Initiatives
        </Typography>
        <Grid container spacing={3}>
          {sustainabilityData.initiatives.map((initiative, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {initiative.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {initiative.impact}
                  </Typography>
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={initiative.completion}
                      color={getStatusColor(initiative.status)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {initiative.completion}% Complete
                    </Typography>
                    <Chip
                      label={initiative.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(initiative.status)}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Add Goal Dialog */}
      <Dialog
        open={showGoalDialog}
        onClose={() => setShowGoalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Sustainability Goal</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Goal Type</InputLabel>
              <Select
                value={newGoal.type}
                label="Goal Type"
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
              >
                <MenuItem value="carbon">Carbon Emissions</MenuItem>
                <MenuItem value="energy">Energy Usage</MenuItem>
                <MenuItem value="water">Water Consumption</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Reduction Target (%)"
              type="number"
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
            />
            <TextField
              fullWidth
              label="Target Date"
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGoalDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddGoal}
            variant="contained"
            color="primary"
            disabled={!newGoal.target || !newGoal.deadline}
          >
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

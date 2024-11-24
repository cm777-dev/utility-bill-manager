import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { useMockData } from '../contexts/MockDataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

function Dashboard() {
  const { bills, sustainabilityData, benchmarkData } = useMockData();

  const billsByType = bills.reduce((acc, bill) => {
    if (!acc[bill.type]) {
      acc[bill.type] = 0;
    }
    acc[bill.type] += bill.amount;
    return acc;
  }, {});

  const pieData = Object.entries(billsByType).map(([name, value]) => ({
    name,
    value
  }));

  const barData = [
    {
      name: 'Energy',
      Current: benchmarkData.energyUsage.current,
      Industry: benchmarkData.energyUsage.industry,
    },
    {
      name: 'Water',
      Current: benchmarkData.waterUsage.current,
      Industry: benchmarkData.waterUsage.industry,
    },
    {
      name: 'Gas',
      Current: benchmarkData.gasUsage.current,
      Industry: benchmarkData.gasUsage.industry,
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Utility Costs Distribution
            </Typography>
            <PieChart width={400} height={300}>
              <Pie
                data={pieData}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Usage Benchmarking
            </Typography>
            <BarChart
              width={400}
              height={300}
              data={barData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Current" fill="#8884d8" />
              <Bar dataKey="Industry" fill="#82ca9d" />
            </BarChart>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sustainability Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle1">Carbon Footprint</Typography>
                <Typography variant="h4">{sustainabilityData.carbonFootprint} tons</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle1">Energy Efficiency</Typography>
                <Typography variant="h4">{sustainabilityData.energyEfficiency}%</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle1">Water Usage</Typography>
                <Typography variant="h4">{sustainabilityData.waterConsumption} gal</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle1">Waste Reduction</Typography>
                <Typography variant="h4">{sustainabilityData.wasteReduction}%</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

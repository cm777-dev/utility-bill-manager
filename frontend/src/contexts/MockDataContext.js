import React, { createContext, useContext, useState } from 'react';

const MockDataContext = createContext();

export function useMockData() {
  return useContext(MockDataContext);
}

export default function MockDataProvider({ children }) {
  const [bills] = useState([
    {
      id: 1,
      date: '2024-01-15',
      amount: 150.25,
      type: 'Electricity',
      status: 'Paid',
      usage: 750,
      unit: 'kWh'
    },
    {
      id: 2,
      date: '2024-01-10',
      amount: 85.50,
      type: 'Water',
      status: 'Pending',
      usage: 2500,
      unit: 'Gallons'
    },
    {
      id: 3,
      date: '2024-01-05',
      amount: 95.75,
      type: 'Gas',
      status: 'Paid',
      usage: 100,
      unit: 'Therms'
    }
  ]);

  const [sustainabilityData] = useState({
    carbonFootprint: 25.5,
    energyEfficiency: 85,
    waterConsumption: 2500,
    wasteReduction: 15,
    goals: [
      { id: 1, name: 'Reduce Energy Usage', target: 10, current: 7 },
      { id: 2, name: 'Water Conservation', target: 15, current: 12 },
      { id: 3, name: 'Waste Reduction', target: 20, current: 15 }
    ]
  });

  const [complianceData] = useState({
    requirements: [
      { id: 1, name: 'Energy Reporting', status: 'Compliant', dueDate: '2024-03-01' },
      { id: 2, name: 'Water Usage Report', status: 'Pending', dueDate: '2024-02-15' },
      { id: 3, name: 'Emissions Declaration', status: 'Review', dueDate: '2024-04-01' }
    ],
    documents: [
      { id: 1, name: 'Annual Energy Report', type: 'PDF', date: '2024-01-01' },
      { id: 2, name: 'Water Compliance Cert', type: 'PDF', date: '2023-12-15' },
      { id: 3, name: 'Emissions Data', type: 'Excel', date: '2023-12-01' }
    ]
  });

  const [benchmarkData] = useState({
    energyUsage: {
      current: 750,
      industry: 850,
      difference: -11.8
    },
    waterUsage: {
      current: 2500,
      industry: 2800,
      difference: -10.7
    },
    gasUsage: {
      current: 100,
      industry: 95,
      difference: 5.3
    }
  });

  const value = {
    bills,
    sustainabilityData,
    complianceData,
    benchmarkData
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

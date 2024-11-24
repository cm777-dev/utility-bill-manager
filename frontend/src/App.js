import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BillsList from './pages/BillsList';
import AddBill from './pages/AddBill';
import Analytics from './pages/Analytics';
import BillProcessing from './pages/BillProcessing';
import Settings from './pages/Settings';
import Benchmarking from './pages/Benchmarking';
import Compliance from './pages/Compliance';
import Sustainability from './pages/Sustainability';
import MockDataProvider from './contexts/MockDataContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Router><Route path="/login" element={<Login />} /></Router>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MockDataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/benchmarking"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Benchmarking />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/bills"
                element={
                  <PrivateRoute>
                    <Layout>
                      <BillProcessing />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/bills/add"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AddBill />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/compliance"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Compliance />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sustainability"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Sustainability />
                    </Layout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </MockDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

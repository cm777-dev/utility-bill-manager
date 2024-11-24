import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';

const AppWrapper = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('App Component', () => {
  test('renders login page for unauthenticated users', () => {
    render(<AppWrapper />);
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  test('renders login form elements', () => {
    render(<AppWrapper />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
});

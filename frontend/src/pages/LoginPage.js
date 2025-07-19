import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          fullWidth
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          fullWidth
          required
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </form>
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          Don't have an account?{' '}
          <Link component="button" onClick={() => navigate('/register')}>
            Register here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;

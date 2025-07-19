import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BookIcon from '@mui/icons-material/Book';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <BookIcon sx={{ mr: 2 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Personal Library Tracker
        </Typography>
        
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Welcome, {user?.firstName || user?.username}!
            </Typography>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

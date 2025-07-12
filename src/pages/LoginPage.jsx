import React, { useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Avatar,
  Grid,
  Link as MuiLink,
  Alert,
  Snackbar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WorkIcon from '@mui/icons-material/Work';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 1. Define la URL base de la API compatible con Vite
const API_URL_BASE = import.meta.env.VITE_URL; 

// Recibe handleLogin como prop
function LoginPage({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setSnackbarMessage('Por favor, ingresa tu correo y contraseña.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Usa la URL base definida para la petición de login
      const response = await axios.post(`${API_URL_BASE}/api/login`, { 
        email,
        password,
      });

      console.log('Inicio de sesión exitoso:', response.data);
      handleLogin(response.data.token, response.data.user);
      
      setSnackbarMessage('Inicio de sesión exitoso.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Redireccionar al usuario a la página de inicio (HomePage) después de un inicio de sesión exitoso
      navigate('/');

    } catch (error) {
      console.error('Error durante el inicio de sesión:', error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || 'Error en el inicio de sesión.';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Iniciar Sesión
          </Button>
          <Grid container>
            <Grid item xs>
              {/* Opción para recuperar contraseña si la tienes implementada */}
            </Grid>
            <Grid item>
              <MuiLink component={Link} to="/register" variant="body2">
                {"¿No tienes una cuenta? Regístrate"}
              </MuiLink>
            </Grid>
          </Grid>
          {/* Botón más vistoso para el login de empleados */}
          <Box sx={{ mt: 3, textAlign: 'center', width: '100%' }}>
            <Button
              component={Link}
              to="/employee-login"
              variant="outlined" 
              color="primary"
              fullWidth
              startIcon={<WorkIcon />} 
              sx={{
                mt: 2,
                py: 1.5, 
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              ¿Eres empleado? Ingresa aquí
            </Button>
          </Box>
        </Box>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default LoginPage;
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
import WorkIcon from '@mui/icons-material/Work'; // Importa un icono de trabajo para empleados
import { Link, useNavigate } from 'react-router-dom'; // Corrección aquí: '=>' cambiado a 'from'
import axios from 'axios';

// Recibe handleLogin como prop
function LoginPage({ handleLogin }) {
  // Accede a la URL del backend desde las variables de entorno
  const API_URL = import.meta.env.VITE_API_URL;

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
      const response = await axios.post(`${API_URL}/api/login`, {
        email,
        password,
      });

      console.log('Inicio de sesión exitoso:', response.data);
      setSnackbarMessage(`¡Bienvenido, ${response.data.user.firstName}!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Llama a handleLogin de App.jsx para actualizar el estado global
      handleLogin('client'); // Asigna el rol 'client' para usuarios normales

      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error durante el inicio de sesión:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
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
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
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
              <MuiLink href="#" variant="body2">
                ¿Olvidaste tu contraseña?
              </MuiLink>
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
              variant="outlined" // O "contained" para un botón más prominente
              color="primary" // O "secondary" o un color personalizado
              fullWidth
              startIcon={<WorkIcon />} // Icono de trabajo
              sx={{
                mt: 2,
                py: 1.5, // Padding vertical
                fontSize: '1rem', // Tamaño de fuente
                fontWeight: 'bold', // Negrita
                boxShadow: 3, // Sombra para un efecto 3D
                '&:hover': {
                  boxShadow: 6, // Sombra más grande al pasar el ratón
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

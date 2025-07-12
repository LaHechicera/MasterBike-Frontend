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
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 1. Define la URL base de la API (compatible con Vite)
// Nota: En Vite, las variables de entorno se acceden con import.meta.env y deben empezar con VITE_
const API_URL_BASE = import.meta.env.VITE_URL;

// Recibe handleLogin como prop
function EmployeeLoginPage({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loggedInAsAdmin, setLoggedInAsAdmin] = useState(false);
  
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('');
  const [newEmployeeLastName, setNewEmployeeLastName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');

  const navigate = useNavigate();

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Manejar el login de empleado o administrador
  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      // Endpoint de login para empleados
      const response = await axios.post(`${API_URL_BASE}/api/employee/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Almacenar el token y el rol
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);

      // Si es un administrador y el modo admin está activado, permite el registro de nuevos empleados
      if (user.role === 'admin' && isAdminMode) {
        setLoggedInAsAdmin(true);
        showSnackbar('Acceso de Administrador confirmado. Puedes registrar nuevos empleados.', 'success');
      } else if (user.role === 'admin' || user.role === 'employee') {
        // Redirige a la página de inventario si el login es exitoso
        navigate('/inventory'); 
        showSnackbar('Inicio de sesión de empleado exitoso.', 'success');
      } else {
        // En teoría, el endpoint de empleado solo debería retornar empleados/admins, pero por seguridad
        showSnackbar('Acceso denegado. Rol de usuario no autorizado.', 'error');
      }

      // Llama a la función de manejo de login del componente App/Padre si existe
      if (handleLogin) {
        handleLogin(user.role);
      }

    } catch (error) {
      console.error('Error durante el inicio de sesión de empleado:', error.response ? error.response.data : error.message);
      showSnackbar('Error de autenticación. Verifica tu correo y contraseña.', 'error');
    }
  };

  // Manejar el registro de nuevos empleados (solo accesible si se ha logueado como admin y activado el modo admin)
  const handleRegisterEmployee = async (event) => {
    event.preventDefault();

    if (!loggedInAsAdmin) {
      showSnackbar('Solo los administradores pueden registrar nuevos empleados.', 'error');
      return;
    }

    // Validar que el email termine en @masterbike.cl
    if (!newEmployeeEmail.endsWith('@masterbike.cl')) {
      showSnackbar('El correo debe terminar en @masterbike.cl para registrarse como empleado.', 'error');
      return;
    }

    try {
      // Envía los datos de registro al backend
      const response = await axios.post(`${API_URL_BASE}/api/register`, {
        firstName: newEmployeeFirstName,
        lastName: newEmployeeLastName,
        email: newEmployeeEmail,
        password: newEmployeePassword,
        role: 'employee', // Asegura que el rol sea 'employee'
      });

      console.log('Registro de empleado exitoso:', response.data);
      showSnackbar('Empleado registrado exitosamente.', 'success');
      
      // Limpia el formulario de registro después de éxito
      setNewEmployeeFirstName('');
      setNewEmployeeLastName('');
      setNewEmployeeEmail('');
      setNewEmployeePassword('');

    } catch (error) {
      console.error('Error durante el registro de empleado:', error.response ? error.response.data : error.message);
      showSnackbar(error.response?.data?.message || 'Error al registrar el empleado. Intenta de nuevo.', 'error');
    }
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
          {loggedInAsAdmin ? <PersonAddIcon /> : <LockOutlinedIcon />}
        </Avatar>
        <Typography component="h1" variant="h5">
          {loggedInAsAdmin ? 'Registrar Empleado' : 'Inicio de Sesión (Empleado/Admin)'}
        </Typography>

        {!loggedInAsAdmin && (
          <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAdminMode}
                  onChange={(e) => setIsAdminMode(e.target.checked)}
                  color="primary"
                />
              }
              label="Modo Administrador (Para registro)"
              sx={{ mb: 2 }}
            />
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
            <Grid container justifyContent="flex-end">
              <Grid item>
                <MuiLink component={Link} to="/login" variant="body2">
                  Volver al Login de Cliente
                </MuiLink>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Formulario de registro de empleado (solo visible si loggedInAsAdmin es true) */}
        {loggedInAsAdmin && (
          <Box component="form" onSubmit={handleRegisterEmployee} noValidate sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nombre"
              value={newEmployeeFirstName}
              onChange={(e) => setNewEmployeeFirstName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Apellido"
              value={newEmployeeLastName}
              onChange={(e) => setNewEmployeeLastName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Correo Electrónico (@masterbike.cl)"
              value={newEmployeeEmail}
              onChange={(e) => setNewEmployeeEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contraseña"
              type="password"
              value={newEmployeePassword}
              onChange={(e) => setNewEmployeePassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Registrar Empleado
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setLoggedInAsAdmin(false);
                setEmail('');
                setPassword('');
              }}
              sx={{ mb: 2 }}
            >
              Volver al Login de Empleado
            </Button>
          </Box>
        )}
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default EmployeeLoginPage;
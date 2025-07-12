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

// 1. Define la URL base de la API compatible con Vite
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

  const API_URL_LOGIN = `${API_URL_BASE}/api/employee/login`;
  const API_URL_REGISTER_EMPLOYEE = `${API_URL_BASE}/api/employee/register`;

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      showSnackbar('Por favor, ingresa tu correo y contraseña.', 'warning');
      return;
    }

    // Validación de correo para empleados (solo dominios @masterbike.cl)
    if (!email.endsWith('@masterbike.cl')) {
      showSnackbar('Solo empleados con dominio @masterbike.cl pueden iniciar sesión aquí.', 'error');
      return;
    }

    try {
      // Envía la petición de login al backend
      const response = await axios.post(API_URL_LOGIN, { email, password });

      // Si el inicio de sesión es exitoso, se maneja el token y el usuario en App.jsx
      handleLogin(response.data.token, response.data.user);
      
      showSnackbar('Inicio de sesión de empleado exitoso.', 'success');
      
      // Si el usuario es un administrador, activa el modo de registro de empleado
      if (response.data.user.role === 'admin') {
        setLoggedInAsAdmin(true);
        // Opcional: Redirigir a una página de administración si existe
        // navigate('/admin-dashboard'); 
      } else {
        // Redirigir a la página de inventario si es un empleado normal
        navigate('/inventory'); 
      }

    } catch (error) {
      console.error('Error durante el inicio de sesión de empleado:', error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || 'Error en el inicio de sesión. Credenciales inválidas o correo no registrado.';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleRegisterEmployeeSubmit = async (event) => {
    event.preventDefault();

    if (!newEmployeeFirstName || !newEmployeeLastName || !newEmployeeEmail || !newEmployeePassword || !newEmployeeEmail.endsWith('@masterbike.cl')) {
      showSnackbar('Por favor, completa todos los campos y asegúrate de usar un correo @masterbike.cl.', 'warning');
      return;
    }

    try {
      // Envía la petición de registro de empleado al backend
      const response = await axios.post(API_URL_REGISTER_EMPLOYEE, {
        firstName: newEmployeeFirstName,
        lastName: newEmployeeLastName,
        email: newEmployeeEmail,
        password: newEmployeePassword,
        role: isAdminMode ? 'admin' : 'employee', // Asigna el rol basado en el switch
      });

      console.log('Registro de empleado exitoso:', response.data);
      showSnackbar('Nuevo empleado registrado exitosamente.', 'success');
      
      // Limpiar el formulario después del registro exitoso
      setNewEmployeeFirstName('');
      setNewEmployeeLastName('');
      setNewEmployeeEmail('');
      setNewEmployeePassword('');
      setIsAdminMode(false);

    } catch (error) {
      console.error('Error durante el registro de empleado:', error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || 'Error en el registro del empleado. Asegúrate de que el correo no esté ya registrado.';
      showSnackbar(errorMessage, 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
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
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          {loggedInAsAdmin ? <PersonAddIcon /> : <LockOutlinedIcon />}
        </Avatar>
        <Typography component="h1" variant="h5">
          {loggedInAsAdmin ? 'Registrar Nuevo Empleado' : 'Inicio de Sesión de Empleado'}
        </Typography>

        {/* Formulario de Login de Empleado */}
        {!loggedInAsAdmin ? (
          <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico (@masterbike.cl)"
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
        ) : (
          /* Formulario de Registro de Empleado (solo si se ha iniciado sesión como Admin) */
          <Box component="form" onSubmit={handleRegisterEmployeeSubmit} noValidate sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAdminMode}
                  onChange={(e) => setIsAdminMode(e.target.checked)}
                  name="isAdminMode"
                  color="primary"
                />
              }
              label="Registrar como Administrador"
            />
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
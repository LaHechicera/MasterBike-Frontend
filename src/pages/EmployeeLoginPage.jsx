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

// 1. Define la URL base de la API
const API_URL_BASE = process.env.REACT_APP_URL;

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

  // Función para manejar el inicio de sesión de empleados
  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setSnackbarMessage('Por favor, ingresa tu correo y contraseña.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      // 2. URL de inicio de sesión de empleados
      const response = await axios.post(`${API_URL_BASE}/api/employees/login`, {
        email,
        password,
      });

      console.log('Inicio de sesión de empleado exitoso:', response.data);
      setSnackbarMessage(`Bienvenido, ${response.data.user.firstName}!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Aquí se maneja el login del empleado (usando el rol del backend si está disponible)
      // Si el usuario es un administrador, activa el modo de registro de empleados
      if (response.data.user.role === 'admin' && isAdminMode) {
        setLoggedInAsAdmin(true);
        // Limpiamos los campos de login después de un inicio de sesión exitoso como admin
        setEmail('');
        setPassword('');
      } else {
        // Lógica de navegación para empleados normales o admins que no están en modo de registro
        handleLogin(response.data.user.role); // 'employee' o 'admin'
        setTimeout(() => {
          // Asumimos que los empleados van a la página de inventario
          navigate('/inventory'); 
        }, 2000);
      }

    } catch (error) {
      console.error('Error durante el inicio de sesión:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error de autenticación. Verifica tus credenciales.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Función para manejar el inicio de sesión de administrador para permitir el registro de empleados
  const handleAdminRegisterSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setSnackbarMessage('Por favor, ingresa tu correo y contraseña.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      // 3. URL de inicio de sesión de administrador (para registro de empleados)
      const response = await axios.post(`${API_URL_BASE}/api/employees/admin-register`, {
        email,
        password,
      });

      // Si el login de administrador es exitoso, permite el registro de nuevos empleados
      if (response.data.isAdmin) {
        setLoggedInAsAdmin(true);
        setSnackbarMessage('Inicio de sesión de administrador exitoso. Puedes registrar nuevos empleados.');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('No autorizado. Solo los administradores pueden registrar empleados.');
        setSnackbarSeverity('error');
      }
      setSnackbarOpen(true);

    } catch (error) {
      console.error('Error durante el inicio de sesión de administrador:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error de autenticación de administrador.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Función para registrar un nuevo empleado (solo accesible si loggedInAsAdmin es true)
  const handleNewEmployeeSubmit = async (event) => {
    event.preventDefault();

    if (!newEmployeeFirstName || !newEmployeeLastName || !newEmployeeEmail || !newEmployeePassword) {
      setSnackbarMessage('Por favor, completa todos los campos para el nuevo empleado.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      // 4. URL de registro de empleados
      const response = await axios.post(`${API_URL_BASE}/api/employees/register`, {
        firstName: newEmployeeFirstName,
        lastName: newEmployeeLastName,
        email: newEmployeeEmail,
        password: newEmployeePassword,
        role: 'employee' // Por defecto, se registra como 'employee'
      });

      console.log('Registro de nuevo empleado exitoso:', response.data);
      setSnackbarMessage('Nuevo empleado registrado con éxito.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Limpiar campos del formulario después del registro
      setNewEmployeeFirstName('');
      setNewEmployeeLastName('');
      setNewEmployeeEmail('');
      setNewEmployeePassword('');

    } catch (error) {
      console.error('Error al registrar nuevo empleado:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error al registrar el empleado. Asegúrate de que el correo no esté en uso.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          {loggedInAsAdmin ? <PersonAddIcon /> : <LockOutlinedIcon />}
        </Avatar>
        <Typography component="h1" variant="h5">
          {loggedInAsAdmin ? 'Registrar Nuevo Empleado' : 'Login de Empleados'}
        </Typography>

        {/* Formulario de Login de Empleado/Admin */}
        {!loggedInAsAdmin && (
          <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ mt: 1 }}>
            <FormControlLabel
              control={<Switch checked={isAdminMode} onChange={(e) => setIsAdminMode(e.target.checked)} />}
              label="Modo Administrador (Registrar Empleado)"
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
              {isAdminMode ? 'Login de Admin para Registrar' : 'Iniciar Sesión'}
            </Button>
            <Grid container>
              <Grid item xs>
                <MuiLink component={Link} to="/login" variant="body2">
                  Volver al Login de Clientes
                </MuiLink>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Formulario de Registro de Nuevo Empleado (solo para Admin Logeado) */}
        {loggedInAsAdmin && (
          <Box component="form" onSubmit={handleNewEmployeeSubmit} noValidate sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Datos del Nuevo Empleado
            </Typography>
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
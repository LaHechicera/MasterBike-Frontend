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

// Recibe handleLogin como prop
function EmployeeLoginPage({ handleLogin }) {
  // Accede a la URL del backend desde las variables de entorno
  const API_URL = import.meta.env.VITE_API_URL;

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

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setSnackbarMessage('Por favor, ingresa tu correo y contraseña.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/employee-login`, {
        email,
        password,
      });

      console.log('Inicio de sesión exitoso:', response.data);
      setSnackbarMessage(`¡Bienvenido, ${response.data.employee.firstName}!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Llama a handleLogin de App.jsx con el rol del empleado
      handleLogin(response.data.employee.role);

      if (response.data.employee.role === 'admin') {
        setLoggedInAsAdmin(true);
      } else {
        setTimeout(() => {
          navigate('/inventory'); // Redirige a la página de inventario para empleados normales
        }, 2000);
      }

    } catch (error) {
      console.error('Error durante el inicio de sesión:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleRegisterEmployeeSubmit = async (event) => {
    event.preventDefault();

    if (!newEmployeeFirstName || !newEmployeeLastName || !newEmployeeEmail || !newEmployeePassword) {
      setSnackbarMessage('Por favor, completa todos los campos para registrar al nuevo empleado.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    if (!newEmployeeEmail.endsWith('@masterbike.cl')) {
      setSnackbarMessage('El correo del nuevo empleado debe terminar en @masterbike.cl');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/employee-register`, {
        firstName: newEmployeeFirstName,
        lastName: newEmployeeLastName,
        email: newEmployeeEmail,
        password: newEmployeePassword,
        adminEmail: email,
        adminPassword: password
      });

      console.log('Empleado registrado exitosamente:', response.data);
      setSnackbarMessage(`Empleado ${response.data.employee.firstName} registrado exitosamente.`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setNewEmployeeFirstName('');
      setNewEmployeeLastName('');
      setNewEmployeeEmail('');
      setNewEmployeePassword('');

    } catch (error) {
      console.error('Error durante el registro de empleado:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error al registrar empleado.');
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
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          {loggedInAsAdmin ? <PersonAddIcon /> : <LockOutlinedIcon />}
        </Avatar>
        <Typography component="h1" variant="h5">
          {loggedInAsAdmin ? 'Registrar Nuevo Empleado' : 'Iniciar Sesión de Empleado'}
        </Typography>

        {!loggedInAsAdmin && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={isAdminMode}
                  onChange={() => {
                    setIsAdminMode(!isAdminMode);
                    setEmail('');
                    setPassword('');
                  }}
                  name="adminMode"
                  color="primary"
                />
              }
              label={isAdminMode ? "Modo Administrador" : "Modo Empleado Normal"}
              sx={{ mt: 2, mb: 1 }}
            />

            <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={isAdminMode ? "Correo Electrónico de Administrador" : "Correo Electrónico de Empleado"}
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
              </Grid>
            </Box>
          </>
        )}

        {loggedInAsAdmin && (
          <Box component="form" onSubmit={handleRegisterEmployeeSubmit} noValidate sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Registrar Nuevo Empleado
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

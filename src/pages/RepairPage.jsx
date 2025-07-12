import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// URL base de tu backend para las reparaciones
const API_URL_BASE = import.meta.env.VITE_URL;
const API_URL_REPAIRS = `${API_URL_BASE}/api/repairs`;

const repairSteps = ['Detalles de la Bicicleta', 'Descripción del Problema', 'Información de Contacto', 'Confirmación'];
const repairStatuses = ['Pendiente', 'En Proceso', 'Completada', 'Cancelada'];

function RepairPage({ userRole }) {
  const [activeStep, setActiveStep] = useState(0);
  const [bikeType, setBikeType] = useState('');
  const [bikeBrand, setBikeBrand] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const isEmployeeOrAdmin = userRole === 'employee' || userRole === 'admin';

  useEffect(() => {
    if (isEmployeeOrAdmin) {
      fetchRepairRequests();
    }
  }, [userRole, isEmployeeOrAdmin]);

  const fetchRepairRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL_REPAIRS);
      const sortedRequests = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRepairRequests(sortedRequests);
      setError(null);
    } catch (err) {
      console.error('Error al cargar las solicitudes de reparación:', err);
      setError('Error al cargar las solicitudes de reparación.');
      setSnackbarMessage('Error al cargar las solicitudes de reparación.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && (!bikeType || !bikeBrand)) {
      setSnackbarMessage('Por favor, completa el tipo y la marca de la bicicleta.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    if (activeStep === 1 && !problemDescription.trim()) {
      setSnackbarMessage('Por favor, describe el problema.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    if (activeStep === 2 && (!contactName.trim() || !contactEmail.trim())) {
      setSnackbarMessage('Por favor, ingresa tu nombre y correo electrónico.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setBikeType('');
    setBikeBrand('');
    setProblemDescription('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
  };

  const generateRepairConfirmationPDF = (repairDetails) => {
    const doc = new jsPDF();
    const margin = 15;
    let y = margin;

    doc.setFontSize(22);
    doc.text("Solicitud de Reparación MasterBike", doc.internal.pageSize.width / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(14);
    doc.text("Detalles de la Solicitud:", margin, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Tipo de Bicicleta: ${repairDetails.bikeType}`, margin, y);
    y += 7;
    doc.text(`Marca de Bicicleta: ${repairDetails.bikeBrand}`, margin, y);
    y += 7;
    doc.text(`Problema: ${repairDetails.problemDescription}`, margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Información de Contacto:", margin, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Nombre: ${repairDetails.contactName}`, margin, y);
    y += 7;
    doc.text(`Email: ${repairDetails.contactEmail}`, margin, y);
    y += 7;
    if (repairDetails.contactPhone) {
      doc.text(`Teléfono: ${repairDetails.contactPhone}`, margin, y);
      y += 7;
    }
    doc.text(`Fecha de Solicitud: ${new Date(repairDetails.date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.text("Gracias por confiar en MasterBike para tu reparación.", doc.internal.pageSize.width / 2, y, { align: 'center' });

    doc.save(`solicitud_reparacion_${new Date().toISOString().slice(0,10)}.pdf`);
  };


  const handleSubmit = async () => {
    try {
      setLoading(true);
      const repairData = {
        bikeType,
        bikeBrand,
        problemDescription,
        contactName,
        contactEmail,
        contactPhone,
        status: 'Pendiente',
      };
      const response = await axios.post(API_URL_REPAIRS, repairData);
      console.log('Solicitud de reparación enviada:', response.data);

      setSnackbarMessage('¡Solicitud de reparación guardada con éxito!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      generateRepairConfirmationPDF(response.data);
      
      handleReset();
    } catch (err) {
      console.error('Error al enviar la solicitud de reparación:', err);
      setSnackbarMessage(`Error al enviar la solicitud: ${err.response?.data?.message || err.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (repairId, newStatus) => {
    try {
      await axios.put(`${API_URL_REPAIRS}/${repairId}`, { status: newStatus });
      setSnackbarMessage('Estado de la solicitud actualizado con éxito.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchRepairRequests();
    } catch (err) {
      console.error('Error al actualizar el estado de la solicitud:', err);
      setSnackbarMessage(`Error al actualizar el estado: ${err.response?.data?.message || err.message}`);
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
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        {isEmployeeOrAdmin ? 'Gestión de Solicitudes de Reparación' : 'Solicitud de Reparación de Bicicletas'}
      </Typography>

      {/* Formulario de Solicitud (visible solo para clientes) */}
      {!isEmployeeOrAdmin && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {repairSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {activeStep === 0 && (
                    <Box sx={{ mb: 2 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="bike-type-label">Tipo de Bicicleta</InputLabel>
                        <Select
                          labelId="bike-type-label"
                          value={bikeType}
                          label="Tipo de Bicicleta"
                          onChange={(e) => setBikeType(e.target.value)}
                        >
                          <MenuItem value=""><em>Selecciona un tipo</em></MenuItem>
                          <MenuItem value="MTB">Montaña (MTB)</MenuItem>
                          <MenuItem value="Ruta">Ruta</MenuItem>
                          <MenuItem value="Urbana">Urbana</MenuItem>
                          <MenuItem value="Eléctrica">Eléctrica</MenuItem>
                          <MenuItem value="BMX">BMX</MenuItem>
                          <MenuItem value="Niño">Niño</MenuItem>
                          <MenuItem value="Otra">Otra</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Marca de la Bicicleta"
                        variant="outlined"
                        fullWidth
                        value={bikeBrand}
                        onChange={(e) => setBikeBrand(e.target.value)}
                      />
                    </Box>
                  )}
                  {activeStep === 1 && (
                    <TextField
                      label="Describe el problema de tu bicicleta"
                      multiline
                      rows={4}
                      variant="outlined"
                      fullWidth
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                    />
                  )}
                  {activeStep === 2 && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        label="Tu Nombre Completo"
                        variant="outlined"
                        fullWidth
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Tu Correo Electrónico"
                        type="email"
                        variant="outlined"
                        fullWidth
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Tu Teléfono (opcional)"
                        variant="outlined"
                        fullWidth
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </Box>
                  )}
                  {activeStep === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Resumen de tu Solicitud:
                      </Typography>
                      <Typography>
                        **Bicicleta:** {bikeType} - {bikeBrand}
                      </Typography>
                      <Typography>
                        **Problema:** {problemDescription}
                      </Typography>
                      <Typography>
                        **Contacto:** {contactName} ({contactEmail}) {contactPhone && `| ${contactPhone}`}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={activeStep === repairSteps.length - 1 ? handleSubmit : handleNext}
                        sx={{ mt: 1, mr: 1 }}
                        disabled={loading}
                      >
                        {activeStep === repairSteps.length - 1 ? (loading ? 'Enviando...' : 'Enviar Solicitud') : 'Siguiente'}
                      </Button>
                      <Button
                        disabled={activeStep === 0 || loading}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Atrás
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          {activeStep === repairSteps.length && (
            <Paper square elevation={0} sx={{ p: 3 }}>
              <Typography>¡Tu solicitud ha sido enviada!</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Enviar otra solicitud
              </Button>
            </Paper>
          )}
        </Paper>
      )}

      {/* Sección de Solicitudes de Reparación Recientes (visible solo para empleados/administradores) */}
      {isEmployeeOrAdmin && (
        <>

          {loading && repairRequests.length === 0 && <Typography align="center">Cargando solicitudes...</Typography>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={3} alignItems="stretch">
            {repairRequests.length === 0 && !loading && !error ? (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No hay solicitudes de reparación registradas aún.
                </Typography>
              </Grid>
            ) : (
              repairRequests.map((repair) => (
                <Grid item xs={12} sm={6} md={6} key={repair._id}>
                  <Card raised sx={{ height: 250, width: 500, display: 'flex', flexDirection: 'column' }}> {/* Fixed height for uniformity */}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          Solicitud ID: {repair._id.slice(-6)}
                        </Typography>
                        <Chip
                          label={repair.status}
                          color={
                            repair.status === 'Pendiente' ? 'warning' :
                            repair.status === 'En Proceso' ? 'info' :
                            repair.status === 'Completada' ? 'success' : 'default'
                          }
                          icon={
                            repair.status === 'Pendiente' ? <HourglassEmptyIcon /> :
                            repair.status === 'En Proceso' ? <BuildIcon /> :
                            repair.status === 'Completada' ? <CheckCircleOutlineIcon /> : null
                          }
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Solicitud: {new Date(repair.date).toLocaleDateString('es-CL')}
                      </Typography>
                      <Typography variant="body2">
                        Tipo de Bici: **{repair.bikeType}** ({repair.bikeBrand})
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, maxHeight: 80, overflowY: 'auto' }}> {/* Constrain problem description height */}
                        **Problema:** {repair.problemDescription}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Contacto: {repair.contactName} | {repair.contactEmail} {repair.contactPhone && `| ${repair.contactPhone}`}
                      </Typography>

                      {/* Controles de gestión para empleados/administradores */}
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`status-label-${repair._id}`}>Cambiar Estado</InputLabel>
                          <Select
                            labelId={`status-label-${repair._id}`}
                            value={repair.status}
                            label="Cambiar Estado"
                            onChange={(e) => handleUpdateStatus(repair._id, e.target.value)}
                          >
                            {repairStatuses.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default RepairPage;

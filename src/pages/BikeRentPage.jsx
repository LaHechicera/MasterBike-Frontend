import React, { useState, useEffect } from 'react'; // Importa useEffect
import {
  Grid,
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress, // Para indicar carga
  Alert, // Para mensajes de éxito/error
  Snackbar, // Para mostrar la Alert
  CardMedia // Para mostrar la imagen de la bici
} from '@mui/material';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; // Cambiado a DateTimePicker
import { format, differenceInMinutes } from 'date-fns'; // differenceInMinutes para cálculo por minutos
import es from 'date-fns/locale/es'; // Para tener el DatePicker en español

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import axios from 'axios'; // Importa axios

function BikeRentPage() {
  // Accede a la URL del backend desde las variables de entorno
  const API_URL = import.meta.env.VITE_API_URL;
  // URL base de tu backend para las bicicletas y los arriendos
  const API_URL_BIKES = `${API_URL}/api/bikes`; // URL para obtener bicicletas
  const API_URL_RENTALS = `${API_URL}/api/rentals`; // URL para registrar arriendos

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableBikes, setAvailableBikes] = useState([]); // Estado para las bicicletas disponibles
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado para errores de carga

  // Nuevos estados para la información del cliente
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Estados para el Snackbar (mensajes de alerta)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error', 'warning', 'info'

  // Estado para detalles de confirmación de arriendo para el PDF (ahora opcional para la descarga automática)
  const [rentConfirmationDetails, setRentConfirmationDetails] = useState(null);

  // useEffect para cargar las bicicletas al montar el componente
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_URL_BIKES);
        setAvailableBikes(response.data);
        setError(null); // Limpiar errores si la carga fue exitosa
      } catch (err) {
        console.error("Error al cargar las bicicletas:", err);
        setError("Error al cargar las bicicletas. Intenta de nuevo más tarde.");
        setSnackbarMessage("Error al cargar las bicicletas.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBikes();
  }, [API_URL_BIKES]); // El array vacío asegura que se ejecute solo una vez al montar

  useEffect(() => {
    if (selectedBike && startDate && endDate && endDate > startDate) {
      // Calcular la diferencia en minutos y luego en horas o fracciones de hora
      const diffMinutes = differenceInMinutes(endDate, startDate);
      // Asumiendo que pricePerHour es por hora, si necesitas por minutos, ajusta la división
      const pricePerMinute = selectedBike.pricePerHour / 60;
      const calculatedPrice = pricePerMinute * diffMinutes;
      setTotalPrice(calculatedPrice);
    } else {
      setTotalPrice(0);
    }
  }, [startDate, endDate, selectedBike]);

  const handleOpenDialog = (bike) => {
    setSelectedBike(bike);
    setStartDate(null);
    setEndDate(null);
    setTotalPrice(0);
    setCustomerName(''); // Resetear campos al abrir
    setCustomerEmail('');
    setCustomerPhone('');
    setRentConfirmationDetails(null); // Resetear detalles de confirmación
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBike(null);
  };

  const handleStartDateChange = (newValue) => {
    setStartDate(newValue);
    // Asegurarse de que endDate no sea anterior a startDate
    if (endDate && newValue && endDate < newValue) {
      setEndDate(newValue);
    }
  };

  const handleEndDateChange = (newValue) => {
    setEndDate(newValue);
  };

  // Función para generar el PDF (ahora puede recibir los detalles directamente)
  const generateRentConfirmationPDF = (detailsToPrint) => {
    // Si no se pasaron detalles, intenta usar los del estado (útil si se mantuviera un botón manual)
    const finalDetails = detailsToPrint || rentConfirmationDetails;

    if (!finalDetails) {
      setSnackbarMessage("No hay detalles de confirmación de arriendo para generar el PDF.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    const doc = new jsPDF();
    let yPos = 10;
    const margin = 10;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.text("Confirmación de Arriendo de Bicicleta", margin, yPos);
    yPos += lineHeight * 2;

    doc.setFontSize(12);
    doc.text(`ID de Arriendo: ${finalDetails._id}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Bicicleta: ${finalDetails.bikeName}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Fecha de Inicio: ${format(new Date(finalDetails.startDate), 'dd/MM/yyyy HH:mm', { locale: es })}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Fecha de Término: ${format(new Date(finalDetails.endDate), 'dd/MM/yyyy HH:mm', { locale: es })}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Precio Total: $${finalDetails.totalPrice.toLocaleString('es-CL')}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Estado: ${finalDetails.status}`, margin, yPos);
    yPos += lineHeight * 2;

    doc.text("Detalles del Cliente:", margin, yPos);
    yPos += lineHeight;
    doc.text(`Nombre: ${finalDetails.customerName}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Email: ${finalDetails.customerEmail}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Teléfono: ${finalDetails.customerPhone || 'N/A'}`, margin, yPos);
    yPos += lineHeight * 2;

    doc.text("¡Gracias por tu arriendo!", margin, yPos);

    doc.save(`confirmacion_arriendo_${finalDetails._id}.pdf`);
  };


  const handleConfirmRent = async () => {
    if (!selectedBike || !startDate || !endDate || totalPrice <= 0 || !customerName || !customerEmail) {
      setSnackbarMessage("Por favor, completa todos los campos requeridos y selecciona fechas válidas.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      const rentalData = {
        bikeId: selectedBike._id,
        bikeName: selectedBike.name,
        startDate: startDate.toISOString(), // Enviar en formato ISO
        endDate: endDate.toISOString(),     // Enviar en formato ISO
        totalPrice: totalPrice,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        status: 'Activo' // O 'Pendiente' según tu lógica
      };

      const response = await axios.post(API_URL_RENTALS, rentalData);
      console.log('Arriendo registrado:', response.data);

      setRentConfirmationDetails(response.data); // Guardar los detalles en el estado

      // Llama a generateRentConfirmationPDF con los datos de la respuesta directamente
      generateRentConfirmationPDF(response.data);

      setSnackbarMessage('¡Arriendo confirmado con éxito! El PDF se ha descargado.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog(); // Cerrar el diálogo después de confirmar
    } catch (err) {
      console.error('Error al registrar el arriendo:', err.response ? err.response.data : err.message);
      setSnackbarMessage(`Error al confirmar el arriendo: ${err.response?.data?.message || err.message}`);
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
    <Container>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        Arriendo de Bicicletas
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Cargando bicicletas...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && availableBikes.length === 0 && (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No hay bicicletas disponibles para arriendo en este momento.
        </Typography>
      )}

      {!loading && !error && availableBikes.length > 0 && (
        <Grid container spacing={4} justifyContent="center">
          {availableBikes.map((bike) => (
            <Grid item key={bike._id} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ height: 400, width: 500, display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  height="194"
                  sx={{ objectFit: 'contain' }}
                  image={bike.imageUrl || 'https://via.placeholder.com/345x194?text=No+Image'}
                  alt={bike.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {bike.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bike.description}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    ${bike.pricePerHour ? bike.pricePerHour.toLocaleString('es-CL') : 'N/A'} / hora
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleOpenDialog(bike)}
                    disabled={!bike.available} // Deshabilitar si no está disponible
                  >
                    {bike.available ? 'Arrendar' : 'No Disponible'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo de Arriendo */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Arrendar: {selectedBike?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selecciona las fechas y horas de arriendo e ingresa tus datos:
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DateTimePicker
              label="Fecha y Hora de Inicio"
              value={startDate}
              onChange={handleStartDateChange}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              minDateTime={new Date()} // No permitir fechas/horas pasadas
            />
            <DateTimePicker
              label="Fecha y Hora de Término"
              value={endDate}
              onChange={handleEndDateChange}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              minDateTime={startDate || new Date()} // No permitir antes de la fecha/hora de inicio
            />
          </LocalizationProvider>

          {/* CAMPOS DE CLIENTE INCLUIDOS */}
          <TextField
            margin="dense"
            label="Tu Nombre Completo"
            type="text"
            fullWidth
            variant="outlined"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Tu Correo Electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Tu Teléfono (opcional)"
            type="tel"
            fullWidth
            variant="outlined"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            sx={{ mt: 2 }}
          />
          {/* FIN DE LOS CAMPOS INCLUIDOS */}

          <Typography variant="h6" sx={{ mt: 2 }}>
            Costo Estimado: ${totalPrice.toLocaleString('es-CL')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Calculado en bloques de 1 hora.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleConfirmRent}
            variant="contained"
            disabled={!startDate || !endDate || totalPrice <= 0 || endDate < startDate || !customerName || !customerEmail}
          >
            Confirmar Arriendo
          </Button>
          {/* El botón de descarga manual ha sido comentado/eliminado ya que la descarga es automática */}
          {/* Si deseas mantenerlo como opción adicional, puedes descomentarlo */}
          {/*
          <Button
            onClick={() => generateRentConfirmationPDF()} // Llama sin argumentos, usará el estado
            variant="outlined"
            color="secondary"
            disabled={!rentConfirmationDetails}
          >
            Descargar Confirmación PDF
          </Button>
          */}
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default BikeRentPage;

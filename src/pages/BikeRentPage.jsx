import React, { useState, useEffect } from 'react'; 
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
  CircularProgress, 
  Alert, 
  Snackbar, 
  CardMedia 
} from '@mui/material';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; 
import { format, differenceInMinutes } from 'date-fns'; 
import es from 'date-fns/locale/es'; 

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import axios from 'axios'; 

// 1. Define la URL base de la API
const API_URL_BASE = process.env.REACT_APP_URL;

// 2. Define las URLs completas para los endpoints
const API_URL_BIKES = `${API_URL_BASE}/api/bikes`; // URL para obtener bicicletas
const API_URL_RENTALS = `${API_URL_BASE}/api/rentals`; // URL para registrar arriendos

// Constante para el precio por hora de arriendo (ejemplo: $2.500)
const RENTAL_PRICE_PER_HOUR = 2500;

function BikeRentPage() {
  const [bikes, setBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [rentConfirmationDetails, setRentConfirmationDetails] = useState(null);
  const [loadingRent, setLoadingRent] = useState(false);

  // Función para obtener las bicicletas disponibles (se ejecuta al cargar la página)
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setLoading(true);
        // Usa la URL de bicicletas actualizada
        const response = await axios.get(API_URL_BIKES);
        // Filtra las bicicletas disponibles para arriendo (suponiendo que hay un campo 'availableForRent' en el backend)
        const availableBikes = response.data.filter(bike => bike.availableForRent); 
        setBikes(availableBikes);
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener bicicletas:", err);
        setError("No se pudieron cargar las bicicletas para arriendo.");
        setLoading(false);
      }
    };
    fetchBikes();
  }, []);

  // Función para calcular el precio
  const calculatePrice = (start, end) => {
    if (start && end && end > start) {
      // Diferencia en minutos
      const durationMinutes = differenceInMinutes(end, start);
      // Precio por minuto basado en el precio por hora
      const pricePerMinute = RENTAL_PRICE_PER_HOUR / 60;
      // Cálculo del precio total
      const price = durationMinutes * pricePerMinute;
      setTotalPrice(price);
    } else {
      setTotalPrice(0);
    }
  };

  // Observa cambios en startDate y endDate para recalcular el precio
  useEffect(() => {
    calculatePrice(startDate, endDate);
  }, [startDate, endDate]);

  const handleOpenDialog = (bike) => {
    setSelectedBike(bike);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Reiniciar estados del diálogo
    setCustomerName('');
    setCustomerEmail('');
    setStartDate(null);
    setEndDate(null);
    setTotalPrice(0);
    setSelectedBike(null);
  };

  // Función para manejar la confirmación del arriendo
  const handleConfirmRent = async () => {
    // Validaciones básicas
    if (!customerName || !customerEmail || !selectedBike || !startDate || !endDate || endDate <= startDate) {
      setSnackbarMessage('Por favor, completa todos los datos y asegúrate de que las fechas sean válidas.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    setLoadingRent(true);

    const rentalData = {
      bikeId: selectedBike._id,
      customerName,
      customerEmail,
      startDate: startDate.toISOString(), // Enviar en formato ISO
      endDate: endDate.toISOString(),
      totalPrice,
      status: 'Confirmado'
    };

    try {
      // Usa la URL de arriendos actualizada
      const response = await axios.post(API_URL_RENTALS, rentalData);
      
      setSnackbarMessage('Arriendo confirmado con éxito!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Guarda los detalles de confirmación para el PDF
      setRentConfirmationDetails(response.data); 
      
      // Generar y descargar el PDF de confirmación
      generateRentConfirmationPDF(response.data);
      
      // Cierra el diálogo y actualiza la lista de bicicletas (para marcar la bici como no disponible si es necesario)
      handleCloseDialog();
      fetchBikes(); // Re-fetch para actualizar el estado del inventario
      
    } catch (err) {
      console.error("Error al registrar el arriendo:", err.response ? err.response.data : err.message);
      setSnackbarMessage(err.response?.data?.message || 'Error al confirmar el arriendo. Intenta de nuevo.');
      setSnackbarSeverity('error');
    } finally {
      setLoadingRent(false);
    }
  };

  // Función para generar el PDF de confirmación de arriendo
  const generateRentConfirmationPDF = (details) => {
    // Código para generar el PDF de confirmación
    const pdf = new jsPDF();
    
    // ... (Contenido del PDF) ...
    
    pdf.save(`Confirmacion_Arriendo_${details._id}.pdf`);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Cargando bicicletas disponibles...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 6 }}>
        Arriendo de Bicicletas
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Bicicletas Disponibles
      </Typography>

      {bikes.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No hay bicicletas disponibles para arriendo en este momento.
        </Alert>
      ) : (
        <Grid container spacing={4} justifyContent="center">
          {bikes.map((bike) => (
            <Grid item key={bike._id} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  height="194"
                  image={bike.imageUrl || 'https://via.placeholder.com/345x194?text=Bicicleta'}
                  alt={bike.name}
                  sx={{ objectFit: 'contain' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {bike.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipo: {bike.type} | Marca: {bike.brand}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {bike.stock}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    ${RENTAL_PRICE_PER_HOUR.toLocaleString('es-CL')} / Hora
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleOpenDialog(bike)}
                    disabled={bike.stock === 0}
                  >
                    {bike.stock > 0 ? 'Arrendar' : 'Sin Stock'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo de Arriendo */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          Arrendar {selectedBike?.name}
        </DialogTitle>
        <DialogContent>
          {loadingRent && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}
          <TextField
            label="Nombre Completo"
            fullWidth
            margin="dense"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Correo Electrónico"
            fullWidth
            margin="dense"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DateTimePicker
              label="Fecha y Hora de Inicio"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
            />
            <DateTimePicker
              label="Fecha y Hora de Término"
              value={endDate}
              onChange={setEndDate}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              minDate={startDate} // Asegura que la fecha de término sea posterior a la de inicio
            />
          </LocalizationProvider>

          <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
            Precio Total Estimado: ${totalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
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
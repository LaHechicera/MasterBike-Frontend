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

// 1. Define la URL base de la API (compatible con Vite)
const API_URL_BASE = import.meta.env.VITE_URL;

// 2. Define las URLs completas para los endpoints
const API_URL_BIKES = `${API_URL_BASE}/api/bikes`; // URL para obtener bicicletas
const API_URL_RENTALS = `${API_URL_BASE}/api/rentals`; // URL para registrar arriendos

// Componente para la Tarjeta de Bicicleta de Arriendo
const BikeCard = ({ bike, onRent }) => {
  return (
    <Card 
      sx={{ 
        height: 400, 
        width: 300, 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: 3, 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px',
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        }
      }}
    >
      <CardMedia
        component="img"
        height="194"
        sx={{ objectFit: 'contain' }}
        image={bike.imageUrl || 'https://via.placeholder.com/345x194.png?text=Sin+Imagen'}
        alt={bike.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div">
          {bike.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {bike.brand} - {bike.type}
        </Typography>
        <Typography variant="h5" color="secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
          ${bike.hourlyRate ? bike.hourlyRate.toLocaleString('es-CL') : 'N/A'} / hora
        </Typography>
      </CardContent>
      <CardActions sx={{ mt: 'auto', p: 2 }}>
        <Button 
          size="small" 
          variant="contained" 
          color="primary"
          onClick={() => onRent(bike)}
        >
          Arrendar
        </Button>
      </CardActions>
    </Card>
  );
};

// Componente principal de la página de arriendo
function BikeRentPage() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  
  // Estados para el formulario de arriendo
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Estados para Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Cargar las bicicletas al iniciar el componente
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        // Asumiendo que el endpoint `api/bikes` devuelve solo las bicicletas disponibles para arriendo
        const response = await axios.get(API_URL_BIKES);
        setBikes(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar bicicletas:', err);
        setError('No se pudo cargar la lista de bicicletas. Intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    fetchBikes();
  }, []);

  // Calcular el precio total cuando cambian las fechas o la bicicleta seleccionada
  useEffect(() => {
    if (startDate && endDate && selectedBike && selectedBike.hourlyRate && endDate > startDate) {
      // Calcular la diferencia en minutos entre las fechas
      const durationMinutes = differenceInMinutes(endDate, startDate);
      // Convertir minutos a horas y redondear al bloque de hora más cercano (hacia arriba)
      const durationHours = Math.ceil(durationMinutes / 60); 
      
      const calculatedPrice = durationHours * selectedBike.hourlyRate;
      setTotalPrice(calculatedPrice);
    } else {
      setTotalPrice(0);
    }
  }, [startDate, endDate, selectedBike]);

  const handleOpenDialog = (bike) => {
    setSelectedBike(bike);
    // Resetear las fechas al abrir el diálogo
    setStartDate(null);
    setEndDate(null);
    setCustomerName('');
    setCustomerEmail('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBike(null);
  };

  // Generar PDF de confirmación de arriendo
  const generateRentConfirmationPDF = (details) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Confirmación de Arriendo - MasterBike', 10, 20);

    doc.setFontSize(16);
    doc.text('Detalles del Cliente y Arriendo', 10, 40);
    doc.setFontSize(12);
    doc.text(`Cliente: ${details.customerName}`, 10, 50);
    doc.text(`Email: ${details.customerEmail}`, 10, 57);
    doc.text(`Bicicleta: ${details.bikeName} (${details.bikeBrand})`, 10, 64);
    doc.text(`Fecha de Inicio: ${details.startDate}`, 10, 71);
    doc.text(`Fecha de Término: ${details.endDate}`, 10, 78);
    doc.text(`Duración Estimada (Horas): ${details.durationHours}`, 10, 85);

    doc.setFontSize(18);
    doc.text(`Total Pagado: $${details.totalPrice.toLocaleString('es-CL')}`, 10, 100);

    doc.setFontSize(10);
    doc.text('Gracias por preferir MasterBike. Disfruta tu arriendo!', 10, 120);

    doc.save(`Confirmacion_Arriendo_${Date.now()}.pdf`);
  };

  // Enviar solicitud de arriendo al backend
  const handleConfirmRent = async () => {
    if (!startDate || !endDate || !customerName || !customerEmail || totalPrice <= 0) {
      showSnackbar('Por favor, completa todos los campos y verifica las fechas.', 'error');
      return;
    }

    try {
      const rentalData = {
        bikeId: selectedBike._id,
        customerName,
        customerEmail,
        startDate,
        endDate,
        totalPrice,
      };

      // Envía los datos al backend
      const response = await axios.post(API_URL_RENTALS, rentalData);
      
      console.log('Arriendo registrado:', response.data);
      
      // Preparar detalles para el PDF
      const durationMinutes = differenceInMinutes(endDate, startDate);
      const durationHours = Math.ceil(durationMinutes / 60);

      const pdfDetails = {
        customerName,
        customerEmail,
        bikeName: selectedBike.name,
        bikeBrand: selectedBike.brand,
        startDate: format(startDate, 'dd/MM/yyyy HH:mm', { locale: es }),
        endDate: format(endDate, 'dd/MM/yyyy HH:mm', { locale: es }),
        durationHours,
        totalPrice,
      };

      // Generar y descargar el PDF de confirmación
      generateRentConfirmationPDF(pdfDetails);
      
      showSnackbar('Arriendo confirmado y registrado exitosamente. Se ha descargado la confirmación en PDF.', 'success');
      handleCloseDialog();
      
    } catch (error) {
      console.error('Error al registrar el arriendo:', error.response ? error.response.data : error.message);
      showSnackbar('Error al registrar el arriendo. Intenta de nuevo.', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
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
        <Typography variant="h6" sx={{ mt: 2 }}>Cargando bicicletas de arriendo...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        Arriendo de Bicicletas MasterBike
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Explora nuestra selección de bicicletas disponibles para arriendo por hora.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }} justifyContent="center">
        {bikes.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">No hay bicicletas disponibles para arriendo en este momento.</Alert>
          </Grid>
        ) : (
          bikes.map((bike) => (
            <Grid item key={bike._id} xs={12} sm={6} md={4} lg={3}>
              <BikeCard bike={bike} onRent={handleOpenDialog} />
            </Grid>
          ))
        )}
      </Grid>

      {/* Diálogo de Arriendo */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Arrendar {selectedBike?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Precio por hora: ${selectedBike?.hourlyRate?.toLocaleString('es-CL') || 0}
          </Typography>
          
          <TextField
            margin="dense"
            label="Nombre Completo"
            type="text"
            fullWidth
            variant="outlined"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email de Contacto"
            type="email"
            fullWidth
            variant="outlined"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          {/* DateTimePicker para la fecha de inicio y término */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DateTimePicker
              label="Fecha y Hora de Inicio"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              minDate={new Date()} // No permitir seleccionar fechas pasadas
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
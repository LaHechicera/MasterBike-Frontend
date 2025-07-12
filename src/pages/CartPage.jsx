// CartPage.jsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Divider,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

// DatePicker imports
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, isWeekend, isPast, addDays } from 'date-fns';
import es from 'date-fns/locale/es';

// PDF imports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 1. Define la URL base de la API
const API_URL_BASE = process.env.REACT_APP_URL;

// 2. Define la URL de tu backend para procesar la compra
const API_URL_PURCHASE = `${API_URL_BASE}/api/purchase`;

function CartPage({ cart, updateItemQuantity, removeItemFromCart, clearCart }) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  
  // Datos del cliente para la compra
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); // Añadido para la dirección de despacho
  const [deliveryDate, setDeliveryDate] = useState(null); // Para la fecha de despacho

  // ... (Funciones de manejo de cantidad y eliminación de items) ...

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Función para manejar la confirmación de la compra
  const handleConfirmPurchase = async () => {
    // Validar datos de cliente y fecha de despacho
    if (!customerName || !customerEmail || !customerAddress || !deliveryDate) {
      setSnackbarMessage('Por favor, completa todos los datos de contacto y selecciona una fecha de despacho.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Preparar los datos de la compra
    const purchaseData = {
      items: cart.map(item => ({
        itemId: item._id, // Usamos _id del inventario
        quantity: item.quantity,
        price: item.price,
        name: item.name
      })),
      totalAmount: calculateSubtotal(),
      customerName,
      customerEmail,
      customerAddress,
      deliveryDate: format(deliveryDate, 'yyyy-MM-dd')
    };

    setLoadingPurchase(true);

    try {
      // Usa la URL de compra actualizada
      const response = await axios.post(API_URL_PURCHASE, purchaseData);

      console.log('Compra exitosa:', response.data);
      setSnackbarMessage('¡Compra realizada con éxito! Recibirás un correo de confirmación.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Simula la creación del PDF de la boleta
      createInvoicePDF(response.data.purchase);
      
      // Limpiar el carrito y cerrar el diálogo después de la compra
      clearCart();
      setOpenPurchaseDialog(false);
      
    } catch (error) {
      console.error('Error al procesar la compra:', error.response ? error.response.data : error.message);
      setSnackbarMessage(error.response?.data?.message || 'Error al procesar la compra. Verifica el stock disponible.');
      setSnackbarSeverity('error');
      
    } finally {
      setLoadingPurchase(false);
    }
  };

  // ... (Resto del código, incluyendo createInvoicePDF, shouldDisableDate, etc.) ...
  
  // Función para generar el PDF de la boleta
  const createInvoicePDF = (purchaseDetails) => {
    // Código para generar el PDF usando jsPDF y html2canvas
    const invoiceContent = document.createElement('div');
    invoiceContent.style.padding = '20px';
    invoiceContent.style.backgroundColor = '#fff';
    invoiceContent.style.fontFamily = 'Arial, sans-serif';
    
    // ... (Estructura HTML de la boleta) ...
    
    html2canvas(invoiceContent, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Boleta_${purchaseDetails._id}.pdf`);
    });
  };

  const shouldDisableDate = (date) => {
    // Deshabilitar fines de semana y fechas pasadas
    const today = new Date();
    return isWeekend(date) || isPast(date) && !isSameDay(date, today);
  };

  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleOpenPurchaseDialog = () => {
    setOpenPurchaseDialog(true);
  };

  const handleClosePurchaseDialog = () => {
    setOpenPurchaseDialog(false);
    // Reiniciar los campos del formulario de compra
    setCustomerName('');
    setCustomerEmail('');
    setCustomerAddress('');
    setDeliveryDate(null);
  };
  
  const handleDeliveryDateChange = (date) => {
    setDeliveryDate(date);
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
        Carrito de Compras
      </Typography>

      {cart.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          Tu carrito está vacío.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <List component={Paper} elevation={3}>
              {cart.map((item) => (
                <ListItem key={item._id} sx={{ py: 2, px: 3, '&:not(:last-child)': { borderBottom: '1px solid #e0e0e0' } }}>
                  <ListItemText
                    primary={<Typography variant="h6">{item.name}</Typography>}
                    secondary={`Cantidad: ${item.quantity} | Precio Unitario: $${item.price.toLocaleString('es-CL')}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => updateItemQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                    <IconButton onClick={() => updateItemQuantity(item._id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                      <AddIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => removeItemFromCart(item._id)} color="error" sx={{ ml: 2 }}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Resumen de Compra
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Subtotal:</Typography>
                <Typography variant="h6" color="primary">
                  ${calculateSubtotal().toLocaleString('es-CL')}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={handleOpenPurchaseDialog}
                sx={{ mt: 2, py: 1.5 }}
              >
                Proceder a la Compra
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Diálogo de Confirmación de Compra */}
      <Dialog open={openPurchaseDialog} onClose={handleClosePurchaseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Datos para el Despacho</DialogTitle>
        <DialogContent>
          {loadingPurchase && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}
          <TextField
            label="Nombre Completo"
            fullWidth
            margin="normal"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Correo Electrónico"
            fullWidth
            margin="normal"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Dirección de Despacho"
            fullWidth
            margin="normal"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            sx={{ mb: 2 }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha de Despacho Sugerida (Días hábiles)"
              value={deliveryDate}
              onChange={handleDeliveryDateChange}
              shouldDisableDate={shouldDisableDate}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              minDate={addDays(new Date(), 0)}
            />
          </LocalizationProvider>
          <Typography variant="body2" color="text.secondary">
            Total a Pagar: **${calculateSubtotal().toLocaleString('es-CL')}**
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePurchaseDialog}>Cancelar</Button>
          <Button
            onClick={handleConfirmPurchase}
            variant="contained"
            // NUEVO: Deshabilitar si la dirección está vacía
            disabled={!deliveryDate || !customerName.trim() || !customerEmail.trim() || !customerAddress.trim() || loadingPurchase}
          >
            Confirmar Compra
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default CartPage;
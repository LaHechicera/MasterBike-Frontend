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

// 1. Define la URL base de la API (compatible con Vite)
// Nota: En Vite, las variables de entorno se acceden con import.meta.env y deben empezar con VITE_
const API_URL_BASE = import.meta.env.VITE_URL;

// 2. Define la URL de tu backend para procesar la compra
const API_URL_PURCHASE = `${API_URL_BASE}/api/purchase`;

function CartPage({ cart, updateItemQuantity, removeItemFromCart, clearCart }) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  
  // Estados para la información del cliente
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(null);

  // Manejador para la cantidad de productos
  const handleQuantityChange = (id, newQuantity, maxStock) => {
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      updateItemQuantity(id, newQuantity);
    } else if (newQuantity > maxStock) {
      showSnackbar(`No hay suficiente stock para ${newQuantity} unidades.`, 'warning');
    }
  };

  // Calcula el subtotal del carrito
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Mostrar Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Manejar el cierre del Snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Abrir el diálogo de compra
  const handleOpenPurchaseDialog = () => {
    if (cart.length === 0) {
      showSnackbar('El carrito está vacío. Agrega productos para continuar.', 'warning');
      return;
    }
    setOpenPurchaseDialog(true);
  };

  // Cerrar el diálogo de compra
  const handleClosePurchaseDialog = () => {
    setOpenPurchaseDialog(false);
    setLoadingPurchase(false);
  };

  // Generar PDF de confirmación de compra
  const generatePurchasePDF = (purchaseDetails) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(22);
    doc.text('Confirmación de Compra - MasterBike', 10, 20);

    // Detalles del Cliente
    doc.setFontSize(16);
    doc.text('Detalles del Cliente', 10, 40);
    doc.setFontSize(12);
    doc.text(`Nombre: ${purchaseDetails.customerName}`, 10, 50);
    doc.text(`Email: ${purchaseDetails.customerEmail}`, 10, 57);
    doc.text(`Dirección de Despacho: ${purchaseDetails.customerAddress}`, 10, 64);
    doc.text(`Fecha de Despacho Sugerida: ${purchaseDetails.deliveryDate}`, 10, 71);

    // Detalles de la Compra
    doc.setFontSize(16);
    doc.text('Productos Comprados', 10, 85);
    doc.setFontSize(12);
    let y = 95;
    purchaseDetails.items.forEach(item => {
      doc.text(`${item.quantity}x ${item.name} ($${item.price.toLocaleString('es-CL')}) - Total: $${(item.quantity * item.price).toLocaleString('es-CL')}`, 10, y);
      y += 7;
    });

    // Total
    doc.setFontSize(16);
    doc.text(`Total Pagado: $${purchaseDetails.totalAmount.toLocaleString('es-CL')}`, 10, y + 10);

    // Nota
    doc.setFontSize(10);
    doc.text('Gracias por tu compra en MasterBike. Te contactaremos para coordinar el despacho.', 10, y + 30);

    doc.save(`Confirmacion_Compra_${Date.now()}.pdf`);
  };

  // Confirmar compra y procesar el pago (simulado)
  const handleConfirmPurchase = async () => {
    setLoadingPurchase(true);

    const purchaseDetails = {
      customerName,
      customerEmail,
      customerAddress,
      deliveryDate: deliveryDate ? format(deliveryDate, 'dd/MM/yyyy') : null,
      items: cart.map(item => ({
        id: item._id, // Usamos _id de MongoDB
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      })),
      totalAmount: calculateSubtotal(),
      // Aquí podrías agregar el método de pago si fuera real
    };

    try {
      // Envía los detalles de la compra al backend
      const response = await axios.post(API_URL_PURCHASE, purchaseDetails);
      
      console.log('Compra procesada exitosamente:', response.data);
      
      // Generar PDF y descargar
      generatePurchasePDF(purchaseDetails);

      // Limpiar el carrito y cerrar el diálogo
      clearCart();
      handleClosePurchaseDialog();
      showSnackbar('¡Compra realizada con éxito! Tu confirmación se ha descargado en PDF.', 'success');

      // Limpiar estados del formulario
      setCustomerName('');
      setCustomerEmail('');
      setCustomerAddress('');
      setDeliveryDate(null);

    } catch (error) {
      console.error('Error al procesar la compra:', error.response ? error.response.data : error.message);
      handleClosePurchaseDialog();
      showSnackbar('Hubo un error al procesar la compra. Intenta de nuevo.', 'error');
    }
  };

  // Lógica para deshabilitar fines de semana y días pasados en el DatePicker
  const shouldDisableDate = (date) => {
    return isWeekend(date) || isPast(date);
  };

  // Manejar el cambio de fecha de despacho
  const handleDeliveryDateChange = (date) => {
    // Asegurarse de que la fecha seleccionada sea un objeto Date válido antes de establecerla
    if (date instanceof Date && !isNaN(date)) {
      setDeliveryDate(date);
    } else {
      setDeliveryDate(null);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Carrito de Compras
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {cart.length === 0 ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          Tu carrito está vacío.
        </Alert>
      ) : (
        <Paper elevation={3} sx={{ p: 3 }}>
          <List>
            {cart.map((item) => (
              <ListItem
                key={item._id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => removeItemFromCart(item._id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '4px', marginRight: 16 }}
                  />
                  <ListItemText
                    primary={item.name}
                    secondary={`$${item.price.toLocaleString('es-CL')} c/u`}
                    sx={{ flexGrow: 1 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.stock)}
                      disabled={item.quantity <= 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      variant="outlined"
                      size="small"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        handleQuantityChange(item._id, value || 0, item.stock);
                      }}
                      inputProps={{ 
                        style: { textAlign: 'center' },
                        min: 1,
                        max: item.stock
                      }}
                      sx={{ width: 60, mx: 1 }}
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.stock)}
                      disabled={item.quantity >= item.stock}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4, minWidth: 100, textAlign: 'right' }}>
                    Total: ${(item.price * item.quantity).toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
              Total: ${calculateSubtotal().toLocaleString('es-CL')}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleOpenPurchaseDialog}
            >
              Comprar
            </Button>
          </Box>
        </Paper>
      )}

      {/* Diálogo de Información de Compra */}
      <Dialog open={openPurchaseDialog} onClose={handleClosePurchaseDialog}>
        <DialogTitle>Confirmar Compra</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Por favor, ingresa tus datos para el despacho.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Nombre Completo"
            type="text"
            fullWidth
            variant="outlined"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
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
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Dirección de Despacho"
            type="text"
            fullWidth
            variant="outlined"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* DatePicker para la fecha de despacho */}
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
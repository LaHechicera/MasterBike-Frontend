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

function CartPage({ cart, updateItemQuantity, removeItemFromCart, clearCart }) {
  // Accede a la URL del backend desde las variables de entorno
  const API_URL = import.meta.env.VITE_API_URL;
  // URL de tu backend para procesar la compra
  const API_URL_PURCHASE = `${API_URL}/api/purchase`;

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  // NUEVO: Estado para la dirección del cliente
  const [customerAddress, setCustomerAddress] = useState('');

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleOpenPurchaseDialog = () => {
    setOpenPurchaseDialog(true);
    const today = new Date();
    let tomorrow = addDays(today, 1);
    while (isWeekend(tomorrow)) {
      tomorrow = addDays(tomorrow, 1);
    }
    setDeliveryDate(tomorrow);
  };

  const handleClosePurchaseDialog = () => {
    setOpenPurchaseDialog(false);
    setDeliveryDate(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerAddress(''); // NUEVO: Limpiar dirección al cerrar
  };

  const handleConfirmPurchase = async () => {
    if (!deliveryDate) {
      setSnackbarMessage('Por favor, selecciona una fecha de despacho.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setSnackbarMessage('Por favor, ingresa tu nombre y correo electrónico.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    // NUEVO: Validar que la dirección no esté vacía
    if (!customerAddress.trim()) {
      setSnackbarMessage('Por favor, ingresa tu dirección de despacho.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    setLoadingPurchase(true);
    setOpenPurchaseDialog(false);

    try {
      const purchaseData = {
        cartItems: cart.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryDate: format(deliveryDate, 'yyyy-MM-dd'),
        customerName: customerName,
        customerEmail: customerEmail,
        customerAddress: customerAddress // NUEVO: Enviar dirección al backend
      };

      const response = await axios.post(API_URL_PURCHASE, purchaseData);

      setSnackbarMessage(response.data.message || 'Compra realizada con éxito.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      generatePurchaseConfirmationPDF({
        cart: cart,
        totalAmount: calculateSubtotal(),
        deliveryDate: deliveryDate,
        customerName: customerName,
        customerEmail: customerEmail,
        customerAddress: customerAddress // NUEVO: Enviar dirección para PDF
      });
      clearCart();
      setDeliveryDate(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerAddress(''); // NUEVO: Limpiar dirección después de compra

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al procesar la compra.';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Error al procesar la compra:', error);
    } finally {
      setLoadingPurchase(false);
    }
  };

  const generatePurchaseConfirmationPDF = async (purchaseDetails) => {
    const doc = new jsPDF();
    const margin = 15;
    let y = margin;

    doc.setFontSize(22);
    doc.text("Confirmación de Compra BikeShop", doc.internal.pageSize.width / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.text(`Cliente: ${purchaseDetails.customerName}`, margin, y);
    y += 7;
    doc.text(`Email: ${purchaseDetails.customerEmail}`, margin, y);
    y += 7;
    doc.text(`Dirección: ${purchaseDetails.customerAddress}`, margin, y); // NUEVO: Añadir dirección al PDF
    y += 7;
    doc.text(`Fecha de Compra: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, margin, y);
    y += 7;
    doc.text(`Fecha de Despacho Solicitada: ${format(new Date(purchaseDetails.deliveryDate), 'dd/MM/yyyy')}`, margin, y);
    y += 10;

    doc.setFontSize(16);
    doc.text("Detalle de Productos:", margin, y);
    y += 8;

    purchaseDetails.cart.forEach(item => {
      doc.setFontSize(12);
      const brandText = item.brand ? ` (${item.brand})` : '';
      doc.text(`- ${item.name} (${item.category}${brandText}): ${item.quantity} x $${item.price.toLocaleString('es-CL')} = $${(item.quantity * item.price).toLocaleString('es-CL')}`, margin + 5, y);
      y += 7;
    });
    y += 5;

    doc.setFontSize(16);
    doc.text(`Total Pagado: $${purchaseDetails.totalAmount.toLocaleString('es-CL')}`, margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.text("Gracias por tu compra en BikeShop. ¡Esperamos verte de nuevo!", doc.internal.pageSize.width / 2, y, { align: 'center' });

    doc.save(`confirmacion_compra_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
  };

  const handleDeliveryDateChange = (newDate) => {
    setDeliveryDate(newDate);
  };

  const shouldDisableDate = (date) => {
    return isWeekend(date) || isPast(date, new Date());
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Tu Carrito de Compras
      </Typography>

      {cart.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Tu carrito está vacío. ¡Añade algunos productos!
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} component="a" href="/">
            Ir a la Tienda
          </Button>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 3 }}>
          <List>
            {cart.map((item) => (
              <React.Fragment key={item._id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography variant="h6">${item.price.toLocaleString('es-CL')}</Typography>
                      </Box>
                    }
                    secondary={`Cantidad: ${item.quantity} (Stock máx: ${item.stock || 'N/A'})`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton edge="end" aria-label="remove" onClick={() => updateItemQuantity(item._id, item.quantity - 1)}>
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value);
                        const maxStock = item.stock || 1;
                        if (!isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= maxStock) {
                          updateItemQuantity(item._id, newQuantity);
                        } else if (isNaN(newQuantity) || newQuantity < 1) {
                          updateItemQuantity(item._id, 1);
                        } else if (newQuantity > maxStock) {
                            updateItemQuantity(item._id, maxStock);
                        }
                      }}
                      inputProps={{ min: 1, max: item.stock || 1 }}
                      sx={{ width: '60px', mx: 1, textAlign: 'center' }}
                      size="small"
                    />
                    <IconButton edge="end" aria-label="add" onClick={() => updateItemQuantity(item._id, item.quantity + 1)} disabled={item.quantity >= (item.stock || 0)}>
                      <AddIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => removeItemFromCart(item._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Subtotal: ${calculateSubtotal().toLocaleString('es-CL')}
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleOpenPurchaseDialog}
              disabled={loadingPurchase || cart.length === 0}
              startIcon={loadingPurchase ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loadingPurchase ? 'Cargando...' : 'Comprar'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Vaciar Carrito
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={openPurchaseDialog} onClose={handleClosePurchaseDialog}>
        <DialogTitle>Confirmar Compra y Detalles de Despacho</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tu Nombre Completo"
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
            label="Tu Correo Electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          {/* NUEVO: Campo para la dirección de despacho */}
          <TextField
            margin="dense"
            label="Tu Dirección de Despacho"
            type="text"
            fullWidth
            variant="outlined"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            required
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

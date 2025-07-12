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

// 1. Define la URL base de la API compatible con Vite
const API_URL_BASE = import.meta.env.VITE_URL;

// 2. Define la URL de tu backend para procesar la compra
const API_URL_PURCHASE = `${API_URL_BASE}/api/purchase`;

function CartPage({ cart, updateItemQuantity, removeItemFromCart, clearCart }) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  // NUEVO: Estado para la dirección del cliente
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
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

  const handleOpenPurchaseDialog = () => {
    // Si el carrito está vacío, muestra un error y no abre el diálogo
    if (cart.length === 0) {
      showSnackbar("El carrito está vacío.", "error");
      return;
    }
    setOpenPurchaseDialog(true);
  };

  const handleClosePurchaseDialog = () => {
    setOpenPurchaseDialog(false);
  };

  // Función para deshabilitar fechas de fin de semana y fechas pasadas
  const shouldDisableDate = (date) => {
    // Deshabilitar fines de semana (sábado y domingo)
    if (isWeekend(date)) {
      return true;
    }
    // Deshabilitar fechas pasadas (no es necesario si se usa minDate, pero es una buena práctica)
    return isPast(date) && !isSameDay(date, new Date());
  };

  const handleDeliveryDateChange = (date) => {
    // Solo permite seleccionar la fecha si no es fin de semana
    if (date && !shouldDisableDate(date)) {
      setDeliveryDate(date);
    } else if (date) {
      showSnackbar("Por favor, selecciona solo días hábiles (Lunes a Viernes).", "warning");
      setDeliveryDate(null);
    } else {
      setDeliveryDate(null);
    }
  };

  // Generar PDF de confirmación de compra
  const generatePurchaseConfirmationPDF = (orderId) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(22);
    doc.text('Confirmación de Compra - MasterBike', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(14);
    doc.text(`ID de la Orden: ${orderId}`, 15, y);
    y += 7;
    doc.text(`Fecha de Compra: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 15, y);
    y += 7;
    doc.text(`Nombre del Cliente: ${customerName}`, 15, y);
    y += 7;
    doc.text(`Email: ${customerEmail}`, 15, y);
    y += 7;
    doc.text(`Dirección de Envío: ${customerAddress}`, 15, y);
    y += 7;
    doc.text(`Fecha de Despacho Estimada: ${format(deliveryDate, 'dd/MM/yyyy', { locale: es })}`, 15, y);
    y += 15;

    doc.setFontSize(18);
    doc.text('Detalle de Productos', 15, y);
    y += 10;

    // Tabla de productos
    cart.forEach(item => {
      doc.setFontSize(12);
      doc.text(`${item.name} (${item.quantity} x $${item.price.toLocaleString('es-CL')})`, 20, y);
      doc.text(`$${(item.quantity * item.price).toLocaleString('es-CL')}`, pageWidth - 20, y, { align: 'right' });
      y += 8;
    });

    y += 10;
    doc.setFontSize(16);
    doc.text(`Total Pagado: $${calculateSubtotal().toLocaleString('es-CL')}`, pageWidth - 20, y, { align: 'right' });

    doc.save(`Confirmacion_Compra_${orderId}.pdf`);
  };

  // Manejar la confirmación de la compra
  const handleConfirmPurchase = async () => {
    if (cart.length === 0) {
      showSnackbar("El carrito está vacío.", "error");
      return;
    }

    // NUEVO: Validar que todos los campos de cliente estén llenos
    if (!customerName.trim() || !customerEmail.trim() || !customerAddress.trim() || !deliveryDate) {
      showSnackbar("Por favor, completa todos los datos de contacto y selecciona una fecha de despacho.", "warning");
      return;
    }

    setLoadingPurchase(true);

    try {
      // Preparar los datos para la petición POST
      const purchaseData = {
        customerName,
        customerEmail,
        customerAddress,
        deliveryDate: deliveryDate.toISOString(), // Enviar la fecha en formato ISO
        items: cart.map(item => ({
          itemId: item._id, // Asumiendo que el item tiene un _id del backend
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: calculateSubtotal(),
      };

      // Envía los datos al backend para procesar la compra
      const response = await axios.post(API_URL_PURCHASE, purchaseData);

      console.log("Compra procesada con éxito:", response.data);

      // Generar y descargar el PDF con la confirmación de la orden
      generatePurchaseConfirmationPDF(response.data.orderId);

      // Limpiar el carrito y los datos del formulario después de la compra
      clearCart();
      setCustomerName('');
      setCustomerEmail('');
      setCustomerAddress('');
      setDeliveryDate(null);
      setOpenPurchaseDialog(false);

      showSnackbar("Compra confirmada y procesada exitosamente. Se ha descargado tu confirmación.", "success");

    } catch (error) {
      console.error("Error al procesar la compra:", error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || 'Hubo un error al procesar tu compra. Por favor, intenta de nuevo.';
      showSnackbar(errorMessage, "error");
    } finally {
      setLoadingPurchase(false);
    }
  };

  const renderCartItems = () => {
    if (cart.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Tu carrito está vacío.
        </Typography>
      );
    }

    return (
      <List>
        {cart.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton edge="end" aria-label="remove" onClick={() => updateItemQuantity(item.id, -1)}>
                  <RemoveIcon />
                </IconButton>
                <Typography variant="body1" sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                  {item.quantity}
                </Typography>
                <IconButton edge="end" aria-label="add" onClick={() => updateItemQuantity(item.id, 1)} disabled={item.quantity >= item.stock}>
                  <AddIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => removeItemFromCart(item.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={item.name}
              secondary={`$${item.price.toLocaleString('es-CL')} c/u`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tu Carrito de Compras
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        {renderCartItems()}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Subtotal:
          </Typography>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
            ${calculateSubtotal().toLocaleString('es-CL')}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={clearCart} 
          disabled={cart.length === 0}
        >
          Vaciar Carrito
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenPurchaseDialog}
          disabled={cart.length === 0}
        >
          Proceder a la Compra
        </Button>
      </Box>

      {/* Diálogo de Confirmación de Compra */}
      <Dialog open={openPurchaseDialog} onClose={handleClosePurchaseDialog}>
        <DialogTitle>Confirmar Compra</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Completa tus datos para finalizar la compra.
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
            label="Correo Electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          {/* NUEVO: Campo de dirección de envío */}
          <TextField
            margin="dense"
            label="Dirección de Envío"
            type="text"
            fullWidth
            variant="outlined"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Selecciona una fecha de despacho (solo días hábiles):
          </Typography>
          {/* Date Picker para la fecha de despacho */}
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
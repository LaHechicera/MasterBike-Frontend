import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import axios from 'axios';

function BikeSalePage({ addItemToCart }) {
  // Accede a la URL del backend desde las variables de entorno
  const API_URL = import.meta.env.VITE_API_URL;
  const API_URL_INVENTORY = `${API_URL}/api/inventory`;

  const [bikesForSale, setBikesForSale] = useState([]);
  const [sparePartsForSale, setSparePartsForSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [openQuantityDialog, setOpenQuantityDialog] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(API_URL_INVENTORY);
        const bikes = response.data.filter(item => item.category === 'Bicicleta');
        const spareParts = response.data.filter(item => item.category === 'Repuesto');
        setBikesForSale(bikes);
        setSparePartsForSale(spareParts);
      } catch (err) {
        console.error('Error al obtener el inventario:', err);
        setError('No se pudo cargar el inventario. Inténtalo de nuevo más tarde.');
        setSnackbarMessage('Error al cargar el inventario.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [API_URL_INVENTORY]); // Añadido API_URL_INVENTORY a las dependencias

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleAddToCartClick = (product) => {
    if (product.stock === 0) {
      setSnackbarMessage(`Lo sentimos, "${product.name}" está agotado.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setSelectedProductForCart(product);
    setQuantityToAdd(1);
    setOpenQuantityDialog(true);
  };

  const handleCloseQuantityDialog = () => {
    setOpenQuantityDialog(false);
    setSelectedProductForCart(null);
    setQuantityToAdd(1);
  };

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1) {
      if (selectedProductForCart && value > selectedProductForCart.stock) {
        setQuantityToAdd(selectedProductForCart.stock);
        setSnackbarMessage(`Cantidad máxima para ${selectedProductForCart.name} es ${selectedProductForCart.stock}.`);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      } else {
        setQuantityToAdd(value);
      }
    } else {
      setQuantityToAdd(1);
    }
  };

  const handleConfirmAddToCart = () => {
    if (selectedProductForCart && quantityToAdd > 0 && quantityToAdd <= selectedProductForCart.stock) {
        addItemToCart(selectedProductForCart, quantityToAdd);
        setSnackbarMessage(`${quantityToAdd} ${selectedProductForCart.name}(s) añadido(s) al carrito.`);
        setSnackbarSeverity('success');
    } else {
        setSnackbarMessage('Por favor, selecciona una cantidad válida y dentro del stock disponible.');
        setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
    handleCloseQuantityDialog();
  };

  const renderProductCards = (products) => (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
            <CardMedia
              component="img"
              height="200"
              image={product.imageUrl || 'https://via.placeholder.com/200'}
              alt={product.name}
              sx={{ objectFit: 'contain', pt: 2 }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h6" component="div">
                {product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categoría: {product.category}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Marca: {product.brand}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Talla: {product.size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Material: {product.material}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Color: {product.color}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stock: {product.stock}
              </Typography>
              <Typography variant="h6" color="text.primary" sx={{ mt: 1 }}>
                ${product.price.toLocaleString('es-CL')}
              </Typography>
            </CardContent>
            <CardActions sx={{ mt: 'auto' }}>
              <Button
                size="small"
                color="primary"
                onClick={() => handleAddToCartClick(product)}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Cargando inventario...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Explora Nuestras Bicicletas y Repuestos
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Bicicletas
        </Typography>
        {renderProductCards(bikesForSale)}
      </Box>

      <Divider sx={{ my: 6 }} />

      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Repuestos
        </Typography>
        {renderProductCards(sparePartsForSale)}
      </Box>

      <Dialog open={openQuantityDialog} onClose={handleCloseQuantityDialog}>
        <DialogTitle>
          Agregar {selectedProductForCart?.name} al Carrito
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Stock disponible: {selectedProductForCart?.stock}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            variant="outlined"
            value={quantityToAdd}
            onChange={handleQuantityChange}
            inputProps={{ min: 1, max: selectedProductForCart?.stock || 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuantityDialog}>Cancelar</Button>
          <Button onClick={handleConfirmAddToCart} variant="contained">
            Añadir al Carrito
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

export default BikeSalePage;

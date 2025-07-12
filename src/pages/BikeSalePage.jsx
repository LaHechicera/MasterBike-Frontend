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

// 1. Define la URL base de la API (compatible con Vite usando VITE_URL)
const API_URL_BASE = import.meta.env.VITE_URL;

// Define la URL completa para el endpoint de inventario
const API_URL_INVENTORY = `${API_URL_BASE}/api/inventory`;

// Componente ProductCard ajustado para la estética formal
const ProductCard = ({ product, onAddToCart }) => {
  return (
    <Card 
      sx={{ 
        height: 450, 
        width: 300, 
        display: 'flex', 
        flexDirection: 'column',
        // Añadir una sombra sutil y un borde para un aspecto más formal
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
        image={product.imageUrl || 'https://via.placeholder.com/345x194.png?text=Sin+Imagen'}
        alt={product.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div">
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {product.brand} - {product.category}
        </Typography>
        <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
          ${product.price ? product.price.toLocaleString('es-CL') : 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: product.stock > 0 ? 'success.main' : 'error.main' }}>
          {product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}
        </Typography>
      </CardContent>
      <CardActions sx={{ mt: 'auto', p: 2 }}>
        <Button 
          size="small" 
          variant="contained" 
          disabled={product.stock <= 0} 
          onClick={() => onAddToCart(product)}
        >
          Añadir al Carrito
        </Button>
      </CardActions>
    </Card>
  );
};

function BikeSalePage({ addItemToCart }) {
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

  // useEffect para cargar el inventario al montar el componente
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(API_URL_INVENTORY);
        const inventoryData = response.data;
        
        // Filtra y separa los productos por categoría
        const bikes = inventoryData.filter(item => item.category === 'Bicicleta');
        const spareParts = inventoryData.filter(item => item.category === 'Repuesto');

        setBikesForSale(bikes);
        setSparePartsForSale(spareParts);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar el inventario:', err);
        setError('No se pudo cargar el inventario. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
        showSnackbar('Error al cargar el inventario', 'error');
      }
    };

    fetchInventory();
  }, []);

  // Función para abrir el diálogo de cantidad y seleccionar el producto
  const handleOpenQuantityDialog = (product) => {
    setSelectedProductForCart(product);
    setQuantityToAdd(1); // Resetear a 1 cada vez
    setOpenQuantityDialog(true);
  };

  const handleCloseQuantityDialog = () => {
    setOpenQuantityDialog(false);
    setSelectedProductForCart(null);
  };

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      setQuantityToAdd(value);
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

  // Función para confirmar la adición al carrito
  const handleConfirmAddToCart = () => {
    if (selectedProductForCart && quantityToAdd > 0 && quantityToAdd <= selectedProductForCart.stock) {
      addItemToCart(selectedProductForCart, quantityToAdd);
      showSnackbar(`${quantityToAdd} ${selectedProductForCart.name} añadido(s) al carrito.`, 'success');
      handleCloseQuantityDialog();
    } else {
      showSnackbar('Cantidad inválida o superior al stock disponible.', 'error');
    }
  };

  const renderProductCards = (products) => {
    if (products.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          No hay productos disponibles en esta categoría.
        </Typography>
      );
    }
    return (
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {products.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
            <ProductCard 
              product={product} 
              onAddToCart={handleOpenQuantityDialog} 
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Cargando productos...</Typography>
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
        Inventario MasterBike
      </Typography>

      <Box sx={{ my: 6 }}>
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
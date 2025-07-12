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
        image={product.imageUrl || 'https://via.placeholder.com/345x194?text=Producto'}
        alt={product.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {/* El texto del título usará el color definido en text.primary (negro) */}
        <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Categoría: {product.category}
        </Typography>
        {product.category === 'Bicicleta' && (
          <Typography variant="body2" color="text.secondary">
            Tipo: {product.type || 'N/A'} | Marca: {product.brand || 'N/A'}
          </Typography>
        )}
        {product.category === 'Repuesto' && (
          <Typography variant="body2" color="text.secondary">
            Tipo de Parte: {product.partType || 'N/A'} | Compatibilidad: {product.compatibility || 'N/A'}
          </Typography>
        )}
        {/* El precio usará el color 'primary' (Verde Oliva) del tema */}
        <Typography variant="h6" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
          ${product.price.toLocaleString('es-CL')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stock: {product.stock}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        {/* El botón usará el estilo definido en el tema para 'variant="contained"' (verde oliva) */}
        <Button
          size="small"
          variant="contained"
          onClick={() => onAddToCart(product)}
          disabled={product.stock <= 0}
        >
          {product.stock > 0 ? 'Añadir al Carrito' : 'Sin Stock'}
        </Button>
      </CardActions>
    </Card>
  );
};


// URL de tu backend para el inventario
const API_URL_BASE = process.env.REACT_APP_URL;

const API_URL_INVENTORY = `${API_URL_BASE}/api/inventory`;

function HomePage({ addItemToCart }) {
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

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL_INVENTORY);
      const allItems = response.data;

      const bikes = allItems.filter(item => item.category === 'Bicicleta');
      const spareParts = allItems.filter(item => item.category === 'Repuesto');

      setBikesForSale(bikes);
      setSparePartsForSale(spareParts);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener ítems del inventario:", err);
      setError("No se pudieron cargar los productos. Inténtalo de nuevo más tarde.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const handleAddToCartClick = (product) => {
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
    const value = Math.max(1, parseInt(event.target.value, 10) || 1);
    if (selectedProductForCart && value > selectedProductForCart.stock) {
      setQuantityToAdd(selectedProductForCart.stock);
      setSnackbarMessage(`Solo hay ${selectedProductForCart.stock} unidades disponibles.`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } else {
      setQuantityToAdd(value);
    }
  };

  const handleConfirmAddToCart = () => {
    if (selectedProductForCart && quantityToAdd > 0) {
      addItemToCart(selectedProductForCart, quantityToAdd);
      setSnackbarMessage(`${quantityToAdd} x "${selectedProductForCart.name}" añadido(s) al carrito.`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseQuantityDialog();
    } else {
      setSnackbarMessage('Por favor, ingresa una cantidad válida.');
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

  const renderProductCards = (products) => (
    <Grid container spacing={4} justifyContent="center">
      {products.length > 0 ? (
        products.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
            <ProductCard product={product} onAddToCart={handleAddToCartClick} />
          </Grid>
        ))
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
          No hay productos disponibles en esta categoría.
        </Typography>
      )}
    </Grid>
  );

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
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {/* Sección de Bienvenida de HomePage */}
      <Box sx={{ textAlign: 'center', mt: 4, mb: 6 }}>
        {/* Usamos el color de texto primario (negro) y bold para un aspecto formal */}
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          ¡Bienvenido a MasterBike!
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Tu destino para bicicletas, arriendo y reparaciones.
        </Typography>
        {/*<Box sx={{ mt: 4 }}>
          <img
            src="https://via.placeholder.com/600x300?text=Imagen+de+Bicicletas+Formal"
            alt="Bicicletas"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}
          />
        </Box>   aqui se le agrega esa cosa de bicicletas*/}
      </Box>

      {/* Título de sección de productos - Estilo formal con borde verde oliva */}
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          textAlign: 'center', 
          mb: 4, 
          // Usamos el color primario para el borde inferior
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1,
          display: 'block',
          color: 'text.primary' // Texto en negro para formalidad
        }}
      >
        Nuestros Productos en Venta
      </Typography>

      {/* Sección de Bicicletas */}
      <Box sx={{ my: 5 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Nuestras Bicicletas
        </Typography>
        {renderProductCards(bikesForSale)}
      </Box>

      <Divider sx={{ my: 5 }} /> 

      {/* Sección de Repuestos */}
      <Box sx={{ my: 5 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Repuestos
        </Typography>
        {renderProductCards(sparePartsForSale)}
      </Box>

      {/* Diálogo de Cantidad */}
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
          {/* El botón usará el color primario (verde oliva) del tema por defecto */}
          <Button onClick={handleConfirmAddToCart} variant="contained">
            Añadir al Carrito
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

export default HomePage;
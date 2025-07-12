// InventoryPage.jsx
import React, { useState, useEffect } from 'react'; // Importa useEffect
import axios from 'axios'; // Importa axios
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// Estado inicial para un nuevo ítem/edición
const defaultItemState = {
  id: null, // MongoDB usará _id, pero lo mantendremos para consistencia visual si es necesario
  name: '',
  category: '',
  type: '',
  brand: '',
  price: '',
  stock: '',
  partType: '',
  compatibility: '',
  imageUrl: '' // Añadir imageUrl al estado inicial si vas a gestionarlo
};

function InventoryPage() {
  // Accede a la URL del backend desde las variables de entorno
  const API_URL_BASE = import.meta.env.VITE_API_URL;
  // URL base de tu backend (ajusta si tu backend está en otro puerto/dominio)
  const API_URL = `${API_URL_BASE}/api/inventory`;

  const [inventory, setInventory] = useState([]); // Ahora se cargará desde la API
  const [open, setOpen] = useState(false); // Estado para controlar la apertura/cierre del diálogo
  const [currentItem, setCurrentItem] = useState({ ...defaultItemState }); // Estado para el ítem actual que se está añadiendo/editando
  const [isEditing, setIsEditing] = useState(false); // Bandera para saber si estamos editando
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Cargar inventario al montar el componente
  useEffect(() => {
    fetchInventory();
  }, [API_URL]); // Añadido API_URL a las dependencias

  const fetchInventory = async () => {
    try {
      const response = await axios.get(API_URL);
      setInventory(response.data);
    } catch (error) {
      console.error('Error al obtener el inventario:', error);
      setSnackbarMessage('Error al cargar el inventario.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleOpen = () => {
    setIsEditing(false);
    setCurrentItem({ ...defaultItemState }); // Reiniciar el estado para un nuevo ítem
    setOpen(true);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem({ ...item, id: item._id }); // Usar _id de MongoDB como id
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddOrUpdateItem = async () => {
    try {
      if (isEditing) {
        // Actualizar ítem existente
        await axios.put(`${API_URL}/${currentItem.id}`, currentItem);
        setSnackbarMessage('Ítem actualizado con éxito.');
        setSnackbarSeverity('success');
      } else {
        // Añadir nuevo ítem
        await axios.post(API_URL, currentItem);
        setSnackbarMessage('Ítem añadido con éxito.');
        setSnackbarSeverity('success');
      }
      setSnackbarOpen(true);
      fetchInventory(); // Recargar el inventario después de añadir/actualizar
      handleClose(); // Cerrar el diálogo
    } catch (error) {
      console.error('Error al guardar el ítem:', error);
      setSnackbarMessage(`Error al guardar el ítem: ${error.response?.data?.message || error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ítem?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSnackbarMessage('Ítem eliminado con éxito.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchInventory(); // Recargar el inventario después de eliminar
      } catch (error) {
        console.error('Error al eliminar el ítem:', error);
        setSnackbarMessage('Error al eliminar el ítem.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // NUEVO: Función para redirigir a la página de Shimano
  const handleGoToShimano = () => {
    window.open('https://www.shimano.com/', '_blank'); // Abre en una nueva pestaña
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Gestión de Inventario
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}> {/* Añadido 'gap' para espacio entre botones */}
        {/* Botón para añadir nuevo ítem */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Añadir Ítem
        </Button>
        {/* NUEVO: Botón para redirigir a Shimano */}
        <Button
          variant="outlined" // O 'contained' si prefieres
          color="primary"
          onClick={handleGoToShimano}
        >
          Ir a Shimano
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Tipo/Part Type</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow
                key={item._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {item.name}
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.category === 'Bicicleta' ? item.type : item.partType}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell align="right">${item.price.toLocaleString('es-CL')}</TableCell>
                <TableCell align="right">{item.stock}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleEdit(item)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteItem(item._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para añadir/editar ítem */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Editar Ítem' : 'Añadir Nuevo Ítem'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={currentItem.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Categoría</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={currentItem.category}
              label="Categoría"
              onChange={handleChange}
            >
              <MenuItem value="">Selecciona Categoría</MenuItem>
              <MenuItem value="Bicicleta">Bicicleta</MenuItem>
              <MenuItem value="Repuesto">Repuesto</MenuItem>
              <MenuItem value="Accesorio">Accesorio</MenuItem> {/* NUEVO: Opción de categoría 'Accesorio' */}
            </Select>
          </FormControl>

          {currentItem.category === 'Bicicleta' && (
            <>
              <TextField
                margin="dense"
                name="type"
                label="Tipo de Bicicleta (Urbana, Montaña, Ruta, etc.)"
                type="text"
                fullWidth
                variant="outlined"
                value={currentItem.type}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="brand"
                label="Marca de Bicicleta"
                type="text"
                fullWidth
                variant="outlined"
                value={currentItem.brand}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
            </>
          )}

          {currentItem.category === 'Repuesto' && (
            <Box>
              <TextField
                margin="dense"
                name="partType"
                label="Tipo de Repuesto (Cadena, Freno, Neumático, etc.)"
                type="text"
                fullWidth
                variant="outlined"
                value={currentItem.partType}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="compatibility"
                label="Compatibilidad (MTB, Ruta, Universal, etc.)"
                type="text"
                fullWidth
                variant="outlined"
                value={currentItem.compatibility}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {/* NUEVO: Campos específicos para "Accesorio" si necesitas alguno (ej. material, color) */}
          {currentItem.category === 'Accesorio' && (
            <Box>
              <TextField
                margin="dense"
                name="type" // Puedes reutilizar 'type' o crear 'accessoryType'
                label="Tipo de Accesorio (Casco, Luz, Candado, etc.)"
                type="text"
                fullWidth
                variant="outlined"
                value={currentItem.type} // O currentItem.accessoryType
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="brand" // Puedes reutilizar 'brand' para la marca del accesorio
                label="Marca de Accesorio"
                type="text"
                fullWidth
                variant="outlined"
                value={currentItem.brand} // O currentItem.accessoryBrand
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              {/* Puedes añadir más campos específicos para accesorios aquí si es necesario */}
            </Box>
          )}

          <TextField
            margin="dense"
            name="price"
            label="Precio"
            type="number"
            fullWidth
            variant="outlined"
            value={currentItem.price}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="stock"
            label="Stock"
            type="number"
            fullWidth
            variant="outlined"
            value={currentItem.stock}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="imageUrl"
            label="URL de Imagen"
            type="text"
            fullWidth
            variant="outlined"
            value={currentItem.imageUrl}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleAddOrUpdateItem} variant="contained">
            {isEditing ? 'Actualizar' : 'Añadir'}
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

export default InventoryPage;

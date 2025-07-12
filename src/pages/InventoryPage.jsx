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

// Nota: En Vite, las variables de entorno se acceden con import.meta.env y deben empezar con VITE_
const API_URL_BASE = import.meta.env.VITE_URL;

const API_URL = `${API_URL_BASE}/api/inventory`;

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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(defaultItemState);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    fetchInventory();
  }, []);

  // Función para obtener el inventario desde el backend
  const fetchInventory = async () => {
    try {
      const response = await axios.get(API_URL);
      setItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar el inventario:', err);
      setError('Error al cargar el inventario. Asegúrate de que el servidor esté funcionando.');
      setLoading(false);
      showSnackbar('Error al cargar el inventario', 'error');
    }
  };

  // Función para abrir el diálogo de añadir/editar
  const handleClickOpen = (item = defaultItemState, editing = false) => {
    setCurrentItem(item);
    setIsEditing(editing);
    setOpen(true);
  };

  // Función para cerrar el diálogo
  const handleClose = () => {
    setOpen(false);
    setCurrentItem(defaultItemState);
  };

  // Manejador de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: value,
    });
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

  // Manejar la adición o actualización de un ítem
  const handleAddOrUpdateItem = async () => {
    if (!currentItem.name || !currentItem.price || !currentItem.stock) {
      showSnackbar('Por favor, completa los campos requeridos (Nombre, Precio, Stock).', 'warning');
      return;
    }

    try {
      if (isEditing) {
        // Lógica de actualización (PUT)
        await axios.put(`${API_URL}/${currentItem._id}`, currentItem);
        showSnackbar('Ítem actualizado exitosamente', 'success');
      } else {
        // Lógica de adición (POST)
        await axios.post(API_URL, currentItem);
        showSnackbar('Ítem añadido exitosamente', 'success');
      }
      
      fetchInventory(); // Actualizar la lista después de la operación
      handleClose(); // Cerrar el diálogo
    } catch (err) {
      console.error('Error al guardar el ítem:', err);
      showSnackbar(`Error al ${isEditing ? 'actualizar' : 'añadir'} el ítem.`, 'error');
    }
  };

  // Manejar la eliminación de un ítem
  const handleDeleteItem = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ítem?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchInventory();
        showSnackbar('Ítem eliminado exitosamente', 'success');
      } catch (err) {
        console.error('Error al eliminar el ítem:', err);
        showSnackbar('Error al eliminar el ítem.', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Cargando inventario...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Gestión de Inventario
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleClickOpen(defaultItemState, false)}
        >
          Añadir Nuevo Ítem
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="inventory table">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell align="right">${item.price}</TableCell>
                <TableCell align="right">{item.stock}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleClickOpen(item, true)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteItem(item._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para añadir/editar */}
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
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              name="category"
              value={currentItem.category}
              label="Categoría"
              onChange={handleChange}
            >
              <MenuItem value="Bicicleta">Bicicleta</MenuItem>
              <MenuItem value="Repuesto">Repuesto</MenuItem>
            </Select>
          </FormControl>

          {currentItem.category === 'Bicicleta' && (
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                name="type"
                value={currentItem.type}
                label="Tipo"
                onChange={handleChange}
              >
                <MenuItem value="MTB">Montaña (MTB)</MenuItem>
                <MenuItem value="Ruta">Ruta</MenuItem>
                <MenuItem value="Urbana">Urbana</MenuItem>
                <MenuItem value="Eléctrica">Eléctrica</MenuItem>
                <MenuItem value="BMX">BMX</MenuItem>
                <MenuItem value="Niño">Niño</MenuItem>
              </Select>
            </FormControl>
          )}

          {currentItem.category === 'Repuesto' && (
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Tipo de Repuesto</InputLabel>
              <Select
                name="partType"
                value={currentItem.partType}
                label="Tipo de Repuesto"
                onChange={handleChange}
              >
                <MenuItem value="Cadena">Cadena</MenuItem>
                <MenuItem value="Neumático">Neumático</MenuItem>
                <MenuItem value="Freno">Freno</MenuItem>
                <MenuItem value="Cambio">Cambio</MenuItem>
                <MenuItem value="Asiento">Asiento</MenuItem>
                <MenuItem value="Pedal">Pedal</MenuItem>
                <MenuItem value="Accesorio">Accesorio</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField
            margin="dense"
            name="brand"
            label="Marca"
            type="text"
            fullWidth
            variant="outlined"
            value={currentItem.brand}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
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
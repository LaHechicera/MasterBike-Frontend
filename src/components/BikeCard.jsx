import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
} from '@mui/material';

function BikeCard({ bike, onAddToCart, onRentClick, mode = 'sale' }) {
  // 'mode' puede ser 'sale' o 'rent' para adaptar las acciones
  return (
    <Card sx={{ maxWidth: 345, margin: 2, boxShadow: 3 }}>
      <CardMedia
        component="img"
        height="194"
        image={bike.imageUrl || "https://via.placeholder.com/345x194?text=Bicicleta"}
        alt={bike.name}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {bike.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {bike.description.substring(0, 70)}...
        </Typography>
        <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
          ${bike.price.toLocaleString('es-CL')}
          {mode === 'rent' && <Typography variant="caption" display="block">/ día</Typography>}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" variant="outlined">Ver Detalles</Button>
        {mode === 'sale' && (
          <Button size="small" variant="contained" onClick={() => onAddToCart(bike)}>
            Añadir al Carrito
          </Button>
        )}
        {mode === 'rent' && (
          <Button size="small" variant="contained" onClick={() => onRentClick(bike)}>
            Arrendar
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default BikeCard;
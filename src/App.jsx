import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Badge,
  CssBaseline
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

// Importa el tema personalizado
import theme from './theme';

// ... (El resto de tus importaciones de páginas no cambia)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BikeRentPage from './pages/BikeRentPage';
import RepairPage from './pages/RepairPage';
import InventoryPage from './pages/InventoryPage';
import CartPage from './pages/CartPage';
import EmployeeLoginPage from './pages/EmployeeLoginPage';


function App() {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('bikeShopCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error al cargar el carrito de localStorage:", error);
      return [];
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // Inicializa userRole como null

  useEffect(() => {
    try {
      const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const storedUserRole = localStorage.getItem('userRole'); // Obtén el valor como string

      let parsedUserRole = null;
      // Si storedUserRole tiene un valor y no es la cadena "null" o "undefined"
      if (storedUserRole && storedUserRole !== 'null' && storedUserRole !== 'undefined') {
        parsedUserRole = storedUserRole; // Usa el valor de la cadena
      }

      // Si hay un estado de login guardado, úsalo
      if (storedIsLoggedIn) {
        setIsLoggedIn(storedIsLoggedIn);
        setUserRole(parsedUserRole); // Usa el valor parseado
      } else {
        // Si no está logueado, asegúrate de que el estado sea consistente
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error al cargar el estado de autenticación de localStorage:", error);
      // En caso de error, asegúrate de que el estado por defecto sea no logueado
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }, []);

  // CONSOLE.LOGS PARA DEPURACIÓN (Mantenlos si sigues depurando)
  console.log('Estado actual de App - isLoggedIn:', isLoggedIn, 'userRole:', userRole);


  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
  };

  const addItemToCart = (product, quantity) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);

      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
        if (newQuantity === existingItem.quantity) {
            console.log(`No se puede añadir más de ${product.name}, stock máximo alcanzado.`);
            return prevCart;
        }
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: quantity }];
      }
    });
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item._id === itemId) {
            const validatedQuantity = Math.max(1, Math.min(newQuantity, item.stock));
            return { ...item, quantity: validatedQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeItemFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar
          position="static"
          color="transparent"
          sx={{
            backgroundColor: '#7E8C54 !important',
            color: '#332C0F !important',
            boxShadow: 'none !important',
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                MasterBike
              </Link>
            </Typography>

            {/* Los botones con color="inherit" ahora tomarán el color de texto
                definido en MuiAppBar.styleOverrides, que es darkAccent.main */}
            {!isLoggedIn && (
              <>
                {console.log('Rendering public navigation buttons')}
                <Button color="inherit" component={Link} to="/">Venta</Button>
                <Button color="inherit" component={Link} to="/rent">Arriendo</Button>
                <Button color="inherit" component={Link} to="/repair">Reparación</Button>
                <Button color="inherit" component={Link} to="/login">Inicio Sesión</Button>
                <Button color="inherit" component={Link} to="/cart">
                  <Badge badgeContent={totalCartItems} color="secondary">
                    <ShoppingCartIcon />
                  </Badge>
                  Carrito
                </Button>
              </>
            )}

            {isLoggedIn && (userRole === 'employee' || userRole === 'admin') && (
              <>
                {console.log('Rendering employee/admin navigation buttons')}
                <Button color="inherit" component={Link} to="/">Venta</Button>
                <Button color="inherit" component={Link} to="/inventory">Inventario</Button>
                <Button color="inherit" component={Link} to="/repair">Reparación</Button>
                <Button color="inherit" onClick={handleLogout}>Cerrar Sesión</Button>
              </>
            )}

            {isLoggedIn && userRole === 'client' && (
              <>
                {console.log('Rendering client navigation buttons')}
                <Button color="inherit" component={Link} to="/">Venta</Button>
                <Button color="inherit" component={Link} to="/rent">Arriendo</Button>
                <Button color="inherit" component={Link} to="/repair">Reparación</Button>
                <Button color="inherit" component={Link} to="/cart">
                  <Badge badgeContent={totalCartItems} color="secondary">
                    <ShoppingCartIcon />
                  </Badge>
                  Carrito
                </Button>
                <Button color="inherit" onClick={handleLogout}>Cerrar Sesión</Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 4, mb: 4 }}>
          {/* ... (Tus Routes no cambian) ... */}
          <Routes>
            <Route path="/" element={<HomePage addItemToCart={addItemToCart} />} />
            <Route path="/login" element={<LoginPage handleLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/rent" element={<BikeRentPage />} />
            <Route path="/repair" element={<RepairPage userRole={userRole} />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/employee-login" element={<EmployeeLoginPage handleLogin={handleLogin} />} />
            <Route
              path="/cart"
              element={
                <CartPage
                  cart={cart}
                  updateItemQuantity={updateItemQuantity}
                  removeItemFromCart={removeItemFromCart}
                  clearCart={clearCart}
                />
              }
            />
            <Route path="*" element={<Typography variant="h4" sx={{textAlign: 'center', mt: 10}}>Página no encontrada</Typography>} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;

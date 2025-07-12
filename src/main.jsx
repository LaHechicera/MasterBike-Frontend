import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Esto debe apuntar a tu App.jsx
// import './index.css'; // <--- COMENTA o ELIMINA esta línea si no usas index.css
// import './style.css'; // <--- COMENTA o ELIMINA esta línea (la que causa el error)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
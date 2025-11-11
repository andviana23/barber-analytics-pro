import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Importar teste de conexão Supabase para uso no console
import { testSupabaseConnection } from './utils/testSupabaseConnection';
window.testSupabaseConnection = testSupabaseConnection;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

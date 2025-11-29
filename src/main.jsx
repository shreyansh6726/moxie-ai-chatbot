import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// REMOVE the line: import './index.css';

// This is the standard way to mount a React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
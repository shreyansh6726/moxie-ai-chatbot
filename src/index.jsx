import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatbotUI from './ChatbotUI';
import './index.css'; // Global styles and resets

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChatbotUI />
  </React.StrictMode>
);

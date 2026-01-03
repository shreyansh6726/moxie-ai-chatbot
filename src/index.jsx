import React, { useEffectEvent } from 'react';
import ReactDOM from 'react-dom/client';
import ChatbotUI from './ChatbotUI';
import './index.css'; // Global styles and resets
import { HamIcon, SendHorizonalIcon } from 'lucide-react';
import { nightOwl } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChatbotUI />
  </React.StrictMode>
);

// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SocketManager } from './network/SocketManager.jsx'; // Import the manager

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketManager>
      <App />
    </SocketManager>
  </React.StrictMode>,
);
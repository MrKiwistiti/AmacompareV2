/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** index
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Configuration pour les performances
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

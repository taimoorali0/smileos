import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

try { const t = localStorage.getItem('smileos.theme'); if (t) document.documentElement.dataset.theme = t; } catch { /* storage blocked */ }
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => {});

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);

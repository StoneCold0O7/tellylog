import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Store from './lib/store.js';
import App from './components/App.jsx';
import './styles.css';

Store.load();
createRoot(document.getElementById('root')).render(<App />);

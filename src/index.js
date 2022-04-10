import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import './styles/fontStyles.css'
import './polyfill.js'
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home'
import Hodl from './pages/Hodl'
import './styles/stars.sass'
import 'bootstrap/dist/css/bootstrap.min.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <div id="stars-container">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
    </div>
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hodl" element={<Hodl />} />
        </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

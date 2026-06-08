import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ingredientes from './pages/Ingredientes'
import Ventas from './pages/Ventas'
import Sucursales from './pages/Sucursales'
import Usuarios from './pages/Usuarios'
import Elaboraciones from './pages/Elaboraciones'
import Recetas from './pages/Recetas'
import Mercaderia from './pages/Mercaderia'
import Reportes from './pages/Reportes'
import { isLoggedIn } from './services/auth'

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/ingredientes" element={<PrivateRoute><Ingredientes /></PrivateRoute>} />
        <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
        <Route path="/sucursales" element={<PrivateRoute><Sucursales /></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute><Usuarios /></PrivateRoute>} />
        <Route path="/elaboraciones" element={<PrivateRoute><Elaboraciones /></PrivateRoute>} />
        <Route path="/recetas" element={<PrivateRoute><Recetas /></PrivateRoute>} />
        <Route path="/mercaderia" element={<PrivateRoute><Mercaderia /></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
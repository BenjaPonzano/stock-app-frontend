import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../services/auth'
import { useSucursal } from '../contexts/SucursalContext'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const tipoUsuario = localStorage.getItem('tipoUsuario')
  const nombre = localStorage.getItem('nombre') || 'Usuario'
  const isAdmin = tipoUsuario === 'admin'
  const { sucursales, sucursalActual, cambiarSucursal, esAdmin } = useSucursal()
  
  const navItem = (to, icon, label) => (
    <div className={`nav-item ${path === to ? 'active' : ''}`} onClick={() => navigate(to)}>
      <span className="icon">{icon}</span> {label}
    </div>
  )

  return (
    <div className="sidebar">
      <div className="sidebar-logo"><span>🍽️</span> StockGastro</div>
      <nav>
        {isAdmin && (
          <>
            <div className="nav-section">Principal</div>
            {navItem('/dashboard', '📊', 'Dashboard')}
            <div className="nav-section">Inventario</div>
            {navItem('/ingredientes', '📦', 'Productos e Ingredientes')}
            {navItem('/mercaderia', '🛒', 'Ingreso de Mercadería')}
          </>
        )}

        <div className="nav-section">Operaciones</div>
        {navItem('/ventas', '💰', 'Ventas')}
        {navItem('/recetas', '📋', 'Recetas')}
        {navItem('/elaboraciones', '👨‍🍳', 'Elaboraciones')}

        {isAdmin && (
          <>
            <div className="nav-section">Administración</div>
            {navItem('/usuarios', '👥', 'Usuarios')}
            {navItem('/sucursales', '🏪', 'Sucursales')}
            {navItem('/reportes', '📈', 'Reportes')}
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="avatar">{nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{color:'#fff', fontSize:'.85rem'}}>{nombre}</div>
            <div style={{color:'rgba(255,255,255,0.5)', fontSize:'.75rem'}}>{isAdmin ? 'Administrador' : 'Vendedor'}</div>
            <div onClick={logout} style={{cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:'.75rem', marginTop:'2px'}}>Cerrar sesión</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
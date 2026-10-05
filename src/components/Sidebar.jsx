import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../services/auth'
import { useSucursal } from '../contexts/SucursalContext'
import Icon from './Icon'

const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 2-1.6L22 7H6"/>',
  money: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5"/>',
  recetas: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>',
  chef: '<path d="M12 2c1 2-1 3-1 5 0 1.5 1 2.5 2.5 2.5S16 11.5 16 10c0-1-.5-1.5-1-3 2 1.5 4 4.5 4 7.5a6.5 6.5 0 0 1-13 0c0-3.5 2-6.5 6-9.5z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M17 3.13a4 4 0 0 1 0 7.75"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  trend: '<polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/>',
  logo: '<path d="M12 2c1 2-1 3-1 5 0 1.5 1 2.5 2.5 2.5S16 11.5 16 10c0-1-.5-1.5-1-3 2 1.5 4 4.5 4 7.5a6.5 6.5 0 0 1-13 0c0-3.5 2-6.5 6-9.5z"/>'
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  // En celular y tablet el menú se abre y se cierra con el botón hamburguesa
  const [abierto, setAbierto] = useState(false)
  const path = location.pathname
  const tipoUsuario = localStorage.getItem('tipoUsuario')
  const nombre = localStorage.getItem('nombre') || 'Usuario'
  const isAdmin = tipoUsuario === 'admin'
  const { sucursales, sucursalActual, cambiarSucursal, esAdmin } = useSucursal()

  const navItem = (to, iconKey, label) => (
    <div className={`nav-item ${path === to ? 'active' : ''}`} onClick={() => { setAbierto(false); navigate(to) }}>
      <Icon d={icons[iconKey]} /> {label}
    </div>
  )

  return (
    <>
    <button className={`sidebar-toggle ${abierto ? 'open' : ''}`} aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
      <Icon d={icons.menu} />
    </button>
    <div className={`sidebar-backdrop ${abierto ? 'open' : ''}`} onClick={() => setAbierto(false)} />
    <div className={`sidebar ${abierto ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <img src={`${process.env.PUBLIC_URL}/logo-icon.png`} alt="" width="36" height="36" />
        <span className="logo-nombre">Stock<b>Gastro</b></span>
      </div>
      <nav>
        {isAdmin && (
          <>
            <div className="nav-section">Principal</div>
            {navItem('/dashboard', 'dashboard', 'Dashboard')}
            <div className="nav-section">Inventario</div>
            {navItem('/ingredientes', 'box', 'Productos e Ingredientes')}
            {navItem('/mercaderia', 'cart', 'Ingreso de Mercadería')}
          </>
        )}

        <div className="nav-section">Operaciones</div>
        {navItem('/ventas', 'money', 'Ventas')}
        {navItem('/recetas', 'recetas', 'Recetas')}
        {navItem('/elaboraciones', 'chef', 'Elaboraciones')}

        {isAdmin && (
          <>
            <div className="nav-section">Administración</div>
            {navItem('/usuarios', 'users', 'Usuarios')}
            {navItem('/sucursales', 'store', 'Sucursales')}
            {navItem('/reportes', 'trend', 'Reportes')}
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
    </>
  )
}

export default Sidebar
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../services/auth'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItem = (path, icon, label) => (
    <div
      onClick={() => navigate(path)}
      style={{
        ...styles.navItem,
        background: location.pathname === path ? '#0f3460' : 'transparent'
      }}
    >
      <span>{icon}</span> {label}
    </div>
  )

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>🍽️ StockGastro</div>
      <nav>
        <div style={styles.section}>Principal</div>
        {navItem('/dashboard', '📊', 'Dashboard')}

        <div style={styles.section}>Inventario</div>
        {navItem('/ingredientes', '📦', 'Productos e Ingredientes')}
        {navItem('/mercaderia', '🛒', 'Ingreso de Mercadería')}

        <div style={styles.section}>Operaciones</div>
        {navItem('/ventas', '💰', 'Ventas')}
        {navItem('/recetas', '📋', 'Recetas')}
        {navItem('/elaboraciones', '👨‍🍳', 'Elaboraciones')}

        <div style={styles.section}>Administración</div>
        {navItem('/usuarios', '👥', 'Usuarios')}
        {navItem('/sucursales', '🏪', 'Sucursales')}
        {navItem('/reportes', '📈', 'Reportes')}
      </nav>
      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn}>Cerrar sesión</button>
      </div>
    </div>
  )
}

const styles = {
  sidebar: {
    width: '240px', minHeight: '100vh', background: '#16213e',
    display: 'flex', flexDirection: 'column', padding: '20px 0',
    position: 'fixed', left: 0, top: 0
  },
  logo: {
    color: 'white', fontSize: '18px', fontWeight: 'bold',
    padding: '0 20px 20px'
  },
  section: {
    color: '#8b949e', fontSize: '11px', padding: '12px 20px 4px',
    textTransform: 'uppercase', letterSpacing: '1px'
  },
  navItem: {
    color: '#e6edf3', padding: '10px 20px', cursor: 'pointer',
    borderRadius: '6px', margin: '2px 8px', fontSize: '14px',
    display: 'flex', gap: '10px', alignItems: 'center'
  },
  footer: { marginTop: 'auto', padding: '20px' },
  logoutBtn: {
    width: '100%', padding: '10px', background: '#c0392b',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
  }
}

export default Sidebar
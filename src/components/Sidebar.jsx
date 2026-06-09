import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../services/auth'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  return (
    <div className="sidebar">
      <div className="sidebar-logo"><span>🍽️</span> StockGastro</div>
      <nav>
        <div className="nav-section">Principal</div>
        <div className={`nav-item ${path === '/dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
          <span className="icon">📊</span> Dashboard
        </div>

        <div className="nav-section">Inventario</div>
        <div className={`nav-item ${path === '/ingredientes' ? 'active' : ''}`} onClick={() => navigate('/ingredientes')}>
          <span className="icon">📦</span> Productos e Ingredientes
        </div>
        <div className={`nav-item ${path === '/mercaderia' ? 'active' : ''}`} onClick={() => navigate('/mercaderia')}>
          <span className="icon">🛒</span> Ingreso de Mercadería
        </div>

        <div className="nav-section">Operaciones</div>
        <div className={`nav-item ${path === '/ventas' ? 'active' : ''}`} onClick={() => navigate('/ventas')}>
          <span className="icon">💰</span> Ventas
        </div>
        <div className={`nav-item ${path === '/recetas' ? 'active' : ''}`} onClick={() => navigate('/recetas')}>
          <span className="icon">📋</span> Recetas
        </div>
        <div className={`nav-item ${path === '/elaboraciones' ? 'active' : ''}`} onClick={() => navigate('/elaboraciones')}>
          <span className="icon">👨‍🍳</span> Elaboraciones
        </div>

        <div className="nav-section">Administración</div>
        <div className={`nav-item ${path === '/usuarios' ? 'active' : ''}`} onClick={() => navigate('/usuarios')}>
          <span className="icon">👥</span> Usuarios
        </div>
        <div className={`nav-item ${path === '/sucursales' ? 'active' : ''}`} onClick={() => navigate('/sucursales')}>
          <span className="icon">🏪</span> Sucursales
        </div>
        <div className={`nav-item ${path === '/reportes' ? 'active' : ''}`} onClick={() => navigate('/reportes')}>
          <span className="icon">📈</span> Reportes
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="avatar">JG</div>
          <div>
            <div style={{color:'#fff', fontSize:'.85rem'}}>Juan García</div>
            <div onClick={logout} style={{cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:'.8rem'}}>Cerrar sesión</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
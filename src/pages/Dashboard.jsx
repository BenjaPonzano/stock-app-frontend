import React from 'react'
import { logout } from '../services/auth'

function Dashboard() {
  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <h1>📊 Dashboard</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  )
}

export default Dashboard
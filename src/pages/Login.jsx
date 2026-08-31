import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useSucursal } from '../contexts/SucursalContext'

function Login() {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { cargarSucursales } = useSucursal()

  const handleLogin = async () => {
    try {
      await login(nombre, password)
      cargarSucursales()
      navigate('/dashboard')
    } catch (err) {
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>🍕 StockGastro</h2>
        <input
          style={styles.input}
          type="text"
          placeholder="Usuario"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button style={styles.button} onClick={handleLogin}>
          Ingresar
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', background: '#1a1a2e'
  },
  box: {
    background: '#16213e', padding: '40px', borderRadius: '12px',
    width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  },
  title: { color: 'white', textAlign: 'center', marginBottom: '30px' },
  input: {
    width: '100%', padding: '12px', marginBottom: '16px',
    borderRadius: '8px', border: '1px solid #333',
    background: '#0f3460', color: 'white', fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%', padding: '12px', background: '#4A90D9',
    color: 'white', border: 'none', borderRadius: '8px',
    fontSize: '16px', cursor: 'pointer'
  },
  error: { color: '#ff6b6b', textAlign: 'center', marginTop: '10px' }
}

export default Login
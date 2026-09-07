import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useSucursal } from '../contexts/SucursalContext'

const Icon = ({ d, ...props }) => (
  <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} {...props} />
)

const icons = {
  logo: '<path d="M12 2c1 2-1 3-1 5 0 1.5 1 2.5 2.5 2.5S16 11.5 16 10c0-1-.5-1.5-1-3 2 1.5 4 4.5 4 7.5a6.5 6.5 0 0 1-13 0c0-3.5 2-6.5 6-9.5z"/>'
}

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
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Icon d={icons.logo} />
          <span>StockGastro</span>
        </div>
        <div className="login-sub">Sistema de Control de Stock</div>

        <div className="form-group">
          <input
            className="form-control"
            type="text"
            placeholder="Usuario"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            className="form-control"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button className="btn btn-primary btn-full" onClick={handleLogin}>
          Ingresar
        </button>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  )
}

export default Login
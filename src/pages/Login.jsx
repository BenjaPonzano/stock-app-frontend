import React, { useState } from 'react'
import { login } from '../services/auth'



function Login() {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      await login(nombre, password)
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img className="login-logo-img" src={`${process.env.PUBLIC_URL}/logo-completo.png`} alt="StockGastro - Gestión de stock gastronómico" />

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
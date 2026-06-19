import axios from 'axios'

const API = 'http://localhost:3001/api'

export const login = async (nombre, password) => {
  const res = await axios.post(`${API}/auth/login`, { nombre, password })
  localStorage.setItem('token', res.data.token)
  localStorage.setItem('tipoUsuario', res.data.tipoUsuario)
  localStorage.setItem('nombre', res.data.nombre)
  return res.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tipoUsuario')
  localStorage.removeItem('nombre')
  window.location.href = '/login'
}

export const getToken = () => localStorage.getItem('token')
export const getTipoUsuario = () => localStorage.getItem('tipoUsuario')
export const getNombre = () => localStorage.getItem('nombre')
export const isLoggedIn = () => !!localStorage.getItem('token')
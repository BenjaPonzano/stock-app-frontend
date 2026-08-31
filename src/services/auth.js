import axios from 'axios'
import { API } from './api'

export const login = async (nombre, password) => {
  const res = await axios.post(`${API}/auth/login`, { nombre, password })
  localStorage.setItem('token', res.data.token)
  localStorage.setItem('tipoUsuario', res.data.tipoUsuario)
  localStorage.setItem('nombre', res.data.nombre)
  localStorage.setItem('idSucursalUsuario', res.data.idSucursal || '')
  return res.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tipoUsuario')
  localStorage.removeItem('nombre')
  localStorage.removeItem('idSucursalUsuario')
  localStorage.removeItem('idSucursal')
  window.location.href = '/login'
}

export const getToken = () => localStorage.getItem('token')
export const getTipoUsuario = () => localStorage.getItem('tipoUsuario')
export const getNombre = () => localStorage.getItem('nombre')
export const isLoggedIn = () => !!localStorage.getItem('token')
import axios from 'axios'

// URL base del backend. Se puede cambiar sin tocar el codigo definiendo
// REACT_APP_API_URL en un .env (ver .env.example).
export const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

const getHeaders = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('token')
})

export const getProductos = () => axios.get(`${API}/productos`)
export const getIngredientes = () => axios.get(`${API}/ingredientes`)
export const getVentas = () => axios.get(`${API}/ventas`, { headers: getHeaders() })
export const getCompras = () => axios.get(`${API}/compras`, { headers: getHeaders() })
export const getElaboraciones = () => axios.get(`${API}/elaboraciones`, { headers: getHeaders() })
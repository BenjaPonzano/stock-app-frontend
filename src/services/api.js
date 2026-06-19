import axios from 'axios'

const API = 'http://localhost:3001/api'

const getHeaders = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('token')
})

export const getProductos = () => axios.get(`${API}/productos`)
export const getIngredientes = () => axios.get(`${API}/ingredientes`)
export const getVentas = () => axios.get(`${API}/ventas`, { headers: getHeaders() })
export const getCompras = () => axios.get(`${API}/compras`, { headers: getHeaders() })
export const getElaboraciones = () => axios.get(`${API}/elaboraciones`, { headers: getHeaders() })
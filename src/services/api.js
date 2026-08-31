import axios from 'axios'

export const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

const getHeaders = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('token')
})

export const getProductos = (idSucursal) => axios.get(`${API}/productos?sucursal=${idSucursal}`, { headers: getHeaders() })
export const getIngredientes = (idSucursal) => axios.get(`${API}/ingredientes?sucursal=${idSucursal}`, { headers: getHeaders() })
export const getVentas = (idSucursal) => axios.get(`${API}/ventas?sucursal=${idSucursal}`, { headers: getHeaders() })
export const getCompras = (idSucursal) => axios.get(`${API}/compras?sucursal=${idSucursal}`, { headers: getHeaders() })
export const getElaboraciones = (idSucursal) => axios.get(`${API}/elaboraciones?sucursal=${idSucursal}`, { headers: getHeaders() })
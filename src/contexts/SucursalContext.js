import React, { createContext, useContext, useEffect, useState } from 'react'
import { API } from '../services/api'

const SucursalContext = createContext()

export function SucursalProvider({ children }) {
  const [sucursales, setSucursales] = useState([])
  const tipoUsuario = localStorage.getItem('tipoUsuario')
  const esAdmin = tipoUsuario === 'admin'
  const idSucursalUsuario = localStorage.getItem('idSucursalUsuario')

  const [sucursalActual, setSucursalActual] = useState(() => {
    if (!esAdmin) return idSucursalUsuario ? +idSucursalUsuario : null
    const guardada = localStorage.getItem('idSucursal')
    return guardada ? +guardada : null
  })

  const cambiarSucursal = (id) => {
    if (!esAdmin) return
    setSucursalActual(id)
    localStorage.setItem('idSucursal', id)
  }

  const cargarSucursales = () => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API}/sucursales`, { headers: { Authorization: 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return
        setSucursales(data)
        if (esAdmin) {
          const guardada = localStorage.getItem('idSucursal')
          if (!guardada && data.length > 0) cambiarSucursal(data[0].id)
        }
      })
  }

  useEffect(() => { cargarSucursales() }, [])

  return (
    <SucursalContext.Provider value={{ sucursales, sucursalActual, cambiarSucursal, cargarSucursales, esAdmin }}>
      {children}
    </SucursalContext.Provider>
  )
}

export const useSucursal = () => useContext(SucursalContext)
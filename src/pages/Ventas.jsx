import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getVentas } from '../services/api'

function Ventas() {
  const [ventas, setVentas] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    try {
      const res = await getVentas()
      setVentas(res.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filtrado = ventas.filter(v =>
    v.id?.toString().includes(busqueda) ||
    v.fecha?.includes(busqueda)
  )

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>💰 Ventas</h1>
        </div>

        <input
          style={styles.search}
          placeholder="🔍 Buscar por ID o fecha..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>ID</span>
            <span>Fecha</span>
            <span>Total</span>
            <span>Descuento</span>
            <span>Tipo Pago</span>
          </div>
          {filtrado.length > 0 ? filtrado.map((v, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>#{v.idCompra}</span>
              <span>{new Date(v.fecha).toLocaleDateString('es-AR')}</span>
              <span style={{color:'#27ae60'}}>${v.total?.toLocaleString()}</span>
              <span>${v.descuento || 0}</span>
              <span>{v.tipoPago || '-'}</span>
            </div>
          )) : (
            <div style={styles.empty}>No hay ventas registradas</div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', background: '#0d1117', minHeight: '100vh' },
  main: { marginLeft: '240px', flex: 1, padding: '20px' },
  topbar: { marginBottom: '24px' },
  title: { color: 'white', margin: 0 },
  search: { width: '100%', padding: '10px', background: '#16213e', border: '1px solid #30363d', borderRadius: '8px', color: 'white', marginBottom: '16px', boxSizing: 'border-box' },
  tabla: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '12px 20px', color: '#8b949e', fontSize: '13px', borderBottom: '1px solid #30363d' },
  tablaFila: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '12px 20px', color: '#e6edf3', borderBottom: '1px solid #30363d', fontSize: '14px' },
  empty: { padding: '20px', color: '#8b949e', textAlign: 'center' }
}

export default Ventas
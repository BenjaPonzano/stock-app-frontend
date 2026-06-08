import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getProductos, getIngredientes } from '../services/api'

function Ingredientes() {
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [tab, setTab] = useState('productos')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [resProd, resIng] = await Promise.all([getProductos(), getIngredientes()])
      setProductos(resProd.data)
      setIngredientes(resIng.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const lista = tab === 'productos' ? productos : ingredientes
  const filtrado = lista.filter(i =>
    i.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>📦 Productos e Ingredientes</h1>
        </div>

        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(tab === 'productos' ? styles.tabActive : {})}}
            onClick={() => setTab('productos')}
          >Productos</button>
          <button
            style={{...styles.tab, ...(tab === 'ingredientes' ? styles.tabActive : {})}}
            onClick={() => setTab('ingredientes')}
          >Ingredientes</button>
        </div>

        <input
          style={styles.search}
          placeholder="🔍 Buscar por nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>Nombre</span>
            <span>Categoría</span>
            <span>Stock</span>
            <span>Stock Mín</span>
            <span>Estado</span>
          </div>
          {filtrado.map((item, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>{item.emoji || '📦'} {item.nombre}</span>
              <span>{item.categoria || '-'}</span>
              <span>{item.stock} {item.unidad || ''}</span>
              <span>{item.stockMin}</span>
              <span style={{color: item.stock <= item.stockMin ? '#e74c3c' : '#27ae60'}}>
                {item.stock === 0 ? '⛔ Agotado' : item.stock <= item.stockMin ? '⚠️ Bajo' : '✅ OK'}
              </span>
            </div>
          ))}
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
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  tab: { padding: '8px 20px', background: '#16213e', color: '#8b949e', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  tabActive: { background: '#0f3460', color: 'white' },
  search: { width: '100%', padding: '10px', background: '#16213e', border: '1px solid #30363d', borderRadius: '8px', color: 'white', marginBottom: '16px', boxSizing: 'border-box' },
  tabla: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', color: '#8b949e', fontSize: '13px', borderBottom: '1px solid #30363d' },
  tablaFila: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', color: '#e6edf3', borderBottom: '1px solid #30363d', fontSize: '14px' }
}

export default Ingredientes
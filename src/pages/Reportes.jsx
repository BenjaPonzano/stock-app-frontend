import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'

const API = 'http://localhost:3001/api'
const getHeaders = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Reportes() {
  const [ventas, setVentas] = useState([])
  const [compras, setCompras] = useState([])
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [resV, resC, resP, resI] = await Promise.all([
        axios.get(`${API}/ventas`, { headers: getHeaders() }),
        axios.get(`${API}/compras`, { headers: getHeaders() }),
        axios.get(`${API}/productos`),
        axios.get(`${API}/ingredientes`)
      ])
      setVentas(resV.data)
      setCompras(resC.data)
      setProductos(resP.data)
      setIngredientes(resI.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const totalVentas = ventas.reduce((s, v) => s + (v.total || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (c.total || 0), 0)
  const stockCritico = [...productos, ...ingredientes].filter(i => i.stock <= i.stockMin)

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>📈 Reportes</h1>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Ventas</div>
            <div style={styles.statValue}>${totalVentas.toLocaleString()}</div>
            <div style={styles.statSub}>{ventas.length} transacciones</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Compras</div>
            <div style={styles.statValue}>${totalCompras.toLocaleString()}</div>
            <div style={styles.statSub}>{compras.length} ingresos</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Margen</div>
            <div style={{...styles.statValue, color: totalVentas - totalCompras >= 0 ? '#27ae60' : '#e74c3c'}}>
              ${(totalVentas - totalCompras).toLocaleString()}
            </div>
            <div style={styles.statSub}>Ventas - Compras</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Stock Crítico</div>
            <div style={{...styles.statValue, color: '#e74c3c'}}>{stockCritico.length}</div>
            <div style={styles.statSub}>Artículos por reponer</div>
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>⚠️ Artículos con Stock Crítico</h2>
          {stockCritico.length > 0 ? stockCritico.map((item, i) => (
            <div key={i} style={styles.alertItem}>
              <span>{item.emoji || '📦'} <strong>{item.nombre}</strong></span>
              <span style={{color: item.stock === 0 ? '#e74c3c' : '#f39c12'}}>
                {item.stock === 0 ? '⛔ Agotado' : `⚠️ Stock: ${item.stock} ${item.unidad || ''}`}
              </span>
            </div>
          )) : (
            <p style={{color:'#27ae60'}}>✅ Todo el inventario está en niveles óptimos.</p>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#16213e', borderRadius: '12px', padding: '20px' },
  statLabel: { color: '#8b949e', fontSize: '13px', marginBottom: '8px' },
  statValue: { color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' },
  statSub: { color: '#8b949e', fontSize: '12px' },
  panel: { background: '#16213e', borderRadius: '12px', padding: '20px' },
  panelTitle: { color: 'white', marginTop: 0 },
  alertItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #30363d', color: '#e6edf3' }
}

export default Reportes
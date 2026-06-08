import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getVentas, getCompras, getElaboraciones, getProductos, getIngredientes } from '../services/api'

function Dashboard() {
  const [ventasHoy, setVentasHoy] = useState(0)
  const [ordenes, setOrdenes] = useState(0)
  const [comprasMes, setComprasMes] = useState(0)
  const [alertas, setAlertas] = useState(0)
  const [stockCritico, setStockCritico] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const getFechaLocal = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  }

  const cargarDatos = async () => {
    try {
      const [resVentas, resCompras, resProd, resIng] = await Promise.all([
        getVentas(), getCompras(), getProductos(), getIngredientes()
      ])

      const ventas = resVentas.data
      const compras = resCompras.data
      const productos = resProd.data
      const ingredientes = resIng.data
      const hoy = getFechaLocal()
      const mes = hoy.slice(0, 7)

      const vHoy = ventas.filter(v => v.fecha?.startsWith(hoy))
      setVentasHoy(vHoy.reduce((s, v) => s + v.total, 0))
      setOrdenes(vHoy.length)

      const cMes = compras.filter(c => c.fecha?.startsWith(mes))
      setComprasMes(cMes.reduce((s, c) => s + (c.total || 0), 0))

      const inventario = [...productos, ...ingredientes]
      const critico = inventario.filter(i => i.stock <= i.stockMin)
      setAlertas(critico.length)
      setStockCritico(critico.slice(0, 4))

    } catch (error) {
      console.error('Error cargando dashboard:', error)
    }
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>📊 Panel General</h1>
          <button style={styles.refreshBtn} onClick={cargarDatos}>🔄 Actualizar</button>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#eaf2ff', color:'#2980b9'}}>💰</div>
            <div>
              <div style={styles.statLabel}>Ventas Hoy</div>
              <div style={styles.statValue}>${ventasHoy.toLocaleString()}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#d5f5e3', color:'#27ae60'}}>🧾</div>
            <div>
              <div style={styles.statLabel}>Órdenes Hoy</div>
              <div style={styles.statValue}>{ordenes}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#fef9e7', color:'#f39c12'}}>🛒</div>
            <div>
              <div style={styles.statLabel}>Compras (Mes)</div>
              <div style={styles.statValue}>${comprasMes.toLocaleString()}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#fadbd8', color:'#c0392b'}}>⚠️</div>
            <div>
              <div style={styles.statLabel}>Alertas Stock</div>
              <div style={styles.statValue}>{alertas}</div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>⚠️ Stock Crítico</h2>
          {stockCritico.length > 0 ? stockCritico.map((item, i) => (
            <div key={i} style={styles.alertItem}>
              <strong>{item.nombre}</strong>
              <span>{item.stock === 0 ? ' — Stock agotado' : ` — Stock bajo (${item.stock} ${item.unidad || ''})`}</span>
            </div>
          )) : <p style={{color:'#27ae60'}}>✅ Todo el inventario está en niveles óptimos.</p>}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', background: '#0d1117', minHeight: '100vh' },
  main: { marginLeft: '240px', flex: 1, padding: '20px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: 'white', margin: 0 },
  refreshBtn: { padding: '8px 16px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#16213e', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statLabel: { color: '#8b949e', fontSize: '13px' },
  statValue: { color: 'white', fontSize: '24px', fontWeight: 'bold' },
  panel: { background: '#16213e', borderRadius: '12px', padding: '20px' },
  panelTitle: { color: 'white', marginTop: 0 },
  alertItem: { color: '#e6edf3', padding: '10px 0', borderBottom: '1px solid #30363d' }
}

export default Dashboard
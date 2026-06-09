import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getVentas, getCompras, getElaboraciones, getProductos, getIngredientes } from '../services/api'

function Dashboard() {
  const [ventasHoy, setVentasHoy] = useState(0)
  const [ventasSub, setVentasSub] = useState('Cargando...')
  const [ordenes, setOrdenes] = useState(0)
  const [comprasMes, setComprasMes] = useState(0)
  const [alertas, setAlertas] = useState(0)
  const [chartDias, setChartDias] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [stockCritico, setStockCritico] = useState([])
  const [actividad, setActividad] = useState([])

  const getFechaLocal = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  }

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [resV, resC, resE, resP, resI] = await Promise.all([
        getVentas(), getCompras(), getElaboraciones(), getProductos(), getIngredientes()
      ])
      const ventas = resV.data
      const compras = resC.data
      const elaboraciones = resE.data
      const productos = resP.data
      const ingredientes = resI.data

      const hoy = getFechaLocal()
      const mes = hoy.slice(0, 7)

      const vHoy = ventas.filter(v => v.fecha?.startsWith(hoy))
      setVentasHoy(vHoy.reduce((s, v) => s + v.total, 0))
      setVentasSub(vHoy.length > 0 ? 'En curso' : 'Sin ventas aún')
      setOrdenes(vHoy.length)

      const cMes = compras.filter(c => c.fecha?.startsWith(mes))
      setComprasMes(cMes.reduce((s, c) => s + c.items?.reduce((ss, i) => ss + i.subtotal, 0) || 0, 0))

      const inventario = [...productos, ...ingredientes]
      const critico = inventario.filter(i => i.stock <= i.stockMin)
      setAlertas(critico.length)
      setStockCritico(critico.slice(0, 4))

      // Chart últimos 7 días
      const dias = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dias.push({
          fecha: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('es-AR', { weekday: 'short' }),
          total: 0
        })
      }
      ventas.forEach(v => {
        const dia = dias.find(d => d.fecha === v.fecha?.split('T')[0])
        if (dia) dia.total += v.total
      })
      setChartDias(dias)

      // Top productos
      const ranking = {}
      ventas.forEach(v => v.items?.forEach(item => {
        if (!ranking[item.nombre]) ranking[item.nombre] = { cant: 0, emoji: item.emoji }
        ranking[item.nombre].cant += item.cant
      }))
      const top = Object.entries(ranking)
        .map(([nombre, d]) => ({ nombre, cant: d.cant, emoji: d.emoji }))
        .sort((a, b) => b.cant - a.cant).slice(0, 4)
      setTopProductos(top)

      // Actividad
      let act = []
      ventas.forEach(v => act.push({ fechaObj: new Date(v.fecha), texto: `Venta registrada (${v.id})`, sub: `Total: $${v.total?.toLocaleString()}`, icon: '💰', color: 'var(--success)' }))
      elaboraciones.forEach(e => act.push({ fechaObj: new Date(e.fecha), texto: `Elaboración: ${e.recetaNombre}`, icon: '👨‍🍳', color: 'var(--primary)' }))
      compras.forEach(c => act.push({ fechaObj: new Date(c.fecha), texto: `Ingreso mercadería`, sub: `Prov: ${c.proveedor}`, icon: '🛒', color: 'var(--info)' }))
      act.sort((a, b) => b.fechaObj - a.fechaObj)
      setActividad(act.slice(0, 4))

    } catch (error) {
      console.error('Error:', error)
      setVentasSub('Error de conexión')
    }
  }

  const maxVenta = Math.max(...chartDias.map(d => d.total), 1)
  const colores = ['var(--primary)', 'var(--info)', 'var(--success)', 'var(--warning)']
  const maxCant = topProductos.length ? topProductos[0].cant : 1

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>📊 Panel General</h1>
          <div className="sucursal-badge" onClick={cargarDatos}>🔄 Actualizar</div>
        </div>
        <div className="content">

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#eaf2ff', color:'#2980b9'}}>💰</div>
              <div className="stat-info">
                <div className="stat-label">Ventas Hoy</div>
                <div className="stat-value">${ventasHoy.toLocaleString()}</div>
                <div className="stat-sub">{ventasSub}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#d5f5e3', color:'#27ae60'}}>🧾</div>
              <div className="stat-info">
                <div className="stat-label">Órdenes Hoy</div>
                <div className="stat-value">{ordenes}</div>
                <div className="stat-sub">Tickets emitidos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#fef9e7', color:'#f39c12'}}>🛒</div>
              <div className="stat-info">
                <div className="stat-label">Compras (Mes)</div>
                <div className="stat-value">${comprasMes.toLocaleString()}</div>
                <div className="stat-sub">Inversión a proveedores</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#fadbd8', color:'#c0392b'}}>⚠️</div>
              <div className="stat-info">
                <div className="stat-label">Alertas Stock</div>
                <div className="stat-value">{alertas}</div>
                <div className="stat-sub">Artículos por reponer</div>
              </div>
            </div>
          </div>

          <div className="dash-layout">
            <div>
              <div className="panel">
                <div className="panel-header"><h2>📈 Ventas (Últimos 7 días)</h2></div>
                <div className="panel-body">
                  <div className="chart-area">
                    {chartDias.map((d, i) => {
                      const height = Math.max((d.total / maxVenta) * 100, 5)
                      return (
                        <div className="chart-bar-wrap" key={i}>
                          <div className="chart-tooltip">${d.total.toLocaleString()}</div>
                          <div className={`chart-bar ${i === 6 ? 'today' : ''}`} style={{height: `${height}%`}}>
                            <div className="chart-label">{d.label}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{paddingBottom: '20px'}}></div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><h2>⭐ Productos Más Vendidos</h2></div>
                <div className="panel-body">
                  <div className="top-list">
                    {topProductos.length > 0 ? topProductos.map((item, i) => (
                      <div className="top-item" key={i}>
                        <div className="top-emoji">{item.emoji || '🍽️'}</div>
                        <div className="top-details">
                          <div className="top-name">{item.nombre}</div>
                          <div className="progress-wrap">
                            <div className="progress-bar" style={{width: `${(item.cant / maxCant) * 100}%`, background: colores[i]}}></div>
                          </div>
                        </div>
                        <div className="top-qty">{item.cant} u.</div>
                      </div>
                    )) : <div className="empty-state">No hay ventas registradas</div>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="panel">
                <div className="panel-header"><h2>⚠️ Stock Crítico</h2></div>
                <div className="panel-body">
                  <div className="alert-list">
                    {stockCritico.length > 0 ? stockCritico.map((item, i) => (
                      <div className={`alert-item ${item.stock === 0 ? 'danger' : ''}`} key={i}>
                        <div className="alert-content">
                          <h4>{item.nombre}</h4>
                          <p>{item.stock === 0 ? 'Stock agotado' : 'Stock bajo'} ({item.stock} {item.unidad}). Mínimo: {item.stockMin}.</p>
                        </div>
                      </div>
                    )) : <div className="empty-state" style={{color:'var(--success)'}}>✅ Todo el inventario está en niveles óptimos.</div>}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><h2>🔄 Actividad Reciente</h2></div>
                <div className="panel-body">
                  <div className="activity-list">
                    {actividad.length > 0 ? actividad.map((a, i) => (
                      <div className="activity-item" key={i}>
                        <div className="activity-icon" style={{color: a.color, borderColor: a.color}}>{a.icon}</div>
                        <div className="activity-details">
                          <div className="activity-title">{a.texto}</div>
                          <div className="activity-time">{a.fechaObj.toLocaleDateString('es-AR')}</div>
                        </div>
                      </div>
                    )) : <div className="empty-state">No hay actividad reciente.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <div className="toast" id="toast"></div>
    </div>
  )
}

export default Dashboard
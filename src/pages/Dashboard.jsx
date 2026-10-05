import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getVentas, getCompras, getElaboraciones, getProductos, getIngredientes } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'
import { claveDia, aFecha } from '../utils/fechas'
import Icon from '../components/Icon'
import SelectorSucursal from '../components/SelectorSucursal'
import Cargando from '../components/Cargando'


const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  money: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5"/>',
  receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 2-1.6L22 7H6"/>',
  alert: '<path d="M12 3l9.5 17H2.5z"/><line x1="12" y1="10" x2="12" y2="14"/>',
  chart: '<line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/>',
  star: '<polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.5 5.5 21 7.5 13.5 2 9 9 9"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.65 4.36A9 9 0 0 0 20.5 15"/>',
  check: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>',
    chef: '<path d="M12 2c1 2-1 3-1 5 0 1.5 1 2.5 2.5 2.5S16 11.5 16 10c0-1-.5-1.5-1-3 2 1.5 4 4.5 4 7.5a6.5 6.5 0 0 1-13 0c0-3.5 2-6.5 6-9.5z"/>',
}

function Dashboard() {
  const [ventasHoy, setVentasHoy] = useState(0)
  const [ventasSub, setVentasSub] = useState('Cargando...')
  const [cargando, setCargando] = useState(true)
  const [ordenes, setOrdenes] = useState(0)
  const [comprasMes, setComprasMes] = useState(0)
  const [alertas, setAlertas] = useState(0)
  const [chartDias, setChartDias] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [stockCritico, setStockCritico] = useState([])
  const [actividad, setActividad] = useState([])
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  const getFechaLocal = () => claveDia(new Date())

  useEffect(() => { setCargando(true); setVentasSub('Cargando...'); cargarDatos() }, [sucursalActual])

  const cargarDatos = async () => {
    try {
      const [resV, resC, resE, resP, resI] = await Promise.all([
        getVentas(sucursalActual), getCompras(sucursalActual), getElaboraciones(sucursalActual), getProductos(sucursalActual), getIngredientes(sucursalActual)
      ])
      const ventas = resV.data
      const compras = resC.data
      const elaboraciones = resE.data
      const productos = resP.data
      const ingredientes = resI.data

      const hoy = getFechaLocal()
      const mes = hoy.slice(0, 7)

      const vHoy = ventas.filter(v => claveDia(v.fecha) === hoy)
      setVentasHoy(vHoy.reduce((s, v) => s + v.total, 0))
      setVentasSub(vHoy.length > 0 ? 'En curso' : 'Sin ventas aún')
      setOrdenes(vHoy.length)

      const cMes = compras.filter(c => c.fecha?.startsWith(mes))
      setComprasMes(cMes.reduce((s, c) => s + c.items?.reduce((ss, i) => ss + i.subtotal, 0) || 0, 0))

      const inventario = [...productos, ...ingredientes]
      const critico = inventario.filter(i => i.stock <= i.stockMin)
      setAlertas(critico.length)
      setStockCritico(critico.slice(0, 5))

      // Chart últimos 7 días
      const dias = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dias.push({
          fecha: claveDia(d),
          label: d.toLocaleDateString('es-AR', { weekday: 'short' }),
          total: 0
        })
      }
      ventas.forEach(v => {
        const dia = dias.find(d => d.fecha === claveDia(v.fecha))
        if (dia) dia.total += v.total
      })
      setChartDias(dias)

      // Top productos
      const ranking = {}
      ventas.forEach(v => v.items?.forEach(item => {
        if (!ranking[item.nombre]) ranking[item.nombre] = { cant: 0 }
        ranking[item.nombre].cant += item.cant
      }))
      const top = Object.entries(ranking)
        .map(([nombre, d]) => ({ nombre, cant: d.cant }))
        .sort((a, b) => b.cant - a.cant).slice(0, 4)
      setTopProductos(top)

      // Actividad
      let act = []
      ventas.forEach(v => act.push({ fechaObj: new Date(v.fecha), texto: `Venta registrada (${v.id})`, sub: `Total: $${v.total?.toLocaleString()}`, iconKey: 'money', color: 'var(--success)' }))
      elaboraciones.forEach(e => act.push({ fechaObj: new Date(e.fecha), texto: `Elaboración: ${e.recetaNombre}`, iconKey: 'chef', color: 'var(--primary)' }))
      compras.forEach(c => act.push({ fechaObj: aFecha(c.fecha), texto: `Ingreso mercadería`, sub: `Prov: ${c.proveedor}`, iconKey: 'cart', color: 'var(--info)' }))
      act.sort((a, b) => b.fechaObj - a.fechaObj)
      setActividad(act.slice(0, 4))

    } catch (error) {
      console.error('Error:', error)
      setVentasSub('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  const maxVenta = Math.max(...chartDias.map(d => d.total), 1)
  const maxCant = topProductos.length ? topProductos[0].cant : 1
  const rankColors = ['var(--primary)', '#2980b9', '#27ae60', '#f39c12']

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1><Icon d={icons.dashboard} style={{color:'var(--primary)', width:'22px', height:'22px'}} /> Panel General</h1>
          <SelectorSucursal sucursales={sucursales} valor={sucursalActual} onChange={cambiarSucursal} editable={esAdmin} />
        </div>
        <div className="content">

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#eaf2ff', color:'#2980b9'}}><Icon d={icons.money} /></div>
              <div className="stat-info">
                <div className="stat-label">Ventas Hoy</div>
                <div className="stat-value">${ventasHoy.toLocaleString()}</div>
                <div className="stat-sub">{ventasSub}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#d5f5e3', color:'#27ae60'}}><Icon d={icons.receipt} /></div>
              <div className="stat-info">
                <div className="stat-label">Órdenes Hoy</div>
                <div className="stat-value">{ordenes}</div>
                <div className="stat-sub">Tickets emitidos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#fef9e7', color:'#f39c12'}}><Icon d={icons.cart} /></div>
              <div className="stat-info">
                <div className="stat-label">Compras (Mes)</div>
                <div className="stat-value">${comprasMes.toLocaleString()}</div>
                <div className="stat-sub">Inversión a proveedores</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'#fadbd8', color:'#c0392b'}}><Icon d={icons.alert} /></div>
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
                <div className="panel-header"><Icon d={icons.chart} style={{color:'var(--primary)', width:'18px', height:'18px'}} /><h2>Ventas (Últimos 7 días)</h2></div>
                <div className="panel-body">
                  {cargando ? <Cargando mensaje="Cargando ventas..." /> : (
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
                  )}
                  <div style={{paddingBottom: '20px'}}></div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><Icon d={icons.star} style={{color:'var(--primary)', width:'18px', height:'18px'}} /><h2>Productos Más Vendidos</h2></div>
                <div className="panel-body">
                  <div className="top-list">
                    {cargando ? <Cargando compacto /> : topProductos.length > 0 ? topProductos.map((item, i) => (
                      <div className="top-item" key={i}>
                        <div className="top-rank" style={{color: rankColors[i]}}>{i + 1}</div>
                        <div className="top-details">
                          <div className="top-name">{item.nombre}</div>
                          <div className="progress-wrap">
                            <div className="progress-bar" style={{width: `${(item.cant / maxCant) * 100}%`, background: rankColors[i]}}></div>
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
                <div className="panel-header"><Icon d={icons.alert} style={{color:'var(--primary)', width:'18px', height:'18px'}} /><h2>Stock Crítico</h2></div>
                <div className="panel-body">
                  <div className="alert-list">
                    {cargando ? <Cargando compacto /> : stockCritico.length > 0 ? stockCritico.map((item, i) => (
                      <div className={`alert-item ${item.stock === 0 ? 'danger' : ''}`} key={i}>
                        <div className="alert-content">
                          <h4>{item.nombre}</h4>
                          <p>{item.stock === 0 ? 'Stock agotado' : 'Stock bajo'} ({item.stock} {item.unidad}). Mínimo: {item.stockMin}.</p>
                        </div>
                      </div>
                    )) : <div className="empty-state" style={{color:'var(--success)', display:'flex', alignItems:'center', gap:'6px', justifyContent:'center'}}><Icon d={icons.check} style={{width:'16px', height:'16px'}} /> Todo el inventario está en niveles óptimos.</div>}
                    {alertas > stockCritico.length && <p style={{textAlign:'center', color:'var(--muted)', fontSize:'.8rem', margin:'8px 0 0'}}>y {alertas - stockCritico.length} más (ver Reportes)</p>}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><Icon d={icons.refresh} style={{color:'var(--primary)', width:'18px', height:'18px'}} /><h2>Actividad Reciente</h2></div>
                <div className="panel-body">
                  <div className="activity-list">
                    {cargando ? <Cargando compacto /> : actividad.length > 0 ? actividad.map((a, i) => (
                      <div className="activity-item" key={i}>
                        <div className="activity-icon" style={{color: a.color, borderColor: a.color}}><Icon d={icons[a.iconKey]} style={{width:'15px', height:'15px'}} /></div>
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
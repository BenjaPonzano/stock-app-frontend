import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Reportes() {
  const [tab, setTab] = useState('rep-productos')
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [compras, setCompras] = useState([])
  const [elaboraciones, setElaboraciones] = useState([])
  const [ventas, setVentas] = useState([])
  const [r1Search, setR1Search] = useState('')
  const [r1Tipo, setR1Tipo] = useState('todos')
  const [r2Search, setR2Search] = useState('')
  const [r2Fecha, setR2Fecha] = useState('')
  const [r3Search, setR3Search] = useState('')
  const [r3Pago, setR3Pago] = useState('')
  const [r3Fecha, setR3Fecha] = useState('')
  const [r4Search, setR4Search] = useState('')
  const [r4Fecha, setR4Fecha] = useState('')
  const [toast, setToast] = useState('')
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  useEffect(() => { cargarDatos() }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    try {
      const [resP, resI, resC, resE, resV] = await Promise.all([
        fetch(`${API}/productos?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/ingredientes?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/compras?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/elaboraciones?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/ventas?sucursal=${sucursalActual}`, { headers: headers() })
      ])
      const productos = await resP.json()
      const ingredientes = await resI.json()
      const compras = await resC.json()
      const elaboraciones = await resE.json()
      const ventas = await resV.json()
      setProductos(Array.isArray(productos) ? productos : [])
      setIngredientes(Array.isArray(ingredientes) ? ingredientes : [])
      setCompras(Array.isArray(compras) ? compras : [])
      setElaboraciones(Array.isArray(elaboraciones) ? elaboraciones : [])
      setVentas(Array.isArray(ventas) ? ventas : [])
      showToast('Datos actualizados ✓', 'success')
    } catch (e) {
      showToast('Error al conectar', 'error')
    }
  }

  const formatFecha = (f) => {
    if (!f) return ''
    const d = new Date(f)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatFechaHora = (f) => {
    if (!f) return ''
    const d = new Date(f)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const pagoLabels = { ef: 'Efectivo', mp: 'MercadoPago', td: 'Tarjeta Déb.', tc: 'Tarjeta Cré.' }

  // Rep 1 - Productos
  let combined = []
  if (r1Tipo === 'todos' || r1Tipo === 'producto') combined = [...combined, ...productos.map(p => ({ ...p, tipoItem: 'producto' }))]
  if (r1Tipo === 'todos' || r1Tipo === 'ingrediente') combined = [...combined, ...ingredientes.map(i => ({ ...i, tipoItem: 'ingrediente' }))]
  const rep1 = combined.filter(i => i.nombre?.toLowerCase().includes(r1Search.toLowerCase()) || i.categoria?.toLowerCase().includes(r1Search.toLowerCase()))

  // Rep 2 - Ingresos
  let ingresosFlat = []
  compras.forEach(c => c.items?.forEach(i => ingresosFlat.push({ fecha: c.fecha, proveedor: c.proveedor, factura: c.factura, itemNombre: i.nombre, cant: i.cant, unidad: i.unidad, subtotal: i.subtotal })))
  const rep2 = ingresosFlat.filter(i => {
    const matchStr = i.proveedor?.toLowerCase().includes(r2Search.toLowerCase()) || i.itemNombre?.toLowerCase().includes(r2Search.toLowerCase())
    const matchDate = !r2Fecha || i.fecha?.startsWith(r2Fecha)
    return matchStr && matchDate
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  // Rep 3 - Ventas
  const rep3 = ventas.filter(v => {
    const idStr = 'V-' + String(v.idCompra).padStart(4, '0')
    const matchSearch = !r3Search || idStr.toLowerCase().includes(r3Search.toLowerCase())
    const matchPago = !r3Pago || v.tipoPago === r3Pago
    const matchDate = !r3Fecha || v.fecha?.toString().startsWith(r3Fecha)
    return matchSearch && matchPago && matchDate
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  // Rep 4 - Elaboraciones
  const rep4 = elaboraciones.filter(e => {
    const matchSearch = !r4Search || e.recetaNombre?.toLowerCase().includes(r4Search.toLowerCase())
    const matchDate = !r4Fecha || e.fecha?.toString().startsWith(r4Fecha)
    return matchSearch && matchDate
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>📈 Reportes y Estadísticas</h1>
          {esAdmin ? (
            <select
              className="sucursal-badge"
              value={sucursalActual || ''}
              onChange={e => cambiarSucursal(+e.target.value)}
            >
              {sucursales.map(s => <option key={s.id} value={s.id}>🏪 {s.nombre}</option>)}
            </select>
          ) : (
            <div className="sucursal-badge">🏪 {sucursales.find(s => s.id === sucursalActual)?.nombre || 'Sin sucursal'}</div>
          )}
        </div>
        <div className="content">

          <div className="tabs">
            {[
              ['rep-productos', '1. Stock y Precios Actuales'],
              ['rep-ingresos', '2. Historial de Compras'],
              ['rep-ventas', '3. Historial de Ventas'],
              ['rep-elab', '4. Elaboraciones Internas']
            ].map(([id, label]) => (
              <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</div>
            ))}
          </div>

          {tab === 'rep-productos' && (
            <div>
              <div className="toolbar">
                <input className="search-box" placeholder="🔍 Buscar por nombre o categoría..." value={r1Search} onChange={e => setR1Search(e.target.value)} />
                <select className="filter-select" value={r1Tipo} onChange={e => setR1Tipo(e.target.value)}>
                  <option value="todos">Todos los ítems</option>
                  <option value="producto">Solo Productos</option>
                  <option value="ingrediente">Solo Ingredientes</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Tipo</th><th>Nombre</th><th>Categoría</th><th>Stock Actual</th><th>Precio Actual</th></tr></thead>
                  <tbody>
                    {rep1.length === 0 ? (
                      <tr><td colSpan="5"><div className="empty-state">No hay stock que coincida</div></td></tr>
                    ) : rep1.map((item, i) => {
                      const esIng = item.tipoItem === 'ingrediente'
                      const precio = esIng ? item.precio : item.precioVenta
                      const badgeClass = item.stock <= 0 ? 'badge-danger' : item.stock < item.stockMin ? 'badge-warning' : 'badge-success'
                      return (
                        <tr key={i}>
                          <td><span className={`badge ${esIng ? 'badge-warning' : 'badge-primary'}`}>{item.tipoItem.toUpperCase()}</span></td>
                          <td><strong>{item.nombre}</strong></td>
                          <td style={{color:'var(--muted)'}}>{item.categoria}</td>
                          <td><span className={`badge ${badgeClass}`}>{item.stock} {item.unidad}</span></td>
                          <td><strong>${precio?.toLocaleString()}</strong></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rep-ingresos' && (
            <div>
              <div className="toolbar">
                <input className="search-box" placeholder="🔍 Buscar proveedor o ítem..." value={r2Search} onChange={e => setR2Search(e.target.value)} />
                <input type="date" className="filter-select" value={r2Fecha} onChange={e => setR2Fecha(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Fecha Compra</th><th>Nº Factura</th><th>Proveedor</th><th>Ítem Comprado</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {rep2.length === 0 ? (
                      <tr><td colSpan="6"><div className="empty-state">No hay ingresos registrados</div></td></tr>
                    ) : rep2.map((i, idx) => (
                      <tr key={idx}>
                        <td>{formatFecha(i.fecha)}</td>
                        <td style={{color:'var(--muted)'}}>{i.factura || '-'}</td>
                        <td><strong>{i.proveedor}</strong></td>
                        <td>{i.itemNombre}</td>
                        <td><span className="badge badge-success">+{i.cant} {i.unidad}</span></td>
                        <td><strong>${i.subtotal?.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rep-ventas' && (
            <div>
              <div className="toolbar">
                <input className="search-box" placeholder="🔍 Buscar por Nº Venta..." value={r3Search} onChange={e => setR3Search(e.target.value)} />
                <select className="filter-select" value={r3Pago} onChange={e => setR3Pago(e.target.value)}>
                  <option value="">Todos los métodos</option>
                  <option value="ef">Efectivo</option>
                  <option value="mp">MercadoPago</option>
                  <option value="td">Tarjeta Débito</option>
                  <option value="tc">Tarjeta Crédito</option>
                </select>
                <input type="month" className="filter-select" value={r3Fecha} onChange={e => setR3Fecha(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nº Venta</th><th>Fecha y Hora</th><th>Método de Pago</th><th>Descuento</th><th>Total</th><th>Ítems</th></tr></thead>
                  <tbody>
                    {rep3.length === 0 ? (
                      <tr><td colSpan="6"><div className="empty-state">No hay ventas registradas</div></td></tr>
                    ) : rep3.map((v, i) => {
                      const idStr = 'V-' + String(v.idCompra).padStart(4, '0')
                      return (
                        <tr key={i}>
                          <td style={{fontWeight:700, color:'var(--primary)'}}>{idStr}</td>
                          <td>{formatFechaHora(v.fecha)}</td>
                          <td><span className="badge badge-primary">{pagoLabels[v.tipoPago] || v.tipoPago || '-'}</span></td>
                          <td>{v.descuento > 0 ? `${v.descuento}%` : '-'}</td>
                          <td><strong>${v.total?.toLocaleString()}</strong></td>
                          <td>{(v.items || []).length} ítem(s)</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rep-elab' && (
            <div>
              <div className="toolbar">
                <input className="search-box" placeholder="🔍 Buscar por receta o producto..." value={r4Search} onChange={e => setR4Search(e.target.value)} />
                <input type="month" className="filter-select" value={r4Fecha} onChange={e => setR4Fecha(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nº Lote</th><th>Fecha</th><th>Receta</th><th>Producto Generado</th><th>Cant. Producida</th><th>Ingredientes</th></tr></thead>
                  <tbody>
                    {rep4.length === 0 ? (
                      <tr><td colSpan="6"><div className="empty-state">No hay elaboraciones para este filtro</div></td></tr>
                    ) : rep4.map((e, i) => (
                      <tr key={i}>
                        <td style={{fontWeight:700, color:'var(--primary)'}}>{e.id}</td>
                        <td>{formatFechaHora(e.fecha)}</td>
                        <td>{e.recetaNombre || '-'}</td>
                        <td><strong>{e.productoGenerado?.nombre || '-'}</strong></td>
                        <td><span className="badge badge-success">+{e.productoGenerado?.cantidad} {e.productoGenerado?.unidad}</span></td>
                        <td style={{color:'var(--muted)'}}>
                          {(e.ingredientesConsumidos || []).slice(0, 2).map(i => `${i.nombre} -${i.cant}${i.unidad}`).join(', ')}
                          {(e.ingredientesConsumidos || []).length > 2 ? '...' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Reportes
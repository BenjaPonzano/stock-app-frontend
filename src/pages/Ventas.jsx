import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })
const pagoLabels = { ef: 'Efectivo', mp: 'Mercado Pago', td: 'Tarjeta Déb.', tc: 'Tarjeta Cré.' }
const pagoEmojis = { ef: '💵', mp: '📱', td: '💳', tc: '💳' }

function Ventas() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [pago, setPago] = useState('ef')
  const [catActiva, setCatActiva] = useState('Todos')
  const [historial, setHistorial] = useState([])
  const [descuento, setDescuento] = useState(0)
  const [conCuanto, setConCuanto] = useState('')
  const [search, setSearch] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [histPago, setHistPago] = useState('')
  const [ticket, setTicket] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [stockWarning, setStockWarning] = useState(null)
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  useEffect(() => { cargarDatos() }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    try {
      const [resP, resV] = await Promise.all([
        fetch(`${API}/productos?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/ventas?sucursal=${sucursalActual}`, { headers: headers() })
      ])
      const productos = await resP.json()
      setProductos(Array.isArray(productos) ? productos : [])
      const ventas = await resV.json()
      setHistorial((Array.isArray(ventas) ? ventas : []).map(v => ({
        id: 'V-' + String(v.idCompra).padStart(4, '0'),
        idCompra: v.idCompra,
        fecha: v.fecha,
        pago: v.tipoPago,
        descuento: v.descuento,
        total: v.total,
        items: (v.items || []).map(i => ({
          id: i.idProducto, nombre: i.nombre || '', emoji: i.emoji || '🍽️',
          cant: i.cant, precio: i.precioUnitario, sub: i.cant * i.precioUnitario
        }))
      })))
    } catch (e) {
      showToast('Error de conexión', 'error')
    }
  }

  const cats = ['Todos', ...new Set(productos.map(p => p.categoria))]
  const prodsFiltrados = productos.filter(p => {
    const matchCat = catActiva === 'Todos' || p.categoria === catActiva
    const matchSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addToCart = (prod) => {
    setCarrito(prev => {
      const ex = prev.find(i => i.id === prod.id)
      if (ex) {
        return prev.map(i => i.id === prod.id ? { ...i, cant: i.cant + 1, sub: (i.cant + 1) * i.precio } : i)
      }
      return [...prev, { id: prod.id, nombre: prod.nombre, emoji: prod.emoji || '🍽️', cant: 1, precio: prod.precioVenta, sub: prod.precioVenta }]
    })
  }

  const cambiarCant = (id, delta) => {
    setCarrito(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, cant: i.cant + delta, sub: (i.cant + delta) * i.precio } : i)
      return updated.filter(i => i.cant > 0)
    })
  }

  const subtotal = carrito.reduce((s, i) => s + i.sub, 0)
  const descMonto = Math.round(subtotal * descuento / 100)
  const total = subtotal - descMonto
  const vuelto = conCuanto ? +conCuanto - total : null

  const registrarVenta = async (forzar = false) => {
    if (carrito.length === 0) return showToast('El carrito está vacío', 'error')
    try {
      const res = await fetch(`${API}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({
          tipoPago: pago, descuento, total, idSucursal: sucursalActual, forzada: forzar,
          items: carrito.map(i => ({ idProducto: i.id, cant: i.cant, precioUnitario: i.precio }))
        })
      })
      if (res.status === 409) {
        const data = await res.json()
        setStockWarning(data.items || [])
        return
      }
      if (!res.ok) throw new Error()
      const venta = await res.json()
      const newId = 'V-' + String(venta.idCompra).padStart(4, '0')
      setTicket({ id: newId, items: [...carrito], total, descuento, subtotal, pago })
      setCarrito([])
      setDescuento(0)
      setConCuanto('')
      setStockWarning(null)
      showToast(`Venta ${newId} registrada ✓${forzar ? ' (forzada)' : ''}`, 'success')
      cargarDatos()
    } catch (e) {
      showToast('Error al registrar la venta', 'error')
    }
  }

  const histFiltrado = historial.filter(v => {
    const matchS = !histSearch || v.id.toLowerCase().includes(histSearch.toLowerCase())
    const matchP = !histPago || v.pago === histPago
    return matchS && matchP
  })

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>💰 Ventas</h1>
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

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Ventas Hoy</div><div className="stat-value" style={{color:'var(--primary)'}}>{historial.filter(v => v.fecha?.startsWith(new Date().toISOString().split('T')[0])).length}</div></div>
            <div className="stat-card"><div className="stat-label">Total Histórico</div><div className="stat-value" style={{color:'var(--success)', fontSize:'1.2rem'}}>${historial.reduce((s, v) => s + v.total, 0).toLocaleString()}</div></div>
          </div>

          <div className="layout">
            <div>
              <div className="panel" style={{marginBottom:'16px'}}>
                <div className="panel-header"><h2>🛍️ Seleccioná productos</h2></div>
                <div className="catalogo-search"><input id="prodSearch" placeholder="🔍 Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="catalogo-cats">
                  {cats.map(c => <div key={c} className={`cat-chip ${c === catActiva ? 'active' : ''}`} onClick={() => setCatActiva(c)}>{c}</div>)}
                </div>
                <div className="catalogo-grid">
                  {prodsFiltrados.map(p => (
                    <div key={p.id} className={`prod-card ${p.stock === 0 ? 'sin-stock' : ''}`} onClick={() => addToCart(p)}>
                      <span className={`prod-stock-badge ${p.stock === 0 ? 'stock-out' : p.stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                        {p.stock === 0 ? 'Sin stock' : p.stock < 5 ? `⚠ ${p.stock} u.` : `${p.stock} u.`}
                      </span>
                      <div className="prod-emoji">{p.emoji || '🍽️'}</div>
                      <div className="prod-nombre">{p.nombre}</div>
                      <div className="prod-precio">${p.precioVenta?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>🧾 Ticket actual</h2>
                  <button className="btn btn-ghost" style={{fontSize:'.8rem', padding:'5px 10px'}} onClick={() => setCarrito([])}>🗑 Limpiar</button>
                </div>
                <div className="panel-body">
                  <div className="cart-list">
                    <table className="cart-table">
                      <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Sub.</th><th></th></tr></thead>
                      <tbody>
                        {carrito.length === 0 ? (
                          <tr><td colSpan="5"><div className="empty-cart">Agregá productos desde el catálogo</div></td></tr>
                        ) : carrito.map(i => (
                          <tr key={i.id}>
                            <td>{i.emoji} {i.nombre}</td>
                            <td>
                              <div className="qty-ctrl">
                                <button className="qty-btn" onClick={() => cambiarCant(i.id, -1)}>−</button>
                                <span className="qty-val">{i.cant}</span>
                                <button className="qty-btn" onClick={() => cambiarCant(i.id, 1)}>+</button>
                              </div>
                            </td>
                            <td>${i.precio.toLocaleString()}</td>
                            <td>${i.sub.toLocaleString()}</td>
                            <td><button className="btn-icon" onClick={() => cambiarCant(i.id, -999)}>✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="descuento-row">
                    <label>Descuento:</label>
                    <input type="number" min="0" max="100" value={descuento} onChange={e => setDescuento(+e.target.value)} />%
                    <span>{descMonto > 0 ? `− $${descMonto.toLocaleString()}` : ''}</span>
                  </div>

                  <div className="cart-total">
                    <span>Total a cobrar</span>
                    <strong>${total.toLocaleString()}</strong>
                  </div>

                  <div className="form-group"><label>Método de pago</label></div>
                  <div className="pago-row">
                    {['ef','mp','td','tc'].map(p => (
                      <div key={p} className={`pago-btn ${pago === p ? 'selected' : ''}`} onClick={() => setPago(p)}>
                        <span className="pago-icon">{pagoEmojis[p]}</span>{pagoLabels[p]}
                      </div>
                    ))}
                  </div>

                  {pago === 'ef' && (
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'6px', marginBottom:'4px'}}>
                      <label style={{fontSize:'.82rem', color:'var(--muted)', whiteSpace:'nowrap'}}>Con cuánto paga:</label>
                      <input className="form-control" type="number" value={conCuanto} onChange={e => setConCuanto(e.target.value)} style={{maxWidth:'120px', padding:'6px 10px'}} placeholder="$0" />
                      {vuelto !== null && <span style={{fontSize:'.85rem', color:'var(--success)', fontWeight:600}}>{vuelto >= 0 ? `Vuelto: $${vuelto.toLocaleString()}` : '⚠ Monto insuficiente'}</span>}
                    </div>
                  )}

                  <button className="btn btn-success btn-full" onClick={() => registrarVenta()}>✅ Confirmar Venta</button>

                  {ticket && (
                    <div className="ticket-box show">
                      <div style={{textAlign:'center', fontWeight:700, marginBottom:'4px'}}>🍽️ StockGastro</div>
                      <div style={{textAlign:'center', color:'var(--muted)', marginBottom:'8px', fontSize:'.78rem'}}>{ticket.id}</div>
                      <pre style={{fontSize:'.78rem', fontFamily:'monospace', whiteSpace:'pre-wrap'}}>
                        {ticket.items.map(i => `${i.emoji} ${i.nombre} x${i.cant} .......... $${i.sub.toLocaleString()}`).join('\n')}
                      </pre>
                      <hr style={{border:'none', borderTop:'1px dashed var(--border)', margin:'8px 0'}} />
                      <div style={{display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:'1rem', color:'var(--primary)'}}>
                        <span>TOTAL</span><span>${ticket.total.toLocaleString()}</span>
                      </div>
                      <div style={{textAlign:'center', marginTop:'8px', fontSize:'.75rem', color:'var(--muted)'}}>¡Gracias por su visita!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><h2>🕓 Historial de Ventas</h2></div>
              <div className="hist-filters">
                <input className="search-sm" placeholder="🔍 Buscar..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
              </div>
              <div className="hist-filters" style={{paddingTop:0}}>
                <select className="filter-select" value={histPago} onChange={e => setHistPago(e.target.value)}>
                  <option value="">Todos los pagos</option>
                  <option value="ef">Efectivo</option>
                  <option value="mp">Mercado Pago</option>
                  <option value="td">Tarjeta Déb.</option>
                  <option value="tc">Tarjeta Cré.</option>
                </select>
              </div>
              <div>
                {histFiltrado.length === 0 ? (
                  <div className="empty-hist"><div className="icon">🧾</div>Sin ventas registradas</div>
                ) : histFiltrado.map(v => (
                  <div key={v.id} className="venta-card" onClick={() => setModal(v)}>
                    <div className="venta-top">
                      <div>
                        <div className="venta-id">{v.id}</div>
                        <div className="venta-meta">
                          <span>📅 {new Date(v.fecha).toLocaleDateString('es-AR')}</span>
                          <span>{pagoEmojis[v.pago]} {pagoLabels[v.pago]}</span>
                          {v.descuento > 0 && <span style={{color:'var(--danger)'}}>−{v.descuento}%</span>}
                        </div>
                      </div>
                      <div className="venta-total">${v.total.toLocaleString()}</div>
                    </div>
                    <div className="venta-pills">
                      {v.items.slice(0, 3).map((i, idx) => <span key={idx} className="pill">{i.emoji} {i.nombre} x{i.cant}</span>)}
                      {v.items.length > 3 && <span className="pill">+{v.items.length - 3} más</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay open">
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <h2>🧾 {modal.id}</h2>
            <div className="modal-meta">📅 {new Date(modal.fecha).toLocaleDateString('es-AR')} &nbsp;·&nbsp; {pagoEmojis[modal.pago]} {pagoLabels[modal.pago]}</div>
            <table className="detail-table">
              <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {modal.items.map((i, idx) => <tr key={idx}><td>{i.emoji} {i.nombre}</td><td>{i.cant}</td><td>${i.precio?.toLocaleString()}</td><td>${i.sub?.toLocaleString()}</td></tr>)}
              </tbody>
            </table>
            <div className="modal-total-box">
              <div><div style={{fontSize:'.78rem', color:'var(--muted)'}}>Descuento</div><div>{modal.descuento > 0 ? `${modal.descuento}%` : 'Sin descuento'}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'.78rem', color:'var(--muted)'}}>Total cobrado</div><div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--success)'}}>${modal.total?.toLocaleString()}</div></div>
            </div>
          </div>
        </div>
      )}
            {stockWarning && (
        <div className="modal-overlay open">
          <div className="modal">
            <button className="modal-close" onClick={() => setStockWarning(null)}>✕</button>
            <h2>⚠️ Stock insuficiente</h2>
            <p style={{color:'var(--muted)', marginBottom:'12px'}}>Estos productos no tienen stock suficiente:</p>
            <table className="detail-table">
              <thead><tr><th>Producto</th><th>Stock disponible</th><th>Cantidad pedida</th></tr></thead>
              <tbody>
                {stockWarning.map((it, idx) => (
                  <tr key={idx}><td>{it.nombre}</td><td>{it.stockDisponible}</td><td>{it.cantPedida}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setStockWarning(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => registrarVenta(true)}>Forzar venta igual</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Ventas
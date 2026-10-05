import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API, mensajeError } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'
import { claveDia } from '../utils/fechas'
import Icon from '../components/Icon'
import Toast from '../components/Toast'
import SelectorSucursal from '../components/SelectorSucursal'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import Cargando from '../components/Cargando'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })
const pagoLabels = { ef: 'Efectivo', mp: 'Mercado Pago', td: 'Tarjeta Déb.', tc: 'Tarjeta Cré.' }
const pagoIconKeys = { ef: 'banknote', mp: 'smartphone', td: 'card', tc: 'card' }


const icons = {
  money: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  smartphone: '<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  check: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>',
  alert: '<path d="M12 3l9.5 17H2.5z"/><line x1="12" y1="10" x2="12" y2="14"/>',
  logo: '<path d="M6 2v8"/><path d="M4 2v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2V2"/><path d="M18 2c-2.2 2-3.4 5.2-3.4 8.4 0 2.1 1 3.2 2.9 3.2V22"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
}

const avatarColors = ['#e67e22', '#2980b9', '#27ae60', '#8e44ad', '#c0392b', '#16a085']
const avatarColor = (nombre = '') => avatarColors[nombre.length ? nombre.charCodeAt(0) % avatarColors.length : 0]

function Ventas() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [pago, setPago] = useState('ef')
  const [historial, setHistorial] = useState([])
  const [descuento, setDescuento] = useState(0)
  const [conCuanto, setConCuanto] = useState('')
  const [search, setSearch] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [histPago, setHistPago] = useState('')
  const [ticket, setTicket] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [cargando, setCargando] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [stockWarning, setStockWarning] = useState(null)
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCargando(true); cargarDatos() }, [sucursalActual])

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
    } finally {
      setCargando(false)
    }
  }

  const prodsFiltrados = productos.filter(p => {
    const matchSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchSearch
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
    if (registrando) return
    setRegistrando(true)
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
      if (!res.ok) return showToast(await mensajeError(res, 'Error al registrar la venta'), 'error')
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
    } finally {
      setRegistrando(false)
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
          <h1><Icon d={icons.money} /> Ventas</h1>
          <SelectorSucursal sucursales={sucursales} valor={sucursalActual} onChange={cambiarSucursal} editable={esAdmin} />
        </div>
        <div className="content">

          {esAdmin && (
          <div className="stats">
            <StatCard etiqueta="Ventas Hoy" valor={historial.filter(v => claveDia(v.fecha) === claveDia(new Date())).length} color="var(--primary)" />
            <div className="stat-card"><div className="stat-label">Total Histórico</div><div className="stat-value" style={{color:'var(--success)', fontSize:'1.2rem'}}>${historial.reduce((s, v) => s + v.total, 0).toLocaleString()}</div></div>
          </div>
          )}

          <div className="layout">
            <div>
              <div className="panel" style={{marginBottom:'16px'}}>
                <div className="panel-header"><h2><Icon d={icons.box} /> Seleccioná productos</h2></div>
                <div className="catalogo-search"><Icon d={icons.search} /><input id="prodSearch" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="catalogo-grid">
                  {cargando && <div style={{gridColumn:'1 / -1'}}><Cargando mensaje="Cargando productos..." /></div>}
                  {!cargando && prodsFiltrados.map(p => (
                    <div key={p.id} className={`prod-card ${p.stock === 0 ? 'sin-stock' : ''}`} onClick={() => addToCart(p)}>
                      <span className={`prod-stock-badge ${p.stock === 0 ? 'stock-out' : p.stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                        {p.stock === 0 ? 'Sin stock' : `${p.stock} u.`}
                      </span>
                      <div className="prod-avatar" style={{background: avatarColor(p.nombre)}}>{(p.nombre || '?').charAt(0).toUpperCase()}</div>
                      <div className="prod-nombre">{p.nombre}</div>
                      <div className="prod-precio">${p.precioVenta?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2><Icon d={icons.receipt} /> Ticket actual</h2>
                  <button className="btn btn-ghost" style={{fontSize:'.8rem', padding:'5px 10px', display:'flex', alignItems:'center', gap:'5px'}} onClick={() => setCarrito([])}><Icon d={icons.trash} style={{width:14, height:14}} /> Limpiar</button>
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
                            <td><div className="cart-row-name"><div className="mini-avatar" style={{background: avatarColor(i.nombre)}}></div>{i.nombre}</div></td>
                            <td>
                              <div className="qty-ctrl">
                                <button className="qty-btn" onClick={() => cambiarCant(i.id, -1)}>−</button>
                                <span className="qty-val">{i.cant}</span>
                                <button className="qty-btn" onClick={() => cambiarCant(i.id, 1)}>+</button>
                              </div>
                            </td>
                            <td>${i.precio.toLocaleString()}</td>
                            <td>${i.sub.toLocaleString()}</td>
                            <td><button className="btn-icon" onClick={() => cambiarCant(i.id, -999)}><Icon d={icons.x} style={{width:12, height:12}} /></button></td>
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
                        <span className="pago-icon"><Icon d={icons[pagoIconKeys[p]]} /></span>{pagoLabels[p]}
                      </div>
                    ))}
                  </div>

                  {pago === 'ef' && (
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'6px', marginBottom:'4px'}}>
                      <label style={{fontSize:'.82rem', color:'var(--muted)', whiteSpace:'nowrap'}}>Con cuánto paga:</label>
                      <input className="form-control" type="number" value={conCuanto} onChange={e => setConCuanto(e.target.value)} style={{maxWidth:'120px', padding:'6px 10px'}} placeholder="$0" />
                      {vuelto !== null && <span style={{fontSize:'.85rem', color:'var(--success)', fontWeight:600, display:'inline-flex', alignItems:'center', gap:'4px'}}>{vuelto >= 0 ? `Vuelto: $${vuelto.toLocaleString()}` : (<><Icon d={icons.alert} style={{width:14, height:14}} /> Monto insuficiente</>)}</span>}
                    </div>
                  )}

                  <button className="btn btn-success btn-full" onClick={() => registrarVenta()} disabled={registrando} style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}><Icon d={icons.check} /> {registrando ? 'Registrando...' : 'Confirmar Venta'}</button>

                  {ticket && (
                    <div className="ticket-box show">
                      <div style={{textAlign:'center', fontWeight:700, marginBottom:'4px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Icon d={icons.logo} style={{color:'var(--primary)'}} /> StockGastro</div>
                      <div style={{textAlign:'center', color:'var(--muted)', marginBottom:'8px', fontSize:'.78rem'}}>{ticket.id}</div>
                      <pre style={{fontSize:'.78rem', fontFamily:'monospace', whiteSpace:'pre-wrap'}}>
                        {ticket.items.map(i => `${i.nombre} x${i.cant} .......... $${i.sub.toLocaleString()}`).join('\n')}
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
              <div className="panel-header"><h2><Icon d={icons.clock} /> Historial de Ventas</h2></div>
              <div className="hist-filters">
                <input className="search-sm" placeholder="Buscar..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
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
                {cargando ? (
                  <Cargando mensaje="Cargando ventas..." compacto />
                ) : histFiltrado.length === 0 ? (
                  <div className="empty-hist"><div className="icon"><Icon d={icons.receipt} style={{width:32, height:32}} /></div>Sin ventas registradas</div>
                ) : histFiltrado.map(v => (
                  <div key={v.id} className="venta-card" onClick={() => setModal(v)}>
                    <div className="venta-top">
                      <div>
                        <div className="venta-id">{v.id}</div>
                        <div className="venta-meta">
                          <span style={{display:'inline-flex', alignItems:'center', gap:'4px'}}><Icon d={icons.calendar} style={{width:13, height:13}} /> {new Date(v.fecha).toLocaleDateString('es-AR')}</span>
                          <span style={{display:'inline-flex', alignItems:'center', gap:'4px'}}><Icon d={icons[pagoIconKeys[v.pago]]} style={{width:13, height:13}} /> {pagoLabels[v.pago]}</span>
                          {v.descuento > 0 && <span style={{color:'var(--danger)'}}>−{v.descuento}%</span>}
                        </div>
                      </div>
                      <div className="venta-total">${v.total.toLocaleString()}</div>
                    </div>
                    <div className="venta-pills">
                      {v.items.slice(0, 3).map((i, idx) => <span key={idx} className="pill">{i.nombre} x{i.cant}</span>)}
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
        <Modal titulo={<><Icon d={icons.receipt} /> {modal.id}</>} onCerrar={() => setModal(null)}>
            <div className="modal-meta" style={{display:'flex', alignItems:'center', gap:'6px'}}><Icon d={icons.calendar} style={{width:14, height:14}} /> {new Date(modal.fecha).toLocaleDateString('es-AR')} &nbsp;·&nbsp; <Icon d={icons[pagoIconKeys[modal.pago]]} style={{width:14, height:14}} /> {pagoLabels[modal.pago]}</div>
            <table className="detail-table">
              <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {modal.items.map((i, idx) => <tr key={idx}><td><div className="cart-row-name"><div className="mini-avatar" style={{background: avatarColor(i.nombre)}}></div>{i.nombre}</div></td><td>{i.cant}</td><td>${i.precio?.toLocaleString()}</td><td>${i.sub?.toLocaleString()}</td></tr>)}
              </tbody>
            </table>
            <div className="modal-total-box">
              <div><div style={{fontSize:'.78rem', color:'var(--muted)'}}>Descuento</div><div>{modal.descuento > 0 ? `${modal.descuento}%` : 'Sin descuento'}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'.78rem', color:'var(--muted)'}}>Total cobrado</div><div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--success)'}}>${modal.total?.toLocaleString()}</div></div>
            </div>
          </Modal>
      )}
            {stockWarning && (
        <Modal titulo={<><Icon d={icons.alert} /> Stock insuficiente</>} onCerrar={() => setStockWarning(null)}>
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
              <button className="btn btn-primary" onClick={() => registrarVenta(true)} disabled={registrando}>{registrando ? 'Registrando...' : 'Forzar venta igual'}</button>
            </div>
          </Modal>
      )}

      <Toast toast={toast} />
    </div>
  )
}

export default Ventas
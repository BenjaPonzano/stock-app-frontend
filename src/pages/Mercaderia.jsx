import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API, mensajeError } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'
import { claveDia, aFecha } from '../utils/fechas'
import Icon from '../components/Icon'
import Toast from '../components/Toast'
import SelectorSucursal from '../components/SelectorSucursal'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import Cargando from '../components/Cargando'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })


const icons = {
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 2-1.6L22 7H6"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  clipboard: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>'
}

function Mercaderia() {
  const [catalogoIng, setCatalogoIng] = useState([])
  const [catalogoProd, setCatalogoProd] = useState([])
  const [historial, setHistorial] = useState([])
  const [compraItems, setCompraItems] = useState([])
  const [form, setForm] = useState({ proveedor: '', factura: '', obs: '', fecha: claveDia(new Date()) })
  const [tipo, setTipo] = useState('ingrediente')
  const [itemId, setItemId] = useState('')
  const [cant, setCant] = useState(1)
  const [precio, setPrecio] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [cargando, setCargando] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  useEffect(() => { setCargando(true); cargarDatos() }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    try {
      const [resIng, resProd, resCompras] = await Promise.all([
        fetch(`${API}/ingredientes?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/productos?sucursal=${sucursalActual}`, { headers: headers() }),
        fetch(`${API}/compras?sucursal=${sucursalActual}`, { headers: headers() })
      ])
      const ing = await resIng.json()
      const prod = await resProd.json()
      const compras = await resCompras.json()
      setCatalogoIng(Array.isArray(ing) ? ing : [])
      setCatalogoProd(Array.isArray(prod) ? prod : [])
      setHistorial(Array.isArray(compras) ? compras : [])
    } catch (e) {
      showToast('No se pudo conectar con el servidor', 'error')
    } finally {
      setCargando(false)
    }
  }

    const catalogo = tipo === 'ingrediente' ? catalogoIng : catalogoProd.filter(p => p.origen !== 'elaborado')

    // Último precio cargado de un ítem: el de su compra más reciente;
    // si nunca se compró, el precio de compra que tiene en el catálogo.
    const ultimoPrecio = (item) => {
      if (!item) return 0
      const compras = [...historial].sort((a, b) =>
        (aFecha(b.fecha) - aFecha(a.fecha)) || ((b.idIngreso || 0) - (a.idIngreso || 0)))
      for (const c of compras) {
        const it = c.items?.find(x => x.tipo === tipo && x.nombre === item.nombre)
        if (it && it.precio > 0) return it.precio
      }
      return (tipo === 'ingrediente' ? item.precio : item.precioCompra) || 0
    }

    const itemElegido = catalogo.find(i => i.id === +itemId)
    const precioPorDefecto = ultimoPrecio(itemElegido)

    // Al cambiar de ítem el precio queda vacío: vacío significa "usar el último precio cargado".
    const handleItemChange = (id) => {
      setItemId(id)
      setPrecio('')
    }

    const addItem = () => {
    if (!itemId) return showToast(`No seleccionaste ningún ${tipo}`, 'error')
    if (!cant || cant <= 0) return showToast('Cantidad inválida', 'error')
    const item = catalogo.find(i => i.id === +itemId)
    const precioFinal = precio === '' ? ultimoPrecio(item) : +precio
    if (precioFinal <= 0) return showToast(precio === '' ? 'Este ítem todavía no tiene un precio cargado: ingresalo en P. Unit' : 'Precio inválido', 'error')
    const existing = compraItems.findIndex(i => i.id === +itemId && i.tipo === tipo)
    if (existing >= 0) {
      setCompraItems(prev => prev.map((i, idx) => idx === existing ? { ...i, cant: Math.round((i.cant + +cant) * 1000) / 1000, subtotal: Math.round((i.cant + +cant) * 1000) / 1000 * i.precio } : i))
    } else {
      setCompraItems(prev => [...prev, { id: +itemId, nombre: item.nombre, tipo, cant: +cant, unidad: item.unidad, precio: precioFinal, subtotal: +cant * precioFinal }])
    }
    setCant(1)
    setPrecio('')
  }

  const removeItem = (idx) => setCompraItems(prev => prev.filter((_, i) => i !== idx))

  const total = compraItems.reduce((s, i) => s + i.subtotal, 0)

  const registrar = async () => {
    if (!form.proveedor) return showToast('Ingresá el proveedor', 'error')
    if (!form.fecha) return showToast('Seleccioná la fecha', 'error')
    if (compraItems.length === 0) return showToast('Agregá ítems', 'error')
    if (registrando) return
    setRegistrando(true)
    try {
      const res = await fetch(`${API}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ ...form, items: compraItems, idSucursal: sucursalActual })
      })
      if (res.ok) {
        showToast('Ingreso registrado ✓', 'success')
        setCompraItems([])
        setForm({ proveedor: '', factura: '', obs: '', fecha: claveDia(new Date()) })
        cargarDatos()
      } else {
        showToast(await mensajeError(res), 'error')
      }
    } catch (e) {
      showToast('Error al registrar compra', 'error')
    } finally {
      setRegistrando(false)
    }
  }

  const histFiltrado = historial.filter(c =>
    c.proveedor?.toLowerCase().includes(histSearch.toLowerCase()) ||
    c.id?.toLowerCase().includes(histSearch.toLowerCase())
  )

  const stats = {
    total: historial.length,
    monto: historial.reduce((s, c) => s + (c.items?.reduce((ss, i) => ss + i.subtotal, 0) || 0), 0),
    provs: new Set(historial.map(c => c.proveedor)).size
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1><Icon d={icons.cart} /> Ingreso de Mercadería</h1>
          <SelectorSucursal sucursales={sucursales} valor={sucursalActual} onChange={cambiarSucursal} editable={esAdmin} />
        </div>
        <div className="content">

          <div className="stats">
            <StatCard etiqueta="Total Compras" valor={stats.total} color="var(--primary)" />
            <div className="stat-card"><div className="stat-label">Monto Total Invertido</div><div className="stat-value" style={{color:'var(--info)', fontSize:'1.2rem'}}>${stats.monto.toLocaleString()}</div></div>
            <StatCard etiqueta="Proveedores" valor={stats.provs} color="var(--secondary)" />
          </div>

          <div className="layout">
            <div className="form-panel">
              <h2><Icon d={icons.clipboard} /> Nueva Compra</h2>
              <div className="form-row">
                <div className="form-group"><label>Proveedor</label><input className="form-control" placeholder="Nombre del proveedor" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} /></div>
                <div className="form-group"><label>Nº Factura / Remito</label><input className="form-control" placeholder="Ej: A-0001-00012345" value={form.factura} onChange={e => setForm({...form, factura: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Fecha</label><input className="form-control" type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} /></div>
                <div className="form-group">
                  <label>Tipo de ítem</label>
                  <select className="form-control" value={tipo} onChange={e => { setTipo(e.target.value); setItemId('') }}>
                    <option value="ingrediente">Ingrediente</option>
                    <option value="producto">Producto</option>
                  </select>
                </div>
              </div>
              <hr className="divider" />
              <div className="items-section">
                <h3>Ítems de la compra</h3>
                <div className="item-add-row">
                  <div className="form-group" style={{margin:0}}>
                    <label>Ítem</label>
                     <select className="form-control" value={itemId} onChange={e => handleItemChange(e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {catalogo.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>Cantidad</label>
                    <input className="form-control" type="number" min={tipo === 'ingrediente' ? '0.001' : '1'} step={tipo === 'ingrediente' ? 'any' : '1'} value={cant} onChange={e => setCant(e.target.value)} />
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>P. Unit ($)</label>
                    <input className="form-control" type="number" min="0" placeholder={precioPorDefecto > 0 ? String(precioPorDefecto) : '0'} value={precio} onChange={e => setPrecio(e.target.value)} />
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>&nbsp;</label>
                    <button className="btn btn-primary" onClick={addItem} style={{padding:'9px 14px'}}>＋</button>
                  </div>
                </div>
                {itemElegido && (
                  <small className="form-ayuda" style={{marginTop:0, marginBottom:'8px'}}>
                    {precioPorDefecto > 0
                      ? `Último precio cargado: $${precioPorDefecto.toLocaleString('es-AR')}. Si dejás P. Unit vacío se usa ese.`
                      : 'Este ítem todavía no tiene precio cargado: ingresalo en P. Unit.'}
                  </small>
                )}
                <div className="items-list">
                  <table>
                    <thead><tr><th>Ítem</th><th>Tipo</th><th>Cant.</th><th>P.Unit</th><th>Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {compraItems.length === 0 ? (
                        <tr><td colSpan="6"><div className="empty-items">Agregá ítems a la compra</div></td></tr>
                      ) : compraItems.map((it, i) => (
                        <tr key={i}>
                          <td><strong>{it.nombre}</strong></td>
                          <td><span className={`badge ${it.tipo === 'ingrediente' ? 'badge-ing' : 'badge-prod'}`}>{it.tipo === 'ingrediente' ? 'Ingred.' : 'Prod.'}</span></td>
                          <td>{it.cant} {it.unidad}</td>
                          <td>${it.precio.toLocaleString()}</td>
                          <td>${it.subtotal.toLocaleString()}</td>
                          <td><button className="btn-icon" onClick={() => removeItem(i)}><Icon d={icons.x} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="total-box">
                  <span>Total de la compra</span>
                  <strong>${total.toLocaleString()}</strong>
                </div>
              </div>
              <div className="form-group" style={{marginTop:'16px'}}>
                <label>Observaciones</label>
                <textarea className="form-control" rows="2" placeholder="Notas opcionales..." value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
              </div>
              <button className="btn btn-success btn-full" onClick={registrar} disabled={registrando}><Icon d={icons.check} /> {registrando ? 'Registrando...' : 'Registrar Ingreso'}</button>
            </div>

            <div className="history-panel">
              <div className="history-header"><h2><Icon d={icons.clock} /> Historial</h2></div>
              <div className="history-filters">
                <input className="search-sm" placeholder="Buscar proveedor..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
              </div>
              <div>
                {cargando ? (
                  <Cargando mensaje="Cargando ingresos..." compacto />
                ) : histFiltrado.length === 0 ? (
                  <div className="empty-hist">Sin resultados</div>
                ) : histFiltrado.map(c => {
                  const tot = c.items?.reduce((s, i) => s + i.subtotal, 0) || 0
                  return (
                    <div key={c.id} className="compra-card" onClick={() => setModal(c)}>
                      <div className="compra-top">
                        <div>
                          <div className="compra-id">{c.id} — {c.proveedor}</div>
                          <div className="compra-meta"><span><Icon d={icons.calendar} /> {c.fecha}</span></div>
                        </div>
                        <div className="compra-total">${tot.toLocaleString()}</div>
                      </div>
                      <div className="compra-items-preview">
                        {c.items?.slice(0, 3).map((i, idx) => <span key={idx} className="pill">{i.nombre}</span>)}
                        {c.items?.length > 3 && <span className="pill">+{c.items.length - 3}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal titulo={<>{modal.id} — {modal.proveedor}</>} onCerrar={() => setModal(null)}>
            <div className="modal-meta" style={{display:'flex', alignItems:'center', gap:'6px'}}><Icon d={icons.calendar} style={{width:14, height:14}} /> {modal.fecha} &nbsp;·&nbsp; <Icon d={icons.file} style={{width:14, height:14}} /> {modal.factura || '—'}</div>
            <table className="detail-table">
              <thead><tr><th>Ítem</th><th>Tipo</th><th>Cantidad</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {modal.items?.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.nombre}</td>
                    <td><span className={`badge ${i.tipo === 'ingrediente' ? 'badge-ing' : 'badge-prod'}`}>{i.tipo}</span></td>
                    <td>{i.cant} {i.unidad}</td>
                    <td>${i.precio?.toLocaleString()}</td>
                    <td>${i.subtotal?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="total-box" style={{marginTop:'12px'}}>
              <span>Total</span>
              <strong>${modal.items?.reduce((s, i) => s + i.subtotal, 0).toLocaleString()}</strong>
            </div>
            {modal.obs && <div style={{marginTop:'12px', fontSize:'.82rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'6px'}}><Icon d={icons.edit} style={{width:14, height:14}} /> {modal.obs}</div>}
          </Modal>
      )}

      <Toast toast={toast} />
    </div>
  )
}

export default Mercaderia
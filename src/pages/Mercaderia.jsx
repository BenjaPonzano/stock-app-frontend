import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'

const API = 'http://localhost:3001/api'
const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Mercaderia() {
  const [catalogoIng, setCatalogoIng] = useState([])
  const [catalogoProd, setCatalogoProd] = useState([])
  const [historial, setHistorial] = useState([])
  const [compraItems, setCompraItems] = useState([])
  const [form, setForm] = useState({ proveedor: '', factura: '', obs: '', fecha: new Date().toISOString().split('T')[0] })
  const [tipo, setTipo] = useState('ingrediente')
  const [itemId, setItemId] = useState('')
  const [cant, setCant] = useState(1)
  const [precio, setPrecio] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { cargarDatos() }, [])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    const [resIng, resProd, resCompras] = await Promise.all([
      fetch(`${API}/ingredientes`),
      fetch(`${API}/productos`),
      fetch(`${API}/compras`, { headers: headers() })
    ])
    setCatalogoIng(await resIng.json())
    setCatalogoProd(await resProd.json())
    setHistorial(await resCompras.json())
  }

  const catalogo = tipo === 'ingrediente' ? catalogoIng : catalogoProd

  const addItem = () => {
    if (!itemId) return showToast(`No seleccionaste ningún ${tipo}`, 'error')
    if (!cant || cant <= 0) return showToast('Cantidad inválida', 'error')
    if (!precio || precio <= 0) return showToast('Precio inválido', 'error')
    const item = catalogo.find(i => i.id === +itemId)
    const existing = compraItems.findIndex(i => i.id === +itemId && i.tipo === tipo)
    if (existing >= 0) {
      setCompraItems(prev => prev.map((i, idx) => idx === existing ? { ...i, cant: i.cant + +cant, subtotal: (i.cant + +cant) * i.precio } : i))
    } else {
      setCompraItems(prev => [...prev, { id: +itemId, nombre: item.nombre, tipo, cant: +cant, unidad: item.unidad, precio: +precio, subtotal: +cant * +precio }])
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
    try {
      const res = await fetch(`${API}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ ...form, items: compraItems })
      })
      if (res.ok) {
        showToast('Ingreso registrado ✓', 'success')
        setCompraItems([])
        setForm({ proveedor: '', factura: '', obs: '', fecha: new Date().toISOString().split('T')[0] })
        cargarDatos()
      }
    } catch (e) {
      showToast('Error al registrar compra', 'error')
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
          <h1>🛒 Ingreso de Mercadería</h1>
          <div className="sucursal-badge">🏪 Sucursal Centro ▾</div>
        </div>
        <div className="content">

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Total Compras</div><div className="stat-value" style={{color:'var(--primary)'}}>{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Monto Total Invertido</div><div className="stat-value" style={{color:'var(--info)', fontSize:'1.2rem'}}>${stats.monto.toLocaleString()}</div></div>
            <div className="stat-card"><div className="stat-label">Proveedores</div><div className="stat-value" style={{color:'var(--secondary)'}}>{stats.provs}</div></div>
          </div>

          <div className="layout">
            <div className="form-panel">
              <h2>📋 Nueva Compra</h2>
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
                    <select className="form-control" value={itemId} onChange={e => setItemId(e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {catalogo.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>Cantidad</label>
                    <input className="form-control" type="number" min="1" value={cant} onChange={e => setCant(e.target.value)} />
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>P. Unit ($)</label>
                    <input className="form-control" type="number" min="0" placeholder="0" value={precio} onChange={e => setPrecio(e.target.value)} />
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>&nbsp;</label>
                    <button className="btn btn-primary" onClick={addItem} style={{padding:'9px 14px'}}>＋</button>
                  </div>
                </div>
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
                          <td><button className="btn-icon" onClick={() => removeItem(i)}>✕</button></td>
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
              <button className="btn btn-success btn-full" onClick={registrar}>✅ Registrar Ingreso</button>
            </div>

            <div className="history-panel">
              <div className="history-header"><h2>🕓 Historial</h2></div>
              <div className="history-filters">
                <input className="search-sm" placeholder="🔍 Buscar proveedor..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
              </div>
              <div>
                {histFiltrado.length === 0 ? (
                  <div className="empty-hist">Sin resultados</div>
                ) : histFiltrado.map(c => {
                  const tot = c.items?.reduce((s, i) => s + i.subtotal, 0) || 0
                  return (
                    <div key={c.id} className="compra-card" onClick={() => setModal(c)}>
                      <div className="compra-top">
                        <div>
                          <div className="compra-id">{c.id} — {c.proveedor}</div>
                          <div className="compra-meta"><span>📅 {c.fecha}</span></div>
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
        <div className="modal-overlay open">
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <h2>{modal.id} — {modal.proveedor}</h2>
            <div className="modal-meta">📅 {modal.fecha} &nbsp;·&nbsp; 📄 {modal.factura || '—'}</div>
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
            {modal.obs && <div style={{marginTop:'12px', fontSize:'.82rem', color:'var(--muted)'}}>📝 {modal.obs}</div>}
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Mercaderia
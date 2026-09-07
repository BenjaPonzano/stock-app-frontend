import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

const Icon = ({ d, ...props }) => (
  <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} {...props} />
)

const icons = {
  chef: '<path d="M12 2c1 2-1 3-1 5 0 1.5 1 2.5 2.5 2.5S16 11.5 16 10c0-1-.5-1.5-1-3 2 1.5 4 4.5 4 7.5a6.5 6.5 0 0 1-13 0c0-3.5 2-6.5 6-9.5z"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  clipboard: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>',
  flask: '<path d="M9 2v6L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 8V2"/><line x1="9" y1="2" x2="15" y2="2"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  alert: '<path d="M12 3l9.5 17H2.5z"/><line x1="12" y1="10" x2="12" y2="14"/>',
  check: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>'
}

function Elaboraciones() {
  const [recetas, setRecetas] = useState([])
  const [historial, setHistorial] = useState([])
  const [stockIngredientes, setStockIngredientes] = useState({})
  const [selectedReceta, setSelectedReceta] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [fecha, setFecha] = useState('')
  const [obs, setObs] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [histReceta, setHistReceta] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  useEffect(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setFecha(now.toISOString().slice(0, 16))
    cargarDatos()
  }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    const [resR, resI, resE] = await Promise.all([
      fetch(`${API}/recetas?sucursal=${sucursalActual}`, { headers: headers() }),
      fetch(`${API}/ingredientes?sucursal=${sucursalActual}`, { headers: headers() }),
      fetch(`${API}/elaboraciones?sucursal=${sucursalActual}`, { headers: headers() })
    ])
    const recetas = await resR.json()
    setRecetas(Array.isArray(recetas) ? recetas : [])
    const ing = await resI.json()
    const stockMap = {}
    if (Array.isArray(ing)) ing.forEach(i => stockMap[i.id] = { stock: i.stock, nombre: i.nombre, unidad: i.unidad })
    setStockIngredientes(stockMap)
    const elaboraciones = await resE.json()
    setHistorial(Array.isArray(elaboraciones) ? elaboraciones : [])
  }
  const getConsumo = () => {
    if (!selectedReceta) return []
    return selectedReceta.ingredientes?.map(ing => {
      const info = stockIngredientes[ing.idIngrediente]
      const stockActual = info?.stock ?? 0
      const aConsumir = ing.cant * cantidad
      const stockFinal = stockActual - aConsumir
      return { ...ing, stockActual, aConsumir, stockFinal, faltante: stockFinal < 0 }
    }) || []
  }

  const consumo = getConsumo()
  const warnings = consumo.filter(i => i.faltante).map(i => `${i.nombre}: faltan ${Math.abs(i.stockFinal)} ${i.unidad}`)

  const registrar = async () => {
    if (!selectedReceta) return showToast('Seleccioná una receta', 'error')
    if (!fecha) return showToast('Ingresá la fecha', 'error')

    if (warnings.length > 0) {
      if (!window.confirm(`⚠️ Stock insuficiente en:\n${consumo.filter(i => i.faltante).map(i => i.nombre).join(', ')}\n¿Forzar registro?`)) return
    }

    const payload = {
      idReceta: selectedReceta.id,
      recetaNombre: selectedReceta.nombre,
      idProducto: selectedReceta.idProducto,
      idSucursal: sucursalActual,
      cantidad,
      obs,
      ingredientesConsumidos: selectedReceta.ingredientes?.map(i => ({
        idIngrediente: i.idIngrediente,
        cant: i.cant * cantidad
      }))
    }

    try {
      const res = await fetch(`${API}/elaboraciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showToast('Elaboración registrada ✓', 'success')
        setSelectedReceta(null)
        setCantidad(1)
        setObs('')
        cargarDatos()
      }
    } catch (e) {
      showToast('Error al registrar', 'error')
    }
  }

  const histFiltrado = historial.filter(e => {
    const matchSearch = !histSearch || e.recetaNombre?.toLowerCase().includes(histSearch.toLowerCase())
    const matchReceta = !histReceta || e.recetaId === +histReceta
    return matchSearch && matchReceta
  })

  const stats = {
    total: historial.length,
    hoy: historial.filter(e => e.fecha?.toString().startsWith(new Date().toISOString().slice(0, 10))).length,
    recetasUsadas: new Set(historial.map(e => e.recetaId)).size,
    unidades: historial.reduce((s, e) => s + (e.productoGenerado?.cantidad || 0), 0)
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1><Icon d={icons.chef} /> Elaboraciones Internas</h1>
          {esAdmin ? (
            <div className="sucursal-select-wrap">
              <Icon d={icons.store} />
              <select
                className="sucursal-badge"
                value={sucursalActual || ''}
                onChange={e => cambiarSucursal(+e.target.value)}
              >
              {sucursales.map(s => <option key={s.id} value={s.id}>🏪 {s.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div className="sucursal-badge"><Icon d={icons.store} /> {sucursales.find(s => s.id === sucursalActual)?.nombre || 'Sin sucursal'}</div>
          )}
        </div>
        <div className="content">

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Total Elaboraciones</div><div className="stat-value" style={{color:'var(--primary)'}}>{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Elaboraciones Hoy</div><div className="stat-value" style={{color:'var(--success)'}}>{stats.hoy}</div></div>
            <div className="stat-card"><div className="stat-label">Recetas Utilizadas</div><div className="stat-value" style={{color:'var(--info)'}}>{stats.recetasUsadas}</div></div>
            <div className="stat-card"><div className="stat-label">Unidades Producidas</div><div className="stat-value" style={{color:'var(--secondary)'}}>{stats.unidades}</div></div>
          </div>

          <div className="layout">
            <div className="panel">
              <div className="panel-header"><h2><Icon d={icons.clipboard} /> Nueva Elaboración</h2></div>
              <div className="panel-body">

                <div className="form-group">
                  <label>1. Seleccioná la receta</label>
                  <div id="recetasList">
                    {recetas.length === 0 ? (
                      <div className="empty-hist">No hay recetas cargadas</div>
                    ) : recetas.map(r => (
                      <div key={r.id} className={`receta-card ${selectedReceta?.id === r.id ? 'selected' : ''}`} onClick={() => setSelectedReceta(r)}>
                        <div className="receta-name">{r.nombre}</div>
                        <div className="receta-desc">{r.descripcion || ''}</div>
                        <div className="receta-tags">
                          {r.ingredientes?.map(i => <span key={i.idIngrediente} className="tag ing"><Icon d={icons.flask} />{i.nombre}</span>)}
                          <span className="tag prod"><Icon d={icons.arrowRight} />{r.productoNombre}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="divider" />

                <div className="form-row">
                  <div className="form-group">
                    <label>2. Cantidad a elaborar</label>
                    <input className="form-control" type="number" min="1" value={cantidad} onChange={e => setCantidad(+e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Fecha y hora</label>
                    <input className="form-control" type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>3. Ingredientes que se consumirán</label>
                  <div className="items-list">
                    <table>
                      <thead><tr><th>Ingrediente</th><th>Stock actual</th><th>A consumir</th><th>Stock final</th></tr></thead>
                      <tbody>
                        {consumo.length === 0 ? (
                          <tr><td colSpan="4"><div className="empty-items">Seleccioná una receta primero</div></td></tr>
                        ) : consumo.map((ing, i) => (
                          <tr key={i}>
                            <td><strong>{ing.nombre}</strong></td>
                            <td>{ing.stockActual} {ing.unidad}</td>
                            <td style={{color: ing.faltante ? 'var(--danger)' : 'var(--text)'}}>{ing.aConsumir} {ing.unidad}</td>
                            <td style={{color: ing.stockFinal < 0 ? 'var(--danger)' : ing.stockFinal < ing.cant ? 'var(--warning)' : 'var(--success)'}}>
                              {ing.stockFinal < 0 ? <strong style={{display:'inline-flex', alignItems:'center', gap:'3px'}}><Icon d={icons.alert} style={{width:12, height:12}} /> {ing.stockFinal}</strong> : ing.stockFinal} {ing.unidad}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {warnings.length > 0 && (
                    <div className="stock-warning show"><Icon d={icons.alert} /> Stock insuficiente: {warnings.join(' · ')}</div>
                  )}
                </div>

                {selectedReceta && (
                  <div className="form-group">
                    <label>4. Producto generado</label>
                    <div style={{background:'var(--bg)', borderRadius:'8px', padding:'12px', fontSize:'.88rem', border:'1px solid var(--border)'}}>
                      <strong style={{color:'var(--primary)'}}>{selectedReceta.cantPorLote * cantidad} u.</strong>
                      <span style={{color:'var(--muted)', marginLeft:'4px'}}>de {selectedReceta.productoNombre}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea className="form-control" rows="2" placeholder="Notas opcionales..." value={obs} onChange={e => setObs(e.target.value)} />
                </div>

                <button className="btn btn-success btn-full" onClick={registrar}><Icon d={icons.check} /> Registrar Elaboración</button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><h2><Icon d={icons.clock} /> Historial</h2></div>
              <div className="hist-filters">
                <input className="search-sm" placeholder="Buscar receta..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
              </div>
              <div className="hist-filters" style={{paddingTop:0}}>
                <select className="filter-select" value={histReceta} onChange={e => setHistReceta(e.target.value)}>
                  <option value="">Todas las recetas</option>
                  {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div>
                {histFiltrado.length === 0 ? (
                  <div className="empty-hist"><div className="icon"><Icon d={icons.chef} style={{width:32, height:32}} /></div>Sin resultados</div>
                ) : histFiltrado.map(e => (
                  <div key={e.id} className="elab-card" onClick={() => setModal(e)}>
                    <div className="elab-top">
                      <div>
                        <div className="elab-id">{e.id} — {e.recetaNombre}</div>
                        <div className="elab-meta">
                          <span style={{display:'inline-flex', alignItems:'center', gap:'4px'}}><Icon d={icons.calendar} style={{width:13, height:13}} /> {e.fecha?.toString().replace('T', ' ').slice(0, 16)}</span>
                          <span style={{display:'inline-flex', alignItems:'center', gap:'4px'}}><Icon d={icons.repeat} style={{width:13, height:13}} /> x{e.cantidad} lote(s)</span>
                        </div>
                      </div>
                      <div className="elab-qty">+{e.productoGenerado?.cantidad} {e.productoGenerado?.unidad}</div>
                    </div>
                    <div className="elab-pills">
                      {(e.ingredientesConsumidos || []).slice(0, 3).map((i, idx) => (
                        <span key={idx} className="pill consumed">{i.nombre} -{i.cant}{i.unidad}</span>
                      ))}
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
            <button className="modal-close" onClick={() => setModal(null)}><Icon d={icons.x} /></button>
            <h2>{modal.id} — {modal.recetaNombre}</h2>
            <div className="modal-meta" style={{display:'flex', alignItems:'center', gap:'6px'}}><Icon d={icons.calendar} style={{width:14, height:14}} /> {modal.fecha?.toString().replace('T', ' ').slice(0, 16)} &nbsp;·&nbsp; <Icon d={icons.repeat} style={{width:14, height:14}} /> x{modal.cantidad}</div>
            <div className="section-title">Ingredientes consumidos</div>
            <table className="detail-table">
              <thead><tr><th>Ingrediente</th><th>Cantidad consumida</th></tr></thead>
              <tbody>
                {(modal.ingredientesConsumidos || []).map((i, idx) => (
                  <tr key={idx}><td>{i.nombre}</td><td style={{color:'var(--danger)'}}>- {i.cant} {i.unidad}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="section-title">Producto generado</div>
            <table className="detail-table">
              <thead><tr><th>Producto</th><th>Cantidad producida</th></tr></thead>
              <tbody>
                <tr><td>{modal.productoGenerado?.nombre}</td><td style={{color:'var(--success)'}}>+ {modal.productoGenerado?.cantidad} {modal.productoGenerado?.unidad}</td></tr>
              </tbody>
            </table>
            {modal.obs && <div style={{marginTop:'12px', fontSize:'.82rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'6px'}}><Icon d={icons.edit} style={{width:14, height:14}} /> {modal.obs}</div>}
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Elaboraciones
import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

function Ingredientes() {
  const [data, setData] = useState({ productos: [], ingredientes: [] })
  const [tab, setTab] = useState('productos')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [toast, setToast] = useState('')
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()
  

  useEffect(() => { cargarDatos() }, [tab, sucursalActual])

  const cargarDatos = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/${tab}?sucursal=${sucursalActual}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    const items = await res.json()
    setData(prev => ({ ...prev, [tab]: Array.isArray(items) ? items : [] }))
  }

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const getStockStatus = (item) => {
    if (item.stock === 0) return 'out'
    if (item.stock < item.stockMin) return 'low'
    return 'ok'
  }

  const cats = [...new Set(data[tab].map(i => i.categoria))].sort()
  const filtered = data[tab].filter(i => {
    const matchSearch = i.nombre?.toLowerCase().includes(search.toLowerCase()) || i.categoria?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || i.categoria === filterCat
    const matchStock = !filterStock || getStockStatus(i) === filterStock
    return matchSearch && matchCat && matchStock
  })

  const stats = {
    total: data[tab].length,
    ok: data[tab].filter(i => getStockStatus(i) === 'ok').length,
    low: data[tab].filter(i => getStockStatus(i) === 'low').length,
    out: data[tab].filter(i => getStockStatus(i) === 'out').length,
  }

  const openModal = (item = null) => {
    setEditingId(item?.id || null)
    setForm(item || {})
    setModalOpen(true)
  }

  const saveItem = async () => {
    if (!form.nombre) return showToast('Nombre obligatorio', 'error')
    const token = localStorage.getItem('token')
    const url = `${API}/${tab}${editingId ? '/' + editingId : ''}`
    await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
        body: JSON.stringify({ ...form, idSucursal: form.idSucursal || sucursalActual })
    })
    showToast('Guardado ✓', 'success')
    setModalOpen(false)
    cargarDatos()
  }

  const deleteItem = async (id) => {
    console.log('ID a eliminar:', id)
    if (!window.confirm('¿Eliminar?')) return
    const token = localStorage.getItem('token')
    await fetch(`${API}/${tab}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    showToast('Eliminado', 'error')
    cargarDatos()
  }

  const catOptions = ['Hamburguesas', 'Pizzas', 'Empanadas', 'Platos', 'Guarniciones', 'Bebidas', 'Otros']
  const ingCatOptions = ['Carnes', 'Lácteos', 'Secos', 'Verduras', 'Enlatados', 'Condimentos', 'Otros']
  const isP = tab === 'productos'

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>📦 Productos e Ingredientes</h1>
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
            <div className={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>Productos</div>
            <div className={`tab ${tab === 'ingredientes' ? 'active' : ''}`} onClick={() => setTab('ingredientes')}>Ingredientes</div>
          </div>

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Total {tab}</div><div className="stat-value" style={{color:'var(--primary)'}}>{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Stock Normal</div><div className="stat-value" style={{color:'var(--success)'}}>{stats.ok}</div></div>
            <div className="stat-card"><div className="stat-label">Stock Bajo</div><div className="stat-value" style={{color:'var(--warning)'}}>{stats.low}</div></div>
            <div className="stat-card"><div className="stat-label">Sin Stock</div><div className="stat-value" style={{color:'var(--danger)'}}>{stats.out}</div></div>
          </div>

          <div className="toolbar">
            <input className="search-box" placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={filterStock} onChange={e => setFilterStock(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="ok">Stock OK</option>
              <option value="low">Stock Bajo</option>
              <option value="out">Sin Stock</option>
            </select>
            <button className="btn btn-primary" onClick={() => openModal()}>+ Nuevo</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Categoría</th><th>Stock</th><th>Stock Mín.</th>
                  {isP ? <th>Precio Venta</th> : <th>Precio</th>}
                  <th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty-state">No se encontraron resultados</div></td></tr>
                ) : filtered.map(item => {
                  const s = getStockStatus(item)
                  const badgeMap = { ok: ['badge-ok', '✓ Normal'], low: ['badge-low', '⚠ Bajo'], out: ['badge-out', '✕ Sin Stock'] }
                  const pct = item.stockMin > 0 ? Math.min(100, Math.round(item.stock / (item.stockMin * 2) * 100)) : 100
                  const color = item.stock === 0 ? '#e74c3c' : item.stock < item.stockMin ? '#f39c12' : '#27ae60'
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.nombre}</strong></td>
                      <td><span className="badge badge-cat">{item.categoria}</span></td>
                      <td>
                        <div className="stock-bar-wrap">
                          <span style={{minWidth:'50px'}}>{item.stock} {item.unidad}</span>
                          <div className="stock-bar"><div className="stock-bar-fill" style={{width:`${pct}%`, background: color}}></div></div>
                        </div>
                      </td>
                      <td style={{color:'var(--muted)'}}>{item.stockMin} {item.unidad}</td>
                      {isP ? <td>${item.precioVenta?.toLocaleString()}</td> : <td>${item.precio?.toLocaleString()}/{item.unidad}</td>}
                      <td><span className={`badge ${badgeMap[s][0]}`}>{badgeMap[s][1]}</span></td>
                      <td>
                        <div className="actions">
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={(e) => { e.stopPropagation(); openModal(item) }}
                          >✏️</button>
                          <button 
                            className="btn btn-sm" 
                            style={{background:'#fadbd8', color:'#c0392b'}} 
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <h2>{editingId ? 'Editar' : 'Nuevo'}</h2>
            <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select className="form-control" value={form.categoria || ''} onChange={e => setForm({...form, categoria: e.target.value})}>
                  {(isP ? catOptions : ingCatOptions).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unidad</label>
                <select className="form-control" value={form.unidad || 'u'} onChange={e => setForm({...form, unidad: e.target.value})}>
                  {['u','g','kg','ml','l'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Stock actual</label><input className="form-control" type="number" value={form.stock || 0} onChange={e => setForm({...form, stock: +e.target.value})} /></div>
              <div className="form-group"><label>Stock mínimo</label><input className="form-control" type="number" value={form.stockMin || 0} onChange={e => setForm({...form, stockMin: +e.target.value})} /></div>
            </div>
            {isP ? (
              <div className="form-group">
                <label>Precio Venta</label>
                <input className="form-control" type="number" value={form.precioVenta || 0} onChange={e => setForm({...form, precioVenta: +e.target.value})} />
              </div>
            ) : (
              <div className="form-group">
                <label>Precio de Compra</label>
                <input className="form-control" type="number" value={form.precio || 0} onChange={e => setForm({...form, precio: +e.target.value})} />
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveItem}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Ingredientes

import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Recetas() {
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', idProducto: '', cantPorLote: 1 })
  const [ingRows, setIngRows] = useState([{ idIngrediente: '', cant: '', unidad: '' }])
  const [toast, setToast] = useState('')
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  useEffect(() => { cargarDatos() }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    const [resR, resP, resI] = await Promise.all([
      fetch(`${API}/recetas`, { headers: headers() }),
      fetch(`${API}/productos?sucursal=${sucursalActual}`, { headers: headers() }),
      fetch(`${API}/ingredientes?sucursal=${sucursalActual}`, { headers: headers() })
    ])
    const recetas = await resR.json()
    const productos = await resP.json()
    const ingredientes = await resI.json()
    setRecetas(Array.isArray(recetas) ? recetas : [])
    setProductos(Array.isArray(productos) ? productos : [])
    setIngredientes(Array.isArray(ingredientes) ? ingredientes : [])
  }

  const filtered = recetas.filter(r =>
    r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.productoNombre?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: recetas.length,
    productos: new Set(recetas.map(r => r.idProducto)).size,
    totalIng: recetas.reduce((s, r) => s + (r.ingredientes?.length || 0), 0)
  }

  const openModal = (r = null) => {
    setEditingId(r?.id || null)
    setForm(r ? { nombre: r.nombre, descripcion: r.descripcion || '', idProducto: r.idProducto, cantPorLote: r.cantPorLote } : { nombre: '', descripcion: '', idProducto: '', cantPorLote: 1 })
    setIngRows(r?.ingredientes?.length > 0 ? r.ingredientes.map(i => ({ idIngrediente: i.idIngrediente, cant: i.cant, unidad: i.unidad })) : [{ idIngrediente: '', cant: '', unidad: '' }])
    setModalOpen(true)
  }

  const addIngRow = () => setIngRows(prev => [...prev, { idIngrediente: '', cant: '', unidad: '' }])
  const removeIngRow = (idx) => setIngRows(prev => prev.filter((_, i) => i !== idx))
  const updateIngRow = (idx, field, value) => {
    setIngRows(prev => prev.map((row, i) => {
      if (i !== idx) return row
      if (field === 'idIngrediente') {
        const ing = ingredientes.find(i => i.id === +value)
        return { ...row, idIngrediente: +value, unidad: ing?.unidad || '' }
      }
      return { ...row, [field]: value }
    }))
  }

  const guardar = async () => {
    if (!form.nombre) return showToast('El nombre es obligatorio', 'error')
    if (!form.idProducto) return showToast('Seleccioná el producto que genera', 'error')
    const ings = ingRows.filter(r => r.idIngrediente && r.cant)
    if (ings.length === 0) return showToast('Agregá al menos un ingrediente', 'error')

    const body = { ...form, ingredientes: ings }
    const url = `${API}/recetas${editingId ? '/' + editingId : ''}`
    try {
      await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(body) })
      showToast(editingId ? 'Receta actualizada ✓' : 'Receta creada ✓', 'success')
      setModalOpen(false)
      cargarDatos()
    } catch {
      showToast('Error al guardar', 'error')
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta receta?')) return
    await fetch(`${API}/recetas/${id}`, { method: 'DELETE', headers: headers() })
    showToast('Receta eliminada', 'error')
    cargarDatos()
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>📋 Recetas</h1>
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
            <div className="stat-card"><div className="stat-label">Total Recetas</div><div className="stat-value" style={{color:'var(--primary)'}}>{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Productos Cubiertos</div><div className="stat-value" style={{color:'var(--success)'}}>{stats.productos}</div></div>
            <div className="stat-card"><div className="stat-label">Total Ingredientes</div><div className="stat-value" style={{color:'var(--info)'}}>{stats.totalIng}</div></div>
          </div>

          <div className="toolbar">
            <input className="search-box" placeholder="🔍 Buscar receta..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => openModal()}>+ Nueva Receta</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Descripción</th><th>Producto que genera</th><th>Cant. por lote</th><th>Ingredientes</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state">No se encontraron recetas</div></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.nombre}</strong></td>
                    <td style={{color:'var(--muted)'}}>{r.descripcion || '—'}</td>
                    <td><span className="badge badge-cat">{r.productoNombre || '—'}</span></td>
                    <td style={{textAlign:'center'}}>{r.cantPorLote} u.</td>
                    <td>{r.ingredientes?.map(i => <span key={i.idIngrediente} className="badge badge-ing" style={{margin:'2px'}}>🧂 {i.nombre}</span>)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(r)}>✏️ Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => eliminar(r.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay open">
          <div className="modal" style={{maxWidth:'600px', width:'95%'}}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <h2>{editingId ? 'Editar Receta' : 'Nueva Receta'}</h2>
            <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Masa para Pizza" /></div>
            <div className="form-group"><label>Descripción</label><input className="form-control" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción opcional" /></div>
            <div className="form-row">
              <div className="form-group">
                <label>Producto que genera</label>
                <select className="form-control" value={form.idProducto} onChange={e => setForm({...form, idProducto: +e.target.value})}>
                  <option value="">— Seleccioná un producto —</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Cantidad por lote</label>
                <input className="form-control" type="number" min="1" value={form.cantPorLote} onChange={e => setForm({...form, cantPorLote: +e.target.value})} />
              </div>
            </div>

            <div style={{marginTop:'16px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <strong>Ingredientes</strong>
                <button className="btn btn-ghost btn-sm" onClick={addIngRow}>+ Agregar</button>
              </div>
              <table style={{width:'100%'}}>
                <thead>
                  <tr style={{fontSize:'.8rem', color:'var(--muted)'}}>
                    <th style={{textAlign:'left', padding:'4px'}}>Ingrediente</th>
                    <th style={{textAlign:'left', padding:'4px'}}>Cantidad</th>
                    <th style={{textAlign:'left', padding:'4px'}}>Unidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ingRows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{padding:'4px'}}>
                        <select className="form-control" style={{fontSize:'.85rem'}} value={row.idIngrediente} onChange={e => updateIngRow(idx, 'idIngrediente', e.target.value)}>
                          <option value="">— Ingrediente —</option>
                          {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'4px'}}><input className="form-control" type="number" min="0.1" step="0.1" style={{fontSize:'.85rem'}} value={row.cant} onChange={e => updateIngRow(idx, 'cant', e.target.value)} /></td>
                      <td style={{padding:'4px'}}><input className="form-control" style={{fontSize:'.85rem'}} value={row.unidad} readOnly /></td>
                      <td style={{padding:'4px'}}><button className="btn-icon" onClick={() => removeIngRow(idx)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Recetas
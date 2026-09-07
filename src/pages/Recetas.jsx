import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

const Icon = ({ d, ...props }) => (
  <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} {...props} />
)

const icons = {
  clipboard: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>',
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  flask: '<path d="M9 2v6L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 8V2"/><line x1="9" y1="2" x2="15" y2="2"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
}

function Recetas() {
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', idProducto: '', cantPorLote: 1 })
  const [ingRows, setIngRows] = useState([{ idIngrediente: '', cant: '', unidad: '' }])
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', categoria: 'Otros', unidad: 'u', precioVenta: 0 })
  const [toast, setToast] = useState('')
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()
  const catOptions = ['Hamburguesas', 'Pizzas', 'Empanadas', 'Platos', 'Guarniciones', 'Bebidas', 'Otros']

  useEffect(() => { cargarDatos() }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    const [resR, resP, resI] = await Promise.all([
      fetch(`${API}/recetas?sucursal=${sucursalActual}`, { headers: headers() }),
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
    setNuevoProducto({ nombre: '', categoria: 'Otros', unidad: 'u', precioVenta: 0 })
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
      if (form.idProducto === '__nuevo__' && !nuevoProducto.nombre) return showToast('Completá el nombre del producto nuevo', 'error')
      const ings = ingRows.filter(r => r.idIngrediente && r.cant)
      if (ings.length === 0) return showToast('Agregá al menos un ingrediente', 'error')

      try {
        let idProducto = form.idProducto
        if (idProducto === '__nuevo__') {
          const resProd = await fetch(`${API}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers() },
            body: JSON.stringify({ ...nuevoProducto, stock: 0, stockMin: 0, idSucursal: sucursalActual })
          })
          const prodCreado = await resProd.json()
          if (!prodCreado.id) return showToast('No se pudo crear el producto nuevo', 'error')
          idProducto = prodCreado.id
        }

        const body = { ...form, idProducto, ingredientes: ings, idSucursal: sucursalActual }
        const url = `${API}/recetas${editingId ? '/' + editingId : ''}`
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(body) })
        const data = await res.json()
        if (data.avisos?.length > 0) {
          showToast(data.avisos.join(' '), 'error')
        } else {
          showToast(editingId ? 'Receta actualizada ✓' : 'Receta creada ✓', 'success')
        }
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
          <h1><Icon d={icons.clipboard} /> Recetas</h1>
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
            <div className="stat-card"><div className="stat-label">Total Recetas</div><div className="stat-value" style={{color:'var(--primary)'}}>{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Productos Cubiertos</div><div className="stat-value" style={{color:'var(--success)'}}>{stats.productos}</div></div>
            <div className="stat-card"><div className="stat-label">Total Ingredientes</div><div className="stat-value" style={{color:'var(--info)'}}>{stats.totalIng}</div></div>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Icon d={icons.search} />
              <input className="search-box" placeholder="Buscar receta..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
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
                    <td>{r.ingredientes?.map(i => <span key={i.idIngrediente} className="badge badge-ing" style={{margin:'2px'}}><Icon d={icons.flask} />{i.nombre}</span>)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(r)}><Icon d={icons.edit} style={{width:13, height:13}} /> Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => eliminar(r.id)}><Icon d={icons.trash} /></button>
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
            <button className="modal-close" onClick={() => setModalOpen(false)}><Icon d={icons.x} /></button>
            <h2>{editingId ? 'Editar Receta' : 'Nueva Receta'}</h2>
            <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Masa para Pizza" /></div>
            <div className="form-group"><label>Descripción</label><input className="form-control" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción opcional" /></div>
                        <div className="form-row">
              <div className="form-group">
                <label>Producto que genera</label>
                <select className="form-control" value={form.idProducto} onChange={e => setForm({...form, idProducto: e.target.value === '__nuevo__' ? '__nuevo__' : +e.target.value})}>
                  <option value="">— Seleccioná un producto —</option>
                  <option value="__nuevo__">+ Crear producto nuevo</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Cantidad por lote</label>
                <input className="form-control" type="number" min="1" value={form.cantPorLote} onChange={e => setForm({...form, cantPorLote: +e.target.value})} />
              </div>
            </div>
            {form.idProducto === '__nuevo__' && (
              <div style={{background:'#f6f6f6', padding:'10px', borderRadius:'8px', marginBottom:'8px'}}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del producto nuevo</label>
                    <input className="form-control" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} placeholder="Ej: Pan" />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select className="form-control" value={nuevoProducto.categoria} onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}>
                      {catOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unidad</label>
                    <select className="form-control" value={nuevoProducto.unidad} onChange={e => setNuevoProducto({...nuevoProducto, unidad: e.target.value})}>
                      {['u','g','kg','ml','l'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Precio Venta</label>
                    <input className="form-control" type="number" value={nuevoProducto.precioVenta} onChange={e => setNuevoProducto({...nuevoProducto, precioVenta: +e.target.value})} />
                  </div>
                </div>
              </div>
            )}
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
                      <td style={{padding:'4px'}}><button className="btn-icon" onClick={() => removeIngRow(idx)}><Icon d={icons.x} style={{width:12, height:12}} /></button></td>
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
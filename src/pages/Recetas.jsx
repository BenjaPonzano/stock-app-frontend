import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API, mensajeError } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'
import Icon from '../components/Icon'
import Toast from '../components/Toast'
import SelectorSucursal from '../components/SelectorSucursal'
import Modal from '../components/Modal'
import Cargando from '../components/Cargando'
import ConfirmarModal from '../components/ConfirmarModal'
import { UNIDADES, compatibles, sonCompatibles, convertir, formatoCantidad } from '../utils/unidades'
import StatCard from '../components/StatCard'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })


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
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', unidad: 'u', precioVenta: 0 })
  const [toast, setToast] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [aEliminar, setAEliminar] = useState(null)
  const { sucursalActual, sucursales, cambiarSucursal, esAdmin } = useSucursal()

  useEffect(() => { setCargando(true); cargarDatos() }, [sucursalActual])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    try {
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
    } catch (e) {
      showToast('No se pudo conectar con el servidor', 'error')
    } finally {
      setCargando(false)
    }
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
    setNuevoProducto({ nombre: '', unidad: 'u', precioVenta: 0 })
    setModalOpen(true)
  }

  const addIngRow = () => setIngRows(prev => [...prev, { idIngrediente: '', cant: '', unidad: '' }])
  const removeIngRow = (idx) => setIngRows(prev => prev.filter((_, i) => i !== idx))
  const updateIngRow = (idx, field, value) => {
    setIngRows(prev => prev.map((row, i) => {
      if (i !== idx) return row
      if (field === 'idIngrediente') {
        if (value === '__nuevo__') return { ...row, idIngrediente: '__nuevo__', unidad: 'g', unidadStock: 'g', nuevoNombre: '', nuevoPrecio: '' }
        const ing = ingredientes.find(i => i.id === +value)
        return { ...row, idIngrediente: +value, unidad: ing?.unidad || '' }
      }
      // Ingrediente nuevo: si cambia la unidad en que se lleva el stock, la de la receta debe ser compatible
      if (field === 'unidadStock') {
        return { ...row, unidadStock: value, unidad: sonCompatibles(row.unidad, value) ? row.unidad : value }
      }
      return { ...row, [field]: value }
    }))
  }

  // Unidad en que se lleva el stock de lo elegido en una fila (null si no se eligió nada)
  const unidadStockDe = (row) =>
    row.idIngrediente === '__nuevo__' ? row.unidadStock : ingredientes.find(i => i.id === +row.idIngrediente)?.unidad || null

    const guardar = async () => {
      if (!form.nombre) return showToast('El nombre es obligatorio', 'error')
      if (!form.idProducto) return showToast('Seleccioná el producto que genera', 'error')
      if (form.idProducto === '__nuevo__' && !nuevoProducto.nombre) return showToast('Completá el nombre del producto nuevo', 'error')
      const ings = ingRows.filter(r => r.idIngrediente && r.cant)
      if (ings.length === 0) return showToast('Agregá al menos un ingrediente', 'error')
      if (ings.some(r => r.idIngrediente === '__nuevo__' && !r.nuevoNombre?.trim())) return showToast('Completá el nombre del ingrediente nuevo', 'error')

      try {
        let idProducto = form.idProducto
        if (idProducto === '__nuevo__') {
          const resProd = await fetch(`${API}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers() },
            body: JSON.stringify({ ...nuevoProducto, origen: 'elaborado', stock: 0, stockMin: 0, idSucursal: sucursalActual })
          })
          const prodCreado = await resProd.json()
          if (!prodCreado.id) return showToast('No se pudo crear el producto nuevo', 'error')
          idProducto = prodCreado.id
        }

        // Los ingredientes marcados como "nuevo" se crean primero y se usa el id que devuelve la API
        const ingredientesFinal = []
        for (const r of ings) {
          let idIngrediente = r.idIngrediente
          if (idIngrediente === '__nuevo__') {
            const resIng = await fetch(`${API}/ingredientes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers() },
              body: JSON.stringify({ nombre: r.nuevoNombre.trim(), unidad: r.unidadStock || r.unidad, stock: 0, stockMin: 0, precio: +r.nuevoPrecio || 0, idSucursal: sucursalActual })
            })
            if (!resIng.ok) return showToast(await mensajeError(resIng), 'error')
            idIngrediente = (await resIng.json()).id
          }
          ingredientesFinal.push({ idIngrediente, cant: r.cant, unidad: r.unidad })
        }

        const body = { ...form, idProducto, ingredientes: ingredientesFinal, idSucursal: sucursalActual }
        const url = `${API}/recetas${editingId ? '/' + editingId : ''}`
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(body) })
        if (!res.ok) return showToast(await mensajeError(res), 'error')
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

  const guardarSeguro = async () => {
    if (guardando) return
    setGuardando(true)
    try { await guardar() } finally { setGuardando(false) }
  }

  const eliminar = async (id) => {
    const res = await fetch(`${API}/recetas/${id}`, { method: 'DELETE', headers: headers() })
    setAEliminar(null)
    if (!res.ok) { showToast(await mensajeError(res, 'No se pudo eliminar la receta'), 'error'); return }
    showToast('Receta eliminada', 'error')
    cargarDatos()
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1><Icon d={icons.clipboard} /> Recetas</h1>
          <SelectorSucursal sucursales={sucursales} valor={sucursalActual} onChange={cambiarSucursal} editable={esAdmin} />
        </div>
        <div className="content">

          {esAdmin && (
          <div className="stats">
            <StatCard etiqueta="Total Recetas" valor={stats.total} color="var(--primary)" />
            <StatCard etiqueta="Productos Cubiertos" valor={stats.productos} color="var(--success)" />
            <StatCard etiqueta="Total Ingredientes" valor={stats.totalIng} color="var(--info)" />
          </div>
          )}

          <div className="toolbar">
            <div className="search-wrap">
              <Icon d={icons.search} />
              <input className="search-box" placeholder="Buscar receta..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {esAdmin && <button className="btn btn-primary" onClick={() => openModal()}>+ Nueva Receta</button>}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Descripción</th><th>Producto que genera</th><th>Cant. por lote</th><th>Ingredientes</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="6"><Cargando mensaje="Cargando recetas..." /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state">No se encontraron recetas</div></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.nombre}</strong></td>
                    <td style={{color:'var(--muted)'}}>{r.descripcion || '—'}</td>
                    <td><span className="badge badge-cat">{r.productoNombre || '—'}</span></td>
                    <td style={{textAlign:'center'}}>{r.cantPorLote} u.</td>
                    <td>{r.ingredientes?.map(i => <span key={i.idIngrediente} className="badge badge-ing" style={{margin:'2px'}}><Icon d={icons.flask} />{i.nombre}</span>)}</td>
                    <td>
                      {esAdmin && (
                        <div className="actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => openModal(r)}><Icon d={icons.edit} style={{width:13, height:13}} /> Editar</button>
                          <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => setAEliminar({ id: r.id, nombre: r.nombre })}><Icon d={icons.trash} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal titulo={editingId ? 'Editar Receta' : 'Nueva Receta'} onCerrar={() => setModalOpen(false)} ancho="600px">
            <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Masa para Pizza" /></div>
            <div className="form-group"><label>Descripción</label><input className="form-control" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción opcional" /></div>
                        <div className="form-row">
              <div className="form-group">
                <label>Producto que genera</label>
                <select className="form-control" value={form.idProducto} onChange={e => setForm({...form, idProducto: e.target.value === '__nuevo__' ? '__nuevo__' : +e.target.value})}>
                  <option value="">— Seleccioná un producto —</option>
                  <option value="__nuevo__">+ Crear producto nuevo</option>
                  {productos.filter(p => p.origen !== 'comprado' || p.id === form.idProducto).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <small className="form-ayuda">Solo se listan productos que se elaboran en el local. Si creás uno nuevo desde acá, queda marcado así.</small>
              </div>
              <div className="form-group">
                <label>Cantidad por lote</label>
                <input className="form-control" type="number" min="1" value={form.cantPorLote} onChange={e => setForm({...form, cantPorLote: +e.target.value})} />
              </div>
            </div>
            {form.idProducto === '__nuevo__' && (
              <div style={{background:'#f6f6f6', padding:'10px', borderRadius:'8px', marginBottom:'8px'}}>
                <div className="form-group">
                  <label>Nombre del producto nuevo</label>
                  <input className="form-control" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} placeholder="Ej: Pan" />
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
              <table style={{width:'100%', tableLayout:'fixed'}}>
                <thead>
                  <tr style={{fontSize:'.8rem', color:'var(--muted)'}}>
                    <th style={{textAlign:'left', padding:'4px', width:'44%'}}>Ingrediente</th>
                    <th style={{textAlign:'left', padding:'4px', width:'24%'}}>Cant.</th>
                    <th style={{textAlign:'left', padding:'4px', width:'22%'}}>Unidad</th>
                    <th style={{width:'10%'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {ingRows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{padding:'4px'}}>
                        <select className="form-control" style={{fontSize:'.85rem'}} value={row.idIngrediente} onChange={e => updateIngRow(idx, 'idIngrediente', e.target.value)}>
                          <option value="">— Ingrediente —</option>
                          <option value="__nuevo__">+ Crear ingrediente nuevo</option>
                          {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                        </select>
                        {row.idIngrediente === '__nuevo__' && (
                          <div style={{display:'flex', flexDirection:'column', gap:'6px', marginTop:'6px'}}>
                            <input className="form-control" style={{fontSize:'.85rem'}} placeholder="Nombre del ingrediente nuevo" value={row.nuevoNombre || ''} onChange={e => updateIngRow(idx, 'nuevoNombre', e.target.value)} />
                            <select className="form-control" style={{fontSize:'.85rem'}} value={row.unidadStock} onChange={e => updateIngRow(idx, 'unidadStock', e.target.value)} title="Unidad en que se compra y se lleva el stock">
                              {UNIDADES.map(u => <option key={u} value={u}>Se compra en {u}</option>)}
                            </select>
                            <input className="form-control" style={{fontSize:'.85rem'}} type="number" min="0" placeholder="Precio de compra por unidad de compra (opcional)" title="Precio por la unidad en que se compra" value={row.nuevoPrecio} onChange={e => updateIngRow(idx, 'nuevoPrecio', e.target.value)} />
                          </div>
                        )}
                        {unidadStockDe(row) && (
                          <div className="form-ayuda" style={{marginTop:'4px'}}>
                            {'Stock en ' + unidadStockDe(row)}
                            {row.cant !== '' && row.unidad && row.unidad !== unidadStockDe(row) && convertir(+row.cant, row.unidad, unidadStockDe(row)) !== null &&
                              ` · ${formatoCantidad(+row.cant)} ${row.unidad} = ${formatoCantidad(convertir(+row.cant, row.unidad, unidadStockDe(row)))} ${unidadStockDe(row)}`}
                          </div>
                        )}
                      </td>
                      <td style={{padding:'4px'}}><input className="form-control" type="number" min="0" step="any" style={{fontSize:'.85rem'}} value={row.cant} onChange={e => updateIngRow(idx, 'cant', e.target.value)} /></td>
                      <td style={{padding:'4px'}}>
                        {unidadStockDe(row) ? (
                          <select className="form-control" style={{fontSize:'.85rem'}} value={row.unidad} onChange={e => updateIngRow(idx, 'unidad', e.target.value)} title="Unidad en que se usa en esta receta">
                            {[...new Set([...compatibles(unidadStockDe(row)), row.unidad].filter(Boolean))].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        ) : (
                          <input className="form-control" style={{fontSize:'.85rem'}} value={row.unidad} readOnly placeholder="—" />
                        )}
                      </td>
                      <td style={{padding:'4px'}}><button className="btn-icon" onClick={() => removeIngRow(idx)}><Icon d={icons.x} style={{width:12, height:12}} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarSeguro} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </Modal>
      )}

      {aEliminar && (
        <ConfirmarModal
          titulo="Eliminar receta"
          mensaje={<>¿Seguro que querés eliminar la receta <strong>{aEliminar.nombre}</strong>? Las elaboraciones ya registradas no se modifican, pero no vas a poder elaborar con esta receta.</>}
          onConfirmar={() => eliminar(aEliminar.id)}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

export default Recetas
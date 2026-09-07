import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

const Icon = ({ d, ...props }) => (
  <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} {...props} />
)

const icons = {
  store: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  check: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'
}

function Sucursales() {
  const [sucursales, setSucursales] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [status, setStatus] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { cargarDatos() }, [])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    const res = await fetch(`${API}/sucursales`, { headers: headers() })
    setSucursales(await res.json())
  }

  const filtered = sucursales.filter(s =>
    s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    s.direccion?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: sucursales.length,
    activas: sucursales.filter(s => s.activa).length,
    inactivas: sucursales.filter(s => !s.activa).length
  }

  const openModal = (s = null) => {
    setEditingId(s?.id || null)
    setForm(s || {})
    setStatus(s ? !!s.activa : true)
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre) return showToast('El nombre es obligatorio', 'error')
    const obj = { ...form, activa: status }
    const url = `${API}/sucursales${editingId ? '/' + editingId : ''}`
    await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(obj) })
    showToast(editingId ? 'Actualizada ✓' : 'Creada ✓', 'success')
    setModalOpen(false)
    cargarDatos()
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar sucursal?')) return
    await fetch(`${API}/sucursales/${id}`, { method: 'DELETE', headers: headers() })
    showToast('Eliminada', 'error')
    cargarDatos()
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1><Icon d={icons.store} /> Administración de Sucursales</h1>
          <div style={{fontSize:'.85rem', color:'var(--muted)'}}>Vista Global de Administrador</div>
        </div>
        <div className="content">

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Total Sucursales</div><div className="stat-value" style={{color:'var(--primary)'}}>{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Operativas</div><div className="stat-value" style={{color:'var(--success)'}}>{stats.activas}</div></div>
            <div className="stat-card"><div className="stat-label">Inactivas</div><div className="stat-value" style={{color:'var(--muted)'}}>{stats.inactivas}</div></div>
          </div>

          <div className="toolbar">
            <div className="toolbar-left">
              <div className="search-wrap">
                <Icon d={icons.search} />
                <input className="search-box" placeholder="Buscar por nombre o dirección..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => openModal()}>+ Nueva Sucursal</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Sucursal</th><th>Contacto</th><th>Encargado</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty-state">No se encontraron sucursales</div></td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="sucursal-name">{s.nombre}</div>
                      <div className="sucursal-address"><Icon d={icons.mapPin} style={{width:12, height:12}} /> {s.direccion}</div>
                    </td>
                    <td><span className="cell-icon"><Icon d={icons.phone} style={{width:13, height:13}} /> {s.telefono || '-'}</span></td>
                    <td><span className="cell-icon"><Icon d={icons.user} style={{width:13, height:13}} /> {s.encargado || '-'}</span></td>
                    <td><span className={`badge ${s.activa ? 'badge-active' : 'badge-inactive'}`}>{s.activa ? <><Icon d={icons.check} /> Operativa</> : <><Icon d={icons.x} /> Inactiva</>}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(s)}><Icon d={icons.edit} style={{width:13, height:13}} /> Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => eliminar(s.id)}><Icon d={icons.trash} /></button>
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
          <div className="modal">
            <button className="modal-close" onClick={() => setModalOpen(false)}><Icon d={icons.x} /></button>
            <h2>{editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
            <div className="form-group"><label>Nombre de la Sucursal</label><input className="form-control" value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
            <div className="form-group"><label>Dirección</label><input className="form-control" value={form.direccion || ''} onChange={e => setForm({...form, direccion: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label>Teléfono</label><input className="form-control" value={form.telefono || ''} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
              <div className="form-group"><label>Encargado / Gerente</label><input className="form-control" value={form.encargado || ''} onChange={e => setForm({...form, encargado: e.target.value})} /></div>
            </div>
            <div className="form-group">
              <label>Estado Operativo</label>
              <div className="status-toggle">
                <div className={`status-opt yes ${status ? 'active' : ''}`} onClick={() => setStatus(true)} style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Icon d={icons.check} style={{width:14, height:14}} /> Activa</div>
                <div className={`status-opt no ${!status ? 'active' : ''}`} onClick={() => setStatus(false)} style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Icon d={icons.x} style={{width:14, height:14}} /> Inactiva</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar Sucursal</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Sucursales
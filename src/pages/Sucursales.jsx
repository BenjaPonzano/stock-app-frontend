import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

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
          <h1>🏪 Administración de Sucursales</h1>
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
              <input className="search-box" placeholder="🔍 Buscar por nombre o dirección..." value={search} onChange={e => setSearch(e.target.value)} />
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
                      <div className="sucursal-address">📍 {s.direccion}</div>
                    </td>
                    <td>📞 {s.telefono || '-'}</td>
                    <td>👤 {s.encargado || '-'}</td>
                    <td><span className={`badge ${s.activa ? 'badge-active' : 'badge-inactive'}`}>{s.activa ? 'Operativa' : 'Inactiva'}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(s)}>✏️ Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => eliminar(s.id)}>🗑️</button>
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
            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
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
                <div className={`status-opt yes ${status ? 'active' : ''}`} onClick={() => setStatus(true)}>✓ Activa</div>
                <div className={`status-opt no ${!status ? 'active' : ''}`} onClick={() => setStatus(false)}>✕ Inactiva</div>
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
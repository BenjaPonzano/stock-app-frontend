import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API, mensajeError } from '../services/api'
import Icon from '../components/Icon'
import SucursalModelo from '../models/Sucursal'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import Cargando from '../components/Cargando'
import ConfirmarModal from '../components/ConfirmarModal'
import StatCard from '../components/StatCard'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })


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
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [aEliminar, setAEliminar] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    try {
      const res = await fetch(`${API}/sucursales`, { headers: headers() })
      const datos = await res.json()
      setSucursales(Array.isArray(datos) ? datos.map(SucursalModelo.desdeApi) : [])
    } catch (e) {
      showToast('No se pudo conectar con el servidor', 'error')
    } finally {
      setCargando(false)
    }
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
    const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(obj) })
    if (!res.ok) return showToast(await mensajeError(res), 'error')
    showToast(editingId ? 'Actualizada ✓' : 'Creada ✓', 'success')
    setModalOpen(false)
    cargarDatos()
  }

  const guardarSeguro = async () => {
    if (guardando) return
    setGuardando(true)
    try { await guardar() } finally { setGuardando(false) }
  }

  const eliminar = async (id) => {
    const res = await fetch(`${API}/sucursales/${id}`, { method: 'DELETE', headers: headers() })
    setAEliminar(null)
    if (!res.ok) return showToast(await mensajeError(res), 'error')
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
            <StatCard etiqueta="Total Sucursales" valor={stats.total} color="var(--primary)" />
            <StatCard etiqueta="Operativas" valor={stats.activas} color="var(--success)" />
            <StatCard etiqueta="Inactivas" valor={stats.inactivas} color="var(--muted)" />
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
                {cargando ? (
                  <tr><td colSpan="5"><Cargando mensaje="Cargando sucursales..." /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty-state">No se encontraron sucursales</div></td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="sucursal-name">{s.nombre}</div>
                      <div className="sucursal-address"><Icon d={icons.mapPin} style={{width:12, height:12}} /> {s.direccion}</div>
                    </td>
                    <td><span className="cell-icon"><Icon d={icons.phone} style={{width:13, height:13}} /> {s.telefono || '-'}</span></td>
                    <td><span className="cell-icon"><Icon d={icons.user} style={{width:13, height:13}} /> {s.encargado || '-'}</span></td>
                    <td><span className={`badge ${s.activa ? 'badge-active' : 'badge-inactive'}`}>{s.activa ? <><Icon d={icons.check} /> {s.estadoTexto}</> : <><Icon d={icons.x} /> Inactiva</>}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(s)}><Icon d={icons.edit} style={{width:13, height:13}} /> Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => setAEliminar({ id: s.id, nombre: s.nombre })}><Icon d={icons.trash} /></button>
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
        <Modal titulo={editingId ? 'Editar Sucursal' : 'Nueva Sucursal'} onCerrar={() => setModalOpen(false)}>
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
              <button className="btn btn-primary" onClick={guardarSeguro} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar Sucursal'}</button>
            </div>
          </Modal>
      )}

      {aEliminar && (
        <ConfirmarModal
          titulo="Eliminar sucursal"
          mensaje={<>¿Seguro que querés eliminar la sucursal <strong>{aEliminar.nombre}</strong>? Esta acción no se puede deshacer. Si tiene usuarios o movimientos asociados, el sistema no te va a dejar eliminarla.</>}
          onConfirmar={() => eliminar(aEliminar.id)}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

export default Sucursales
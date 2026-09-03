import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [rol, setRol] = useState('vendedor')
  const [toast, setToast] = useState('')
  const { sucursales } = useSucursal()

  useEffect(() => { cargarDatos() }, [])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    const res = await fetch(`${API}/usuarios`, { headers: headers() })
    setUsuarios(await res.json())
  }

  const getIniciales = (n, a) => (n?.charAt(0) + a?.charAt(0)).toUpperCase()

  const filtered = usuarios.filter(u => {
    const matchSearch = (u.nombre + ' ' + u.apellido).toLowerCase().includes(search.toLowerCase())
    const matchRol = !filterRol || u.tipoUsuario === filterRol
    return matchSearch && matchRol
  })

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.tipoUsuario === 'admin').length,
    vendedores: usuarios.filter(u => u.tipoUsuario !== 'admin').length
  }

  const openModal = (u = null) => {
    setEditingId(u?.idUsuario || null)
    setForm(u ? { nombre: u.nombre, apellido: u.apellido, idSucursal: u.idSucursal || '' } : { idSucursal: '' })
    setRol(u?.tipoUsuario || 'vendedor')
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre || !form.apellido) return showToast('Nombre y apellido obligatorios', 'error')
    if (!editingId && !form.password) return showToast('Debe asignar contraseña', 'error')
    if (rol === 'vendedor' && !form.idSucursal) return showToast('Seleccioná la sucursal del vendedor', 'error')
    const obj = { ...form, tipoUsuario: rol }
    const url = `${API}/usuarios${editingId ? '/' + editingId : ''}`
    await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(obj) })
    showToast(editingId ? 'Actualizado ✓' : 'Creado ✓', 'success')
    setModalOpen(false)
    cargarDatos()
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar usuario?')) return
    await fetch(`${API}/usuarios/${id}`, { method: 'DELETE', headers: headers() })
    showToast('Eliminado', 'error')
    cargarDatos()
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>👥 Gestión de Usuarios</h1>
          <div style={{fontSize:'.85rem', color:'var(--muted)'}}>Panel de Control de Accesos</div>
        </div>
        <div className="content">

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Total Usuarios</div><div className="stat-value">{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Administradores</div><div className="stat-value" style={{color:'var(--info)'}}>{stats.admins}</div></div>
            <div className="stat-card"><div className="stat-label">Vendedores</div><div className="stat-value" style={{color:'var(--success)'}}>{stats.vendedores}</div></div>
          </div>

          <div className="toolbar">
            <div className="toolbar-left">
              <input className="search-box" placeholder="🔍 Buscar por nombre o apellido..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="filter-select" value={filterRol} onChange={e => setFilterRol(e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="vendedor">Vendedores</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => openModal()}>+ Nuevo Usuario</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Usuario</th><th>Rol / Permisos</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="4"><div className="empty-state">No se encontraron usuarios</div></td></tr>
                ) : filtered.map(u => (
                  <tr key={u.idUsuario}>
                    <td style={{color:'var(--muted)'}}>#{u.idUsuario}</td>
                    <td>
                      <div className="user-name">
                        <div className="user-avatar">{getIniciales(u.nombre, u.apellido)}</div>
                        {u.nombre} {u.apellido}
                      </div>
                    </td>
                    <td><span className={`badge ${u.tipoUsuario === 'admin' ? 'badge-primary' : 'badge-success'}`}>{u.tipoUsuario === 'admin' ? '👑 Admin' : '🛒 Vendedor'}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(u)}>✏️ Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => eliminar(u.idUsuario)}>🗑️</button>
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
            <h2>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <div className="form-row">
              <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
              <div className="form-group"><label>Apellido</label><input className="form-control" value={form.apellido || ''} onChange={e => setForm({...form, apellido: e.target.value})} /></div>
            </div>
            <div className="form-group">
              <label>Contraseña de Acceso</label>
              <input className="form-control" type="password" placeholder="••••••••" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
              <div style={{fontSize:'.7rem', color:'var(--muted)', marginTop:'4px'}}>Dejar en blanco si no se desea modificar (al editar).</div>
            </div>
            <div className="form-group">
              <label>Tipo de Usuario</label>
              <div className="role-toggle">
                <div className={`role-opt admin ${rol === 'admin' ? 'active' : ''}`} onClick={() => setRol('admin')}>👑 Admin</div>
                <div className={`role-opt vendedor ${rol === 'vendedor' ? 'active' : ''}`} onClick={() => setRol('vendedor')}>🛒 Vendedor</div>
              </div>
            </div>
            {rol === 'vendedor' && (
            <div className="form-group">
              <label>Sucursal Asignada</label>
              <select className="form-control" value={form.idSucursal || ''} onChange={e => setForm({...form, idSucursal: +e.target.value})}>
                <option value="">— Seleccioná una sucursal —</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar Usuario</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type} show`}>{toast.msg}</div>}
    </div>
  )
}

export default Usuarios
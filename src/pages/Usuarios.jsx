import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { API, mensajeError } from '../services/api'
import { useSucursal } from '../contexts/SucursalContext'
import Icon from '../components/Icon'
import Usuario from '../models/Usuario'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import Cargando from '../components/Cargando'
import ConfirmarModal from '../components/ConfirmarModal'
import StatCard from '../components/StatCard'

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })


const icons = {
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M17 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  crown: '<path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4z"/><line x1="4" y1="21" x2="20" y2="21"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 2-1.6L22 7H6"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [rol, setRol] = useState('vendedor')
  const [toast, setToast] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [aEliminar, setAEliminar] = useState(null)
  const { sucursales } = useSucursal()

  useEffect(() => { cargarDatos() }, [])

  const showToast = (msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 2800)
  }

  const cargarDatos = async () => {
    try {
      const res = await fetch(`${API}/usuarios`, { headers: headers() })
      const datos = await res.json()
      setUsuarios(Array.isArray(datos) ? datos.map(Usuario.desdeApi) : [])
    } catch (e) {
      showToast('No se pudo conectar con el servidor', 'error')
    } finally {
      setCargando(false)
    }
  }

  const filtered = usuarios.filter(u => {
    const matchSearch = u.nombreCompleto.toLowerCase().includes(search.toLowerCase())
    const matchRol = !filterRol || u.tipoUsuario === filterRol
    return matchSearch && matchRol
  })

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.esAdmin).length,
    vendedores: usuarios.filter(u => !u.esAdmin).length
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
    if (form.password && form.password.length < 4) return showToast('La contraseña debe tener al menos 4 caracteres', 'error')
    const obj = { ...form, tipoUsuario: rol }
    const url = `${API}/usuarios${editingId ? '/' + editingId : ''}`
    const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(obj) })
    if (!res.ok) return showToast(await mensajeError(res), 'error')
    showToast(editingId ? 'Actualizado ✓' : 'Creado ✓', 'success')
    setModalOpen(false)
    cargarDatos()
  }

  const guardarSeguro = async () => {
    if (guardando) return
    setGuardando(true)
    try { await guardar() } finally { setGuardando(false) }
  }

  const eliminar = async (id) => {
    const res = await fetch(`${API}/usuarios/${id}`, { method: 'DELETE', headers: headers() })
    setAEliminar(null)
    if (!res.ok) return showToast(await mensajeError(res), 'error')
    showToast('Eliminado', 'error')
    cargarDatos()
  }

  return (
    <div>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1><Icon d={icons.users} /> Gestión de Usuarios</h1>
          <div style={{fontSize:'.85rem', color:'var(--muted)'}}>Panel de Control de Accesos</div>
        </div>
        <div className="content">

          <div className="stats">
            <div className="stat-card"><div className="stat-label">Total Usuarios</div><div className="stat-value">{stats.total}</div></div>
            <StatCard etiqueta="Administradores" valor={stats.admins} color="var(--info)" />
            <StatCard etiqueta="Vendedores" valor={stats.vendedores} color="var(--success)" />
          </div>

          <div className="toolbar">
            <div className="toolbar-left">
              <div className="search-wrap">
                <Icon d={icons.search} />
                <input className="search-box" placeholder="Buscar por nombre o apellido..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
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
                {cargando ? (
                  <tr><td colSpan="4"><Cargando mensaje="Cargando usuarios..." /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="4"><div className="empty-state">No se encontraron usuarios</div></td></tr>
                ) : filtered.map(u => (
                  <tr key={u.idUsuario}>
                    <td style={{color:'var(--muted)'}}>#{u.idUsuario}</td>
                    <td>
                      <div className="user-name">
                        <div className="user-avatar">{u.iniciales}</div>
                        {u.nombreCompleto}
                      </div>
                    </td>
                    <td><span className={`badge ${u.tipoUsuario === 'admin' ? 'badge-primary' : 'badge-success'}`}>{u.tipoUsuario === 'admin' ? <><Icon d={icons.crown} /> Admin</> : <><Icon d={icons.cart} /> Vendedor</>}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(u)}><Icon d={icons.edit} style={{width:13, height:13}} /> Editar</button>
                        <button className="btn btn-sm" style={{background:'#fadbd8', color:'#c0392b'}} onClick={() => setAEliminar({ id: u.idUsuario, nombre: u.nombreCompleto })}><Icon d={icons.trash} /></button>
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
        <Modal titulo={editingId ? 'Editar Usuario' : 'Nuevo Usuario'} onCerrar={() => setModalOpen(false)}>
            <div className="form-row">
              <div className="form-group"><label>Nombre</label><input className="form-control" value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
              <div className="form-group"><label>Apellido</label><input className="form-control" value={form.apellido || ''} onChange={e => setForm({...form, apellido: e.target.value})} /></div>
            </div>
            <div className="form-group">
              <label>Contraseña de Acceso</label>
              <input className="form-control" type="password" placeholder="••••••••" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
              {editingId && <div style={{fontSize:'.7rem', color:'var(--muted)', marginTop:'4px'}}>Dejar en blanco si no se desea modificar.</div>}
            </div>
            <div className="form-group">
              <label>Tipo de Usuario</label>
              <div className="role-toggle">
                <div className={`role-opt admin ${rol === 'admin' ? 'active' : ''}`} onClick={() => setRol('admin')} style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Icon d={icons.crown} style={{width:14, height:14}} /> Admin</div>
                <div className={`role-opt vendedor ${rol === 'vendedor' ? 'active' : ''}`} onClick={() => setRol('vendedor')} style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Icon d={icons.cart} style={{width:14, height:14}} /> Vendedor</div>
              </div>
            </div>
            {rol === 'vendedor' && (
            <div className="form-group">
              <label>Sucursal Asignada</label>
              <select className="form-control" value={form.idSucursal || ''} onChange={e => setForm({...form, idSucursal: +e.target.value})}>
                <option value="">— Seleccioná una sucursal —</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>🏪 {s.nombre}</option>)}
              </select>
            </div>
          )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarSeguro} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar Usuario'}</button>
            </div>
          </Modal>
      )}

      {aEliminar && (
        <ConfirmarModal
          titulo="Eliminar usuario"
          mensaje={<>¿Seguro que querés eliminar al usuario <strong>{aEliminar.nombre}</strong>? Va a perder el acceso al sistema y esta acción no se puede deshacer.</>}
          onConfirmar={() => eliminar(aEliminar.id)}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

export default Usuarios
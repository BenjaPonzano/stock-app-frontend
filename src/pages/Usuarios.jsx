import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'
import bcrypt from 'bcryptjs'

const API = 'http://localhost:3001/api'
const getHeaders = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nombre: '', apellido: '', tipoUsuario: 'vendedor', password: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => { cargarUsuarios() }, [])

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get(`${API}/usuarios`, { headers: getHeaders() })
      setUsuarios(res.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const guardar = async () => {
    try {
      const datos = { ...form }
      if (datos.password) {
        datos.password = await bcrypt.hash(datos.password, 10)
      }
      if (editando) {
        await axios.put(`${API}/usuarios/${editando}`, datos, { headers: getHeaders() })
      } else {
        await axios.post(`${API}/usuarios`, datos, { headers: getHeaders() })
      }
      setForm({ nombre: '', apellido: '', tipoUsuario: 'vendedor', password: '' })
      setEditando(null)
      setMostrarForm(false)
      cargarUsuarios()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const editar = (u) => {
    setForm({ nombre: u.nombre, apellido: u.apellido, tipoUsuario: u.tipoUsuario, password: '' })
    setEditando(u.idUsuario)
    setMostrarForm(true)
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar usuario?')) return
    await axios.delete(`${API}/usuarios/${id}`, { headers: getHeaders() })
    cargarUsuarios()
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>👥 Usuarios</h1>
          <button style={styles.btnPrimary} onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setForm({ nombre: '', apellido: '', tipoUsuario: 'vendedor', password: '' }) }}>
            + Nuevo Usuario
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={{color:'white', marginTop:0}}>{editando ? 'Editar' : 'Nuevo'} Usuario</h3>
            <input style={styles.input} placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <input style={styles.input} placeholder="Apellido" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} />
            <select style={styles.input} value={form.tipoUsuario} onChange={e => setForm({...form, tipoUsuario: e.target.value})}>
              <option value="vendedor">Vendedor</option>
              <option value="admin">Admin</option>
            </select>
            <input style={styles.input} placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <div style={{display:'flex', gap:'8px'}}>
              <button style={styles.btnPrimary} onClick={guardar}>Guardar</button>
              <button style={styles.btnSecondary} onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>Nombre</span>
            <span>Apellido</span>
            <span>Tipo</span>
            <span>Acciones</span>
          </div>
          {usuarios.map((u, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>{u.nombre}</span>
              <span>{u.apellido}</span>
              <span style={{color: u.tipoUsuario === 'admin' ? '#4A90D9' : '#27ae60'}}>
                {u.tipoUsuario === 'admin' ? '🔑 Admin' : '👤 Vendedor'}
              </span>
              <span style={{display:'flex', gap:'8px'}}>
                <button style={styles.btnEdit} onClick={() => editar(u)}>✏️</button>
                <button style={styles.btnDelete} onClick={() => eliminar(u.idUsuario)}>🗑️</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', background: '#0d1117', minHeight: '100vh' },
  main: { marginLeft: '240px', flex: 1, padding: '20px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: 'white', margin: 0 },
  btnPrimary: { padding: '8px 16px', background: '#4A90D9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#30363d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnEdit: { padding: '4px 8px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnDelete: { padding: '4px 8px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  form: { background: '#16213e', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: 'white', marginBottom: '12px', boxSizing: 'border-box' },
  tabla: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 20px', color: '#8b949e', fontSize: '13px', borderBottom: '1px solid #30363d' },
  tablaFila: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 20px', color: '#e6edf3', borderBottom: '1px solid #30363d', fontSize: '14px' }
}

export default Usuarios
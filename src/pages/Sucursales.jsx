import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'

const API = 'http://localhost:3001/api'
const getHeaders = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Sucursales() {
  const [sucursales, setSucursales] = useState([])
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '' })
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => { cargarSucursales() }, [])

  const cargarSucursales = async () => {
    try {
      const res = await axios.get(`${API}/sucursales`, { headers: getHeaders() })
      setSucursales(res.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const guardar = async () => {
    try {
      if (editando) {
        await axios.put(`${API}/sucursales/${editando}`, form, { headers: getHeaders() })
      } else {
        await axios.post(`${API}/sucursales`, form, { headers: getHeaders() })
      }
      setForm({ nombre: '', direccion: '', telefono: '' })
      setEditando(null)
      setMostrarForm(false)
      cargarSucursales()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const editar = (s) => {
    setForm({ nombre: s.nombre, direccion: s.direccion, telefono: s.telefono })
    setEditando(s.idSucursal)
    setMostrarForm(true)
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar sucursal?')) return
    await axios.delete(`${API}/sucursales/${id}`, { headers: getHeaders() })
    cargarSucursales()
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>🏪 Sucursales</h1>
          <button style={styles.btnPrimary} onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setForm({ nombre: '', direccion: '', telefono: '' }) }}>
            + Nueva Sucursal
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={{color:'white', marginTop:0}}>{editando ? 'Editar' : 'Nueva'} Sucursal</h3>
            <input style={styles.input} placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <input style={styles.input} placeholder="Dirección" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
            <input style={styles.input} placeholder="Teléfono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
            <div style={{display:'flex', gap:'8px'}}>
              <button style={styles.btnPrimary} onClick={guardar}>Guardar</button>
              <button style={styles.btnSecondary} onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>Nombre</span>
            <span>Dirección</span>
            <span>Teléfono</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {sucursales.map((s, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>{s.nombre}</span>
              <span>{s.direccion || '-'}</span>
              <span>{s.telefono || '-'}</span>
              <span style={{color: s.estado ? '#27ae60' : '#e74c3c'}}>{s.estado ? '✅ Activa' : '❌ Inactiva'}</span>
              <span style={{display:'flex', gap:'8px'}}>
                <button style={styles.btnEdit} onClick={() => editar(s)}>✏️</button>
                <button style={styles.btnDelete} onClick={() => eliminar(s.idSucursal)}>🗑️</button>
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
  btnSecondary: { padding: '8px 16px', background: '#30363d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnEdit: { padding: '4px 8px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnDelete: { padding: '4px 8px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  form: { background: '#16213e', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: 'white', marginBottom: '12px', boxSizing: 'border-box' },
  tabla: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 20px', color: '#8b949e', fontSize: '13px', borderBottom: '1px solid #30363d' },
  tablaFila: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 20px', color: '#e6edf3', borderBottom: '1px solid #30363d', fontSize: '14px' }
}

export default Sucursales
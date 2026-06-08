import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'

const API = 'http://localhost:3001/api'
const getHeaders = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Recetas() {
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState({ nombre: '', descripcion: '', idProducto: '', cantPorLote: 1 })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [resRec, resProd] = await Promise.all([
        axios.get(`${API}/recetas`, { headers: getHeaders() }),
        axios.get(`${API}/productos`)
      ])
      setRecetas(resRec.data)
      setProductos(resProd.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const guardar = async () => {
    try {
      if (editando) {
        await axios.put(`${API}/recetas/${editando}`, form, { headers: getHeaders() })
      } else {
        await axios.post(`${API}/recetas`, form, { headers: getHeaders() })
      }
      setForm({ nombre: '', descripcion: '', idProducto: '', cantPorLote: 1 })
      setEditando(null)
      setMostrarForm(false)
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const editar = (r) => {
    setForm({ nombre: r.nombre, descripcion: r.descripcion, idProducto: r.idProducto, cantPorLote: r.cantPorLote })
    setEditando(r.idReceta)
    setMostrarForm(true)
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar receta?')) return
    await axios.delete(`${API}/recetas/${id}`, { headers: getHeaders() })
    cargarDatos()
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>📋 Recetas</h1>
          <button style={styles.btnPrimary} onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setForm({ nombre: '', descripcion: '', idProducto: '', cantPorLote: 1 }) }}>
            + Nueva Receta
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={{color:'white', marginTop:0}}>{editando ? 'Editar' : 'Nueva'} Receta</h3>
            <input style={styles.input} placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <input style={styles.input} placeholder="Descripción" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
            <select style={styles.input} value={form.idProducto} onChange={e => setForm({...form, idProducto: e.target.value})}>
              <option value="">Seleccionar producto...</option>
              {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.nombre}</option>)}
            </select>
            <input style={styles.input} placeholder="Cantidad por lote" type="number" value={form.cantPorLote} onChange={e => setForm({...form, cantPorLote: e.target.value})} />
            <div style={{display:'flex', gap:'8px'}}>
              <button style={styles.btnPrimary} onClick={guardar}>Guardar</button>
              <button style={styles.btnSecondary} onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>Nombre</span>
            <span>Descripción</span>
            <span>Cant. por Lote</span>
            <span>Acciones</span>
          </div>
          {recetas.length > 0 ? recetas.map((r, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>{r.nombre}</span>
              <span>{r.descripcion || '-'}</span>
              <span>{r.cantPorLote}</span>
              <span style={{display:'flex', gap:'8px'}}>
                <button style={styles.btnEdit} onClick={() => editar(r)}>✏️</button>
                <button style={styles.btnDelete} onClick={() => eliminar(r.idReceta)}>🗑️</button>
              </span>
            </div>
          )) : (
            <div style={styles.empty}>No hay recetas registradas</div>
          )}
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
  tablaHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 20px', color: '#8b949e', fontSize: '13px', borderBottom: '1px solid #30363d' },
  tablaFila: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 20px', color: '#e6edf3', borderBottom: '1px solid #30363d', fontSize: '14px' },
  empty: { padding: '20px', color: '#8b949e', textAlign: 'center' }
}

export default Recetas
import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'

const API = 'http://localhost:3001/api'
const getHeaders = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Elaboraciones() {
  const [elaboraciones, setElaboraciones] = useState([])
  const [recetas, setRecetas] = useState([])
  const [form, setForm] = useState({ idReceta: '', cantidad: '', obs: '' })
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [resElab, resRec] = await Promise.all([
        axios.get(`${API}/elaboraciones`, { headers: getHeaders() }),
        axios.get(`${API}/recetas`, { headers: getHeaders() })
      ])
      setElaboraciones(resElab.data)
      setRecetas(resRec.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const guardar = async () => {
    try {
      await axios.post(`${API}/elaboraciones`, form, { headers: getHeaders() })
      setForm({ idReceta: '', cantidad: '', obs: '' })
      setMostrarForm(false)
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.title}>👨‍🍳 Elaboraciones</h1>
          <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
            + Nueva Elaboración
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={{color:'white', marginTop:0}}>Nueva Elaboración</h3>
            <select style={styles.input} value={form.idReceta} onChange={e => setForm({...form, idReceta: e.target.value})}>
              <option value="">Seleccionar receta...</option>
              {recetas.map(r => <option key={r.idReceta} value={r.idReceta}>{r.nombre}</option>)}
            </select>
            <input style={styles.input} placeholder="Cantidad" type="number" value={form.cantidad} onChange={e => setForm({...form, cantidad: e.target.value})} />
            <input style={styles.input} placeholder="Observaciones" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
            <div style={{display:'flex', gap:'8px'}}>
              <button style={styles.btnPrimary} onClick={guardar}>Guardar</button>
              <button style={styles.btnSecondary} onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>ID</span>
            <span>Receta</span>
            <span>Cantidad</span>
            <span>Fecha</span>
            <span>Observaciones</span>
          </div>
          {elaboraciones.length > 0 ? elaboraciones.map((e, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>#{e.idElaboracion}</span>
              <span>{e.recetaNombre || '-'}</span>
              <span>{e.cantidad}</span>
              <span>{new Date(e.fecha).toLocaleDateString('es-AR')}</span>
              <span>{e.obs || '-'}</span>
            </div>
          )) : (
            <div style={styles.empty}>No hay elaboraciones registradas</div>
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
  form: { background: '#16213e', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: 'white', marginBottom: '12px', boxSizing: 'border-box' },
  tabla: { background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
  tablaHeader: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr', padding: '12px 20px', color: '#8b949e', fontSize: '13px', borderBottom: '1px solid #30363d' },
  tablaFila: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr', padding: '12px 20px', color: '#e6edf3', borderBottom: '1px solid #30363d', fontSize: '14px' },
  empty: { padding: '20px', color: '#8b949e', textAlign: 'center' }
}

export default Elaboraciones
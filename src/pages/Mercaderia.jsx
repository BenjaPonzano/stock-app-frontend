import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'

const API = 'http://localhost:3001/api'
const getHeaders = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') })

function Mercaderia() {
  const [ingresos, setIngresos] = useState([])
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [form, setForm] = useState({ proveedor: '', factura: '', obs: '', fecha: '', items: [] })
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [resIng, resProd, resIngr] = await Promise.all([
        axios.get(`${API}/ingresos`, { headers: getHeaders() }),
        axios.get(`${API}/productos`),
        axios.get(`${API}/ingredientes`)
      ])
      setIngresos(resIng.data)
      setProductos(resProd.data)
      setIngredientes(resIngr.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const guardar = async () => {
    try {
      await axios.post(`${API}/ingresos`, form, { headers: getHeaders() })
      setForm({ proveedor: '', factura: '', obs: '', fecha: '', items: [] })
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
          <h1 style={styles.title}>🛒 Ingreso de Mercadería</h1>
          <button style={styles.btnPrimary} onClick={() => setMostrarForm(!mostrarForm)}>
            + Nuevo Ingreso
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={{color:'white', marginTop:0}}>Nuevo Ingreso</h3>
            <input style={styles.input} placeholder="Proveedor" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} />
            <input style={styles.input} placeholder="Número de factura" value={form.factura} onChange={e => setForm({...form, factura: e.target.value})} />
            <input style={styles.input} placeholder="Observaciones" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
            <input style={styles.input} type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
            <div style={{display:'flex', gap:'8px'}}>
              <button style={styles.btnPrimary} onClick={guardar}>Guardar</button>
              <button style={styles.btnSecondary} onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={styles.tabla}>
          <div style={styles.tablaHeader}>
            <span>ID</span>
            <span>Proveedor</span>
            <span>Factura</span>
            <span>Fecha</span>
            <span>Observaciones</span>
          </div>
          {ingresos.length > 0 ? ingresos.map((ing, i) => (
            <div key={i} style={styles.tablaFila}>
              <span>#{ing.idIngreso}</span>
              <span>{ing.proveedor}</span>
              <span>{ing.factura || '-'}</span>
              <span>{new Date(ing.fecha).toLocaleDateString('es-AR')}</span>
              <span>{ing.obs || '-'}</span>
            </div>
          )) : (
            <div style={styles.empty}>No hay ingresos registrados</div>
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

export default Mercaderia
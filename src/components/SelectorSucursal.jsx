import React from 'react'
import Icon from './Icon'

const iconoLocal = '<path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/>'

/**
 * Selector de sucursal de la barra superior.
 *
 * Props de entrada:
 *  - sucursales: lista de { id, nombre }
 *  - valor: id de la sucursal seleccionada
 *  - editable: true para el admin (puede elegir), false para el vendedor (solo ve la suya)
 * Props de salida:
 *  - onChange(id): se llama con el id numérico cuando el admin elige otra sucursal
 */
const SelectorSucursal = ({ sucursales, valor, onChange, editable }) => {
  if (!editable) {
    const actual = sucursales.find(s => s.id === valor)
    return (
      <div className="sucursal-badge">
        <Icon d={iconoLocal} /> {actual?.nombre || 'Sin sucursal'}
      </div>
    )
  }

  return (
    <select
      className="sucursal-badge"
      aria-label="Sucursal"
      value={valor || ''}
      onChange={e => onChange(+e.target.value)}
    >
      {sucursales.map(s => <option key={s.id} value={s.id}>🏪 {s.nombre}</option>)}
    </select>
  )
}

export default SelectorSucursal

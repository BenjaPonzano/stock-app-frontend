import React from 'react'

/**
 * Tarjeta de estadística (número grande con una etiqueta arriba).
 *
 * Props de entrada:
 *  - etiqueta: texto chico que describe el número
 *  - valor: número o texto que se muestra grande
 *  - color: color CSS del valor (por defecto el del texto)
 */
const StatCard = ({ etiqueta, valor, color }) => (
  <div className="stat-card">
    <div className="stat-label">{etiqueta}</div>
    <div className="stat-value" style={color ? { color } : undefined}>{valor}</div>
  </div>
)

export default StatCard

import React from 'react'

/**
 * Indicador de carga reutilizable (spinner + mensaje).
 *
 * Props de entrada:
 *  - mensaje: texto que acompaña al spinner (por defecto "Cargando...")
 *  - compacto: si es true ocupa poco alto (para usar dentro de tarjetas o tablas)
 */
const Cargando = ({ mensaje = 'Cargando...', compacto = false }) => (
  <div className={`cargando ${compacto ? 'cargando-compacto' : ''}`} role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    <span>{mensaje}</span>
  </div>
)

export default Cargando

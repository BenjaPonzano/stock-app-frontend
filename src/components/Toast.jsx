import React from 'react'

/**
 * Mensaje emergente.
 *
 * Props de entrada:
 *  - toast: { msg: string, type: 'success' | 'error' } o vacío para no mostrar nada
 */
const Toast = ({ toast }) => {
  if (!toast) return null
  return <div className={`toast ${toast.type} show`}>{toast.msg}</div>
}

export default Toast

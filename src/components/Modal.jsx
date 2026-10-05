import React, { useEffect } from 'react'
import Icon from './Icon'

const iconoCerrar = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'

/**
 * Ventana modal reutilizable.
 *
 * Props de entrada:
 *  - titulo: texto o elementos que se muestran como título
 *  - ancho: ancho máximo opcional (ej. '600px')
 *  - children: contenido del modal
 * Props de salida:
 *  - onCerrar(): se llama al tocar la X o al apretar Escape
 */
const Modal = ({ titulo, ancho, onCerrar, children }) => {
  useEffect(() => {
    const alApretarTecla = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alApretarTecla)
    return () => window.removeEventListener('keydown', alApretarTecla)
  }, [onCerrar])

  return (
    <div className="modal-overlay open" role="dialog" aria-modal="true">
      <div className="modal" style={ancho ? { maxWidth: ancho, width: '95%' } : undefined}>
        <button className="modal-close" aria-label="Cerrar" onClick={onCerrar}><Icon d={iconoCerrar} /></button>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

export default Modal

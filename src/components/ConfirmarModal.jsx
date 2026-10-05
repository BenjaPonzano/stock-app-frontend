import React, { useState } from 'react'
import Modal from './Modal'

/**
 * Ventana de confirmación para acciones que no se pueden deshacer (borrados).
 *
 * Props de entrada:
 *  - titulo: título de la ventana
 *  - mensaje: texto o elementos que explican qué se va a hacer
 *  - textoConfirmar: texto del botón rojo (por defecto "Eliminar")
 * Props de salida:
 *  - onConfirmar(): puede ser async; mientras se resuelve el botón queda deshabilitado
 *  - onCancelar(): se llama con "Cancelar", la X o la tecla Escape
 */
const ConfirmarModal = ({ titulo = 'Confirmar acción', mensaje, textoConfirmar = 'Eliminar', onConfirmar, onCancelar }) => {
  const [procesando, setProcesando] = useState(false)

  const confirmar = async () => {
    setProcesando(true)
    try { await onConfirmar() } finally { setProcesando(false) }
  }

  return (
    <Modal titulo={titulo} ancho="420px" onCerrar={procesando ? () => {} : onCancelar}>
      <p className="confirmar-mensaje">{mensaje}</p>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onCancelar} disabled={procesando}>Cancelar</button>
        <button className="btn btn-danger" onClick={confirmar} disabled={procesando}>
          {procesando ? 'Eliminando...' : textoConfirmar}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmarModal

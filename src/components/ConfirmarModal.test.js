import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConfirmarModal from './ConfirmarModal'

describe('ConfirmarModal', () => {
  test('muestra título y mensaje', () => {
    render(<ConfirmarModal titulo="Eliminar usuario" mensaje="¿Seguro?" onConfirmar={() => {}} onCancelar={() => {}} />)
    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument()
    expect(screen.getByText('¿Seguro?')).toBeInTheDocument()
  })

  test('Cancelar llama a onCancelar y no a onConfirmar', () => {
    const onConfirmar = jest.fn()
    const onCancelar = jest.fn()
    render(<ConfirmarModal mensaje="x" onConfirmar={onConfirmar} onCancelar={onCancelar} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancelar).toHaveBeenCalledTimes(1)
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  test('Escape cancela', () => {
    const onCancelar = jest.fn()
    render(<ConfirmarModal mensaje="x" onConfirmar={() => {}} onCancelar={onCancelar} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  test('mientras confirma deshabilita los botones y evita doble clic', async () => {
    let terminar
    const onConfirmar = jest.fn(() => new Promise(res => { terminar = res }))
    render(<ConfirmarModal mensaje="x" onConfirmar={onConfirmar} onCancelar={() => {}} />)
    fireEvent.click(screen.getByText('Eliminar', { selector: 'button' }))
    const boton = await screen.findByText('Eliminando...')
    expect(boton).toBeDisabled()
    expect(screen.getByText('Cancelar')).toBeDisabled()
    fireEvent.click(boton)
    expect(onConfirmar).toHaveBeenCalledTimes(1)
    terminar()
    await waitFor(() => expect(screen.getByText('Eliminar', { selector: 'button' })).not.toBeDisabled())
  })
})

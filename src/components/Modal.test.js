import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

describe('Modal', () => {
  test('muestra el título y el contenido', () => {
    render(<Modal titulo="Nuevo Usuario" onCerrar={() => {}}><p>Contenido</p></Modal>)
    expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  test('llama a onCerrar al tocar la X', () => {
    const onCerrar = jest.fn()
    render(<Modal titulo="Prueba" onCerrar={onCerrar} />)
    fireEvent.click(screen.getByLabelText('Cerrar'))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('llama a onCerrar al apretar Escape', () => {
    const onCerrar = jest.fn()
    render(<Modal titulo="Prueba" onCerrar={onCerrar} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })
})

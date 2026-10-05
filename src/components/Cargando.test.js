import { render, screen } from '@testing-library/react'
import Cargando from './Cargando'

describe('Cargando', () => {
  test('muestra el mensaje por defecto', () => {
    render(<Cargando />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando...')
  })

  test('muestra el mensaje recibido por props', () => {
    render(<Cargando mensaje="Cargando recetas..." />)
    expect(screen.getByText('Cargando recetas...')).toBeInTheDocument()
  })

  test('la versión compacta agrega su clase', () => {
    render(<Cargando compacto />)
    expect(screen.getByRole('status')).toHaveClass('cargando-compacto')
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import SelectorSucursal from './SelectorSucursal'

const sucursales = [
  { id: 3, nombre: 'Centro' },
  { id: 4, nombre: 'Sur' }
]

describe('SelectorSucursal', () => {
  test('el admin puede elegir y se avisa con el id numérico', () => {
    const onChange = jest.fn()
    render(<SelectorSucursal sucursales={sucursales} valor={3} onChange={onChange} editable />)
    fireEvent.change(screen.getByLabelText('Sucursal'), { target: { value: '4' } })
    expect(onChange).toHaveBeenCalledWith(4)
  })

  test('el vendedor solo ve el nombre de su sucursal', () => {
    render(<SelectorSucursal sucursales={sucursales} valor={4} onChange={() => {}} editable={false} />)
    expect(screen.getByText('Sur')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  test('sin sucursal asignada muestra "Sin sucursal"', () => {
    render(<SelectorSucursal sucursales={[]} valor={null} onChange={() => {}} editable={false} />)
    expect(screen.getByText('Sin sucursal')).toBeInTheDocument()
  })
})

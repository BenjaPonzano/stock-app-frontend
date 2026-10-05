import { aFecha, claveDia } from './fechas'

describe('fechas', () => {
  test('una fecha sin hora se interpreta como día local, sin correrse un día', () => {
    const d = aFecha('2026-09-07')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8) // septiembre
    expect(d.getDate()).toBe(7)
  })

  test('claveDia devuelve YYYY-MM-DD a partir de una fecha sin hora', () => {
    expect(claveDia('2026-09-07')).toBe('2026-09-07')
  })

  test('claveDia usa el día local de un Date', () => {
    expect(claveDia(new Date(2026, 9, 5, 23, 30))).toBe('2026-10-05')
  })

  test('claveDia devuelve vacío si la fecha no es válida', () => {
    expect(claveDia('no es una fecha')).toBe('')
  })
})

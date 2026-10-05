import { compatibles, sonCompatibles, convertir, redondear, formatoCantidad } from './unidades'

describe('unidades', () => {
  test('g y kg son compatibles; g y ml no', () => {
    expect(sonCompatibles('g', 'kg')).toBe(true)
    expect(sonCompatibles('g', 'ml')).toBe(false)
  })

  test('lista las unidades en las que se puede usar un ingrediente', () => {
    expect(compatibles('kg')).toEqual(['g', 'kg'])
    expect(compatibles('l')).toEqual(['ml', 'l'])
    expect(compatibles('u')).toEqual(['u'])
  })

  test('300 g de un ingrediente que se lleva en kg son 0,3 kg', () => {
    expect(convertir(300, 'g', 'kg')).toBe(0.3)
    expect(convertir(2, 'kg', 'g')).toBe(2000)
  })

  test('unidades iguales o faltantes no convierten; incompatibles devuelven null', () => {
    expect(convertir(5, 'kg', 'kg')).toBe(5)
    expect(convertir(5, '', 'kg')).toBe(5)
    expect(convertir(5, 'g', 'ml')).toBeNull()
  })

  test('redondear evita arrastrar errores de coma flotante', () => {
    expect(redondear(10 - 0.3 * 3)).toBe(9.1)
  })

  test('formatoCantidad usa coma decimal', () => {
    expect(formatoCantidad(0.3)).toBe('0,3')
    expect(formatoCantidad(9.7)).toBe('9,7')
  })
})

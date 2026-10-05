import Producto from './Producto'

describe('Producto', () => {
  test('desdeApi crea una instancia con los datos de la API', () => {
    const p = Producto.desdeApi({ id: 4, nombre: 'Pan Blanco', stock: 3, stockMin: 5, origen: 'elaborado' })
    expect(p).toBeInstanceOf(Producto)
    expect(p.nombre).toBe('Pan Blanco')
  })

  test('estadoStock distingue sin stock, bajo y normal', () => {
    expect(new Producto({ stock: 0, stockMin: 2 }).estadoStock).toBe('out')
    expect(new Producto({ stock: 1, stockMin: 2 }).estadoStock).toBe('low')
    expect(new Producto({ stock: 5, stockMin: 2 }).estadoStock).toBe('ok')
  })

  test('un producto se compra hecho salvo que se indique que se elabora', () => {
    expect(new Producto({ nombre: 'Gaseosa' }).seElabora).toBe(false)
    expect(new Producto({ nombre: 'Gaseosa' }).etiquetaOrigen).toBe('Se compra hecho')
    expect(new Producto({ origen: 'elaborado' }).etiquetaOrigen).toBe('Se elabora')
  })
})

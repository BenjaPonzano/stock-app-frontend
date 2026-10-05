/** Ingrediente: materia prima que se consume en las recetas. */
export default class Ingrediente {
  constructor({ id, nombre, descripcion = '', unidad = 'u', stock = 0, stockMin = 0, emoji = '', precio = 0, idSucursal = null } = {}) {
    this.id = id
    this.nombre = nombre
    this.descripcion = descripcion
    this.unidad = unidad
    this.stock = stock
    this.stockMin = stockMin
    this.emoji = emoji
    this.precio = precio
    this.idSucursal = idSucursal
  }

  /** Crea un Ingrediente a partir del JSON que devuelve la API. */
  static desdeApi(json) {
    return new Ingrediente(json)
  }

  /** 'out' sin stock, 'low' por debajo del mínimo, 'ok' en caso contrario. */
  get estadoStock() {
    if (this.stock === 0) return 'out'
    if (this.stock < this.stockMin) return 'low'
    return 'ok'
  }
}

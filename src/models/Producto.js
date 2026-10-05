/**
 * Producto: lo que se vende al cliente.
 * Puede comprarse hecho ('comprado') o prepararse en el local con una receta ('elaborado').
 */
export const ORIGENES = {
  comprado: 'Se compra hecho',
  elaborado: 'Se elabora'
}

export default class Producto {
  constructor({ id, nombre, descripcion = '', unidad = 'u', stock = 0, stockMin = 0, emoji = '', origen = 'comprado', precioVenta = 0, precioCompra = 0, idSucursal = null } = {}) {
    this.id = id
    this.nombre = nombre
    this.descripcion = descripcion
    this.unidad = unidad
    this.stock = stock
    this.stockMin = stockMin
    this.emoji = emoji
    this.origen = origen
    this.precioVenta = precioVenta
    this.precioCompra = precioCompra
    this.idSucursal = idSucursal
  }

  /** Crea un Producto a partir del JSON que devuelve la API. */
  static desdeApi(json) {
    return new Producto(json)
  }

  get seElabora() {
    return this.origen === 'elaborado'
  }

  get etiquetaOrigen() {
    return ORIGENES[this.origen] || ORIGENES.comprado
  }

  /** 'out' sin stock, 'low' por debajo del mínimo, 'ok' en caso contrario. */
  get estadoStock() {
    if (this.stock === 0) return 'out'
    if (this.stock < this.stockMin) return 'low'
    return 'ok'
  }
}

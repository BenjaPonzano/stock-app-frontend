/** Sucursal: cada local de la cadena. El stock, las ventas y los usuarios dependen de una sucursal. */
export default class Sucursal {
  constructor({ id, nombre, direccion = '', telefono = '', encargado = '', activa = true } = {}) {
    this.id = id
    this.nombre = nombre
    this.direccion = direccion
    this.telefono = telefono
    this.encargado = encargado
    this.activa = activa
  }

  static desdeApi(json) {
    return new Sucursal(json)
  }

  get estadoTexto() {
    return this.activa ? 'Operativa' : 'Inactiva'
  }
}

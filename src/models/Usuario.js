/** Usuario del sistema. tipoUsuario define el nivel de acceso: 'admin' o 'vendedor'. */
export default class Usuario {
  constructor({ idUsuario, nombre, apellido, tipoUsuario = 'vendedor', idSucursal = null } = {}) {
    this.idUsuario = idUsuario
    this.nombre = nombre
    this.apellido = apellido
    this.tipoUsuario = tipoUsuario
    this.idSucursal = idSucursal
  }

  static desdeApi(json) {
    return new Usuario(json)
  }

  get esAdmin() {
    return this.tipoUsuario === 'admin'
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`
  }

  get iniciales() {
    return `${this.nombre?.charAt(0) || ''}${this.apellido?.charAt(0) || ''}`.toUpperCase()
  }
}

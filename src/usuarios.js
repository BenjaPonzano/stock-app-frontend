import crypto from 'node:crypto';

export class Usuario {
    constructor(
        name,
        apellido,
        mail,
        tipoUsuario,
        direccion,
        username,
        contraseña,
        telefono,
        id = crypto.randomUUID() // ID generado automáticamente
    ) {
        this.id = id;
        this.name = name;
        this.apellido = apellido;
        this.mail = mail;
        this.tipoUsuario = tipoUsuario;
        this.direccion = direccion;
        this.username = username;
        this.contraseña = contraseña; // en producción usar bcrypt
        this.telefono = telefono;
    }
}

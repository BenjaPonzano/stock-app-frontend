import express from 'express';
import { Usuario } from './usuarios.js';

const app = express();
app.use(express.json());

// Datos iniciales (ejemplo)
const usuarios = [
    new Usuario(
        'Juan',
        'Pérez',
        'juan.perez@example.com',
        'Cliente',
        'Calle Falsa 123',
        'juanperez',
        'securePassword123',
        '+5491122334455',
        '1' // ID explícito para el ejemplo
    )
];

function sanitizeUserInput(req, res, next) {
    console.log("Sanitized input:", req.body);

    req.body.sanitizedInput = {
        name: req.body.name,
        apellido: req.body.apellido,
        mail: req.body.mail,
        direccion: req.body.direccion,
        tipoUsuario: req.body.tipoUsuario,
        username: req.body.username,
        contraseña: req.body.contraseña,
        telefono: req.body.telefono
    };

    if (typeof req.body.name === 'string') {
        req.body.name = req.body.name.trim();
    }

    next();
}

// Rutas

app.get('/api/usuarios', (req, res) => {
    res.json({ data: usuarios });
});

app.get('/api/usuarios/:id', (req, res) => {
    const usuario = usuarios.find(c => c.id === req.params.id);
    if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ data: usuario });
});

app.post('/api/usuarios', sanitizeUserInput, (req, res) => {
    const input = req.body.sanitizedInput;

    const newUsuario = new Usuario(
        input.name,
        input.apellido,
        input.mail,
        input.tipoUsuario,
        input.direccion,
        input.username,
        input.contraseña,
        input.telefono
    );

    usuarios.push(newUsuario);
    res.status(201).json({ message: 'Usuario creado', data: newUsuario });
});

app.put('/api/usuarios/:id', sanitizeUserInput, (req, res) => {
    const usuarioIdx = usuarios.findIndex(c => c.id === req.params.id);

    if (usuarioIdx === -1) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuarios[usuarioIdx] = { ...usuarios[usuarioIdx], ...req.body.sanitizedInput };

    res.status(200).json({ message: 'Usuario actualizado', data: usuarios[usuarioIdx] });
});

app.delete('/api/usuarios/:id', (req, res) => {
    const usuarioIdx = usuarios.findIndex(c => c.id === req.params.id);
    if (usuarioIdx === -1) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuarios.splice(usuarioIdx, 1);
    res.status(200).json({ message: 'Usuario borrado exitosamente' });
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

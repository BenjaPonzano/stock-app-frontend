# stock-app-frontend

Frontend del sistema **StockGastro** (TP de Desarrollo de Software): control de stock para un
local de comida con varias sucursales. Hecho con **React** (Create React App) y **React Router**;
consume la API de [stock-app-backend](https://github.com/BenjaPonzano/stock-app-backend).

## Puesta en marcha

```bash
npm install
npm start
```

Queda en `http://localhost:3000`. **El backend tiene que estar corriendo en
`http://localhost:3001`**; si no, el login y todas las pantallas fallan.

Si el backend está en otra dirección, copiar `.env.example` como `.env` y cambiar
`REACT_APP_API_URL` (hay que reiniciar `npm start` después de cambiarla).
Create React App solo lee variables que empiezan con `REACT_APP_`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga automática. |
| `npm test` | Corre los tests (Jest + React Testing Library). |
| `npm run build` | Genera la versión optimizada para producción en `build/`. |

## Estructura

```
src/
├── pages/        Una pantalla por ruta (Login, Dashboard, Ventas, Recetas, etc.)
├── components/   Piezas reutilizables con props de entrada y de salida
│   ├── Sidebar          Menú lateral (se vuelve un panel deslizable en celular y tablet)
│   ├── SelectorSucursal Entrada: sucursales, valor, editable · Salida: onChange(id)
│   ├── Modal            Entrada: titulo, ancho, children · Salida: onCerrar()
│   ├── StatCard         Entrada: etiqueta, valor, color
│   ├── Toast            Entrada: toast { msg, type }
│   └── Icon             Entrada: d (contenido SVG)
├── models/       Clases que representan los datos: Producto, Ingrediente, Sucursal, Usuario
├── services/     api.js (URL base, llamados y lectura de errores) y auth.js (login/logout)
├── contexts/     SucursalContext: sucursal elegida, compartida por todas las pantallas
└── utils/        fechas.js (fechas en hora local, sin el desfase de UTC)
public/CSS/style.css   Estilos globales
```

## Acceso por rol

El login guarda el token y el rol. `src/App.js` define las rutas y cuáles son solo para admin
(`PrivateRoute adminOnly`); un vendedor que escribe a mano una URL de admin vuelve a `/ventas`.
El backend vuelve a validar el rol en cada pedido, así que ocultar botones es una comodidad
de la interfaz y no la única barrera.

## Diseño responsive

Los estilos se escribieron **mobile-first**: lo que está arriba en `style.css` es la base para
celulares y se amplía con `min-width`.

| Tamaño | Ancho | Qué cambia |
|---|---|---|
| SM (celular) | menos de 768 px | Una sola columna, menú lateral oculto con botón hamburguesa, tablas con scroll horizontal. |
| MD (tablet) | desde 768 px | Formularios en dos columnas, panel principal del dashboard en dos columnas, catálogo en tres. |
| LG (escritorio) | desde 1024 px | Menú lateral fijo, paneles de dos columnas (contenido + ticket / formulario). |

## Tests

```bash
npm test
```

Hay tests unitarios de componentes (`Modal`, `SelectorSucursal`), de los modelos (`Producto`)
y de utilidades (`fechas`).

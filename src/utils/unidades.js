// Unidades de medida y conversión entre unidades de la misma familia
// (misma lógica que el backend: src/utils/unidades.js).
// Peso: g, kg · Volumen: ml, l · Unidades sueltas: u

const FAMILIAS = {
  g:  { base: 'g',  factor: 1 },
  kg: { base: 'g',  factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  l:  { base: 'ml', factor: 1000 },
  u:  { base: 'u',  factor: 1 }
}

export const UNIDADES = Object.keys(FAMILIAS)

export const sonCompatibles = (a, b) =>
  Object.prototype.hasOwnProperty.call(FAMILIAS, a) &&
  Object.prototype.hasOwnProperty.call(FAMILIAS, b) &&
  FAMILIAS[a].base === FAMILIAS[b].base

// Unidades en las que se puede medir algo que se lleva en "unidad" (incluida ella misma).
export const compatibles = (unidad) => UNIDADES.filter(u => sonCompatibles(u, unidad))

// Redondea para evitar errores de coma flotante (0.1 + 0.2).
export const redondear = (n, decimales = 3) => {
  const m = 10 ** decimales
  return Math.round((Number(n) + Number.EPSILON) * m) / m
}

// Convierte una cantidad entre unidades. Si falta alguna unidad no convierte;
// si son incompatibles devuelve null.
export const convertir = (cant, desde, hacia) => {
  if (!desde || !hacia || desde === hacia) return Number(cant)
  if (!sonCompatibles(desde, hacia)) return null
  return redondear(Number(cant) * FAMILIAS[desde].factor / FAMILIAS[hacia].factor, 6)
}

// Número legible en español, con hasta 3 decimales (0,3 · 9,7 · 1.250).
export const formatoCantidad = (n) =>
  Number(n).toLocaleString('es-AR', { maximumFractionDigits: 3 })

// Fechas en hora local del navegador.
// toISOString() devuelve la fecha en UTC y, en Argentina, después de las 21:00
// da el día siguiente; "2026-09-07" sin hora también se interpreta como UTC y
// se muestra un día antes. Estas funciones evitan ambos desfases.

const dos = (n) => String(n).padStart(2, '0')

// Convierte un string de fecha (con o sin hora) o un Date en un Date local.
export const aFecha = (f) =>
  typeof f === 'string' && f.length === 10 ? new Date(f + 'T00:00:00') : new Date(f)

// Devuelve el día local como "YYYY-MM-DD" (sirve para comparar días).
export const claveDia = (f) => {
  const d = f instanceof Date ? f : aFecha(f)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

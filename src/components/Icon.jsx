import React from 'react'

/**
 * Ícono SVG.
 *
 * Props de entrada:
 *  - d: contenido SVG (paths, líneas, etc.) como string
 *  - cualquier otra prop (style, className, onClick...) se pasa al <svg>
 */
const Icon = ({ d, ...props }) => (
  <svg
    className="icn"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: d }}
    {...props}
  />
)

export default Icon

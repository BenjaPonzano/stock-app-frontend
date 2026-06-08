// ─── SUCURSALES ───────────────────────────────────────────
const API = 'http://localhost:3000/api';
let sucursales = [];
let sucursalActual = null;

async function cargarSucursales() {
  try {
    const res = await fetch(`${API}/sucursales`);
    sucursales = await res.json();
    console.log('Sucursales cargadas:', sucursales);

    const guardada = localStorage.getItem('sucursalId');
    sucursalActual = sucursales.find(s => s.idSucursal == guardada) || sucursales[0];
    console.log('Sucursal actual:', sucursalActual);

    actualizarLabel();
  } catch (err) {
    console.error('Error cargando sucursales:', err);
  }
}

function actualizarLabel() {
  const label = document.getElementById('sucursalLabel');
  if (label && sucursalActual) {
    label.textContent = sucursalActual.nombre;
  }
}

function cycleSucursal() {
  // Crear dropdown si no existe
  let dropdown = document.getElementById('sucursalDropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }

  dropdown = document.createElement('div');
  dropdown.id = 'sucursalDropdown';
  dropdown.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    min-width: 180px;
    overflow: hidden;
  `;

  sucursales.forEach(s => {
    const item = document.createElement('div');
    item.textContent = s.nombre;
    item.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      font-size: 0.9rem;
      background: ${sucursalActual?.idSucursal === s.idSucursal ? '#f0f4ff' : 'white'};
      font-weight: ${sucursalActual?.idSucursal === s.idSucursal ? '600' : 'normal'};
    `;
    item.onmouseover = () => item.style.background = '#f5f5f5';
    item.onmouseout = () => item.style.background = sucursalActual?.idSucursal === s.idSucursal ? '#f0f4ff' : 'white';
    item.onclick = () => seleccionarSucursal(s);
    dropdown.appendChild(item);
  });

  // Posicionarlo debajo del botón
  const btn = document.querySelector('.sucursal-badge');
  const rect = btn.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY + 6}px`;
  dropdown.style.left = `${rect.left}px`;

  document.body.appendChild(dropdown);

  // Cerrar al hacer click afuera
  setTimeout(() => {
    document.addEventListener('click', () => dropdown.remove(), { once: true });
  }, 0);
}

function seleccionarSucursal(s) {
  sucursalActual = s;
  localStorage.setItem('sucursalId', s.idSucursal);
  actualizarLabel();

  // Recargar datos de la página actual
  if (typeof cargarDatos === 'function') cargarDatos();

  showToast(`Sucursal: ${s.nombre}`);
}

function getSucursalId() {
  console.log('sucursalActual en getSucursalId:', sucursalActual);
  return sucursalActual?.idSucursal || null;
}

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}


let sucursalesData = [];
let editingId = null;
let currentStatus = true;

async function cargarDatosAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/sucursales');
    sucursalesData = await res.json();
    renderStats();
    renderTable();
  } catch (e) {
    showToast('Error cargando sucursales', 'error');
  }
}

function renderStats() {
  const total = sucursalesData.length;
  const activas = sucursalesData.filter(s => s.activa).length;

  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Sucursales</div><div class="stat-value orange">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Operativas</div><div class="stat-value green">${activas}</div></div>
    <div class="stat-card"><div class="stat-label">Inactivas</div><div class="stat-value muted">${total - activas}</div></div>
  `;
}

function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filtered = sucursalesData.filter(s => s.nombre.toLowerCase().includes(search) || s.direccion.toLowerCase().includes(search));

  const tbody = document.getElementById('tableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No se encontraron sucursales</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td><div class="sucursal-name">${s.nombre}</div><div class="sucursal-address">📍 ${s.direccion}</div></td>
      <td>📞 ${s.telefono || '-'}</td>
      <td>👤 ${s.encargado || '-'}</td>
      <td><span class="badge ${s.activa ? 'badge-active' : 'badge-inactive'}">${s.activa ? 'Operativa' : 'Inactiva'}</span></td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" onclick="openModal(${s.id})">✏️ Editar</button>
          <button class="btn btn-sm" style="background:#fadbd8;color:#c0392b" onclick="deleteSucursal(${s.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setStatus(isActive) {
  currentStatus = isActive;
  document.getElementById('st_activa').classList.toggle('active', isActive);
  document.getElementById('st_inactiva').classList.toggle('active', !isActive);
}

function openModal(id = null) {
  editingId = id;
  const s = id ? sucursalesData.find(i => i.id === id) : null;
  document.getElementById('modalTitle').textContent = id ? 'Editar Sucursal' : 'Nueva Sucursal';
  document.getElementById('f_nombre').value = s?.nombre || '';
  document.getElementById('f_direccion').value = s?.direccion || '';
  document.getElementById('f_telefono').value = s?.telefono || '';
  document.getElementById('f_encargado').value = s?.encargado || '';
  setStatus(s ? s.activa : true);
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

async function saveSucursal() {
  const nombre = document.getElementById('f_nombre').value.trim();
  if (!nombre) return showToast('El nombre es obligatorio', 'error');

  const obj = {
    nombre, direccion: document.getElementById('f_direccion').value.trim(),
    telefono: document.getElementById('f_telefono').value.trim(),
    encargado: document.getElementById('f_encargado').value.trim(),
    activa: currentStatus
  };

  const url = `http://localhost:3000/api/sucursales${editingId ? '/' + editingId : ''}`;
  try {
    await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
    showToast(editingId ? 'Actualizada ✓' : 'Creada ✓', 'success');
    closeModal();
    cargarDatosAPI();
  } catch (e) {
    showToast('Error al guardar', 'error');
  }
}

async function deleteSucursal(id) {
  if (!confirm('¿Eliminar sucursal?')) return;
  try {
    await fetch(`http://localhost:3000/api/sucursales/${id}`, { method: 'DELETE' });
    showToast('Sucursal eliminada', 'error');
    cargarDatosAPI();
  } catch (e) {
    showToast('Error al eliminar', 'error');
  }
}

document.addEventListener('DOMContentLoaded', cargarDatosAPI);

let usuariosData = [];
let editingId = null;
let currentRol = 'vendedor';

function getIniciales(n, a) { return (n.charAt(0) + a.charAt(0)).toUpperCase(); }

async function cargarDatosAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/usuarios');
    usuariosData = await res.json();
    renderStats();
    renderTable();
  } catch (e) {
    showToast('Error cargando usuarios', 'error');
  }
}

function renderStats() {
  const total = usuariosData.length;
  const admins = usuariosData.filter(u => u.tipoUsuario === 'admin').length;

  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Usuarios</div><div class="stat-value" style="color:var(--text)">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Administradores</div><div class="stat-value" style="color:var(--info)">${admins}</div></div>
    <div class="stat-card"><div class="stat-label">Vendedores</div><div class="stat-value" style="color:var(--success)">${total - admins}</div></div>
  `;
}

function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filterRol = document.getElementById('filterRol').value;

  let filtered = usuariosData.filter(u => {
    const matchSearch = (u.nombre + ' ' + u.apellido).toLowerCase().includes(search);
    const matchRol = !filterRol || u.tipoUsuario === filterRol;
    return matchSearch && matchRol;
  });

  const tbody = document.getElementById('tableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">No se encontraron usuarios</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td style="color:var(--muted)">#${u.idUsuario}</td>
      <td>
        <div class="user-name">
          <div class="user-avatar">${getIniciales(u.nombre, u.apellido)}</div>
          ${u.nombre} ${u.apellido}
        </div>
      </td>
      <td><span class="badge ${u.tipoUsuario === 'admin' ? 'badge-admin' : 'badge-vendedor'}">${u.tipoUsuario === 'admin' ? '👑 Admin' : '🛒 Vendedor'}</span></td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" onclick="openModal(${u.idUsuario})">✏️ Editar</button>
          <button class="btn btn-sm" style="background:#fadbd8;color:#c0392b" onclick="deleteUsuario(${u.idUsuario})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setRol(rol) {
  currentRol = rol;
  document.getElementById('rol_admin').classList.toggle('active', rol === 'admin');
  document.getElementById('rol_vendedor').classList.toggle('active', rol === 'vendedor');
}

function openModal(id = null) {
  editingId = id;
  const u = id ? usuariosData.find(user => user.idUsuario === id) : null;
  document.getElementById('modalTitle').textContent = id ? 'Editar Usuario' : 'Nuevo Usuario';
  document.getElementById('f_nombre').value = u?.nombre || '';
  document.getElementById('f_apellido').value = u?.apellido || '';
  document.getElementById('f_password').value = '';
  setRol(u ? u.tipoUsuario : 'vendedor');
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

async function saveUsuario() {
  const nombre = document.getElementById('f_nombre').value.trim();
  const apellido = document.getElementById('f_apellido').value.trim();
  const password = document.getElementById('f_password').value.trim();

  if (!nombre || !apellido) return showToast('Nombre y apellido obligatorios', 'error');
  if (!editingId && !password) return showToast('Debe asignar contraseña', 'error');

  const obj = { nombre, apellido, tipoUsuario: currentRol };
  if (password) obj.password = 'new_hashed_password';

  const url = `http://localhost:3000/api/usuarios${editingId ? '/' + editingId : ''}`;
  try {
    await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
    showToast(editingId ? 'Actualizado ✓' : 'Creado ✓', 'success');
    closeModal();
    cargarDatosAPI();
  } catch (e) {
    showToast('Error al guardar', 'error');
  }
}

async function deleteUsuario(id) {
  if (!confirm('¿Eliminar usuario?')) return;
  try {
    await fetch(`http://localhost:3000/api/usuarios/${id}`, { method: 'DELETE' });
    showToast('Usuario eliminado', 'error');
    cargarDatosAPI();
  } catch (e) {
    showToast('Error al eliminar', 'error');
  }
}

document.addEventListener('DOMContentLoaded', cargarDatosAPI);

const API = 'http://localhost:3000/api';

let recetasData = [];
let productosData = [];
let ingredientesData = [];
let editingId = null;

// ── Carga inicial ──────────────────────────────────────────────
async function cargarDatos() {
  try {
    const [resR, resP, resI] = await Promise.all([
      fetch(`${API}/recetas`),
      fetch(`${API}/productos`),
      fetch(`${API}/ingredientes`)
    ]);
    recetasData    = await resR.json();
    productosData  = await resP.json();
    ingredientesData = await resI.json();

    renderStats();
    renderTable();
  } catch (e) {
    showToast('Error cargando datos', 'error');
  }
}

// ── Stats ──────────────────────────────────────────────────────
function renderStats() {
  const total = recetasData.length;
  const totalIng = recetasData.reduce((s, r) => s + r.ingredientes.length, 0);
  const productos = new Set(recetasData.map(r => r.idProducto)).size;

  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Recetas</div><div class="stat-value orange">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Productos Cubiertos</div><div class="stat-value green">${productos}</div></div>
    <div class="stat-card"><div class="stat-label">Total Ingredientes</div><div class="stat-value" style="color:var(--info)">${totalIng}</div></div>
  `;
}

// ── Tabla ──────────────────────────────────────────────────────
function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filtered = recetasData.filter(r =>
    r.nombre.toLowerCase().includes(search) ||
    (r.productoNombre || '').toLowerCase().includes(search)
  );

  const tbody = document.getElementById('tableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No se encontraron recetas</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><strong>${r.nombre}</strong></td>
      <td style="color:var(--muted)">${r.descripcion || '—'}</td>
      <td><span class="badge badge-cat">${r.productoNombre || '—'}</span></td>
      <td style="text-align:center">${r.cantPorLote} u.</td>
      <td>
        ${r.ingredientes.map(i => `<span class="badge badge-ing" style="margin:2px">🧂 ${i.nombre}</span>`).join('')}
      </td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" onclick="openModal(${r.id})">✏️ Editar</button>
          <button class="btn btn-sm" style="background:#fadbd8;color:#c0392b" onclick="deleteReceta(${r.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Modal ──────────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const r = id ? recetasData.find(x => x.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Editar Receta' : 'Nueva Receta';
  document.getElementById('f_nombre').value   = r?.nombre      || '';
  document.getElementById('f_desc').value     = r?.descripcion || '';
  document.getElementById('f_cantLote').value = r?.cantPorLote || 1;

  // Poblar select de productos
  document.getElementById('f_producto').innerHTML =
    '<option value="">— Seleccioná un producto —</option>' +
    productosData.map(p => `<option value="${p.id}" ${r?.idProducto === p.id ? 'selected' : ''}>${p.nombre}</option>`).join('');

  // Poblar filas de ingredientes
  const ingRows = document.getElementById('ingRows');
  ingRows.innerHTML = '';
  if (r?.ingredientes?.length > 0) {
    r.ingredientes.forEach(i => addIngRow(i.idIngrediente, i.cant, i.unidad));
  } else {
    addIngRow();
  }

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

// ── Filas de ingredientes en el modal ─────────────────────────
function addIngRow(idIng = '', cant = '', unidad = '') {
  const tbody = document.getElementById('ingRows');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:4px">
      <select class="form-control ing-select" onchange="autoUnidad(this)" style="font-size:.85rem">
        <option value="">— Ingrediente —</option>
        ${ingredientesData.map(i => `<option value="${i.id}" data-unidad="${i.unidad}" ${+idIng === i.id ? 'selected' : ''}>${i.nombre}</option>`).join('')}
      </select>
    </td>
    <td style="padding:4px"><input class="form-control ing-cant" type="number" min="0.1" step="0.1" value="${cant}" style="font-size:.85rem"></td>
    <td style="padding:4px"><input class="form-control ing-unidad" value="${unidad}" style="font-size:.85rem" readonly></td>
    <td style="padding:4px"><button class="btn-icon" onclick="this.closest('tr').remove()">✕</button></td>
  `;
  tbody.appendChild(tr);
}

function autoUnidad(select) {
  const unidad = select.options[select.selectedIndex]?.dataset.unidad || '';
  select.closest('tr').querySelector('.ing-unidad').value = unidad;
}

// ── Guardar ────────────────────────────────────────────────────
async function saveReceta() {
  const nombre = document.getElementById('f_nombre').value.trim();
  if (!nombre) return showToast('El nombre es obligatorio', 'error');

  const idProducto = +document.getElementById('f_producto').value;
  if (!idProducto) return showToast('Seleccioná el producto que genera', 'error');

  // Leer ingredientes de las filas
  const filas = document.querySelectorAll('#ingRows tr');
  const ingredientes = [];
  for (const fila of filas) {
    const idIngrediente = +fila.querySelector('.ing-select').value;
    const cant          = +fila.querySelector('.ing-cant').value;
    const unidad        =  fila.querySelector('.ing-unidad').value;
    if (!idIngrediente || !cant) continue;
    ingredientes.push({ idIngrediente, cant, unidad });
  }
  if (ingredientes.length === 0) return showToast('Agregá al menos un ingrediente', 'error');

  const body = {
    nombre,
    descripcion: document.getElementById('f_desc').value.trim(),
    idProducto,
    cantPorLote: +document.getElementById('f_cantLote').value || 1,
    ingredientes
  };

  const url    = editingId ? `${API}/recetas/${editingId}` : `${API}/recetas`;
  const method = editingId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error();
    showToast(editingId ? 'Receta actualizada ✓' : 'Receta creada ✓', 'success');
    closeModal();
    await cargarDatos();
  } catch {
    showToast('Error al guardar', 'error');
  }
}

// ── Eliminar ───────────────────────────────────────────────────
async function deleteReceta(id) {
  if (!confirm('¿Eliminar esta receta?')) return;
  try {
    await fetch(`${API}/recetas/${id}`, { method: 'DELETE' });
    showToast('Receta eliminada', 'error');
    await cargarDatos();
  } catch {
    showToast('Error al eliminar', 'error');
  }
}

document.addEventListener('DOMContentLoaded', cargarDatos);

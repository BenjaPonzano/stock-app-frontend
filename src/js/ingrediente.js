const data = { productos: [], ingredientes: [] };
let currentTab = 'productos';
let editingId = null;

async function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', ['productos', 'ingredientes'][i] === tab));
  await cargarDatosAPI();
}

function getStockStatus(item) {
  if (item.stock === 0) return 'out';
  if (item.stock < item.stockMin) return 'low';
  return 'ok';
}

function statusBadge(item) {
  const s = getStockStatus(item);
  const map = { ok: ['badge-ok', '✓ Normal'], low: ['badge-low', '⚠ Bajo'], out: ['badge-out', '✕ Sin Stock'] };
  return `<span class="badge ${map[s][0]}">${map[s][1]}</span>`;
}

function stockBar(item) {
  const pct = item.stockMin > 0 ? Math.min(100, Math.round(item.stock / (item.stockMin * 2) * 100)) : 100;
  const color = item.stock === 0 ? '#e74c3c' : item.stock < item.stockMin ? '#f39c12' : '#27ae60';
  return `<div class="stock-bar-wrap">
    <span style="min-width:50px">${item.stock} ${item.unidad}</span>
    <div class="stock-bar"><div class="stock-bar-fill" style="width:${pct}%;background:${color}"></div></div>
  </div>`;
}

function renderStats() {
  const items = data[currentTab];
  const ok = items.filter(i => getStockStatus(i) === 'ok').length;
  const low = items.filter(i => getStockStatus(i) === 'low').length;
  const out = items.filter(i => getStockStatus(i) === 'out').length;
  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total ${currentTab}</div><div class="stat-value orange">${items.length}</div></div>
    <div class="stat-card"><div class="stat-label">Stock Normal</div><div class="stat-value green">${ok}</div></div>
    <div class="stat-card"><div class="stat-label">Stock Bajo</div><div class="stat-value" style="color:var(--warning)">${low}</div></div>
    <div class="stat-card"><div class="stat-label">Sin Stock</div><div class="stat-value red">${out}</div></div>
  `;
}

function renderFilterCats() {
  const cats = [...new Set(data[currentTab].map(i => i.categoria))].sort();
  const sel = document.getElementById('filterCat');
  sel.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderTable() {
  const items = data[currentTab];
  const search = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('filterCat').value;
  const st = document.getElementById('filterStock').value;

  let filtered = items.filter(i => {
    return (i.nombre.toLowerCase().includes(search) || i.categoria.toLowerCase().includes(search)) &&
           (!cat || i.categoria === cat) && (!st || getStockStatus(i) === st);
  });

  const isP = currentTab === 'productos';
  document.getElementById('tableHead').innerHTML = `<tr>
    <th>Nombre</th><th>Categoría</th><th>Stock</th><th>Stock Mín.</th>
    ${isP ? '<th>Precio Venta</th><th>Precio Costo</th>' : '<th>Precio</th>'}
    <th>Estado</th><th>Acciones</th>
  </tr>`;

  if (filtered.length === 0) {
    document.getElementById('tableBody').innerHTML = `<tr><td colspan="8"><div class="empty-state">No se encontraron resultados</div></td></tr>`;
    return;
  }

  document.getElementById('tableBody').innerHTML = filtered.map(item => `
    <tr>
      <td><strong>${item.nombre}</strong></td>
      <td><span class="badge badge-cat">${item.categoria}</span></td>
      <td>${stockBar(item)}</td>
      <td style="color:var(--muted)">${item.stockMin} ${item.unidad}</td>
      ${isP ? `<td>$${item.precioVenta.toLocaleString()}</td><td>$${item.precioCompra.toLocaleString()}</td>` : `<td>$${item.precio.toLocaleString()}/${item.unidad}</td>`}
      <td>${statusBadge(item)}</td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" onclick="openModal(${item.id})">✏️</button>
        <button class="btn btn-sm" style="background:#fadbd8;color:#c0392b" onclick="deleteItem(${item.id})">🗑️</button>
      </div></td>
    </tr>
  `).join('');
}

function openModal(id = null) {
  editingId = id;
  const isP = currentTab === 'productos';
  const item = id ? data[currentTab].find(i => i.id === id) : null;
  document.getElementById('modalTitle').textContent = id ? 'Editar' : 'Nuevo';

  const cats = isP ? ['Hamburguesas', 'Pizzas', 'Empanadas', 'Platos', 'Guarniciones', 'Bebidas', 'Otros'] : ['Carnes', 'Lácteos', 'Secos', 'Verduras', 'Enlatados', 'Condimentos', 'Otros'];

  document.getElementById('modalFields').innerHTML = `
    <div class="form-group"><label>Nombre</label><input class="form-control" id="f_nombre" value="${item?.nombre || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Categoría</label><select class="form-control" id="f_cat">${cats.map(c => `<option ${item?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Unidad</label><select class="form-control" id="f_unidad">${['u', 'g', 'kg', 'ml', 'l'].map(u => `<option ${item?.unidad === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Stock actual</label><input class="form-control" id="f_stock" type="number" value="${item?.stock || 0}"></div>
      <div class="form-group"><label>Stock mínimo</label><input class="form-control" id="f_stockMin" type="number" value="${item?.stockMin || 0}"></div>
    </div>
    ${isP ? `<div class="form-row"><div class="form-group"><label>Precio Venta</label><input class="form-control" id="f_precioVenta" type="number" value="${item?.precioVenta || 0}"></div><div class="form-group"><label>Precio Costo</label><input class="form-control" id="f_precioCompra" type="number" value="${item?.precioCompra || 0}"></div></div>` : `<div class="form-group"><label>Precio</label><input class="form-control" id="f_precio" type="number" value="${item?.precio || 0}"></div>`}
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

async function saveItem() {
  const nombre = document.getElementById('f_nombre').value.trim();
  if (!nombre) return showToast('Nombre obligatorio', 'error');

  const isP = currentTab === 'productos';
  const obj = {
  nombre, categoria: document.getElementById('f_cat').value, unidad: document.getElementById('f_unidad').value,
  stock: +document.getElementById('f_stock').value, stockMin: +document.getElementById('f_stockMin').value,
  idSucursal: getSucursalId(),  // ← agregá esta línea
  ...(isP ? { precioVenta: +document.getElementById('f_precioVenta').value, precioCompra: +document.getElementById('f_precioCompra').value } : { precio: +document.getElementById('f_precio').value })
};

  const url = `http://localhost:3000/api/${currentTab}${editingId ? '/' + editingId : ''}`;
  await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });

  showToast('Guardado con éxito ✓', 'success');
  closeModal();
  await cargarDatosAPI();
}

async function deleteItem(id) {
  if (!confirm('¿Eliminar?')) return;
  await fetch(`http://localhost:3000/api/${currentTab}/${id}`, { method: 'DELETE' });
  showToast('Eliminado', 'error');
  await cargarDatosAPI();
}

async function cargarDatosAPI() {
  const idSucursal = getSucursalId();
  console.log('idSucursal:', idSucursal);  // ← agregá esta línea
  const url = `http://localhost:3000/api/${currentTab}${idSucursal ? '?sucursal=' + idSucursal : ''}`;
  console.log('Fetching:', url);
  const res = await fetch(url);
  data[currentTab] = await res.json();
  renderStats(); renderFilterCats(); renderTable();
}

async function cargarDatos() {
  await cargarDatosAPI();
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarSucursales();
  await cargarDatosAPI();
});
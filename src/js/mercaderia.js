let catalogoIngredientes = [];
let catalogoProductos = [];
let historialCompras = [];
let compraItems = [];

document.getElementById('f_fecha').value = new Date().toISOString().split('T')[0];

async function cargarDatosAPI() {
  try {
    const resIng = await fetch('http://localhost:3000/api/ingredientes');
    catalogoIngredientes = await resIng.json();

    const resProd = await fetch('http://localhost:3000/api/productos');
    catalogoProductos = await resProd.json();

    const resCompras = await fetch('http://localhost:3000/api/compras');
    historialCompras = await resCompras.json();

    renderItemSelect();
    renderStats();
    renderHistory();
  } catch (error) {
    console.error("Error conectando a la API:", error);
    showToast('Error de conexión', 'error');
  }
}

function renderItemSelect() {
  const tipo = document.getElementById('f_tipo').value;
  const catalogo = tipo === 'ingrediente' ? catalogoIngredientes : catalogoProductos;

  const select = document.getElementById('f_item');
  if (catalogo.length === 0) {
    select.innerHTML = `<option value="">No hay ${tipo}s cargados</option>`;
  } else {
    select.innerHTML = catalogo.map(i => `<option value="${i.id}">${i.nombre} (${i.unidad})</option>`).join('');
  }
}

function addItem() {
  const tipo = document.getElementById('f_tipo').value;
  const catalogo = tipo === 'ingrediente' ? catalogoIngredientes : catalogoProductos;
  const itemId = +document.getElementById('f_item').value;

  if (!itemId) return showToast(`No seleccionaste ningún ${tipo}`, 'error');

  const item = catalogo.find(i => i.id === itemId);
  const cant = +document.getElementById('f_cant').value;
  const precio = +document.getElementById('f_precio').value;

  if (!cant || cant <= 0) return showToast('Cantidad inválida', 'error');
  if (!precio || precio <= 0) return showToast('Precio inválido', 'error');

  const existing = compraItems.findIndex(i => i.id === itemId && i.tipo === tipo);
  if (existing >= 0) {
    compraItems[existing].cant += cant;
    compraItems[existing].subtotal = compraItems[existing].cant * compraItems[existing].precio;
  } else {
    compraItems.push({ id: itemId, nombre: item.nombre, tipo, cant, unidad: item.unidad, precio, subtotal: cant * precio });
  }

  document.getElementById('f_cant').value = 1;
  document.getElementById('f_precio').value = '';
  renderCompraItems();
}

function removeItem(idx) {
  compraItems.splice(idx, 1);
  renderCompraItems();
}

function renderCompraItems() {
  const body = document.getElementById('itemsBody');
  if (compraItems.length === 0) {
    body.innerHTML = '<tr><td colspan="6"><div class="empty-items">Agregá ítems a la compra</div></td></tr>';
    document.getElementById('totalLabel').textContent = '$0';
    return;
  }

  body.innerHTML = compraItems.map((it, i) => `
    <tr>
      <td><strong>${it.nombre}</strong></td>
      <td><span class="badge ${it.tipo === 'ingrediente' ? 'badge-ing' : 'badge-prod'}">${it.tipo === 'ingrediente' ? 'Ingred.' : 'Prod.'}</span></td>
      <td>${it.cant} ${it.unidad}</td>
      <td>$${it.precio.toLocaleString()}</td>
      <td>$${it.subtotal.toLocaleString()}</td>
      <td><button class="btn-icon" onclick="removeItem(${i})">✕</button></td>
    </tr>`).join('');

  const total = compraItems.reduce((s, i) => s + i.subtotal, 0);
  document.getElementById('totalLabel').textContent = '$' + total.toLocaleString();
}

async function registrarCompra() {
  const proveedor = document.getElementById('f_proveedor').value.trim();
  const fecha = document.getElementById('f_fecha').value;

  if (!proveedor) return showToast('Ingresá el proveedor', 'error');
  if (!fecha) return showToast('Seleccioná la fecha', 'error');
  if (compraItems.length === 0) return showToast('Agregá ítems', 'error');

  const payload = {
    fecha,
    proveedor,
    factura: document.getElementById('f_factura').value.trim() || '—',
    obs: document.getElementById('f_obs').value.trim(),
    sucursal: sucursales[sucIdx],
    items: [...compraItems]
  };

  try {
    const res = await fetch('http://localhost:3000/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Ingreso registrado ✓', 'success');
      compraItems = [];
      document.getElementById('f_proveedor').value = '';
      document.getElementById('f_factura').value = '';
      document.getElementById('f_obs').value = '';
      renderCompraItems();
      await cargarDatosAPI();
    }
  } catch (error) {
    showToast('Error al registrar compra', 'error');
  }
}

function renderStats() {
  const totalCompras = historialCompras.length;
  const montoTotal = historialCompras.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.subtotal, 0), 0);
  const provsUnicos = new Set(historialCompras.map(c => c.proveedor)).size;

  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Compras</div><div class="stat-value" style="color:var(--primary)">${totalCompras}</div></div>
    <div class="stat-card"><div class="stat-label">Monto Total Invertido</div><div class="stat-value" style="color:var(--info);font-size:1.2rem">$${montoTotal.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-label">Proveedores</div><div class="stat-value" style="color:var(--secondary)">${provsUnicos}</div></div>
  `;
}

function renderHistory() {
  const search = document.getElementById('histSearch').value.toLowerCase();

  const filtered = historialCompras.filter(c =>
    c.proveedor.toLowerCase().includes(search) || c.id.toLowerCase().includes(search)
  );

  const list = document.getElementById('historyList');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-hist">Sin resultados</div>';
    return;
  }

  list.innerHTML = filtered.map(c => {
    const total = c.items.reduce((s, i) => s + i.subtotal, 0);
    const pills = c.items.slice(0, 3).map(i => `<span class="pill">${i.nombre}</span>`).join('');
    return `
    <div class="compra-card" onclick="openModal('${c.id}')">
      <div class="compra-top">
        <div>
          <div class="compra-id">${c.id} — ${c.proveedor}</div>
          <div class="compra-meta"><span>📅 ${c.fecha}</span><span>🏪 ${c.sucursal}</span></div>
        </div>
        <div class="compra-total">$${total.toLocaleString()}</div>
      </div>
      <div class="compra-items-preview">${pills} ${c.items.length > 3 ? `<span class="pill">+${c.items.length - 3}</span>` : ''}</div>
    </div>`;
  }).join('');
}

function openModal(id) {
  const c = historialCompras.find(h => h.id === id);
  if (!c) return;

  const total = c.items.reduce((s, i) => s + i.subtotal, 0);
  document.getElementById('modalTitle').textContent = `${c.id} — ${c.proveedor}`;
  document.getElementById('modalMeta').innerHTML = `📅 ${c.fecha} &nbsp;·&nbsp; 🏪 ${c.sucursal} &nbsp;·&nbsp; 📄 ${c.factura}`;

  document.getElementById('modalBody').innerHTML = c.items.map(i => `
    <tr>
      <td>${i.nombre}</td>
      <td><span class="badge ${i.tipo === 'ingrediente' ? 'badge-ing' : 'badge-prod'}">${i.tipo}</span></td>
      <td>${i.cant} ${i.unidad}</td>
      <td>$${i.precio.toLocaleString()}</td>
      <td>$${i.subtotal.toLocaleString()}</td>
    </tr>`).join('');

  document.getElementById('modalTotal').textContent = '$' + total.toLocaleString();
  document.getElementById('modalObs').textContent = c.obs ? `📝 ${c.obs}` : '';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.addEventListener("DOMContentLoaded", cargarDatosAPI);

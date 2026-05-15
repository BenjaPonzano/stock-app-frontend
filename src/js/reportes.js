let apiProductos = [];
let apiIngredientes = [];
let apiCompras = [];
let apiElaboraciones = [];
let apiVentas = [];

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function formatFecha(f) {
  if (!f) return '';
  const d = new Date(f);
  if (isNaN(d.getTime())) return f;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFechaHora(f) {
  if (!f) return '';
  const d = new Date(f);
  if (isNaN(d.getTime())) return f;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

async function cargarDatosAPI() {
  try {
    const [resP, resI, resC, resE, resV] = await Promise.all([
      fetch('http://localhost:3000/api/productos'),
      fetch('http://localhost:3000/api/ingredientes'),
      fetch('http://localhost:3000/api/compras'),
      fetch('http://localhost:3000/api/elaboraciones'),
      fetch('http://localhost:3000/api/ventas')
    ]);

    apiProductos = await resP.json();
    apiIngredientes = await resI.json();
    apiCompras = await resC.json();
    apiElaboraciones = await resE.json();
    apiVentas = await resV.json();

    renderRepProductos();
    renderRepIngresos();
    renderRepVentas();
    renderRepElaboraciones();

    showToast('Datos actualizados correctamente', 'success');
  } catch (error) {
    console.error("Error al cargar la API:", error);
    showToast('Error al conectar con el servidor', 'error');
  }
}

function renderRepProductos() {
  const q = document.getElementById('r1-search').value.toLowerCase();
  const tipo = document.getElementById('r1-tipo').value;

  let combined = [];
  if (tipo === 'todos' || tipo === 'producto') {
    combined = combined.concat(apiProductos.map(p => ({ ...p, tipoItem: 'producto' })));
  }
  if (tipo === 'todos' || tipo === 'ingrediente') {
    combined = combined.concat(apiIngredientes.map(i => ({ ...i, tipoItem: 'ingrediente' })));
  }

  let filtered = combined.filter(item =>
    item.nombre.toLowerCase().includes(q) ||
    item.categoria.toLowerCase().includes(q)
  );

  const tbody = document.getElementById('tb-productos');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">📦</div>No hay stock que coincida</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const esIng = item.tipoItem === 'ingrediente';
    const precio = esIng ? item.precio : item.precioVenta;
    const badgeClass = item.stock <= 0 ? 'badge-danger' : (item.stock < item.stockMin ? 'badge-warning' : 'badge-success');

    return `
      <tr>
        <td><span class="badge ${esIng ? 'badge-warning' : 'badge-primary'}">${item.tipoItem.toUpperCase()}</span></td>
        <td><strong>${item.nombre}</strong></td>
        <td style="color:var(--muted)">${item.categoria}</td>
        <td><span class="badge ${badgeClass}">${item.stock} ${item.unidad}</span></td>
        <td><strong>$${precio.toLocaleString()}</strong></td>
      </tr>
    `;
  }).join('');
}

function renderRepIngresos() {
  const q = document.getElementById('r2-search').value.toLowerCase();
  const fechaFiltro = document.getElementById('r2-fecha').value;

  let ingresosFlat = [];
  apiCompras.forEach(compra => {
    compra.items.forEach(item => {
      ingresosFlat.push({
        fecha: compra.fecha,
        proveedor: compra.proveedor,
        factura: compra.factura,
        itemNombre: item.nombre,
        cant: item.cant,
        unidad: item.unidad,
        subtotal: item.subtotal
      });
    });
  });

  let filtered = ingresosFlat.filter(i => {
    const matchStr = i.proveedor.toLowerCase().includes(q) || i.itemNombre.toLowerCase().includes(q);
    const matchDate = !fechaFiltro || i.fecha.startsWith(fechaFiltro);
    return matchStr && matchDate;
  });

  filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const tbody = document.getElementById('tb-ingresos');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">🛒</div>No hay ingresos registrados</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(i => `
    <tr>
      <td>${formatFecha(i.fecha)}</td>
      <td style="color:var(--muted)">${i.factura || '-'}</td>
      <td><strong>${i.proveedor}</strong></td>
      <td>${i.itemNombre}</td>
      <td><span class="badge badge-success">+${i.cant} ${i.unidad}</span></td>
      <td><strong>$${i.subtotal.toLocaleString()}</strong></td>
    </tr>
  `).join('');
}

function renderRepVentas() {
  const q = document.getElementById('r3-search').value.toLowerCase();
  const pagoFiltro = document.getElementById('r3-pago').value;
  const fechaFiltro = document.getElementById('r3-fecha').value;

  let filtered = apiVentas.filter(v => {
    const matchSearch = v.id.toLowerCase().includes(q) || v.cajero.toLowerCase().includes(q);
    const matchPago = !pagoFiltro || v.pago === pagoFiltro;
    const matchDate = !fechaFiltro || v.fecha.startsWith(fechaFiltro);
    return matchSearch && matchPago && matchDate;
  });

  filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const tbody = document.getElementById('tb-ventas');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">💰</div>No hay ventas registradas para este filtro</div></td></tr>`;
    return;
  }

  const pagoLabels = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', mp: 'MercadoPago' };
  const pagoBadges = { efectivo: 'badge-success', tarjeta: 'badge-primary', mp: 'badge-mp' };

  tbody.innerHTML = filtered.map(v => `
    <tr>
      <td style="font-weight:700; color:var(--primary)">${v.id}</td>
      <td>${formatFechaHora(v.fecha)}</td>
      <td>🏪 ${v.sucursal}</td>
      <td><span class="badge ${pagoBadges[v.pago] || 'badge-primary'}">${pagoLabels[v.pago] || v.pago}</span></td>
      <td>${v.descuento > 0 ? v.descuento + '%' : '-'}</td>
      <td><strong style="color:var(--text)">$${v.total.toLocaleString()}</strong></td>
      <td style="color:var(--muted)">👤 ${v.cajero}</td>
    </tr>
  `).join('');
}

function renderRepElaboraciones() {
  const sucFiltro = document.getElementById('r4-sucursal').value;
  const fechaFiltro = document.getElementById('r4-fecha').value;

  let filtered = apiElaboraciones.filter(e => {
    const matchSuc = !sucFiltro || e.sucursal === sucFiltro;
    const matchDate = !fechaFiltro || e.fecha.startsWith(fechaFiltro);
    return matchSuc && matchDate;
  });

  filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const tbody = document.getElementById('tb-elab');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">👨‍🍳</div>No hay elaboraciones para este filtro</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td style="font-weight:700; color:var(--primary)">${e.id}</td>
      <td>${formatFechaHora(e.fecha)}</td>
      <td>🏪 ${e.sucursal}</td>
      <td><strong>${e.productoGenerado.nombre}</strong></td>
      <td><span class="badge badge-success">+${e.productoGenerado.cantidad} ${e.productoGenerado.unidad}</span></td>
    </tr>
  `).join('');
}

document.addEventListener("DOMContentLoaded", cargarDatosAPI);

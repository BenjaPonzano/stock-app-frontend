const pagoLabels = { ef: 'Efectivo', mp: 'Mercado Pago', td: 'Tarjeta Déb.', tc: 'Tarjeta Cré.' };
const pagoEmojis = { ef: '💵', mp: '📱', td: '💳', tc: '💳' };

let catalogoProductos = [];
let carrito = [];
let pagoSeleccionado = 'ef';
let catActiva = 'Todos';
let historial = [];

// ── Carga inicial ──────────────────────────────────────────────
async function cargarDatos() {
  await Promise.all([cargarProductos(), cargarHistorial()]);
}

async function cargarProductos() {
  try {
    const idSucursal = getSucursalId();
    const url = `${API}/productos${idSucursal ? '?sucursal=' + idSucursal : ''}`;
    const res = await fetch(url);
    catalogoProductos = await res.json();
    renderCatChips();
    renderCatalogo();
  } catch (e) {
    showToast('Error cargando productos', 'error');
  }
}

async function cargarHistorial() {
  try {
    const idSucursal = getSucursalId();
    const url = `${API}/ventas${idSucursal ? '?sucursal=' + idSucursal : ''}`;
    const res = await fetch(url);
    const ventas = await res.json();
    historial = ventas.map(v => ({
      id:        'V-' + String(v.idCompra).padStart(4, '0'),
      idCompra:  v.idCompra,
      fecha:     v.fecha,
      sucursal: sucursalActual?.nombre || '',
      pago:      v.tipoPago,
      descuento: v.descuento,
      total:     v.total,
      items:     (v.items || []).map(i => ({
        id:     i.idProducto,
        nombre: i.nombre || '',
        emoji:  i.emoji  || '🍽️',
        cant:   i.cant,
        precio: i.precioUnitario,
        sub:    i.cant * i.precioUnitario
      }))
    }));
    renderStats();
    renderHistory();
  } catch (e) {
    showToast('Error cargando historial', 'error');
  }
}

// ── Catálogo ───────────────────────────────────────────────────
function getCats() { return ['Todos', ...new Set(catalogoProductos.map(p => p.categoria))]; }

function renderCatChips() {
  document.getElementById('catChips').innerHTML = getCats().map(c =>
    `<div class="cat-chip ${c === catActiva ? 'active' : ''}" onclick="setCategoria('${c}')">${c}</div>`
  ).join('');
}

function setCategoria(c) { catActiva = c; renderCatChips(); renderCatalogo(); }

function renderCatalogo() {
  const search = document.getElementById('prodSearch').value.toLowerCase();
  const prods = catalogoProductos.filter(p => {
    const matchCat = catActiva === 'Todos' || p.categoria === catActiva;
    const matchSearch = !search || p.nombre.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  document.getElementById('catalogoGrid').innerHTML = prods.map(p => {
    const ss = p.stock === 0 ? 'sin-stock' : '';
    const sb = p.stock === 0 ? 'stock-out' : p.stock < 5 ? 'stock-low' : 'stock-ok';
    const sl = p.stock === 0 ? 'Sin stock' : p.stock < 5 ? `⚠ ${p.stock} u.` : `${p.stock} u.`;
    return `<div class="prod-card ${ss}" onclick="${p.stock > 0 ? `addToCart(${p.id})` : ''}">
      <span class="prod-stock-badge ${sb}">${sl}</span>
      <div class="prod-emoji">${p.emoji || '🍽️'}</div>
      <div class="prod-nombre">${p.nombre}</div>
      <div class="prod-precio">$${p.precioVenta.toLocaleString()}</div>
    </div>`;
  }).join('');
}

// ── Carrito ────────────────────────────────────────────────────
function addToCart(id) {
  const prod = catalogoProductos.find(p => p.id === id);
  const ex = carrito.find(i => i.id === id);
  if (ex) {
    if (ex.cant >= prod.stock) { showToast('No hay más stock disponible', 'error'); return; }
    ex.cant++; ex.sub = ex.cant * ex.precio;
  } else {
    carrito.push({ id, nombre: prod.nombre, emoji: prod.emoji || '🍽️', cant: 1, precio: prod.precioVenta, sub: prod.precioVenta });
  }
  renderCarrito(); updateTotal();
}

function cambiarCant(id, delta) {
  const idx = carrito.findIndex(i => i.id === id);
  if (idx < 0) return;
  carrito[idx].cant += delta;
  if (carrito[idx].cant <= 0) { carrito.splice(idx, 1); }
  else { carrito[idx].sub = carrito[idx].cant * carrito[idx].precio; }
  renderCarrito(); updateTotal();
}

function limpiarCarrito() { carrito = []; renderCarrito(); updateTotal(); document.getElementById('ticketBox').classList.remove('show'); }

function renderCarrito() {
  const body = document.getElementById('cartBody');
  if (carrito.length === 0) { body.innerHTML = '<tr><td colspan="5"><div class="empty-cart">Agregá productos desde el catálogo</div></td></tr>'; return; }
  body.innerHTML = carrito.map(i => `<tr>
    <td>${i.emoji} ${i.nombre}</td>
    <td><div class="qty-ctrl">
      <button class="qty-btn" onclick="cambiarCant(${i.id},-1)">−</button>
      <span class="qty-val">${i.cant}</span>
      <button class="qty-btn" onclick="cambiarCant(${i.id},1)">+</button>
    </div></td>
    <td>$${i.precio.toLocaleString()}</td>
    <td>$${i.sub.toLocaleString()}</td>
    <td><button class="btn-icon" onclick="cambiarCant(${i.id},-999)">✕</button></td>
  </tr>`).join('');
}

function updateTotal() {
  const sub = carrito.reduce((s, i) => s + i.sub, 0);
  const desc = Math.min(100, Math.max(0, +document.getElementById('descuento').value || 0));
  const descMonto = Math.round(sub * desc / 100);
  const total = sub - descMonto;
  document.getElementById('totalLabel').textContent = '$' + total.toLocaleString();
  document.getElementById('descuentoMonto').textContent = descMonto > 0 ? `− $${descMonto.toLocaleString()}` : '';
  calcVuelto();
}

// ── Pago ───────────────────────────────────────────────────────
function selectPago(p) {
  pagoSeleccionado = p;
  ['ef', 'mp', 'td', 'tc'].forEach(k => document.getElementById('p_' + k).classList.toggle('selected', k === p));
  document.getElementById('vueltoRow').style.display = p === 'ef' ? 'flex' : 'none';
  document.getElementById('vueltoLabel').textContent = '';
}

function calcVuelto() {
  const totalStr = document.getElementById('totalLabel').textContent.replace(/[$,.]/g, '');
  const total = +totalStr;
  const con = +document.getElementById('f_conCuanto').value || 0;
  const vuelto = con - total;
  document.getElementById('vueltoLabel').textContent = con > 0 ? (vuelto >= 0 ? `Vuelto: $${vuelto.toLocaleString()}` : '⚠ Monto insuficiente') : '';
}

// ── Registrar venta ────────────────────────────────────────────
async function registrarVenta(forzada = false) {
  if (carrito.length === 0) { showToast('El carrito está vacío', 'error'); return; }

  const sub = carrito.reduce((s, i) => s + i.sub, 0);
  const desc = Math.min(100, Math.max(0, +document.getElementById('descuento').value || 0));
  const total = Math.round(sub * (1 - desc / 100));

  const body = {
    tipoPago:   pagoSeleccionado,
    descuento:  desc,
    total,
    forzada,
    idSucursal: getSucursalId(),
    items: carrito.map(i => ({
      idProducto:     i.id,
      cant:           i.cant,
      precioUnitario: i.precio
    }))
  };

  try {
    const res = await fetch(`${API}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Stock insuficiente → mostrar advertencia
    if (res.status === 409) {
      const data = await res.json();
      const productos = data.productos.join(', ');
      if (confirm(`⚠️ Stock insuficiente para:\n${productos}\n\n¿El vendedor confirma que el producto está disponible?`)) {
        await registrarVenta(true); // Forzar la venta
      }
      return;
    }

    if (!res.ok) throw new Error('Error al registrar');

    const venta = await res.json();
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const fecha = now.toISOString().slice(0, 16);
    const newId = 'V-' + String(venta.idCompra).padStart(4, '0');

    mostrarTicket(newId, fecha, total, desc, sub);

    // Actualizar stock local en el catálogo
    carrito.forEach(ci => {
      const p = catalogoProductos.find(p => p.id === ci.id);
      if (p) p.stock = Math.max(0, p.stock - ci.cant);
    });

    carrito = [];
    document.getElementById('descuento').value = 0;
    document.getElementById('f_conCuanto').value = '';
    document.getElementById('vueltoLabel').textContent = '';
    document.getElementById('descuentoMonto').textContent = '';

    renderCarrito(); updateTotal(); renderCatalogo();
    await cargarHistorial();
    showToast(`Venta ${newId} registrada ✓`, 'success');
  } catch (e) {
    showToast('Error al registrar la venta', 'error');
  }
}

// ── Ticket ─────────────────────────────────────────────────────
function mostrarTicket(id, fecha, total, desc, sub) {
  const d = new Date(fecha);
  const lines = carrito.map(i => `${i.emoji} ${i.nombre} x${i.cant} .......... $${i.sub.toLocaleString()}`).join('\n');
  const tb = document.getElementById('ticketBox');
  tb.innerHTML = `<div style="text-align:center;font-weight:700;margin-bottom:4px">🍽️ StockGastro — ${sucursalActual?.nombre || ''}</div>
<div style="text-align:center;color:var(--muted);margin-bottom:8px;font-size:.78rem">${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · ${id}</div>
<pre style="font-size:.78rem;font-family:monospace;white-space:pre-wrap">${lines}</pre>
<hr style="border:none;border-top:1px dashed var(--border);margin:8px 0">
${desc > 0 ? `<div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>$${sub.toLocaleString()}</span></div><div style="display:flex;justify-content:space-between;color:var(--danger)"><span>Descuento ${desc}%</span><span>− $${(sub - total).toLocaleString()}</span></div>` : ''}
<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;color:var(--primary)"><span>TOTAL</span><span>$${total.toLocaleString()}</span></div>
<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:.8rem;color:var(--muted)"><span>Pago</span><span>${pagoEmojis[pagoSeleccionado]} ${pagoLabels[pagoSeleccionado]}</span></div>
<div style="text-align:center;margin-top:8px;font-size:.75rem;color:var(--muted)">¡Gracias por su visita!</div>`;
  tb.classList.add('show');
}

// ── Stats e Historial ──────────────────────────────────────────
function renderStats() {
  const hoy = new Date().toISOString().slice(0, 10);
  const ventasHoy = historial.filter(v => v.fecha && v.fecha.startsWith(hoy));
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const totalGeneral = historial.reduce((s, v) => s + v.total, 0);
  const ticket = historial.length > 0 ? Math.round(totalGeneral / historial.length) : 0;
  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Ventas Hoy</div><div class="stat-value" style="color:var(--primary)">${ventasHoy.length}</div></div>
    <div class="stat-card"><div class="stat-label">Recaudado Hoy</div><div class="stat-value" style="color:var(--success);font-size:1.2rem">$${totalHoy.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-label">Total Histórico</div><div class="stat-value" style="color:var(--info);font-size:1.2rem">$${totalGeneral.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-label">Ticket Promedio</div><div class="stat-value" style="color:var(--secondary);font-size:1.2rem">$${ticket.toLocaleString()}</div></div>`;
}

function renderHistory() {
  const search = document.getElementById('histSearch').value.toLowerCase();
  const pago = document.getElementById('histPago').value;
  const mes = document.getElementById('histMes').value;
  const filtered = historial.filter(v => {
    const matchS = !search || v.id.toLowerCase().includes(search) || v.items.some(i => i.nombre.toLowerCase().includes(search));
    const matchP = !pago || v.pago === pago;
    const matchM = !mes || (v.fecha && v.fecha.startsWith(mes));
    return matchS && matchP && matchM;
  });
  const list = document.getElementById('historyList');
  if (filtered.length === 0) { list.innerHTML = '<div class="empty-hist"><div class="icon">🧾</div>Sin ventas registradas</div>'; return; }
  list.innerHTML = filtered.map(v => `
    <div class="venta-card" onclick="openModal('${v.id}')">
      <div class="venta-top">
        <div>
          <div class="venta-id">${v.id}</div>
          <div class="venta-meta">
            <span>📅 ${formatFecha(v.fecha)}</span>
            <span>🏪 ${v.sucursal}</span>
            <span>${pagoEmojis[v.pago] || ''} ${pagoLabels[v.pago] || v.pago}</span>
            ${v.descuento > 0 ? `<span style="color:var(--danger)">−${v.descuento}%</span>` : ''}
          </div>
        </div>
        <div class="venta-total">$${v.total.toLocaleString()}</div>
      </div>
      <div class="venta-pills">${v.items.slice(0, 3).map(i => `<span class="pill">${i.emoji} ${i.nombre} x${i.cant}</span>`).join('')}${v.items.length > 3 ? `<span class="pill">+${v.items.length - 3} más</span>` : ''}</div>
    </div>`).join('');
}

function formatFecha(f) {
  if (!f) return '';
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function openModal(id) {
  const v = historial.find(h => h.id === id); if (!v) return;
  document.getElementById('modalTitle').textContent = `🧾 ${v.id}`;
  document.getElementById('modalMeta').innerHTML = `📅 ${formatFecha(v.fecha)} &nbsp;·&nbsp; 🏪 ${v.sucursal} &nbsp;·&nbsp; ${pagoEmojis[v.pago] || ''} ${pagoLabels[v.pago] || v.pago}`;
  document.getElementById('modalBody').innerHTML = v.items.map(i => `<tr><td>${i.emoji} ${i.nombre}</td><td>${i.cant}</td><td>$${i.precio.toLocaleString()}</td><td>$${i.sub.toLocaleString()}</td></tr>`).join('');
  const sub = v.items.reduce((s, i) => s + i.sub, 0);
  document.getElementById('modalDescuento').textContent = v.descuento > 0 ? `${v.descuento}% (− $${(sub - v.total).toLocaleString()})` : 'Sin descuento';
  document.getElementById('modalTotal').textContent = '$' + v.total.toLocaleString();
  document.getElementById('modalObs').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await cargarSucursales();
  await cargarDatos();
  selectPago('ef');
});
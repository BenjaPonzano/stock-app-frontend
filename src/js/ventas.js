const pagoLabels = { ef: 'Efectivo', mp: 'Mercado Pago', td: 'Tarjeta Déb.', tc: 'Tarjeta Cré.' };
const pagoEmojis = { ef: '💵', mp: '📱', td: '💳', tc: '💳' };

const catalogoProductos = [
  { id: 1, nombre: 'Hamburguesa Clásica', cat: 'Hamburguesas', emoji: '🍔', precio: 2800, stock: 18 },
  { id: 2, nombre: 'Hamburguesa Doble', cat: 'Hamburguesas', emoji: '🍔', precio: 3500, stock: 10 },
  { id: 3, nombre: 'Pizza Muzzarella', cat: 'Pizzas', emoji: '🍕', precio: 3200, stock: 3 },
  { id: 4, nombre: 'Pizza Napolitana', cat: 'Pizzas', emoji: '🍕', precio: 3600, stock: 0 },
  { id: 5, nombre: 'Empanada de Carne', cat: 'Empanadas', emoji: '🥟', precio: 650, stock: 0 },
  { id: 6, nombre: 'Empanada de Jamón', cat: 'Empanadas', emoji: '🥟', precio: 650, stock: 12 },
  { id: 7, nombre: 'Milanesa Napolitana', cat: 'Platos', emoji: '🍽️', precio: 3800, stock: 12 },
  { id: 8, nombre: 'Papas Fritas', cat: 'Guarniciones', emoji: '🍟', precio: 1200, stock: 25 },
  { id: 9, nombre: 'Gaseosa 500ml', cat: 'Bebidas', emoji: '🥤', precio: 800, stock: 30 },
  { id: 10, nombre: 'Agua Mineral', cat: 'Bebidas', emoji: '💧', precio: 600, stock: 20 },
  { id: 11, nombre: 'Limonada', cat: 'Bebidas', emoji: '🍋', precio: 900, stock: 2 },
  { id: 12, nombre: 'Ensalada Verde', cat: 'Guarniciones', emoji: '🥗', precio: 900, stock: 8 },
];

let carrito = [];
let pagoSeleccionado = 'ef';
let catActiva = 'Todos';

let historial = [
  { id: 'V-0001', fecha: '2025-05-09T10:30', sucursal: 'Sucursal Centro', pago: 'ef', descuento: 0, items: [{ nombre: 'Hamburguesa Clásica', emoji: '🍔', cant: 2, precio: 2800, sub: 5600 }, { nombre: 'Papas Fritas', emoji: '🍟', cant: 2, precio: 1200, sub: 2400 }, { nombre: 'Gaseosa 500ml', emoji: '🥤', cant: 2, precio: 800, sub: 1600 }], total: 9600 },
  { id: 'V-0002', fecha: '2025-05-09T11:15', sucursal: 'Sucursal Norte', pago: 'mp', descuento: 10, items: [{ nombre: 'Pizza Muzzarella', emoji: '🍕', cant: 1, precio: 3200, sub: 3200 }, { nombre: 'Limonada', emoji: '🍋', cant: 2, precio: 900, sub: 1800 }], total: 4500 },
  { id: 'V-0003', fecha: '2025-05-08T20:45', sucursal: 'Sucursal Centro', pago: 'td', descuento: 0, items: [{ nombre: 'Milanesa Napolitana', emoji: '🍽️', cant: 1, precio: 3800, sub: 3800 }, { nombre: 'Ensalada Verde', emoji: '🥗', cant: 1, precio: 900, sub: 900 }, { nombre: 'Agua Mineral', emoji: '💧', cant: 1, precio: 600, sub: 600 }], total: 5300 },
  { id: 'V-0004', fecha: '2025-05-08T13:00', sucursal: 'Sucursal Sur', pago: 'ef', descuento: 0, items: [{ nombre: 'Empanada de Jamón', emoji: '🥟', cant: 6, precio: 650, sub: 3900 }, { nombre: 'Gaseosa 500ml', emoji: '🥤', cant: 2, precio: 800, sub: 1600 }], total: 5500 },
];

function getCats() { return ['Todos', ...new Set(catalogoProductos.map(p => p.cat))]; }

function renderCatChips() {
  const cats = getCats();
  document.getElementById('catChips').innerHTML = cats.map(c => `<div class="cat-chip ${c === catActiva ? 'active' : ''}" onclick="setCategoria('${c}')">${c}</div>`).join('');
}

function setCategoria(c) { catActiva = c; renderCatChips(); renderCatalogo(); }

function renderCatalogo() {
  const search = document.getElementById('prodSearch').value.toLowerCase();
  const prods = catalogoProductos.filter(p => {
    const matchCat = catActiva === 'Todos' || p.cat === catActiva;
    const matchSearch = !search || p.nombre.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  document.getElementById('catalogoGrid').innerHTML = prods.map(p => {
    const ss = p.stock === 0 ? 'sin-stock' : '';
    const sb = p.stock === 0 ? 'stock-out' : p.stock < 5 ? 'stock-low' : 'stock-ok';
    const sl = p.stock === 0 ? 'Sin stock' : p.stock < 5 ? `⚠ ${p.stock} u.` : `${p.stock} u.`;
    return `<div class="prod-card ${ss}" onclick="${p.stock > 0 ? `addToCart(${p.id})` : ''}">
      <span class="prod-stock-badge ${sb}">${sl}</span>
      <div class="prod-emoji">${p.emoji}</div>
      <div class="prod-nombre">${p.nombre}</div>
      <div class="prod-precio">$${p.precio.toLocaleString()}</div>
    </div>`;
  }).join('');
}

function addToCart(id) {
  const prod = catalogoProductos.find(p => p.id === id);
  const ex = carrito.find(i => i.id === id);
  if (ex) {
    if (ex.cant >= prod.stock) { showToast('No hay más stock disponible', 'error'); return; }
    ex.cant++; ex.sub = ex.cant * ex.precio;
  } else {
    carrito.push({ id, nombre: prod.nombre, emoji: prod.emoji, cant: 1, precio: prod.precio, sub: prod.precio });
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

function registrarVenta() {
  if (carrito.length === 0) { showToast('El carrito está vacío', 'error'); return; }
  const sub = carrito.reduce((s, i) => s + i.sub, 0);
  const desc = Math.min(100, Math.max(0, +document.getElementById('descuento').value || 0));
  const total = Math.round(sub * (1 - desc / 100));
  const newId = 'V-' + String(historial.length + 1).padStart(4, '0');
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const fecha = now.toISOString().slice(0, 16);
  historial.unshift({ id: newId, fecha, sucursal: sucursales[sucIdx], pago: pagoSeleccionado, descuento: desc, items: carrito.map(i => ({ ...i })), total });
  carrito.forEach(ci => { const p = catalogoProductos.find(p => p.id === ci.id); if (p) p.stock = Math.max(0, p.stock - ci.cant); });
  mostrarTicket(newId, fecha, total, desc, sub);
  carrito = [];
  document.getElementById('descuento').value = 0;
  document.getElementById('f_conCuanto').value = '';
  document.getElementById('vueltoLabel').textContent = '';
  document.getElementById('descuentoMonto').textContent = '';
  renderCarrito(); updateTotal(); renderCatalogo(); renderStats(); renderHistory();
  showToast(`Venta ${newId} registrada ✓`, 'success');
}

function mostrarTicket(id, fecha, total, desc, sub) {
  const d = new Date(fecha);
  const lines = carrito.map(i => `${i.emoji} ${i.nombre} x${i.cant} .......... $${i.sub.toLocaleString()}`).join('\n');
  const tb = document.getElementById('ticketBox');
  tb.innerHTML = `<div style="text-align:center;font-weight:700;margin-bottom:4px">🍽️ StockGastro — ${sucursales[sucIdx]}</div>
<div style="text-align:center;color:var(--muted);margin-bottom:8px;font-size:.78rem">${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · ${id}</div>
<pre style="font-size:.78rem;font-family:monospace;white-space:pre-wrap">${lines}</pre>
<hr style="border:none;border-top:1px dashed var(--border);margin:8px 0">
${desc > 0 ? `<div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>$${sub.toLocaleString()}</span></div><div style="display:flex;justify-content:space-between;color:var(--danger)"><span>Descuento ${desc}%</span><span>− $${(sub - total).toLocaleString()}</span></div>` : ''}
<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;color:var(--primary)"><span>TOTAL</span><span>$${total.toLocaleString()}</span></div>
<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:.8rem;color:var(--muted)"><span>Pago</span><span>${pagoEmojis[pagoSeleccionado]} ${pagoLabels[pagoSeleccionado]}</span></div>
<div style="text-align:center;margin-top:8px;font-size:.75rem;color:var(--muted)">¡Gracias por su visita!</div>`;
  tb.classList.add('show');
}

function renderStats() {
  const hoy = new Date().toISOString().slice(0, 10);
  const ventasHoy = historial.filter(v => v.fecha.startsWith(hoy));
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
    const matchM = !mes || v.fecha.startsWith(mes);
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
            <span>${pagoEmojis[v.pago]} ${pagoLabels[v.pago]}</span>
            ${v.descuento > 0 ? `<span style="color:var(--danger)">−${v.descuento}%</span>` : ''}
          </div>
        </div>
        <div class="venta-total">$${v.total.toLocaleString()}</div>
      </div>
      <div class="venta-pills">${v.items.slice(0, 3).map(i => `<span class="pill">${i.emoji} ${i.nombre} x${i.cant}</span>`).join('')}${v.items.length > 3 ? `<span class="pill">+${v.items.length - 3} más</span>` : ''}</div>
    </div>`).join('');
}

function formatFecha(f) {
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function openModal(id) {
  const v = historial.find(h => h.id === id); if (!v) return;
  document.getElementById('modalTitle').textContent = `🧾 ${v.id}`;
  document.getElementById('modalMeta').innerHTML = `📅 ${formatFecha(v.fecha)} &nbsp;·&nbsp; 🏪 ${v.sucursal} &nbsp;·&nbsp; ${pagoEmojis[v.pago]} ${pagoLabels[v.pago]}`;
  document.getElementById('modalBody').innerHTML = v.items.map(i => `<tr><td>${i.emoji} ${i.nombre}</td><td>${i.cant}</td><td>$${i.precio.toLocaleString()}</td><td>$${i.sub.toLocaleString()}</td></tr>`).join('');
  const sub = v.items.reduce((s, i) => s + i.sub, 0);
  document.getElementById('modalDescuento').textContent = v.descuento > 0 ? `${v.descuento}% (− $${(sub - v.total).toLocaleString()})` : 'Sin descuento';
  document.getElementById('modalTotal').textContent = '$' + v.total.toLocaleString();
  document.getElementById('modalObs').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

renderCatChips(); renderCatalogo(); renderStats(); renderHistory();
selectPago('ef');

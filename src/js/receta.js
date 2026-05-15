const recetas = [
  { id: 1, nombre: 'Masa para Pizza', emoji: '🍕', desc: 'Base de pizza para 4 unidades', ingredientes: [{ nombre: 'Harina 000', cant: 500, unidad: 'g' }], productoGenerado: { nombre: 'Pizza Muzzarella', unidad: 'u', cantPorLote: 4 } },
  { id: 2, nombre: 'Relleno de Empanadas', emoji: '🥟', desc: 'Relleno de carne para 20 empanadas', ingredientes: [{ nombre: 'Carne Picada', cant: 500, unidad: 'g' }], productoGenerado: { nombre: 'Empanada de Carne', unidad: 'u', cantPorLote: 20 } }
];

let stockIngredientes = {};
let historial = [];
let selectedReceta = null;

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
document.getElementById('f_fecha').value = now.toISOString().slice(0, 16);

async function cargarDatosAPI() {
  try {
    const resIng = await fetch('http://localhost:3000/api/ingredientes');
    const ingData = await resIng.json();
    stockIngredientes = {};
    ingData.forEach(i => stockIngredientes[i.nombre] = i.stock);

    const resElab = await fetch('http://localhost:3000/api/elaboraciones');
    historial = await resElab.json();

    renderRecetas();
    updateConsumo();
    renderStats();
    renderHistory();
  } catch (error) {
    console.error("Error API:", error);
    showToast('Error conectando al servidor', 'error');
  }
}

function renderRecetas() {
  document.getElementById('recetasList').innerHTML = recetas.map(r => `
    <div class="receta-card ${selectedReceta?.id === r.id ? 'selected' : ''}" onclick="selectReceta(${r.id})">
      <div class="receta-name">${r.emoji} ${r.nombre}</div>
      <div class="receta-desc">${r.desc}</div>
      <div class="receta-tags">
        ${r.ingredientes.map(i => `<span class="tag ing">🧂 ${i.nombre}</span>`).join('')}
        <span class="tag prod">➜ ${r.productoGenerado.nombre}</span>
      </div>
    </div>`).join('');
}

function selectReceta(id) {
  selectedReceta = recetas.find(r => r.id === id);
  renderRecetas();
  updateConsumo();
}

function updateConsumo() {
  if (!selectedReceta) { return; }
  const cant = +document.getElementById('f_cantidad').value || 1;
  const warnings = [];

  const rows = selectedReceta.ingredientes.map(ing => {
    const stockActual = stockIngredientes[ing.nombre] ?? 0;
    const aConsumir = ing.cant * cant;
    const stockFinal = stockActual - aConsumir;
    const faltante = stockFinal < 0;

    if (faltante) warnings.push(`${ing.nombre}: faltan ${Math.abs(stockFinal)} ${ing.unidad}`);

    return `<tr>
      <td><strong>${ing.nombre}</strong></td>
      <td>${stockActual.toLocaleString()} ${ing.unidad}</td>
      <td style="color:${faltante ? 'var(--danger)' : 'var(--text)'}">${aConsumir.toLocaleString()} ${ing.unidad}</td>
      <td style="color:${stockFinal < 0 ? 'var(--danger)' : stockFinal < ing.cant ? 'var(--warning)' : 'var(--success)'}">
        ${stockFinal < 0 ? '<strong>⚠ ' + stockFinal.toLocaleString() + '</strong>' : stockFinal.toLocaleString()} ${ing.unidad}
      </td>
    </tr>`;
  }).join('');

  document.getElementById('consumoBody').innerHTML = rows;

  const prodCant = selectedReceta.productoGenerado.cantPorLote * cant;
  document.getElementById('productoGenerado').innerHTML = `
    <span style="font-size:1.3rem">${selectedReceta.emoji}</span>
    <strong style="color:var(--primary);margin-left:8px">${prodCant} ${selectedReceta.productoGenerado.unidad}</strong>
    <span style="color:var(--muted);margin-left:4px">de ${selectedReceta.productoGenerado.nombre}</span>
  `;
  document.getElementById('productoGenerado').style.display = 'flex';
  document.getElementById('productoGenerado').style.alignItems = 'center';

  const warn = document.getElementById('stockWarning');
  if (warnings.length > 0) {
    warn.classList.add('show');
    document.getElementById('stockWarningMsg').textContent = 'Stock insuficiente: ' + warnings.join(' · ');
  } else {
    warn.classList.remove('show');
  }
}

async function registrarElab() {
  if (!selectedReceta) return showToast('Seleccioná una receta', 'error');
  const cant = +document.getElementById('f_cantidad').value || 1;
  const fecha = document.getElementById('f_fecha').value;
  if (!fecha) return showToast('Ingresá la fecha', 'error');

  const faltantes = selectedReceta.ingredientes.filter(ing => (stockIngredientes[ing.nombre] ?? 0) < ing.cant * cant);
  if (faltantes.length > 0) {
    if (!confirm(`⚠️ Stock insuficiente en:\n${faltantes.map(i => i.nombre).join(', ')}\n¿Forzar registro y dejar stock en 0?`)) return;
  }

  const payload = {
    id: 'E-' + String(historial.length + 1).padStart(4, '0'),
    fecha,
    recetaId: selectedReceta.id,
    recetaNombre: selectedReceta.nombre,
    emoji: selectedReceta.emoji,
    cantidad: cant,
    sucursal: sucursales[sucIdx],
    ingredientesConsumidos: selectedReceta.ingredientes.map(i => ({ nombre: i.nombre, cant: i.cant * cant, unidad: i.unidad })),
    productoGenerado: { nombre: selectedReceta.productoGenerado.nombre, cantidad: selectedReceta.productoGenerado.cantPorLote * cant, unidad: selectedReceta.productoGenerado.unidad },
    obs: document.getElementById('f_obs').value.trim()
  };

  try {
    const res = await fetch('http://localhost:3000/api/elaboraciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Elaboración registrada ✓', 'success');
      selectedReceta = null;
      document.getElementById('f_cantidad').value = 1;
      document.getElementById('f_obs').value = '';
      document.getElementById('consumoBody').innerHTML = '<tr><td colspan="4"><div class="empty-items">Seleccioná una receta</div></td></tr>';
      document.getElementById('productoGenerado').innerHTML = 'Seleccioná una receta para ver el producto resultante';
      document.getElementById('stockWarning').classList.remove('show');
      await cargarDatosAPI();
    }
  } catch (e) {
    showToast('Error al registrar', 'error');
  }
}

function renderStats() {
  const total = historial.length;
  const hoy = new Date().toISOString().slice(0, 10);
  const hoyCount = historial.filter(e => e.fecha.startsWith(hoy)).length;
  const recetasUsadas = new Set(historial.map(e => e.recetaId)).size;
  const totalUnidades = historial.reduce((s, e) => s + e.productoGenerado.cantidad, 0);

  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Elaboraciones</div><div class="stat-value" style="color:var(--primary)">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Elaboraciones Hoy</div><div class="stat-value" style="color:var(--success)">${hoyCount}</div></div>
    <div class="stat-card"><div class="stat-label">Recetas Utilizadas</div><div class="stat-value" style="color:var(--info)">${recetasUsadas}</div></div>
    <div class="stat-card"><div class="stat-label">Unidades Producidas</div><div class="stat-value" style="color:var(--secondary)">${totalUnidades}</div></div>
  `;
}

function renderHistory() {
  const search = document.getElementById('histSearch').value.toLowerCase();
  const recFil = document.getElementById('histReceta').value;
  const mes = document.getElementById('histMes').value;

  let filtered = historial.filter(e => {
    return (!search || e.recetaNombre.toLowerCase().includes(search))
      && (!recFil || e.recetaId === +recFil)
      && (!mes || e.fecha.startsWith(mes));
  });

  const sel = document.getElementById('histReceta');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todas las recetas</option>' + recetas.map(r => `<option value="${r.id}" ${+cur === r.id ? 'selected' : ''}>${r.emoji} ${r.nombre}</option>`).join('');

  const list = document.getElementById('historyList');
  if (filtered.length === 0) { list.innerHTML = '<div class="empty-hist"><div class="icon">🍳</div>Sin resultados</div>'; return; }

  list.innerHTML = filtered.map(e => `
    <div class="elab-card" onclick="openModal('${e.id}')">
      <div class="elab-top">
        <div>
          <div class="elab-id">${e.emoji} ${e.id} — ${e.recetaNombre}</div>
          <div class="elab-meta"><span>📅 ${e.fecha.replace('T', ' ')}</span><span>🏪 ${e.sucursal}</span><span>🔁 x${e.cantidad} lote(s)</span></div>
        </div>
        <div class="elab-qty">+${e.productoGenerado.cantidad} ${e.productoGenerado.unidad}</div>
      </div>
      <div class="elab-pills">
        ${e.ingredientesConsumidos.slice(0, 3).map(i => `<span class="pill consumed">${i.nombre} -${i.cant}${i.unidad}</span>`).join('')}
        ${e.ingredientesConsumidos.length > 3 ? `<span class="pill">+${e.ingredientesConsumidos.length - 3} más</span>` : ''}
      </div>
    </div>`).join('');
}

function openModal(id) {
  const e = historial.find(h => h.id === id); if (!e) return;

  document.getElementById('modalTitle').textContent = `${e.emoji} ${e.id} — ${e.recetaNombre}`;
  document.getElementById('modalMeta').innerHTML = `📅 ${e.fecha.replace('T', ' ')} &nbsp;·&nbsp; 🏪 ${e.sucursal} &nbsp;·&nbsp; 🔁 x${e.cantidad}`;

  document.getElementById('modalIngBody').innerHTML = e.ingredientesConsumidos.map(i => `<tr><td>${i.nombre}</td><td style="color:var(--danger)">- ${i.cant} ${i.unidad}</td></tr>`).join('');
  document.getElementById('modalProdBody').innerHTML = `<tr><td>${e.productoGenerado.nombre}</td><td style="color:var(--success)">+ ${e.productoGenerado.cantidad} ${e.productoGenerado.unidad}</td></tr>`;
  document.getElementById('modalObs').textContent = e.obs ? `📝 ${e.obs}` : '';

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.addEventListener("DOMContentLoaded", cargarDatosAPI);

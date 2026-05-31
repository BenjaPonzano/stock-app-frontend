const API = 'http://localhost:3000/api';

let recetas = [];
let stockIngredientes = {}; // idIngrediente → stock
let historial = [];
let selectedReceta = null;

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
document.getElementById('f_fecha').value = now.toISOString().slice(0, 16);

// ── Carga inicial ──────────────────────────────────────────────
async function cargarDatosAPI() {
  try {
    const [resRecetas, resIng, resElab] = await Promise.all([
      fetch(`${API}/recetas`),
      fetch(`${API}/ingredientes`),
      fetch(`${API}/elaboraciones`)
    ]);

    recetas = await resRecetas.json();

    const ingData = await resIng.json();
    stockIngredientes = {};
    ingData.forEach(i => stockIngredientes[i.id] = { stock: i.stock, nombre: i.nombre, unidad: i.unidad });

    historial = await resElab.json();

    renderRecetas();
    updateConsumo();
    renderStats();
    renderHistory();
  } catch (error) {
    console.error('Error API:', error);
    showToast('Error conectando al servidor', 'error');
  }
}

// ── Recetas ────────────────────────────────────────────────────
function renderRecetas() {
  if (recetas.length === 0) {
    document.getElementById('recetasList').innerHTML = '<div class="empty-hist">No hay recetas cargadas</div>';
    return;
  }
  document.getElementById('recetasList').innerHTML = recetas.map(r => `
    <div class="receta-card ${selectedReceta?.id === r.id ? 'selected' : ''}" onclick="selectReceta(${r.id})">
      <div class="receta-name">${r.nombre}</div>
      <div class="receta-desc">${r.descripcion || ''}</div>
      <div class="receta-tags">
        ${r.ingredientes.map(i => `<span class="tag ing">🧂 ${i.nombre}</span>`).join('')}
        <span class="tag prod">➜ ${r.productoNombre}</span>
      </div>
    </div>`).join('');
}

function selectReceta(id) {
  selectedReceta = recetas.find(r => r.id === id);
  renderRecetas();
  updateConsumo();
}

// ── Consumo estimado ───────────────────────────────────────────
function updateConsumo() {
  if (!selectedReceta) return;
  const cant = +document.getElementById('f_cantidad').value || 1;
  const warnings = [];

  const rows = selectedReceta.ingredientes.map(ing => {
    const info = stockIngredientes[ing.idIngrediente];
    const stockActual = info?.stock ?? 0;
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

  const prodCant = selectedReceta.cantPorLote * cant;
  document.getElementById('productoGenerado').innerHTML = `
    <strong style="color:var(--primary);margin-left:8px">${prodCant} u.</strong>
    <span style="color:var(--muted);margin-left:4px">de ${selectedReceta.productoNombre}</span>
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

// ── Registrar elaboración ──────────────────────────────────────
async function registrarElab() {
  if (!selectedReceta) return showToast('Seleccioná una receta', 'error');
  const cant = +document.getElementById('f_cantidad').value || 1;
  const fecha = document.getElementById('f_fecha').value;
  if (!fecha) return showToast('Ingresá la fecha', 'error');

  const faltantes = selectedReceta.ingredientes.filter(ing => {
    const info = stockIngredientes[ing.idIngrediente];
    return (info?.stock ?? 0) < ing.cant * cant;
  });

  if (faltantes.length > 0) {
    if (!confirm(`⚠️ Stock insuficiente en:\n${faltantes.map(i => i.nombre).join(', ')}\n¿Forzar registro y dejar stock en 0?`)) return;
  }

  const payload = {
    idReceta:     selectedReceta.id,
    recetaNombre: selectedReceta.nombre,
    idProducto:   selectedReceta.idProducto,
    cantidad:     cant,
    obs:          document.getElementById('f_obs').value.trim(),
    ingredientesConsumidos: selectedReceta.ingredientes.map(i => ({
      idIngrediente: i.idIngrediente,
      cant:          i.cant * cant
    }))
  };

  try {
    const res = await fetch(`${API}/elaboraciones`, {
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

// ── Stats ──────────────────────────────────────────────────────
function renderStats() {
  const total = historial.length;
  const hoy = new Date().toISOString().slice(0, 10);
  const hoyCount = historial.filter(e => e.fecha && e.fecha.toString().startsWith(hoy)).length;
  const recetasUsadas = new Set(historial.map(e => e.recetaId)).size;
  const totalUnidades = historial.reduce((s, e) => s + (e.productoGenerado?.cantidad || 0), 0);

  document.getElementById('statsArea').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Elaboraciones</div><div class="stat-value" style="color:var(--primary)">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Elaboraciones Hoy</div><div class="stat-value" style="color:var(--success)">${hoyCount}</div></div>
    <div class="stat-card"><div class="stat-label">Recetas Utilizadas</div><div class="stat-value" style="color:var(--info)">${recetasUsadas}</div></div>
    <div class="stat-card"><div class="stat-label">Unidades Producidas</div><div class="stat-value" style="color:var(--secondary)">${totalUnidades}</div></div>
  `;
}

// ── Historial ──────────────────────────────────────────────────
function renderHistory() {
  const search = document.getElementById('histSearch').value.toLowerCase();
  const recFil = +document.getElementById('histReceta').value;
  const mes = document.getElementById('histMes').value;

  const filtered = historial.filter(e =>
    (!search || e.recetaNombre?.toLowerCase().includes(search)) &&
    (!recFil || e.recetaId === recFil) &&
    (!mes || e.fecha?.toString().startsWith(mes))
  );

  // Actualizar select de recetas
  const sel = document.getElementById('histReceta');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todas las recetas</option>' +
    recetas.map(r => `<option value="${r.id}" ${+cur === r.id ? 'selected' : ''}>${r.nombre}</option>`).join('');

  const list = document.getElementById('historyList');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-hist"><div class="icon">🍳</div>Sin resultados</div>';
    return;
  }

  list.innerHTML = filtered.map(e => `
    <div class="elab-card" onclick="openModal('${e.id}')">
      <div class="elab-top">
        <div>
          <div class="elab-id">${e.id} — ${e.recetaNombre}</div>
          <div class="elab-meta">
            <span>📅 ${e.fecha ? e.fecha.toString().replace('T', ' ').slice(0, 16) : ''}</span>
            <span>🏪 ${e.sucursal || ''}</span>
            <span>🔁 x${e.cantidad} lote(s)</span>
          </div>
        </div>
        <div class="elab-qty">+${e.productoGenerado?.cantidad} ${e.productoGenerado?.unidad}</div>
      </div>
      <div class="elab-pills">
        ${(e.ingredientesConsumidos || []).slice(0, 3).map(i => `<span class="pill consumed">${i.nombre} -${i.cant}${i.unidad}</span>`).join('')}
        ${(e.ingredientesConsumidos || []).length > 3 ? `<span class="pill">+${e.ingredientesConsumidos.length - 3} más</span>` : ''}
      </div>
    </div>`).join('');
}

function openModal(id) {
  const e = historial.find(h => h.id === id);
  if (!e) return;

  document.getElementById('modalTitle').textContent = `${e.id} — ${e.recetaNombre}`;
  document.getElementById('modalMeta').innerHTML = `📅 ${e.fecha ? e.fecha.toString().replace('T', ' ').slice(0, 16) : ''} &nbsp;·&nbsp; 🏪 ${e.sucursal || ''} &nbsp;·&nbsp; 🔁 x${e.cantidad}`;
  document.getElementById('modalIngBody').innerHTML = (e.ingredientesConsumidos || []).map(i => `<tr><td>${i.nombre}</td><td style="color:var(--danger)">- ${i.cant} ${i.unidad}</td></tr>`).join('');
  document.getElementById('modalProdBody').innerHTML = `<tr><td>${e.productoGenerado?.nombre}</td><td style="color:var(--success)">+ ${e.productoGenerado?.cantidad} ${e.productoGenerado?.unidad}</td></tr>`;
  document.getElementById('modalObs').textContent = e.obs ? `📝 ${e.obs}` : '';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', cargarDatosAPI);

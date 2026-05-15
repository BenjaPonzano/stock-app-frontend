function getFechaLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

function getMothPrefix() {
  return getFechaLocal().slice(0, 7);
}

async function cargarDatosDashboard() {
  try {
    const [resVentas, resCompras, resElab, resProd, resIng] = await Promise.all([
      fetch('http://localhost:3000/api/ventas'),
      fetch('http://localhost:3000/api/compras'),
      fetch('http://localhost:3000/api/elaboraciones'),
      fetch('http://localhost:3000/api/productos'),
      fetch('http://localhost:3000/api/ingredientes')
    ]);

    const ventas = await resVentas.json();
    const compras = await resCompras.json();
    const elaboraciones = await resElab.json();
    const productos = await resProd.json();
    const ingredientes = await resIng.json();

    const hoy = getFechaLocal();
    const mesActual = getMothPrefix();

    const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));
    const totalVentasHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
    document.getElementById('stVentasHoy').textContent = '$' + totalVentasHoy.toLocaleString();
    document.getElementById('stVentasSub').textContent = `${ventasHoy.length > 0 ? 'En curso' : 'Sin ventas aún'}`;
    document.getElementById('stOrdenes').textContent = ventasHoy.length;

    const comprasMes = compras.filter(c => c.fecha.startsWith(mesActual));
    const totalComprasMes = comprasMes.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.subtotal, 0), 0);
    document.getElementById('stCompras').textContent = '$' + totalComprasMes.toLocaleString();

    const inventario = [...productos, ...ingredientes];
    const stockCritico = inventario.filter(i => i.stock <= i.stockMin);
    document.getElementById('stAlertas').textContent = stockCritico.length;

    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      ultimos7Dias.push({
        fecha: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('es-AR', { weekday: 'short' }),
        total: 0
      });
    }

    ventas.forEach(v => {
      const fechaVenta = v.fecha.split('T')[0];
      const dia = ultimos7Dias.find(d => d.fecha === fechaVenta);
      if (dia) dia.total += v.total;
    });

    const maxVenta = Math.max(...ultimos7Dias.map(d => d.total), 1);
    const chartHtml = ultimos7Dias.map((d, i) => {
      const height = Math.max((d.total / maxVenta) * 100, 5);
      const isToday = i === 6 ? 'today' : '';
      return `
        <div class="chart-bar-wrap">
          <div class="chart-tooltip">$${d.total.toLocaleString()}</div>
          <div class="chart-bar ${isToday}" style="height: ${height}%">
            <div class="chart-label">${d.label}</div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('chartVentas').innerHTML = chartHtml;

    const ranking = {};
    ventas.forEach(v => {
      v.items.forEach(item => {
        if (!ranking[item.nombre]) ranking[item.nombre] = { cant: 0, emoji: item.emoji };
        ranking[item.nombre].cant += item.cant;
      });
    });

    const topItems = Object.entries(ranking)
      .map(([nombre, data]) => ({ nombre, cant: data.cant, emoji: data.emoji }))
      .sort((a, b) => b.cant - a.cant)
      .slice(0, 4);

    const maxCant = topItems.length ? topItems[0].cant : 1;
    const colores = ['var(--primary)', 'var(--info)', 'var(--success)', 'var(--warning)'];

    if (topItems.length > 0) {
      document.getElementById('topProductos').innerHTML = topItems.map((item, i) => `
        <div class="top-item">
          <div class="top-emoji">${item.emoji || '🍽️'}</div>
          <div class="top-details">
            <div class="top-name">${item.nombre}</div>
            <div class="progress-wrap"><div class="progress-bar" style="width: ${(item.cant / maxCant) * 100}%; background: ${colores[i]}"></div></div>
          </div>
          <div class="top-qty">${item.cant} u.</div>
        </div>
      `).join('');
    } else {
      document.getElementById('topProductos').innerHTML = '<div class="empty-state">No hay ventas registradas para armar el ranking.</div>';
    }

    stockCritico.sort((a, b) => a.stock - b.stock);
    const topAlertas = stockCritico.slice(0, 4);

    if (topAlertas.length > 0) {
      document.getElementById('listaAlertas').innerHTML = topAlertas.map(item => {
        const isDanger = item.stock === 0;
        return `
          <div class="alert-item ${isDanger ? 'danger' : ''}">
            <div class="alert-content">
              <h4>${item.nombre}</h4>
              <p>${isDanger ? 'Stock agotado' : 'Stock bajo'} (${item.stock} ${item.unidad}). Mínimo: ${item.stockMin}.</p>
            </div>
          </div>
        `;
      }).join('');
    } else {
      document.getElementById('listaAlertas').innerHTML = '<div class="empty-state" style="color:var(--success)">✅ Todo el inventario está en niveles óptimos.</div>';
    }

    let actividad = [];

    ventas.forEach(v => actividad.push({
      fechaObj: new Date(v.fecha), texto: `Venta registrada (${v.id})`,
      sub: `Total: $${v.total.toLocaleString()}`, icon: '💰', color: 'var(--success)'
    }));

    elaboraciones.forEach(e => actividad.push({
      fechaObj: new Date(e.fecha), texto: `Elaboración: ${e.recetaNombre}`,
      sub: `Producido: +${e.productoGenerado.cantidad} ${e.productoGenerado.unidad}`, icon: '👨‍🍳', color: 'var(--primary)'
    }));

    compras.forEach(c => actividad.push({
      fechaObj: new Date(c.fecha), texto: `Ingreso mercadería (${c.id})`,
      sub: `Prov: ${c.proveedor}`, icon: '🛒', color: 'var(--info)'
    }));

    actividad.sort((a, b) => b.fechaObj - a.fechaObj);
    const topActividad = actividad.slice(0, 4);

    if (topActividad.length > 0) {
      document.getElementById('listaActividad').innerHTML = topActividad.map(a => {
        const fechaStr = a.fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `
          <div class="activity-item">
            <div class="activity-icon" style="color:${a.color}; border-color:${a.color}">${a.icon}</div>
            <div class="activity-details">
              <div class="activity-title">${a.texto}</div>
              <div class="activity-time">${fechaStr}</div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      document.getElementById('listaActividad').innerHTML = '<div class="empty-state">No hay actividad reciente.</div>';
    }

  } catch (error) {
    console.error("Error al cargar el Dashboard:", error);
    document.getElementById('stVentasSub').textContent = 'Error de conexión';
  }
}

document.addEventListener('DOMContentLoaded', cargarDatosDashboard);

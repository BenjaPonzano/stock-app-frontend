const sucursales = ['Sucursal Centro', 'Sucursal Norte', 'Sucursal Sur'];
let sucIdx = 0;

function cycleSucursal() {
  sucIdx = (sucIdx + 1) % sucursales.length;
  document.getElementById('sucursalLabel').textContent = sucursales[sucIdx];
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

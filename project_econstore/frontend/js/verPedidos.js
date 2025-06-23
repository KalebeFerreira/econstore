document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('http://localhost:3001/api/ver-pedidos');
    const pedidos = await res.json();
    const tbody = document.querySelector('#tabelaPedidos tbody');

    pedidos.forEach(pedido => {
      const row = document.createElement('tr');

      // Verifica se itens é um array antes de usar .map
      const itensTexto = Array.isArray(pedido.itens)
        ? pedido.itens.map(item => `${item.nome_produto} (x${item.quantidade})`).join(', ')
        : 'Nenhum item';

row.innerHTML = `
  <td><strong>#${pedido.id_pedido}</strong></td>
  <td>
    <div>
      <strong>${pedido.nome_completo}</strong><br>

    </div>
  </td>
  <td>
    <div class="itens-pedido">
      ${itensTexto}
    </div>
  </td>
  <td>
    <span class="valor">R$ ${Number(pedido.valor_total).toFixed(2)}</span>
  </td>
  <td>
    <span class="status-badge ${pedido.status_pedido.toLowerCase()}">
      ${pedido.status_pedido === 'aprovado' ? '' : pedido.status_pedido === 'pendente' ? '' : ''} 
      ${pedido.status_pedido}
    </span>
  </td>
  <td>
    <div>
      <strong style="color:#333;">${new Date(pedido.data_pedido).toLocaleDateString()}</strong><br>
      <small>${new Date(pedido.data_pedido).toLocaleTimeString()}</small>
    </div>
  </td>
`;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
});

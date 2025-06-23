const { getPool } = require('../config/db');

exports.listarTodosPedidos = async () => {
  const pool = await getPool();

  // Buscar todos os pedidos com nome do usuário
  const [pedidos] = await pool.query(`
    SELECT 
      p.id_pedido, 
      u.nome_completo AS nome_completo,
      p.valor_total, 
      p.status_pedido, 
      p.data_pedido
    FROM Pedidos p
    JOIN Usuarios u ON p.id_usuario = u.id_usuario
    ORDER BY p.data_pedido DESC
  `);

  // Para cada pedido, buscar os itens
 for (const pedido of pedidos) {
  const [itens] = await pool.query(`
    SELECT 
      ip.quantidade, 
      pr.nome_produto 
    FROM itens_pedido ip
    JOIN produtos pr ON ip.id_produto = pr.id_produto
    WHERE ip.id_pedido = ?
  `, [pedido.id_pedido]);

  // Garante que sempre será array
   pedido.itens = itens ?? []; 
}



  return pedidos;
};

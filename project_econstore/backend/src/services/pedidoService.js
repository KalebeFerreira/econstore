const db = require('../config/db');
const ProductModel = require('../models/productModel'); // ⬅️ importar o modelo de produto

exports.criarPedido = async (produtos, total, status, id_usuario) => {
  const pool = await db.getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Verificar estoque antes de criar pedido
    for (const produto of produtos) {
      const produtoNoBanco = await ProductModel.getProductById(produto.id);
      if (!produtoNoBanco) {
        throw new Error(`Produto com ID ${produto.id} não encontrado.`);
      }
      if (produto.quantidade > produtoNoBanco.quantidade_estoque) {
        throw new Error(`Estoque insuficiente para o produto "${produtoNoBanco.nome_produto}". Disponível: ${produtoNoBanco.quantidade_estoque}, solicitado: ${produto.quantidade}`);
      }
    }

    // 2. Criar pedido
    const [pedidoResult] = await conn.query(
      'INSERT INTO pedidos (id_usuario, valor_total, status_pedido, data_pedido) VALUES (?, ?, ?, NOW())',
      [id_usuario, total, status]
    );

    const pedidoId = pedidoResult.insertId;


    
    // 3. Criar itens e atualizar estoque
    for (const produto of produtos) {   

try {
  await ProductModel.updateStock(produto.id, -parseInt(produto.quantidade), conn);
  console.log("✅ Estoque atualizado com sucesso");
} catch (error) {
  console.error("❌ Erro ao atualizar estoque:", error.message);
  throw error;
}

      await conn.query(
        'INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [
          pedidoId,
          produto.id,
          parseInt(produto.quantidade),
          parseFloat(produto.preco)
        ]
      );

      
    }

    await conn.commit();
    return { id_pedido: pedidoId, status };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

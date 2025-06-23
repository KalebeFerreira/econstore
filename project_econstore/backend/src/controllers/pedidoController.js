const pedidoService = require('../services/pedidoService');

exports.criarPedido = async (req, res) => {
  try {
    const { produtos, total, status, id_usuario } = req.body;

    console.log('Recebido do frontend:', req.body);

    const pedido = await pedidoService.criarPedido(produtos, total, status, id_usuario);
    res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro no pedidoController:', error); // 👈 útil para debug
    res.status(500).json({ erro: 'Erro ao criar pedido', detalhes: error.message });
  }
};
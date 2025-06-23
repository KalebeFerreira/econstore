const verPedidosService = require('../services/verPedidosService');

exports.getTodosPedidos = async (req, res) => {
  try {
    const pedidos = await verPedidosService.listarTodosPedidos();
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar pedidos' });
  }
};
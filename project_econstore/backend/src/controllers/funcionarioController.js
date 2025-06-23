const funcionarioService = require('../services/funcionarioService');

exports.loginFuncionario = async (req, res) => {
  try {
    console.log('Body recebido:', req.body);
    const { email, senha } = req.body;
    const result = await funcionarioService.loginFuncionario(email, senha);

    if (!result) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha inválidos' });
    }

    res.json({
      sucesso: true,
      token: result.token,
      usuario: result.usuario
    });
  } catch (error) {
    console.error('Erro no loginFuncionario:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor' });
  }
};

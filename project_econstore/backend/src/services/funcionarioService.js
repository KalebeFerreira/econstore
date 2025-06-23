const { getPool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.loginFuncionario = async (email, senha) => {
  try {
    const db = await getPool();
    const [rows] = await db.query(
      'SELECT * FROM Usuarios WHERE email = ? AND tipo_usuario = "lojista"',
      [email]
    );

    if (rows.length === 0) {
      return null; // Email não encontrado
    }

    const usuario = rows[0];

    console.log("Usuário encontrado:", usuario);
    console.log("Senha enviada:", senha);
    console.log("Senha no banco:", usuario.senha);

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return null; // Senha incorreta
    }

    const token = jwt.sign(
  {
    id_usuario: usuario.id_usuario,
    email: usuario.email,
    tipo_usuario: usuario.tipo_usuario, // 👈 esta chave é crucial!
    nome: usuario.nome
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

    return { token, usuario };
  } catch (error) {
    console.error("Erro no loginFuncionario:", error);
    throw error;
  }
};

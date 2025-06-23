const bcrypt = require('bcrypt');

const senha = 'ola3';

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    return;
  }
  console.log('Hash da senha "ola3":', hash);
});

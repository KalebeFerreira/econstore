document.getElementById('loginFuncionarioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email_funcionario').value;
  const senha = document.getElementById('senha_funcionario').value;

  try {
    const response = await fetch('http://localhost:3001/api/login-funcionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {

        // Salva o token no localStorage
  localStorage.setItem("token", data.token);
      alert('Login realizado com sucesso!');
      // Redireciona para a área do lojista (crie essa página se ainda não existir)
      window.location.href = 'area-lojista.html';
    } else {
      alert(data.mensagem);
    }
  } 
  
  
  
  catch (err) {
    console.error('Erro ao fazer login:', err);
    alert('Erro ao tentar login. Tente novamente mais tarde.');
  }
});

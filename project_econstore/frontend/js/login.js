document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login efetuado com sucesso!');

            // Salvar token no localStorage para autenticar futuras requisições
            localStorage.setItem('token', data.token);
                localStorage.setItem('usuarioLogado', JSON.stringify(data.user));

            // Redirecionar para a página inicial ou dashboard
            window.location.href = 'index.html';
        } else {
            // Se o backend retornar erro, exibir a mensagem para o usuário
            alert(data.message || 'Erro ao fazer login.');
        }
    } catch (error) {
        alert('Erro de conexão: ' + error.message);
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("cadastroForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const senha = document.getElementById("senha").value;
        const confirmaSenha = document.getElementById("confirma_senha").value;

        if (senha !== confirmaSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        const userData = {
            nome_completo: form.nome_completo.value,
            cpf: form.cpf.value,
            telefone: form.telefone.value,
            email: form.email.value,
            senha: senha,
            tipo_usuario: "cliente",
            endereco_rua: form.endereco_rua.value,
            endereco_numero: form.endereco_numero.value,
            endereco_complemento: form.endereco_complemento.value,
            endereco_bairro: form.endereco_bairro.value,
            endereco_cidade: form.endereco_cidade.value,
            endereco_estado: form.endereco_estado.value,
            endereco_cep: form.endereco_cep.value,
        };

        try {
            const response = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Cadastro realizado com sucesso!");
                window.location.href = "login.html";
            } else {
                alert("Erro: " + (result.message || "Não foi possível realizar o cadastro."));
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });
});
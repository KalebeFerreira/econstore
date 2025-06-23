document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("produtos-container");
  const formNovo = document.getElementById("formNovoProduto");

  // Função para carregar e exibir todos os produtos
  async function carregarProdutos() {
    const res = await fetch("http://localhost:3001/api/products");
    const produtos = await res.json();
    container.innerHTML = "";

    produtos.forEach(produto => {
      const div = document.createElement("div");
      div.className = "produto-card";

      div.innerHTML = `
  <div class="produto-card-admin">
    <img src="${produto.imagem_url}" alt="${produto.nome_produto}" class="produto-imagem-admin"/>

    <div class="produto-info-admin">
      <label>Nome do Produto:</label>
      <input type="text" value="${produto.nome_produto}" class="edit-nome" />

      <label>Descrição:</label>
      <textarea class="edit-descricao">${produto.descricao}</textarea>

      <label>Preço (R$):</label>
      <input type="number" value="${produto.preco}" class="edit-preco" step="0.01" min="0"/>

      <label>Estoque:</label>
      <input type="number" value="${produto.quantidade_estoque}" class="edit-estoque" min="0"/>

      <label>URL da Imagem:</label>
      <input type="text" value="${produto.imagem_url}" class="edit-imagem"/>

      <div class="produto-acoes-admin">
        <button class="salvar" data-id="${produto.id_produto}"> Salvar</button>
        <button class="excluir" data-id="${produto.id_produto}"> Excluir</button>
      </div>
    </div>
  </div>
`;


      container.appendChild(div);
    });

    // Adiciona eventos aos botões de salvar
    document.querySelectorAll(".salvar").forEach(botao => {
  botao.addEventListener("click", async () => {
    const id = botao.dataset.id;
    const card = botao.closest(".produto-card"); // CORRIGIDO AQUI ✅

    const nome = card.querySelector(".edit-nome").value.trim();
    const descricao = card.querySelector(".edit-descricao").value.trim();
    const preco = parseFloat(card.querySelector(".edit-preco").value);
    const estoque = parseInt(card.querySelector(".edit-estoque").value);
    const imagem = card.querySelector(".edit-imagem").value.trim();

    if (!nome || preco < 0 || estoque < 0 || !imagem) {
      alert("Preencha os campos corretamente.");
      return;
    }

    const token = localStorage.getItem("token"); // recupera o token do login

await fetch(`http://localhost:3001/api/products/${id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` // envia o token no header
  },
  body: JSON.stringify({
    nome_produto: nome,
    descricao,
    preco,
    quantidade_estoque: estoque,
    imagem_url: imagem
  }),
});

    alert("Produto atualizado!");
    carregarProdutos(); // Recarrega após atualização
  });
});

   // Adiciona eventos ao botão de excluir
   document.querySelectorAll(".excluir").forEach(botao => {
  botao.addEventListener("click", async () => {
    const id = botao.dataset.id;

    const confirmar = confirm("Tem certeza que deseja excluir este produto?");
    if (!confirmar) return;


    const token = localStorage.getItem("token");
    
    const res = await fetch(`http://localhost:3001/api/products/${id}`, {
      method: "DELETE",
      headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }
    });

    if (res.ok) {
      alert("Produto excluído com sucesso!");
      carregarProdutos(); // Recarrega a lista
    } else {
      const erro = await res.json();
      alert("Erro ao excluir produto: " + (erro.message || "Erro desconhecido."));
    }
  });
});

  }

  // Carrega produtos ao abrir a página
  carregarProdutos();

  // Enviar novo produto
  formNovo.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(formNovo);
    const produto = {
      nome_produto: formData.get("nome_produto").trim(),
      descricao: formData.get("descricao").trim(),
      preco: parseFloat(formData.get("preco")),
      quantidade_estoque: parseInt(formData.get("quantidade_estoque")),
      imagem_url: formData.get("imagem_url").trim(),
    };

    if (!produto.nome_produto || produto.preco < 0 || produto.quantidade_estoque < 0 || !produto.imagem_url) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const token = localStorage.getItem("token"); // recupera o token do login
    console.log("Token enviado:", token); 

    const res = await fetch("http://localhost:3001/api/products", {
      method: "POST",
      headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` // envia o token no header
  },
      body: JSON.stringify(produto),
    });

    if (res.ok) {
      alert("Produto adicionado!");
      formNovo.reset();
      carregarProdutos();
    } else {
      alert("Erro ao adicionar produto.");
    }
  });
});

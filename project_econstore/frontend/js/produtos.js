document.addEventListener("DOMContentLoaded", async () => {
  const productGrid = document.getElementById("product-listing-grid");
  const categoriaMenu = document.querySelector(".categoria-menu"); // Seleciona o menu de categorias

  // Função para carregar e exibir produtos, agora com filtro opcional
  async function carregarProdutos(categoria = null) {
    let url = "http://localhost:3001/api/products";
    if (categoria) {
      url += `?categoria=${encodeURIComponent(categoria)}`;
    }

    try {
      const res = await fetch(url); // Ajusta a rota com base na categoria
      if (!res.ok) throw new Error("Erro ao buscar produtos");

      const produtos = await res.json();
      productGrid.innerHTML = ""; // Limpa qualquer conteúdo anterior

      if (produtos.length === 0) {
        productGrid.innerHTML = "<p>Nenhum produto encontrado nesta categoria.</p>";
        return;
      }

      produtos.forEach(produto => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
          <img src="${produto.imagem_url}" alt="${produto.nome_produto}">
          <h3>${produto.nome_produto}</h3>
          <p class="price">R$ ${parseFloat(produto.preco).toFixed(2).replace(".", ",")}</p>
          <a href="produto_detalhes.html?id=${produto.id_produto}" class="ver-detalhes">Ver detalhes</a>
        `;

        productGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      productGrid.innerHTML = "<p>Erro ao carregar produtos. Tente novamente.</p>";
    }
  }

  // Adicionar event listeners aos itens do menu de categoria
  categoriaMenu.querySelectorAll("span").forEach(span => {
    span.addEventListener("click", () => {
      // Remove a classe 'active' de todos os itens e adiciona ao clicado
      categoriaMenu.querySelectorAll("span").forEach(s => s.classList.remove("active"));
      span.classList.add("active");

      const categoriaSelecionada = span.dataset.categoria; // Pega o nome da categoria do atributo data-categoria
      carregarProdutos(categoriaSelecionada); // Chama a função com a categoria selecionada
    });
  });

  // Carrega todos os produtos ao iniciar a página (sem filtro)
  carregarProdutos();

  // Atualizar contador do carrinho no topo (mantido do seu código original)
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  document.getElementById("cart-count").textContent = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
});
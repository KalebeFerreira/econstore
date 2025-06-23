document.addEventListener("DOMContentLoaded", async () => {
  const productGrid = document.getElementById("product-listing-grid");

  try {
    const res = await fetch("http://localhost:3001/api/products"); // ajuste a rota se necessário
    if (!res.ok) throw new Error("Erro ao buscar produtos");

    const produtos = await res.json();
    productGrid.innerHTML = ""; // limpa qualquer conteúdo anterior

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
});
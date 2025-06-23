document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return alert("ID do produto não fornecido");

  let produto = null;

  try {
    const res = await fetch(`http://localhost:3001/api/products/${id}`);
    if (!res.ok) throw new Error("Produto não encontrado");

    produto = await res.json();

    // Preenche os dados na página
    document.getElementById("nome-produto").textContent = produto.nome_produto;
    document.getElementById("imagem-produto").src = produto.imagem_url;
    document.getElementById("descricao-produto").textContent = produto.descricao;
    document.getElementById("preco-produto").textContent = Number(produto.preco).toFixed(2);
    document.getElementById("estoque-produto").textContent = produto.quantidade_estoque;
  } catch (err) {
    alert("Erro ao carregar produto.");
    console.error(err);
    return;
  }

  // Botão Comprar
  const btnComprar = document.getElementById("btn-comprar");
  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      if (!produto) return;

      const item = {
        id: produto.id_produto,
        nome: produto.nome_produto,
        preco: produto.preco,
        imagem: produto.imagem_url,
        quantidade: 1
      };

      let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

      const existente = carrinho.find(p => p.id === item.id);
      if (existente) {
        existente.quantidade += 1;
      } else {
        carrinho.push(item);
      }

      // SALVA o carrinho
      localStorage.setItem("carrinho", JSON.stringify(carrinho));

      // Redireciona para carrinho
      window.location.href = "carrinho.html";
    });
  }
});

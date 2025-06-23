document.addEventListener("DOMContentLoaded", () => {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const cartItemsSection = document.getElementById("cart-items-section");
  const emptyMessage = document.getElementById("empty-cart-message");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");

  if (carrinho.length === 0) {
    emptyMessage.style.display = "block";
    subtotalEl.textContent = "0.00";
    totalEl.textContent = "0.00";
    return;
  }

  cartItemsSection.innerHTML = ""; // limpa antes de renderizar

  let subtotal = 0;

  carrinho.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.dataset.productId = item.id;

    const precoTotal = item.preco * item.quantidade;
    subtotal += precoTotal;

itemEl.innerHTML = `
  <div class="cart-item">
    <img src="${item.imagem}" alt="${item.nome}" class="cart-item-image">
    <div class="cart-item-details">
      <h3 class="cart-item-title">${item.nome}</h3>
      <p class="cart-item-price-label">
        Preço: R$ <span class="cart-item-price">${Number(item.preco).toFixed(2)}</span>
      </p>
      <div class="cart-item-quantity-group">
        <label for="quantity-${index}">Quantidade:</label>
        <input type="number" id="quantity-${index}" value="${item.quantidade}" min="1"
          class="cart-item-quantity" data-index="${index}">
      </div>
    </div>
    <button class="remove-from-cart-btn" data-index="${index}">Remover</button>
  </div>
`;
    cartItemsSection.appendChild(itemEl);
  });

  subtotalEl.textContent = subtotal.toFixed(2);
  totalEl.textContent = subtotal.toFixed(2); // frete = 0

  // Atualizar quantidade
  document.querySelectorAll(".cart-item-quantity").forEach(input => {
    input.addEventListener("change", (e) => {
      const index = e.target.dataset.index;
      const novaQuantidade = parseInt(e.target.value);
      if (novaQuantidade > 0) {
        carrinho[index].quantidade = novaQuantidade;
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        location.reload(); // recarrega pra atualizar valores
      }
    });
  });

  // Remover produto
  document.querySelectorAll(".remove-from-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      carrinho.splice(index, 1);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      location.reload(); // recarrega carrinho
    });
  });

  // Atualizar contador do carrinho no topo
  document.getElementById("cart-count").textContent = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

  // Abrir modal ao clicar em "Finalizar Compra"
document.getElementById("checkout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("payment-modal").classList.remove("hidden");
});

// Cancelar pagamento
document.getElementById("cancel-payment-btn").addEventListener("click", () => {
  document.getElementById("payment-modal").classList.add("hidden");
});

// Confirmar pagamento
document.getElementById("confirm-payment-btn").addEventListener("click", () => {
  const numeroCartao = document.getElementById("card-number").value.trim();
  const senha = document.getElementById("card-password").value.trim();

  if (!numeroCartao || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  // Simula pagamento
  alert("Pagamento confirmado! Obrigado pela compra.");

  // Limpa carrinho
  localStorage.removeItem("carrinho");
  window.location.href = "index.html"; // ou redirecione para uma página de sucesso
});
});
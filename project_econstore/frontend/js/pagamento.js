document.addEventListener("DOMContentLoaded", () => {
  const btnFinalizar = document.getElementById("checkout-btn");
  const modal = document.createElement("div");

  // Criação do modal de pagamento com botão X
  modal.innerHTML = `
  <div style="
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Segoe UI', sans-serif;
  ">
    <div style="
      position: relative;
      background: #fff;
      padding: 30px;
      border-radius: 12px;
      width: 320px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      text-align: center;
    ">
      <span id="fechar-modal" style="
        position: absolute;
        top: 12px;
        right: 16px;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        color: #aaa;
        transition: color 0.3s;
      " onmouseover="this.style.color='#000'" onmouseout="this.style.color='#aaa'">&times;</span>

      <h3 style="
        font-size: 22px;
        margin-bottom: 25px;
        color: #111;
        letter-spacing: 1px;
      ">Pagamento</h3>

      <input type="text" id="numero-cartao" placeholder="Número Cartão" style="
        width: 100%;
        padding: 12px 10px;
        margin-bottom: 15px;
        border-radius: 6px;
        border: 1px solid #ccc;
        background-color: #f2f2f2;
        font-size: 14px;
        transition: border 0.3s;
      " onfocus="this.style.borderColor='#000'" onblur="this.style.borderColor='#ccc'">

      <input type="password" id="senha-cartao" placeholder="Senha Cartão" style="
        width: 100%;
        padding: 12px 10px;
        margin-bottom: 20px;
        border-radius: 6px;
        border: 1px solid #ccc;
        background-color: #f2f2f2;
        font-size: 14px;
        transition: border 0.3s;
      " onfocus="this.style.borderColor='#000'" onblur="this.style.borderColor='#ccc'">

      <button id="finalizar-pagamento" class="btn" style="
        width: 100%;
        padding: 12px;
        background-color: #000;
        color: #fff;
        font-weight: bold;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s;
      " onmouseover="this.style.backgroundColor='#333'" onmouseout="this.style.backgroundColor='#000'">
        FINALIZAR PAGAMENTO
      </button>
    </div>
  </div>
`;

  modal.style.display = "none";
  document.body.appendChild(modal);

  // Botão que exibe o modal
  btnFinalizar.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Botão "X" que fecha o modal
  modal.querySelector("#fechar-modal").addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Botão que finaliza o pagamento
  modal.querySelector("#finalizar-pagamento").addEventListener("click", async () => {
    const numeroCartao = document.getElementById("numero-cartao").value.trim();
    const senhaCartao = document.getElementById("senha-cartao").value.trim();

    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (!usuario || !usuario.id_usuario) {
      alert("Usuário não autenticado. Faça login para continuar.");
      return;
    }

    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    const status = (numeroCartao && senhaCartao) ? "aprovado" : "pendente";

    const pedido = {
      id_usuario: usuario.id_usuario,
      produtos: carrinho,
      total: carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0),
      status
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(pedido)
      });

      if (!res.ok) throw new Error("Erro ao salvar pedido.");

      alert(`Pedido ${status === "aprovado" ? "realizado com sucesso!" : "pendente de confirmação."}`);
      localStorage.removeItem("carrinho");
      window.location.href = "index.html";
    } catch (err) {
      alert("Produto selecionado sem estoque suficiente.");
      console.error(err);
    }
  });
});

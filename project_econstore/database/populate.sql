-- Script para população inicial do banco de dados Econstore (MySQL)

-- Inserir Categorias de Produtos
INSERT INTO `Categorias` (`nome_categoria`) VALUES
("Camisetas"),
("Calças"),
("Casacos"),
("Acessórios");

-- Inserir Usuários de Exemplo (um lojista e um cliente)
-- A senha 'senha123' deve ser substituída por um hash seguro no backend antes de inserir
INSERT INTO `Usuarios` (`nome_completo`, `cpf`, `telefone`, `email`, `senha`, `tipo_usuario`, `endereco_rua`, `endereco_numero`, `endereco_bairro`, `endereco_cidade`, `endereco_estado`, `endereco_cep`) VALUES
("Lojista Admin", "111.111.111-11", "(61) 99999-0001", "admin@econstore.com", "senha123Lojista", "lojista", "Rua da Loja", "10", "Centro", "Brasília", "DF", "70000-001"),
("Cliente Teste", "222.222.222-22", "(61) 98888-0002", "cliente@email.com", "senha123Cliente", "cliente", "Rua do Cliente", "20", "Asa Sul", "Brasília", "DF", "70000-002");

-- Inserir Produtos de Exemplo
INSERT INTO `Produtos` (`nome_produto`, `descricao`, `preco`, `quantidade_estoque`, `id_categoria`, `imagem_url`) VALUES
("Camiseta Básica Branca", "Camiseta de algodão, confortável e versátil.", 29.90, 50, (SELECT id_categoria FROM Categorias WHERE nome_categoria = "Camisetas"), "images/camiseta_branca.jpg"),
("Calça Jeans Slim", "Calça jeans com lavagem escura e corte slim.", 119.90, 30, (SELECT id_categoria FROM Categorias WHERE nome_categoria = "Calças"), "images/calca_jeans_slim.jpg"),
("Moletom Canguru Preto", "Moletom com capuz e bolso canguru, ideal para dias frios.", 89.90, 20, (SELECT id_categoria FROM Categorias WHERE nome_categoria = "Casacos"), "images/moletom_canguru.jpg"),
("Boné Trucker", "Boné estilo trucker com aba curva.", 45.00, 40, (SELECT id_categoria FROM Categorias WHERE nome_categoria = "Acessórios"), "images/bone_trucker.jpg");

-- Exemplo de Pedido (Opcional, apenas para demonstração inicial)
-- Supondo que o cliente com id_usuario = 2 fez um pedido
-- Primeiro, insere o pedido
INSERT INTO `Pedidos` (`id_usuario`, `status_pedido`, `valor_total`, `endereco_entrega_rua`, `endereco_entrega_numero`, `endereco_entrega_bairro`, `endereco_entrega_cidade`, `endereco_entrega_estado`, `endereco_entrega_cep`) VALUES
( (SELECT id_usuario FROM Usuarios WHERE email = "cliente@email.com"), "Pendente", 0.00, "Rua do Cliente", "20", "Asa Sul", "Brasília", "DF", "70000-002");

-- Pega o ID do último pedido inserido
SET @ultimo_pedido_id = LAST_INSERT_ID();

-- Insere itens nesse pedido
-- Item 1: Camiseta Básica Branca (ID do produto pode variar, aqui pegamos dinamicamente)
INSERT INTO `ItensPedido` (`id_pedido`, `id_produto`, `quantidade`, `preco_unitario`) VALUES
(@ultimo_pedido_id, (SELECT id_produto FROM Produtos WHERE nome_produto = "Camiseta Básica Branca"), 2, (SELECT preco FROM Produtos WHERE nome_produto = "Camiseta Básica Branca"));

-- Item 2: Calça Jeans Slim
INSERT INTO `ItensPedido` (`id_pedido`, `id_produto`, `quantidade`, `preco_unitario`) VALUES
(@ultimo_pedido_id, (SELECT id_produto FROM Produtos WHERE nome_produto = "Calça Jeans Slim"), 1, (SELECT preco FROM Produtos WHERE nome_produto = "Calça Jeans Slim"));

-- Atualiza o valor total do pedido
UPDATE `Pedidos` SET `valor_total` = (
    SELECT SUM(ip.quantidade * ip.preco_unitario)
    FROM `ItensPedido` ip
    WHERE ip.id_pedido = @ultimo_pedido_id
)
WHERE `id_pedido` = @ultimo_pedido_id;

-- Fim do script de população inicial


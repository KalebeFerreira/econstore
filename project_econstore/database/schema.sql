-- Script para criação da estrutura do banco de dados Econstore (MySQL)

-- Tabela de Usuários (Clientes e Lojistas/Administradores)
CREATE TABLE IF NOT EXISTS `Usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_completo` VARCHAR(255) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL UNIQUE, -- Formato XXX.XXX.XXX-XX
  `telefone` VARCHAR(20),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL, -- Armazenar hash da senha
  `tipo_usuario` ENUM('cliente', 'lojista') NOT NULL DEFAULT 'cliente',
  `endereco_rua` VARCHAR(255),
  `endereco_numero` VARCHAR(10),
  `endereco_complemento` VARCHAR(100),
  `endereco_bairro` VARCHAR(100),
  `endereco_cidade` VARCHAR(100),
  `endereco_estado` VARCHAR(2),
  `endereco_cep` VARCHAR(9), -- Formato XXXXX-XXX
  `data_cadastro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Categorias de Produtos
CREATE TABLE IF NOT EXISTS `Categorias` (
  `id_categoria` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_categoria` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS `Produtos` (
  `id_produto` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_produto` VARCHAR(255) NOT NULL,
  `descricao` TEXT,
  `preco` DECIMAL(10, 2) NOT NULL,
  `quantidade_estoque` INT NOT NULL DEFAULT 0,
  `id_categoria` INT,
  `imagem_url` VARCHAR(255), -- Caminho ou URL da imagem do produto
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_categoria`) REFERENCES `Categorias`(`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS `Pedidos` (
  `id_pedido` INT AUTO_INCREMENT PRIMARY KEY,
  `id_usuario` INT NOT NULL, -- Cliente que fez o pedido
  `data_pedido` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status_pedido` ENUM('Pendente', 'Processando', 'Em Preparação', 'Enviado', 'Entregue', 'Cancelado') NOT NULL DEFAULT 'Pendente',
  `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `endereco_entrega_rua` VARCHAR(255),
  `endereco_entrega_numero` VARCHAR(10),
  `endereco_entrega_complemento` VARCHAR(100),
  `endereco_entrega_bairro` VARCHAR(100),
  `endereco_entrega_cidade` VARCHAR(100),
  `endereco_entrega_estado` VARCHAR(2),
  `endereco_entrega_cep` VARCHAR(9),
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Itens do Pedido (Tabela de Junção para Pedidos e Produtos)
CREATE TABLE IF NOT EXISTS `ItensPedido` (
  `id_item_pedido` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pedido` INT NOT NULL,
  `id_produto` INT NOT NULL,
  `quantidade` INT NOT NULL,
  `preco_unitario` DECIMAL(10, 2) NOT NULL, -- Preço do produto no momento da compra
  FOREIGN KEY (`id_pedido`) REFERENCES `Pedidos`(`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_produto`) REFERENCES `Produtos`(`id_produto`) ON DELETE RESTRICT ON UPDATE CASCADE -- Evitar exclusão de produto se estiver em um pedido
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionando alguns índices para otimização de consultas
CREATE INDEX idx_produtos_nome ON Produtos(nome_produto);
CREATE INDEX idx_pedidos_status ON Pedidos(status_pedido);
CREATE INDEX idx_usuarios_email ON Usuarios(email);

-- Fim do script de criação de tabelas


// project_econstore/backend/__tests__/Produto.test.js

// Mockar o módulo de configuração do banco de dados (db.js).
jest.mock('../src/config/db');

// Importar o ProductModel para ser testado.
const ProductModel = require('../src/models/productModel');

// Importar a função mockada getPool e a função auxiliar _mockQueryResult do módulo db.js.
const { getPool } = require('../src/config/db');


// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O TESTE ---
const mockConnection = {
    query: jest.fn(),
    release: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
};

const mockPool = {
    getConnection: jest.fn(async () => mockConnection),
    query: jest.fn(), // Para queries diretas no pool
};

const mockDMLResult = (insertId = null, affectedRows = 0) => [
    { insertId, affectedRows },
    undefined
];

const mockSelectResult = (rows = []) => [
    rows,
    undefined
];
// --- FIM DAS DEFINIÇÕES DE MOCKS LOCAIS ---


describe('ProductModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getPool.mockResolvedValue(mockPool);

    mockPool.query.mockClear();
    mockPool.getConnection.mockClear();
    mockConnection.query.mockClear();
    mockConnection.release.mockClear();
    mockConnection.beginTransaction.mockClear();
    mockConnection.commit.mockClear();
    mockConnection.rollback.mockClear();
  });

  describe('createProduct', () => {
    test('deve criar um produto com sucesso e retornar seu ID e nome', async () => {
      mockPool.query.mockResolvedValueOnce(mockDMLResult(101, 1));

      const productData = {
        nome_produto: 'Novo Produto Teste',
        descricao: 'Descrição do produto teste',
        preco: 99.99,
        quantidade_estoque: 50,
        id_categoria: 1,
        imagem_url: 'http://example.com/imagem.jpg'
      };

      const result = await ProductModel.createProduct(productData);

      expect(getPool).toHaveBeenCalledTimes(1);
      // CORRIGIDO: Usando a string SQL exata do template literal do ProductModel.js
      expect(mockPool.query).toHaveBeenCalledWith(
        `
            INSERT INTO Produtos (nome_produto, descricao, preco, quantidade_estoque, id_categoria, imagem_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          productData.nome_produto,
          productData.descricao,
          productData.preco,
          productData.quantidade_estoque,
          productData.id_categoria,
          productData.imagem_url
        ]
      );
      expect(result).toEqual({ id_produto: 101, nome_produto: productData.nome_produto });
    });

    test('deve lançar um erro se a criação do produto falhar', async () => {
      const mockError = new Error('Erro de conexão com o banco de dados');
      mockPool.query.mockRejectedValueOnce(mockError);

      const productData = { /* dados de qualquer produto */ };

      await expect(ProductModel.createProduct(productData)).rejects.toThrow(mockError);
    });
  });

  // --- NOVOS TESTES PARA ProductModel.updateProduct ---
  describe('updateProduct', () => {
    test('1. deve atualizar um produto com sucesso e retornar true', async () => {
      // Cenário: Atualizar um produto existente com novos dados (RF1, RN1).
      const productId = 1;
      const productData = {
        nome_produto: 'Calça Cargo Atualizada',
        descricao: 'Descrição nova da calça cargo',
        preco: 160.00,
        quantidade_estoque: 15,
        id_categoria: 2,
        imagem_url: 'url_cargo_nova.jpg'
      };

      // Mockar o mockPool.query para simular uma atualização bem-sucedida (1 linha afetada).
      mockPool.query.mockResolvedValueOnce(mockDMLResult(null, 1)); // affectedRows = 1

      const result = await ProductModel.updateProduct(productId, productData);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query UPDATE foi chamada com os dados e ID corretos.
      expect(mockPool.query).toHaveBeenCalledWith(
        `
            UPDATE Produtos SET 
            nome_produto = ?, 
            descricao = ?, 
            preco = ?, 
            quantidade_estoque = ?, 
            id_categoria = ?, 
            imagem_url = ?
            WHERE id_produto = ?
        `,
        [
          productData.nome_produto,
          productData.descricao,
          productData.preco,
          productData.quantidade_estoque,
          productData.id_categoria,
          productData.imagem_url,
          productId
        ]
      );
      // Verificar se a função retornou true, indicando sucesso.
      expect(result).toBe(true);
    });

    test('2. deve retornar false se o produto não for encontrado para atualização', async () => {
      // Cenário: Tentar atualizar um produto com um ID que não existe.
      const nonExistentProductId = 999;
      const productData = {
        nome_produto: 'Produto Não Existente',
        descricao: 'Dados para atualização',
        preco: 10.00,
        quantidade_estoque: 1,
        id_categoria: 1,
        imagem_url: 'url.jpg'
      };

      // Mockar o mockPool.query para simular que nenhuma linha foi afetada (produto não encontrado).
      mockPool.query.mockResolvedValueOnce(mockDMLResult(null, 0)); // affectedRows = 0

      const result = await ProductModel.updateProduct(nonExistentProductId, productData);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query UPDATE foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `
            UPDATE Produtos SET 
            nome_produto = ?, 
            descricao = ?, 
            preco = ?, 
            quantidade_estoque = ?, 
            id_categoria = ?, 
            imagem_url = ?
            WHERE id_produto = ?
        `,
        [
          productData.nome_produto,
          productData.descricao,
          productData.preco,
          productData.quantidade_estoque,
          productData.id_categoria,
          productData.imagem_url,
          nonExistentProductId
        ]
      );
      // Verificar se a função retornou false, indicando que não foi atualizado.
      expect(result).toBe(false);
    });

    test('3. deve lançar um erro em caso de falha genérica do banco de dados', async () => {
      // Cenário: Ocorre um erro inesperado durante a atualização no banco de dados.
      const productId = 1;
      const productData = { /* quaisquer dados */ };
      const mockError = new Error('Erro de conexão no DB durante update');

      // Configurar o mockPool.query para rejeitar com o erro mockado.
      mockPool.query.mockRejectedValueOnce(mockError);

      // Esperar que a função updateProduct lance o erro mockado.
      await expect(ProductModel.updateProduct(productId, productData)).rejects.toThrow(mockError);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query UPDATE foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `
            UPDATE Produtos SET 
            nome_produto = ?, 
            descricao = ?, 
            preco = ?, 
            quantidade_estoque = ?, 
            id_categoria = ?, 
            imagem_url = ?
            WHERE id_produto = ?
        `,
        [
          productData.nome_produto,
          productData.descricao,
          productData.preco,
          productData.quantidade_estoque,
          productData.id_categoria,
          productData.imagem_url,
          productId
        ]
      );
    });
  });

  // --- NOVOS TESTES PARA ProductModel.deleteProduct ---
  describe('deleteProduct', () => {
    test('1. deve deletar um produto com sucesso e retornar true', async () => {
      // Cenário: Excluir um produto que existe e não está associado a pedidos (RF1, RN1).
      const productId = 1;

      // Mockar o mockPool.query para simular uma exclusão bem-sucedida (1 linha afetada).
      mockPool.query.mockResolvedValueOnce(mockDMLResult(null, 1)); // affectedRows = 1

      const result = await ProductModel.deleteProduct(productId);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query DELETE foi chamada com o ID correto.
      expect(mockPool.query).toHaveBeenCalledWith(
        `DELETE FROM Produtos WHERE id_produto = ?`,
        [productId]
      );
      // Verificar se a função retornou true, indicando sucesso.
      expect(result).toBe(true);
    });

    test('2. deve retornar false se o produto não for encontrado para exclusão', async () => {
      // Cenário: Tentar excluir um produto com um ID que não existe.
      const nonExistentProductId = 999;

      // Mockar o mockPool.query para simular que nenhuma linha foi afetada (produto não encontrado).
      mockPool.query.mockResolvedValueOnce(mockDMLResult(null, 0)); // affectedRows = 0

      const result = await ProductModel.deleteProduct(nonExistentProductId);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query DELETE foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `DELETE FROM Produtos WHERE id_produto = ?`,
        [nonExistentProductId]
      );
      // Verificar se a função retornou false.
      expect(result).toBe(false);
    });

    test('3. deve lançar erro se o produto estiver associado a um pedido (chave estrangeira)', async () => {
      // Cenário: Tentar excluir um produto que está referenciado em outro lugar (ex: um pedido).
      // Isso geralmente gera um erro de integridade referencial no banco de dados (ER_ROW_IS_REFERENCED_2).
      const productId = 1;
      const mockError = new Error('Cannot delete or update a parent row: a foreign key constraint fails (`econstore_db`.`ItensPedido`, CONSTRAINT `itenspedido_ibfk_2` FOREIGN KEY (`id_produto`) REFERENCES `Produtos` (`id_produto`) ON DELETE RESTRICT ON UPDATE CASCADE)');
      mockError.code = 'ER_ROW_IS_REFERENCED_2'; // Código de erro específico do MySQL para chave estrangeira

      mockPool.query.mockRejectedValueOnce(mockError);

      // Esperar que a função lance um erro com a mensagem customizada do model.
      await expect(ProductModel.deleteProduct(productId)).rejects.toThrow(
        "Não é possível excluir o produto pois ele está associado a um ou mais pedidos."
      );

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query DELETE foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `DELETE FROM Produtos WHERE id_produto = ?`,
        [productId]
      );
    });

    test('4. deve lançar um erro em caso de falha genérica do banco de dados', async () => {
      // Cenário: Ocorre um erro inesperado durante a exclusão no banco de dados.
      const productId = 1;
      const mockError = new Error('Erro de conexão no DB durante delete');
      mockError.code = 'SOME_OTHER_DB_ERROR'; // Outro código de erro qualquer

      mockPool.query.mockRejectedValueOnce(mockError);

      // Esperar que a função deleteProduct lance o erro original do DB.
      await expect(ProductModel.deleteProduct(productId)).rejects.toThrow(mockError);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query DELETE foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `DELETE FROM Produtos WHERE id_produto = ?`,
        [productId]
      );
    });
  });
  
  // --- NOVOS TESTES PARA ProductModel.getProductById ---
  describe('getProductById', () => {
    test('1. deve retornar um produto existente por ID', async () => {
      // Cenário: Buscar um produto que existe no banco de dados.
      const mockProduct = { id_produto: 1, nome_produto: 'Calça Cargo', preco: 150.00, quantidade_estoque: 10, id_categoria: 2, nome_categoria: 'Calças', imagem_url: 'url_cargo.jpg' };
      const productId = 1;

      // Configurar o mockPool.query para retornar o produto mockado.
      // Note que ProductModel.getProductById espera um array com um único produto.
      mockPool.query.mockResolvedValueOnce(mockSelectResult([mockProduct]));

      const product = await ProductModel.getProductById(productId);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query SELECT foi chamada com a condição WHERE para id_produto.
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE p.id_produto = ?`,
        [productId]
      );
      // Verificar se a função retornou o produto esperado.
      expect(product).toEqual(mockProduct);
    });

    test('2. deve retornar undefined se o produto não for encontrado', async () => {
      // Cenário: Buscar um produto com um ID que não existe.
      const nonExistentProductId = 999;

      // Configurar o mockPool.query para retornar um array vazio (produto não encontrado).
      mockPool.query.mockResolvedValueOnce(mockSelectResult([]));

      const product = await ProductModel.getProductById(nonExistentProductId);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query SELECT foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE p.id_produto = ?`,
        [nonExistentProductId]
      );
      // Verificar se a função retornou undefined.
      expect(product).toBeUndefined();
    });

    test('3. deve lançar um erro em caso de falha genérica do banco de dados', async () => {
      // Cenário: Ocorre um erro inesperado durante a consulta ao banco de dados.
      const productId = 1;
      const mockError = new Error('Erro de conexão no DB');

      // Configurar o mockPool.query para rejeitar com o erro mockado.
      mockPool.query.mockRejectedValueOnce(mockError);

      // Esperar que a função getProductById lance o erro mockado.
      await expect(ProductModel.getProductById(productId)).rejects.toThrow(mockError);

      // Verificar se getPool foi chamado.
      expect(getPool).toHaveBeenCalledTimes(1);
      // Verificar se a query SELECT foi chamada.
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE p.id_produto = ?`,
        [productId]
      );
    });
  });


  // --- NOVOS TESTES PARA ProductModel.getAllProducts ---
 // --- NOVOS TESTES PARA ProductModel.getAllProducts ---
 // --- NOVOS TESTES PARA ProductModel.getAllProducts ---
  describe('getAllProducts', () => { // <<< ABERTURA DO BLOCO PAI 'getAllProducts' >>>

    test('1. deve retornar todos os produtos sem filtros', async () => {
      const mockProducts = [
        { id_produto: 1, nome_produto: 'Camiseta Básica', preco: 29.90, quantidade_estoque: 50, id_categoria: 1, nome_categoria: 'Camisetas', imagem_url: 'url_camiseta.jpg' },
        { id_produto: 2, nome_produto: 'Calça Jeans', preco: 119.90, quantidade_estoque: 30, id_categoria: 2, nome_categoria: 'Calças', imagem_url: 'url_calca.jpg' },
      ];

      mockPool.query.mockResolvedValueOnce(mockSelectResult(mockProducts));

      const products = await ProductModel.getAllProducts();

      expect(getPool).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE 1=1`,
        []
      );
      expect(products).toEqual(mockProducts);
    }); // <<< FIM DO TESTE 1 >>>

    test('2. deve retornar produtos filtrados por categoria', async () => {
      const mockProducts = [
        { id_produto: 1, nome_produto: 'Camiseta Esportiva', preco: 79.90, quantidade_estoque: 20, id_categoria: 1, nome_categoria: 'Camisetas', imagem_url: 'url_esportiva.jpg' },
        { id_produto: 3, nome_produto: 'Camiseta Regata', preco: 39.90, quantidade_estoque: 15, id_categoria: 1, nome_categoria: 'Camisetas', imagem_url: 'url_regata.jpg' },
      ];
      const categoryFilter = 'Camisetas';

      mockPool.query.mockResolvedValueOnce(mockSelectResult(mockProducts));

      const filters = { categoria: categoryFilter };
      const products = await ProductModel.getAllProducts(filters);

      expect(getPool).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE 1=1 AND c.nome_categoria = ?`,
        [categoryFilter]
      );
      expect(products).toEqual(mockProducts);
    }); // <<< FIM DO TESTE 2 >>>

    test('3. deve retornar produtos filtrados por nome', async () => {
      const mockProducts = [
        { id_produto: 1, nome_produto: 'Camiseta Esportiva', preco: 79.90, quantidade_estoque: 20, id_categoria: 1, nome_categoria: 'Camisetas', imagem_url: 'url_esportiva.jpg' },
      ];
      const nameFilter = 'Esportiva';

      mockPool.query.mockResolvedValueOnce(mockSelectResult(mockProducts));

      const filters = { nome_produto: nameFilter };
      const products = await ProductModel.getAllProducts(filters);

      expect(getPool).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE 1=1 AND p.nome_produto LIKE ?`,
        [`%${nameFilter}%`]
      );
      expect(products).toEqual(mockProducts);
    }); // <<< FIM DO TESTE 3 >>>

    // <<<< ESTE É O LOCAL CORRETO PARA O TESTE 4 (fora dos outros tests) >>>>
    test('4. deve retornar um array vazio se nenhum produto for encontrado', async () => {
      const mockProducts = [];

      mockPool.query.mockResolvedValueOnce(mockSelectResult(mockProducts));

      const products = await ProductModel.getAllProducts();

      expect(getPool).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE 1=1`,
        []
      );
      expect(products).toEqual([]);
      expect(products.length).toBe(0);
    }); // <<< FIM DO TESTE 4 >>>

    // <<<< ESTE É O LOCAL CORRETO PARA O TESTE 5 (fora dos outros tests) >>>>
    test('5. deve lançar um erro em caso de falha genérica do banco de dados', async () => {
      const mockError = new Error('Erro de conexão com o banco de dados');

      mockPool.query.mockRejectedValueOnce(mockError);

      await expect(ProductModel.getAllProducts()).rejects.toThrow(mockError);

      expect(getPool).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE 1=1`,
        []
      );
    }); // <<< FIM DO TESTE 5 >>>

  }); // <<< FECHAMENTO DO BLOCO PAI 'getAllProducts' >>>

});
# Projeto Econstore - Aplicação Web Full Stack

## 1. Descrição do Projeto

A Econstore é uma aplicação web full stack desenvolvida para simular uma pequena loja virtual de roupas. O sistema permite o cadastro e gerenciamento de produtos, controle de estoque, cadastro e autenticação de clientes e lojistas, carrinho de compras, e uma área administrativa para gestão da loja. Este projeto foi desenvolvido seguindo os requisitos e protótipos fornecidos, com foco na simplicidade operacional e usabilidade.

## 2. Tecnologias Utilizadas

*   **Linguagem de Programação:** JavaScript (ES6+)
*   **Backend:** Node.js com o framework Express.js
*   **Frontend:** HTML5 e CSS3 puro (sem frameworks ou bibliotecas adicionais)
*   **Banco de Dados:** MySQL
*   **Modelagem e Gerenciamento de BD:** Scripts SQL (equivalente ao uso do MySQL Workbench para modelagem)
*   **Controle de Versão (simulado):** Estrutura de pastas e arquivos organizados.
*   **IDE (utilizada no desenvolvimento):** (Não aplicável ao agente, mas seria VS Code ou similar)

## 3. Estrutura de Pastas do Projeto

O projeto está organizado da seguinte forma:

```
project_econstore/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuração do banco de dados (db.js)
│   │   ├── controllers/    # Lógica de controle das rotas (authController.js, productController.js, etc.)
│   │   ├── middlewares/    # Middlewares (authMiddleware.js)
│   │   ├── models/         # Interação com o banco de dados (userModel.js, productModel.js, etc.)
│   │   ├── routes/         # Definição das rotas da API (authRoutes.js, productRoutes.js, etc.)
│   │   └── server.js       # Arquivo principal do servidor Express
│   ├── .env                # Arquivo de variáveis de ambiente (NÃO INCLUIR NO GIT REAL)
│   └── package.json        # Dependências e scripts do backend
├── database/
│   ├── schema.sql          # Script SQL para criar a estrutura do banco de dados
│   └── populate.sql        # Script SQL para popular o banco com dados iniciais
├── frontend/
│   ├── css/
│   │   ├── style.css       # Estilos globais do frontend
│   │   └── admin_style.css # Estilos específicos para a área administrativa
│   ├── images/             # Imagens de exemplo para produtos (placeholders)
│   ├── js/                 # Scripts JavaScript do frontend (login.js, produtos.js, etc. - não implementados neste escopo)
│   ├── admin_menu.html
│   ├── admin_gerenciar_categorias.html (Não implementado, mas estrutura pronta)
│   ├── admin_gerenciar_pedidos.html (Não implementado, mas estrutura pronta)
│   ├── admin_gerenciar_produtos.html (Não implementado, mas estrutura pronta)
│   ├── carrinho.html
│   ├── cadastro.html
│   ├── index.html
│   ├── login_funcionario.html
│   ├── login.html
│   ├── minha_conta.html (Não implementado, mas estrutura pronta)
│   ├── pagamento.html
│   └── produtos.html
├── todo.md                 # Checklist de desenvolvimento (uso interno do agente)
└── README.md               # Este arquivo
```

## 4. Pré-requisitos

Antes de executar a aplicação, certifique-se de ter instalado:

*   Node.js (versão 14.x ou superior)
*   npm (geralmente vem com o Node.js)
*   Servidor MySQL (versão 5.7 ou superior) e um cliente MySQL (como MySQL CLI, MySQL Workbench, DBeaver, etc.) para executar os scripts SQL.

## 5. Configuração do Banco de Dados

1.  **Acesse o MySQL:** Conecte-se ao seu servidor MySQL usando um cliente de sua preferência.
2.  **Crie o Banco de Dados (Opcional):**
    O backend tentará criar o banco de dados `econstore_db` automaticamente se ele não existir (conforme definido em `backend/src/config/db.js`). No entanto, o usuário MySQL utilizado pelo backend precisa ter permissões para criar bancos de dados.
    Caso prefira criar manualmente ou se houver problemas de permissão, execute:
    ```sql
    CREATE DATABASE IF NOT EXISTS econstore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    USE econstore_db;
    ```
3.  **Execute os Scripts SQL:**
    Navegue até a pasta `database/` do projeto.
    *   Execute o script `schema.sql` para criar todas as tabelas e seus relacionamentos:
        ```bash
        # Exemplo usando o cliente mysql command-line
        mysql -u seu_usuario -p econstore_db < schema.sql
        ```
        (Substitua `seu_usuario` pelo seu nome de usuário do MySQL. Você será solicitado a inserir a senha.)
    *   Execute o script `populate.sql` para inserir dados iniciais (categorias, usuários de exemplo, produtos):
        ```bash
        mysql -u seu_usuario -p econstore_db < populate.sql
        ```

## 6. Configuração e Execução do Backend

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend
    ```
2.  **Crie o arquivo de variáveis de ambiente:**
    Copie o arquivo `.env.example` (se existisse, neste caso crie um novo) para `.env` ou crie um arquivo `.env` na raiz da pasta `backend/` com o seguinte conteúdo, ajustando os valores conforme necessário:
    ```env
    PORT=3001
    DB_HOST=localhost
    DB_USER=seu_usuario_mysql # Ex: root
    DB_PASSWORD=sua_senha_mysql # Ex: admin
    DB_NAME=econstore_db
    JWT_SECRET=umaChaveSecretaMuitoForteParaSeusTokensJWT
    ```
    **Importante:** Substitua `seu_usuario_mysql`, `sua_senha_mysql` e `umaChaveSecretaMuitoForteParaSeusTokensJWT` pelos seus valores reais. A `JWT_SECRET` deve ser uma string longa e aleatória para segurança.

3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Inicie o servidor backend:**
    ```bash
    npm start
    ```
    (O script `start` no `package.json` geralmente executa `node src/server.js`)
    O servidor deverá estar rodando em `http://localhost:3001`.

## 7. Execução do Frontend

1.  **Navegue até a pasta do frontend:**
    ```bash
    cd frontend
    ```
2.  **Abra os arquivos HTML no Navegador:**
    Não há um passo de build para o frontend, pois ele é composto por HTML e CSS puros.
    Abra o arquivo `index.html` (ou qualquer outro arquivo HTML da pasta `frontend/`) diretamente no seu navegador web (ex: Chrome, Firefox, Edge).
    *   Exemplo: `file:///caminho/completo/para/project_econstore/frontend/index.html`

3.  **Interação com o Backend:**
    Os arquivos JavaScript do frontend (que não foram implementados neste escopo, mas seriam colocados na pasta `frontend/js/`) fariam requisições AJAX (usando `fetch` API, por exemplo) para a API backend em `http://localhost:3001/api/...`.

## 8. Funcionalidades Implementadas (Visão Geral)

*   **Autenticação:**
    *   Cadastro de Clientes e Lojistas.
    *   Login para Clientes e Lojistas (com geração de token JWT).
    *   Middleware de autenticação e autorização para rotas protegidas.
*   **Produtos:**
    *   CRUD (Criar, Ler, Atualizar, Deletar) de produtos (restrito a lojistas).
    *   Listagem de produtos com filtros básicos (ex: por categoria, nome).
    *   Visualização de detalhes de um produto.
*   **Categorias:**
    *   CRUD de categorias de produtos (restrito a lojistas).
*   **Banco de Dados:**
    *   Estrutura de tabelas para Usuários, Produtos, Categorias, Pedidos, Itens do Pedido.
    *   Scripts para criação e população inicial.
*   **Frontend (Estrutura HTML/CSS):**
    *   Páginas para Login (cliente e funcionário), Cadastro, Início (Home), Lista de Produtos, Carrinho, Pagamento.
    *   Estrutura para painel administrativo (Menu Admin).
    *   Estilização básica e responsiva.

## 9. Observações

*   **Senhas:** As senhas no script `populate.sql` são exemplos (`senha123Lojista`, `senha123Cliente`). No backend, durante o cadastro, as senhas são armazenadas com hash usando `bcryptjs`.
*   **Testes Automatizados:** Conforme a solicitação, não foram implementados testes automatizados neste projeto.
*   **JavaScript do Frontend:** A lógica de interação dinâmica do frontend (como chamadas à API, manipulação do DOM avançada, validações de formulário no lado do cliente) não foi implementada nos arquivos `.js` dentro da pasta `frontend/js/`. As páginas HTML contêm a estrutura e os links para esses scripts, mas os arquivos `.js` em si estão vazios ou contêm apenas código de exemplo básico para estrutura.
*   **Funcionalidades de Pedidos e Relatórios:** As rotas e a lógica completa para gerenciamento de pedidos (RF3) e geração de relatórios (RF6) no backend, bem como as respectivas telas no frontend, foram parcialmente estruturadas mas não completamente implementadas devido ao escopo e tempo.

---

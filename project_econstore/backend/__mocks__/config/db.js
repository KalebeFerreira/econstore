// backend/__mocks__/config/db.js

const mockQueryResult = (rows = [], affectedRows = 0, insertId = null) => [
  rows,
  { affectedRows, insertId }
];

const mockConnection = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  getConnection: jest.fn(async () => mockConnection),
  query: jest.fn(),
};

const getPool = jest.fn(async () => mockPool);

module.exports = {
  getPool,
  // Exporta as mocks para que Produto.test.js possa acessá-las
  _mockQueryResult: mockQueryResult,
  _mockConnection: mockConnection,
  _mockPool: mockPool,
};
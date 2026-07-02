module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/test/**'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/test/styleMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
}

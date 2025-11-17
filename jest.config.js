module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: ".",

  collectCoverageFrom: [
    "src/**/*.ts",
    '!src/**/*.dto.ts' // ✅ excluye los DTOs
  ],

  setupFiles: [
    './test/setEnvVars.ts'
  ],

  testMatch: [
    "**/test/**/*.steps.ts", // Archivos de pruebas BDD (jest-cucumber)
    "**/test/**/*.test.ts",  // Archivos unitarios terminados en .test.ts
    "**/test/**/*.spec.ts",  // Archivos unitarios terminados en .spec.ts
    "**/test/**/*.e2e-spec.ts",  // Archivos end to end .e2s-spec.ts
  ],

  coveragePathIgnorePatterns: [
    'main.ts', // Ignora el archivo main.ts
    'src/.*\\.entity.ts$', // Ignora todos los archivos que terminan en .entities.ts
    'src/common/domain/constants/', // Ignora todo el contenido de la carpeta constants
    'src/encounter/domain/constants/', // Ignora todo el contenido de la carpeta constants
  ],
  
  coverageDirectory: "./coverage",
  verbose: true, // Muestra detalles de los tests en consola

  transform: {
    "^.+\\.(ts|tsx|js)$": "ts-jest",
  },
};

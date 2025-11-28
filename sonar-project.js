require('dotenv').config(); // Opcional si usas .env localmente

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sonarqubeScanner = require('sonarqube-scanner').default;

sonarqubeScanner(
  {
    options: {
      'sonar.projectKey': process.env.SONAR_PROJECT_KEY,
      'sonar.projectName': process.env.SONAR_PROJECT_NAME,
      'sonar.projectVersion': process.env.SONAR_PROJECT_VERSION,
      'sonar.sources': 'src',
      'sonar.exclusions': '**/*.dto.ts,src/main.ts,**/*.entity.ts,src/common/domain/constants/**',
      'sonar.tests': 'test',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.sourceEncoding': 'UTF-8',
      'sonar.qualitygate.wait': true,
      'sonar.host.url': process.env.SONAR_HOST_URL,
      'sonar.login': process.env.SONAR_TOKEN,
    },
  },
  (error) => {
    if (error) {
      console.error('Error ejecutando el análisis de SonarQube:', error);
      console.error('Detalles del error:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      process.exit(1);
    }
    console.log('Análisis de SonarQube completado exitosamente');
  }
);

import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ngolab Express API',
      version: '1.0.0',
      description: 'API untuk backend Ngolab Express',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    paths: {},
    components: {
      schemas: {},
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
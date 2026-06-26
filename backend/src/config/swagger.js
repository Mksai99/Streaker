import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Streakify API',
      version: '1.0.0',
      description: 'QR-based Customer Loyalty & Streak Management Platform API',
      contact: { name: 'Streakify Support', email: 'support@streakify.com' }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.streakify.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);

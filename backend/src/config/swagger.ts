import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduFlow LMS API',
      version: '1.0.0',
      description:
        'Complete REST API for the EduFlow Learning Management System. Supports Admin, Mentor and Student roles with role-based access control.',
      contact: { name: 'EduFlow LMS' },
    },
    servers: [{ url: env.apiUrl, description: 'API server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

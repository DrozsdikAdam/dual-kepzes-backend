import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || 3000;

const options: swaggerJsdoc.Options = {
     definition: {
          openapi: '3.0.0',
          info: {
               title: 'Duális Képzés Backend API',
               version: '1.0.0',
               description: 'API documentation for the Dual Education platform',
          },
          servers: [
               {
                    url: `http://localhost:${port}`,
                    description: 'Development server',
               },
          ],
          components: {
               securitySchemes: {
                    bearerAuth: {
                         type: 'http',
                         scheme: 'bearer',
                         bearerFormat: 'JWT',
                    },
               },
          },
     },
     apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

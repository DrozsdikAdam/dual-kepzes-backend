import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || 3000;

const options: swaggerJsdoc.Options = {
     definition: {
          openapi: '3.0.0',
          info: {
               title: 'Dualis Kepzes Backend API',
               version: '1.0.0',
               description: 'API documentation for the Dual Education platform',
          },
          servers: [
               {
                    url: '/',
                    description: 'Current server (Relative)',
               },
               {
                    url: `http://localhost:${port}`,
                    description: 'Local development server',
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
               schemas: {
                    CreateNews: {
                         type: 'object',
                         required: ['title', 'content', 'targetGroup'],
                         properties: {
                              title: { type: 'string' },
                              content: { type: 'string' },
                              isImportant: { type: 'boolean', default: false },
                              targetGroup: { type: 'string', enum: ['STUDENT', 'ALL'] },
                              tags: { type: 'array', items: { type: 'string' } }
                         }
                    },
                    UpdateNews: {
                         type: 'object',
                         properties: {
                              title: { type: 'string' },
                              content: { type: 'string' },
                              isImportant: { type: 'boolean' },
                              targetGroup: { type: 'string', enum: ['STUDENT', 'ALL'] },
                              tags: { type: 'array', items: { type: 'string' } }
                         }
                    },
                    CreateApplication: {
                         type: 'object',
                         required: ['positionId'],
                         properties: {
                              positionId: { type: 'string', format: 'uuid' }
                         }
                    },
                    EvaluateApplication: {
                         type: 'object',
                         required: ['status'],
                         properties: {
                              status: { type: 'string', enum: ['ACCEPTED', 'REJECTED', 'NO_RESPONSE'] },
                              companyNote: { type: 'string' }
                         },
                         description: 'ACCEPTED status creates a dual partnership automatically unless the student already has an active or pending one.'
                    },
                    UpdateEvaluation: {
                         type: 'object',
                         required: ['status'],
                         properties: {
                              status: { type: 'string', enum: ['SUBMITTED', 'ACCEPTED', 'REJECTED', 'NO_RESPONSE'] },
                              companyNote: { type: 'string' }
                         }
                    },
                    CreatePosition: {
                         type: 'object',
                         required: ['companyId', 'title', 'locationId'],
                         properties: {
                              companyId: { type: 'string', format: 'uuid' },
                              title: { type: 'string' },
                              description: { type: 'string' },
                              majorId: { type: 'string', format: 'uuid' },
                              locationId: { type: 'string', format: 'uuid' },
                              type: { type: 'string', enum: ['DUAL', 'PROFESSIONAL_PRACTICE', 'REGULAR_WORK'], default: 'DUAL' },
                              deadline: { type: 'string', format: 'date-time' },
                              tags: {
                                   type: 'array',
                                   items: {
                                        type: 'object',
                                        properties: {
                                             name: { type: 'string' },
                                             category: { type: 'string' }
                                        }
                                   }
                              }
                         }
                    },
                    UpdatePosition: {
                         type: 'object',
                         properties: {
                              title: { type: 'string' },
                              description: { type: 'string' },
                              majorId: { type: 'string', format: 'uuid' },
                              locationId: { type: 'string', format: 'uuid' },
                              type: { type: 'string', enum: ['DUAL', 'PROFESSIONAL_PRACTICE', 'REGULAR_WORK'] },
                              deadline: { type: 'string', format: 'date-time' },
                              tags: {
                                   type: 'array',
                                   items: {
                                        type: 'object',
                                        properties: {
                                             name: { type: 'string' },
                                             category: { type: 'string' }
                                        }
                                   }
                              }
                         }
                    },
                    CreateCompany: {
                         type: 'object',
                         required: ['name', 'taxId', 'contactName', 'contactEmail'],
                         properties: {
                              name: { type: 'string' },
                              taxId: { type: 'string' },
                              description: { type: 'string' },
                              contactName: { type: 'string' },
                              contactEmail: { type: 'string', format: 'email' },
                              website: { type: 'string', format: 'uri', nullable: true },
                              logoUrl: { type: 'string', format: 'uri' },
                              hasOwnApplication: { type: 'boolean', default: false },
                              externalApplicationUrl: { type: 'string', format: 'uri', nullable: true },
                              locations: {
                                   type: 'array',
                                   items: {
                                        type: 'object',
                                        properties: {
                                             id: { type: 'string', format: 'uuid' },
                                             country: { type: 'string' },
                                             zipCode: { type: 'number' },
                                             city: { type: 'string' },
                                             address: { type: 'string' }
                                        }
                                   }
                              }
                         }
                    },
                    UpdateCompany: {
                         type: 'object',
                         properties: {
                              name: { type: 'string' },
                              taxId: { type: 'string' },
                              description: { type: 'string' },
                              contactName: { type: 'string' },
                              contactEmail: { type: 'string', format: 'email' },
                              website: { type: 'string', format: 'uri', nullable: true },
                              logoUrl: { type: 'string', format: 'uri' },
                              hasOwnApplication: { type: 'boolean' },
                              externalApplicationUrl: { type: 'string', format: 'uri', nullable: true },
                              locations: {
                                   type: 'array',
                                   items: {
                                        type: 'object',
                                        properties: {
                                             id: { type: 'string', format: 'uuid' },
                                             country: { type: 'string' },
                                             zipCode: { type: 'number' },
                                             city: { type: 'string' },
                                             address: { type: 'string' }
                                        }
                                   }
                              }
                         }
                    },
                    UpdateStudent: {
                         type: 'object',
                         properties: {
                              fullName: { type: 'string' },
                              phoneNumber: { type: 'string' },
                              neptunCode: { type: 'string' },
                              majorId: { type: 'string', format: 'uuid' },
                              mothersName: { type: 'string' },
                              highSchool: { type: 'string' },
                              graduationYear: { type: 'number' },
                              studyMode: { type: 'string' },
                              location: {
                                   type: 'object',
                                   properties: {
                                        country: { type: 'string' },
                                        zipCode: { type: 'string' },
                                        city: { type: 'string' },
                                        address: { type: 'string' }
                                   }
                              }
                         }
                    },
                    CreateNotification: {
                         type: 'object',
                         required: ['userId', 'title', 'message', 'type'],
                         properties: {
                              userId: { type: 'string', format: 'uuid' },
                              title: { type: 'string' },
                              message: { type: 'string' },
                              type: { type: 'string' }
                         }
                    },
                    UpdateUserBody: {
                         type: 'object',
                         properties: {
                              fullName: { type: 'string' },
                              phoneNumber: { type: 'string' },
                              email: { type: 'string', format: 'email' },
                              jobTitle: { type: 'string' },
                              companyId: { type: 'string', format: 'uuid' }
                         }
                    }
               }
          },
     },
     apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

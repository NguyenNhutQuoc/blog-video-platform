/**
 * Swagger/OpenAPI Configuration
 *
 * Provides OpenAPI 3.0 specification for API documentation.
 * Only available in non-production environments.
 */

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SwaggerConfig {
  title: string;
  version: string;
  description: string;
  basePath: string;
}

/**
 * Create Swagger/OpenAPI specification
 */
export function createSwaggerSpec(config?: Partial<SwaggerConfig>) {
  const {
    title = 'Blog Video Platform API',
    version = '1.0.0',
    description = 'API documentation for Blog Video Platform',
    basePath = '/api',
  } = config ?? {};

  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title,
        version,
        description,
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: basePath,
          description: 'API Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT access token',
          },
        },
        schemas: {
          // Common response schemas
          SuccessResponse: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
              data: {
                type: 'object',
              },
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false,
              },
              error: {
                type: 'object',
                properties: {
                  code: {
                    type: 'string',
                    example: 'ERROR_CODE',
                  },
                  message: {
                    type: 'string',
                    example: 'Error message',
                  },
                  details: {
                    type: 'object',
                  },
                },
              },
            },
          },
          // Auth schemas
          UserProfile: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              email: {
                type: 'string',
                format: 'email',
              },
              username: {
                type: 'string',
              },
              fullName: {
                type: 'string',
              },
              avatarUrl: {
                type: 'string',
                nullable: true,
              },
              bio: {
                type: 'string',
                nullable: true,
              },
              role: {
                type: 'string',
                enum: ['user', 'admin', 'moderator'],
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'suspended'],
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          AuthTokens: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
              },
              refreshToken: {
                type: 'string',
              },
              expiresIn: {
                type: 'number',
                description: 'Access token expiration time in seconds',
              },
            },
          },
          RegisterRequest: {
            type: 'object',
            required: ['email', 'username', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              username: {
                type: 'string',
                minLength: 3,
                maxLength: 30,
                example: 'johndoe',
              },
              password: {
                type: 'string',
                format: 'password',
                minLength: 8,
                example: 'SecurePass123!',
              },
              fullName: {
                type: 'string',
                example: 'John Doe',
              },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                example: 'SecurePass123!',
              },
            },
          },
          RefreshTokenRequest: {
            type: 'object',
            required: ['refreshToken'],
            properties: {
              refreshToken: {
                type: 'string',
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Health',
          description: 'Health check endpoints',
        },
        {
          name: 'Authentication',
          description: 'User authentication and session management',
        },
      ],
    },
    // Paths to files containing OpenAPI annotations
    apis: [
      path.join(__dirname, '../routes/*.ts'),
      path.join(__dirname, '../routes/*.js'),
      path.join(__dirname, '../app.ts'),
      path.join(__dirname, '../app.js'),
    ],
  };

  return swaggerJsdoc(options);
}

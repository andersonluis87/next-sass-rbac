import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

export function registerSwagger(app: FastifyInstance) {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'NEXT SASS RBAC',
        description: 'Boilerplate for Next.js, Sass, and RBAC',
        version: '1.0.0',
      },
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
    transform: jsonSchemaTransform,
  })

  app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
  })
}

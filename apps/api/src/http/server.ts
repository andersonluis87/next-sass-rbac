import ScalarApiReference from '@scalar/fastify-api-reference'

import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { env } from '@sass/env'
import { fastify, type FastifyReply, type FastifyRequest } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandler } from './error-handler.js'
import { registerRoutes } from './routes/register-routes.js'
import { registerSwagger } from './swagger/register-swagger.js'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

// Swagger API documentation
registerSwagger(app)

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors)

// routes
registerRoutes(app)

// Serve an OpenAPI file
app.get('/openapi.json', async () => {
  return app.swagger()
})

await app.register(ScalarApiReference, {
  routePrefix: '/reference',
  configuration: {
    metaData: {
      title: 'Next SASS RBAC Boilerplate',
      
    }
  },
  // Additional hooks for the API reference routes. You can provide the onRequest and preHandler hooks
  hooks: {
    onRequest: function (_request: FastifyRequest, _reply: FastifyReply, done: () => void) {
      done()
    },
    preHandler: function (_request: FastifyRequest, _reply: FastifyReply, done: () => void) {
      done()
    },
  },
})

// Wait for Fastify
await app.ready()

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log(`Server running on http://localhost:${env.SERVER_PORT}`)
})

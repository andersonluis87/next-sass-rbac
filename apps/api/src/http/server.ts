import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { env } from '@sass/env'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandler } from './error-handler'
import { registerRoutes } from './routes/register-routes'
import { registerSwagger } from './swagger/register-swagger'

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

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log(`Server running on http://localhost:${env.SERVER_PORT}`)
})

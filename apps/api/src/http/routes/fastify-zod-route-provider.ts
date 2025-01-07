import { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { auth } from '../middlewares/auth.js'

export function route(app: FastifyInstance) {
  return app.withTypeProvider<ZodTypeProvider>()
}

export function protectedRoute(app: FastifyInstance) {
  return route(app).register(auth)
}

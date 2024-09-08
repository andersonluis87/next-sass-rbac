import { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

export function routeProvider(app: FastifyInstance) {
  return app.withTypeProvider<ZodTypeProvider>()
}

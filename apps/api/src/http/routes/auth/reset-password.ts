import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/reset',
    {
      schema: {
        tags: ['auth'],
        summary: 'Reset password with token',
        body: z.object({
          code: z.string().uuid(),
          password: z.string().min(8),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, password } = request.body

      const tokenFromCode = await prisma.token.findUnique({
        where: {
          id: code,
        },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError('Invalid token')
      }

      const passwordHash = await hash(password, 10)

      await prisma.user.update({
        where: {
          id: tokenFromCode.userId,
        },
        data: {
          passwordHash,
        },
      })

      // TODO: Invalidate token after updating password

      return reply.status(204).send()
    }
  )
}

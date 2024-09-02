import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with e-mail & password',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        return reply.status(400).send({
          message: 'Invalid credentials',
        })
      }

      if (!user.passwordHash) {
        return reply.status(400).send({
          message:
            'User does not have a password, use a different authentication method',
        })
      }

      const passwordMatch = await compare(password, user.passwordHash)

      if (!passwordMatch) {
        return reply.status(401).send({
          message: 'Invalid password',
        })
      }

      const token = await reply.jwtSign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
        },
        {
          expiresIn: '7d',
        }
      )

      return reply.send({
        token,
      })
    }
  )
}

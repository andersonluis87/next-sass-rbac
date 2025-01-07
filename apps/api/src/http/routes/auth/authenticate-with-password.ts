import bcrypt from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import z from 'zod'

import { prisma } from '@/lib/prisma.js'

import { BadRequestError } from '../_errors/bad-request-error.js'
import { route } from '../fastify-zod-route-provider.js'

export async function authenticateWithPassword(app: FastifyInstance) {
  route(app).post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with e-mail & password',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
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
        throw new BadRequestError('Invalid credentials')
      }

      if (!user.passwordHash) {
        throw new BadRequestError(
          'User does not have a password, use a different authentication method'
        )
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash)

      if (!passwordMatch) {
        throw new BadRequestError('Invalid credentials')
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

      return reply.status(201).send({
        token,
      })
    }
  )
}

import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a new account',
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(8),
        }),
      },
    },
    async (request, response) => {
      const { email, name, password } = request.body

      const userAlredyExists = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userAlredyExists) {
        return response.status(400).send({
          message: 'User already exists',
        })
      }

      const passwordHash = await hash(password, 6)
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      })

      return response.status(201).send()
    }
  )
}

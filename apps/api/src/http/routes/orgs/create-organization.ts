import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'

import { BadRequestError } from '../_errors/bad-request-error'
import { routeProvider } from '../fastify-zod-route-provider'

export async function createOrganization(app: FastifyInstance) {
  routeProvider(app)
    .register(auth)
    .post(
      '/organization',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Create a new organization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().url(),
            shouldAttachUsersByDomain: z.boolean().default(false),
          }),
          response: {
            200: z.object({
              organizationId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { name, domain, shouldAttachUsersByDomain } = request.body
        const slug = createSlug(name)

        if (domain) {
          const organizationExistsByDomainOrSlug =
            await prisma.organization.findMany({
              where: {
                OR: [{ domain }, { slug }],
              },
              select: {
                id: true,
              },
            })

          if (organizationExistsByDomainOrSlug.length) {
            throw new BadRequestError(
              'Organization with this domain or name already exists'
            )
          }
        }

        const organization = await prisma.organization.create({
          data: {
            name,
            slug,
            domain,
            shouldAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        reply.status(201).send({ organizationId: organization.id })
      }
    )
}

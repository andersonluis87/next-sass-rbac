import { rolesSchema } from '@sass/auth'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { prisma } from '@/lib/prisma.js'

import { protectedRoute } from '../fastify-zod-route-provider.js'

export async function getOrganizations(app: FastifyInstance) {
  protectedRoute(app).get(
    '/organizations',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Get organizations where user is member',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            organizations: z.array(
              z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                avatarUrl: z.string().url().nullable(),
                role: rolesSchema,
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = await request.getCurrentUserId()
      const organizations = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          avatarUrl: true,
          members: {
            select: {
              role: true,
            },
            where: {
              userId,
            },
          },
        },
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
      })

      const organizationsWithRole = organizations.map(
        ({ members, ...organization }) => {
          return {
            ...organization,
            role: members[0].role,
          }
        }
      )

      return { organizations: organizationsWithRole }
    }
  )
}

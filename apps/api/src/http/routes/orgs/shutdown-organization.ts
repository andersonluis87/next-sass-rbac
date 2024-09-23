import { organizationSchema } from '@sass/auth'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../_errors/unauthorized-error'
import { protectedRoute } from '../fastify-zod-route-provider'

export async function shutdownOrganization(app: FastifyInstance) {
  protectedRoute(app).delete(
    '/organizations/:slug',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Shutdown an organization',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params

      const userId = await request.getCurrentUserId()
      const {
        membership: { role },
        organization,
      } = await request.getUserMembership(slug)

      const authOrganization = organizationSchema.parse(organization)

      const { cannot } = getUserPermissions(userId, role)

      if (cannot('delete', authOrganization)) {
        throw new UnauthorizedError(
          'You are not allowed to shutdown this organization'
        )
      }

      await prisma.organization.delete({
        where: {
          id: organization.id,
        },
      })

      return reply.status(204).send()
    }
  )
}

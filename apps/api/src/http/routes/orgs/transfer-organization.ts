import { organizationSchema } from '@sass/auth'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { prisma } from '@/lib/prisma.js'
import { getUserPermissions } from '@/utils/get-user-permissions.js'

import { BadRequestError } from '../_errors/bad-request-error.js'
import { UnauthorizedError } from '../_errors/unauthorized-error.js'
import { protectedRoute } from '../fastify-zod-route-provider.js'

export async function transferOrganization(app: FastifyInstance) {
  protectedRoute(app).patch(
    '/organizations/:slug/onwer',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Transfer organization ownership',
        security: [{ bearerAuth: [] }],
        body: z
          .object({
            transferToUserId: z.string().uuid(),
          })
          .strict(),
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
      const { transferToUserId } = request.body

      const userId = await request.getCurrentUserId()
      const {
        membership: { role },
        organization,
      } = await request.getUserMembership(slug)

      const authOrganization = organizationSchema.parse(organization)

      const { cannot } = getUserPermissions(userId, role)

      if (cannot('transfer_ownership', authOrganization)) {
        throw new UnauthorizedError(
          'You are not allowed to transfer this organization ownership'
        )
      }

      const newOrganizationOwner = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: transferToUserId,
          },
        },
      })

      if (!newOrganizationOwner) {
        throw new BadRequestError(
          'Target user is not a member of this organization'
        )
      }

      await prisma.$transaction([
        prisma.member.update({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId,
            },
          },
          data: {
            role: 'MEMBER',
          },
        }),
        prisma.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            ownerId: transferToUserId,
          },
        }),
      ])

      return reply.status(204).send()
    }
  )
}

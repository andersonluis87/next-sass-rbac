import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { protectedRoute } from '../fastify-zod-route-provider'
import { rolesSchema } from '@sass/auth'

export async function getMembers(app: FastifyInstance) {
  protectedRoute(app).get(
    '/members/:organizationSlug',
    {
      schema: {
        tags: ['members'],
        summary: 'Get all organization members',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          200: z.object({
            members: z.array(
              z.object({
                id: z.string().uuid(),
                userId: z.string().uuid(),
                name: z.string().nullable(),
                avatarUrl: z.string().url().nullable(),
                email: z.string().email(),
                role: rolesSchema,
              })
            ),
          }),
        },
      },
    },
    // controller
    async (request, reply) => {
      const { organizationSlug } = request.params
      const { organization, membership } =
        await request.getUserMembership(organizationSlug)

      const userId = await request.getCurrentUserId()
      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot('get', 'User')) {
        throw new BadRequestError('You are not allowed to see organization members')
      }

      // service
      const members = await prisma.member.findMany({
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            }
          }
        },
        where: {
          organizationId: organization.id,
        },
        orderBy: {
          role: 'asc'
        }
      })

      if (!members) {
        throw new BadRequestError('Members not found')
      }

      const membersWithRoles = members.map((({ user: { id: userId, ...user}, ...member }) => {
        return {
          ...user,
          ...member,
          userId
        }
      }));

      reply.status(200).send({ members: membersWithRoles })
    }
  )
}

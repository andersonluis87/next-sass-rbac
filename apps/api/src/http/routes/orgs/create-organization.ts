import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../../lib/prisma.js";
import { createSlug } from "../../../utils/create-slug.js";

import { BadRequestError } from "../_errors/bad-request-error.js";
import { protectedRoute } from "../fastify-zod-route-provider.js";

export async function createOrganization(app: FastifyInstance) {
	protectedRoute(app).post(
		"/organizations",
		{
			schema: {
				tags: ["organizations"],
				summary: "Create a new organization",
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
			const userId = await request.getCurrentUserId();
			const { name, domain, shouldAttachUsersByDomain } = request.body;
			const slug = createSlug(name);

			if (domain) {
				const organizationExistsByDomainOrSlug =
					await prisma.organization.findMany({
						where: {
							OR: [{ domain }, { slug }],
						},
						select: {
							id: true,
						},
					});

				if (organizationExistsByDomainOrSlug.length) {
					throw new BadRequestError(
						"Organization with this domain or name already exists",
					);
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
							role: "ADMIN",
						},
					},
				},
			});

			reply.status(201).send({ organizationId: organization.id });
		},
	);
}

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "@/lib/prisma.js";
import { getUserPermissions } from "@/utils/get-user-permissions.js";

import { BadRequestError } from "../_errors/bad-request-error.js";
import { protectedRoute } from "../fastify-zod-route-provider.js";

export async function getProjects(app: FastifyInstance) {
	protectedRoute(app).get(
		"/organizations/:slug/projects",
		{
			schema: {
				tags: ["projects"],
				summary: "Get projects",
				security: [{ bearerAuth: [] }],
				params: z.object({
					slug: z.string(),
				}),
				response: {
					200: z.object({
						projects: z.array(
							z.object({
								id: z.string().uuid(),
								name: z.string(),
								description: z.string().nullable(),
								slug: z.string(),
								avatarUrl: z.string().nullable(),
								createdAt: z.date(),
								owner: z.object({
									id: z.string().uuid(),
									name: z.string().nullable(),
									avatarUrl: z.string().nullable(),
								}),
							}),
						),
					}),
				},
			},
		},
		// controller
		async (request, reply) => {
			const { slug } = request.params;
			const { organization, membership } =
				await request.getUserMembership(slug);

			const userId = await request.getCurrentUserId();
			const { cannot } = getUserPermissions(userId, membership.role);

			if (cannot("get", "Project")) {
				throw new BadRequestError("You are not allowed to get projects");
			}

			// service
			const projects = await prisma.projects.findMany({
				select: {
					id: true,
					name: true,
					description: true,
					slug: true,
					avatarUrl: true,
					createdAt: true,
					owner: {
						select: {
							id: true,
							name: true,
							avatarUrl: true,
						},
					},
				},
				where: {
					organizationId: organization.id,
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			if (!projects) {
				throw new BadRequestError("Project not found");
			}

			reply.status(201).send({ projects });
		},
	);
}

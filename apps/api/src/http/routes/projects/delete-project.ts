import { projectSchema } from "@sass/auth";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "@/lib/prisma.js";
import { getUserPermissions } from "@/utils/get-user-permissions.js";

import { BadRequestError } from "../_errors/bad-request-error.js";
import { protectedRoute } from "../fastify-zod-route-provider.js";

export async function deleteProject(app: FastifyInstance) {
	protectedRoute(app).delete(
		"/organizations/:slug/projects/:id",
		{
			schema: {
				tags: ["projects"],
				summary: "Delete project",
				security: [{ bearerAuth: [] }],
				params: z.object({
					slug: z.string(),
					id: z.string().uuid(),
				}),
				response: {
					204: z.null(),
				},
			},
		},
		// controller
		async (request, reply) => {
			const { slug, id } = request.params;
			const { organization, membership } =
				await request.getUserMembership(slug);

			const project = await prisma.projects.findUnique({
				where: {
					id,
					organizationId: organization.id,
				},
			});

			if (!project) {
				throw new BadRequestError("Project not found");
			}

			const userId = await request.getCurrentUserId();
			const { cannot } = getUserPermissions(userId, membership.role);
			const authProject = projectSchema.parse(project);

			if (cannot("delete", authProject)) {
				throw new BadRequestError("You are not allowed to remove this project");
			}

			await prisma.projects.delete({
				where: {
					id,
				},
			});

			reply.status(204).send();
		},
	);
}

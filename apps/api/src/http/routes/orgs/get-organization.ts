import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { protectedRoute } from "../fastify-zod-route-provider.js";

export async function getOrganization(app: FastifyInstance) {
	protectedRoute(app).get(
		"/organizations/:slug",
		{
			schema: {
				tags: ["organizations"],
				summary: "Get details from organization",
				security: [{ bearerAuth: [] }],
				params: z.object({
					slug: z.string(),
				}),
				response: {
					200: z.object({
						organization: z.object({
							id: z.string().uuid(),
							name: z.string(),
							slug: z.string(),
							domain: z.string().nullable(),
							shouldAttachUsersByDomain: z.boolean(),
							avatarUrl: z.string().url().nullable(),
							ownerId: z.string().uuid(),
							createdAt: z.date(),
							updatedAt: z.date(),
						}),
					}),
				},
			},
		},
		async (request) => {
			const { slug } = request.params;

			const { organization } = await request.getUserMembership(slug);
			return { organization };
		},
	);
}

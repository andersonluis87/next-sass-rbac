import type { FastifyInstance } from "fastify";
import z from "zod";

import { prisma } from "@/lib/prisma.js";

import { route } from "../fastify-zod-route-provider.js";

export async function requestPasswordRecover(app: FastifyInstance) {
	route(app).post(
		"/password/recover",
		{
			schema: {
				tags: ["auth"],
				summary: "Request password token to reset password",
				body: z.object({
					email: z.string().email(),
				}),
				response: {
					201: z.null(),
				},
			},
		},
		async (request, reply) => {
			const { email } = request.body;

			const user = await prisma.user.findUnique({
				where: {
					email,
				},
			});

			if (!user) {
				return reply.status(201).send();
			}

			const { id: code } = await prisma.token.create({
				data: {
					type: "PASSWORD_RECOVER",
					userId: user.id,
				},
			});

			// TODO: Send email with code
			console.log("Recover password token: ", code);

			return reply.status(201).send();
		},
	);
}

import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "@/lib/prisma.js";

import { BadRequestError } from "../_errors/bad-request-error.js";
import { route } from "../fastify-zod-route-provider.js";

export async function createAccount(app: FastifyInstance) {
	route(app).post(
		"/users",
		{
			schema: {
				tags: ["auth"],
				summary: "Create a new account",
				body: z.object({
					name: z.string(),
					email: z.string().email(),
					password: z.string().min(8),
				}),
			},
		},
		async (request, reply) => {
			const { email, name, password } = request.body;

			const userAlredyExists = await prisma.user.findUnique({
				where: {
					email,
				},
			});

			if (userAlredyExists) {
				throw new BadRequestError("User already exists");
			}

			const domain = email.split("@")[1];
			const autoJoinOrganization = await prisma.organization.findFirst({
				where: {
					domain,
					shouldAttachUsersByDomain: true,
				},
			});

			const passwordHash = await bcrypt.hash(password, 6);

			await prisma.user.create({
				data: {
					email,
					name,
					passwordHash,
					member_on: autoJoinOrganization
						? {
								create: {
									organizationId: autoJoinOrganization.id,
								},
							}
						: undefined,
				},
			});

			return reply.status(201).send();
		},
	);
}

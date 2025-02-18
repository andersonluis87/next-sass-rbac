import type { FastifyInstance } from "fastify";

import { authenticateWithGithub } from "../routes/auth/authenticate-with-github.js";
import { authenticateWithPassword } from "../routes/auth/authenticate-with-password.js";
import { createAccount } from "../routes/auth/create-account.js";
import { getProfile } from "../routes/auth/get-profile.js";
import { requestPasswordRecover } from "../routes/auth/request-password-recover.js";
import { resetPassword } from "../routes/auth/reset-password.js";
import { createOrganization } from "../routes/orgs/create-organization.js";
import { getMembers } from "./members/get-members.js";
import { updateMember } from "./members/update-member.js";
import { getMembership } from "./orgs/get-membership.js";
import { getOrganization } from "./orgs/get-organization.js";
import { getOrganizations } from "./orgs/get-organizations.js";
import { shutdownOrganization } from "./orgs/shutdown-organization.js";
import { transferOrganization } from "./orgs/transfer-organization.js";
import { updateOrganization } from "./orgs/update-organization.js";
import { createProject } from "./projects/create-project.js";
import { deleteProject } from "./projects/delete-project.js";
import { getProject } from "./projects/get-project.js";
import { getProjects } from "./projects/get-projects.js";
import { updateProject } from "./projects/update-project.js";

export function registerRoutes(app: FastifyInstance) {
	app.register(createAccount);
	app.register(authenticateWithPassword);
	app.register(getProfile);
	app.register(requestPasswordRecover);
	app.register(resetPassword);
	app.register(authenticateWithGithub);
	app.register(createOrganization);
	app.register(getMembership);
	app.register(getOrganization);
	app.register(getOrganizations);
	app.register(updateOrganization);
	app.register(shutdownOrganization);
	app.register(transferOrganization);
	app.register(createProject);
	app.register(deleteProject);
	app.register(getProject);
	app.register(getProjects);
	app.register(updateProject);
	app.register(getMembers);
	app.register(updateMember);
}

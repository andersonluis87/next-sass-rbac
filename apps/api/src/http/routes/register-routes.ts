import type { FastifyInstance } from 'fastify'

import { authenticateWithGithub } from '../routes/auth/authenticate-with-github'
import { authenticateWithPassword } from '../routes/auth/authenticate-with-password'
import { createAccount } from '../routes/auth/create-account'
import { getProfile } from '../routes/auth/get-profile'
import { requestPasswordRecover } from '../routes/auth/request-password-recover'
import { resetPassword } from '../routes/auth/reset-password'
import { createOrganization } from '../routes/orgs/create-organization'
import { getMembership } from './orgs/get-membership'
import { getOrganization } from './orgs/get-organization'
import { getOrganizations } from './orgs/get-organizations'
import { shutdownOrganization } from './orgs/shutdown-organization'
import { transferOrganization } from './orgs/transfer-organization'
import { updateOrganization } from './orgs/update-organization'

export function registerRoutes(app: FastifyInstance) {
  app.register(createAccount)
  app.register(authenticateWithPassword)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)
  app.register(authenticateWithGithub)
  app.register(createOrganization)
  app.register(getMembership)
  app.register(getOrganization)
  app.register(getOrganizations)
  app.register(updateOrganization)
  app.register(shutdownOrganization)
  app.register(transferOrganization)
}

import { env } from '@sass/env'
import type { FastifyInstance } from 'fastify'
import z from 'zod'

import { prisma } from '@/lib/prisma.js'

import { BadRequestError } from '../_errors/bad-request-error.js'
import { route } from '../fastify-zod-route-provider.js'

// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
export async function authenticateWithGithub(app: FastifyInstance) {
  route(app).post(
    '/sessions/github',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with GitHub',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body

      // https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&client_secret={GITHUB_CLIENT_SECRE}&redirect_uri={GITHUB_REDIRECT_URI}&scope=user:email
      const githubOauthURL = new URL(
        'https://github.com/login/oauth/access_token'
      )
      githubOauthURL.searchParams.append('client_id', env.GITHUB_CLIENT_ID)
      githubOauthURL.searchParams.append(
        'client_secret',
        env.GITHUB_CLIENT_SECRET
      )
      githubOauthURL.searchParams.append(
        'redirect_uri',
        env.GITHUB_REDIRECT_URI
      )
      githubOauthURL.searchParams.append('code', code)

      const githubAccessTokenResponse = await fetch(githubOauthURL.toString(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const githubAccessTokenData = await githubAccessTokenResponse.json()

      const { access_token: githubAccessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
        })
        .parse(githubAccessTokenData)

      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
        },
      })

      const githubUserData = await githubUserResponse.json()

      const {
        id: githubId,
        avatar_url: avatarUrl,
        name,
        email,
      } = z
        .object({
          id: z.number().int().transform(String),
          avatar_url: z.string().url(),
          name: z.string().optional(),
          email: z.string().email().nullable(),
        })
        .parse(githubUserData)

      if (!email) {
        throw new BadRequestError(
          'Your Github account must have an email to authenticate'
        )
      }

      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
          },
        })
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: githubId,
            userId: user.id,
          },
        })
      }

      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        }
      )

      reply.status(201).send({
        token,
      })
    }
  )
}

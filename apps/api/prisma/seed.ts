import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('123456', 6)

  const admin = await prisma.user.create({
    data: {
      email: 'anderson@test.com',
      name: 'Anderson',
      avatarUrl: 'https://github.com/andersonluis87.png',
      passwordHash: await hash('123456', 6),
    },
  })

  const user = await prisma.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      passwordHash,
    },
  })

  const anotherUser = await prisma.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      passwordHash,
    },
  })

  const oneMoreUser = await prisma.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      passwordHash,
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Acme Inc (Admin)',
      domain: 'acmeinc.com',
      slug: 'acmeinc-admin',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: admin.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: admin.id,
              role: 'ADMIN',
            },
            {
              userId: user.id,
              role: 'MEMBER',
            },
            {
              userId: anotherUser.id,
              role: 'MEMBER',
            },
            {
              userId: oneMoreUser.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Acme Inc (Member)',
      slug: 'acmeinc-member',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: admin.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: admin.id,
              role: 'MEMBER',
            },
            {
              userId: user.id,
              role: 'MEMBER',
            },
            {
              userId: anotherUser.id,
              role: 'MEMBER',
            },
            {
              userId: oneMoreUser.id,
              role: 'ADMIN',
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Acme Inc (Billing)',
      slug: 'acmeinc-billing',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: admin.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                admin.id,
                user.id,
                anotherUser.id,
                oneMoreUser.id,
              ]),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: admin.id,
              role: 'BILLING',
            },
            {
              userId: user.id,
              role: 'MEMBER',
            },
            {
              userId: anotherUser.id,
              role: 'MEMBER',
            },
            {
              userId: oneMoreUser.id,
              role: 'ADMIN',
            },
          ],
        },
      },
    },
  })
}

seed().then(() => {
  console.log('Seed complete')
})

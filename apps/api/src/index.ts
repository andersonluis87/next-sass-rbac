import {
  defineAbilityFor,
  organizationSchema,
  projectSchema,
  userSchema,
} from '@sass/auth'

const ability = defineAbilityFor({ role: 'MEMBER', id: 'user-1' })
const adminAbility = defineAbilityFor({ role: 'ADMIN', id: 'user-2' })

const project = projectSchema.parse({ id: 'project-1', ownerId: 'user-1' })
const project2 = projectSchema.parse({ id: 'project-2', ownerId: 'user-2' })

console.log(
  'Can MEMBER update their own project?',
  ability.can('update', project)
) // true
console.log(
  'Can MEMBER update others project?',
  ability.can('update', project2)
) // false
console.log(
  'Can ADMIN update others project?',
  adminAbility.can('update', project)
) // true

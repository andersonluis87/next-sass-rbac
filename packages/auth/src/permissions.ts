// https://casl.js.org/v6/en/cookbook/roles-with-static-permissions

import { AbilityBuilder } from '@casl/ability'

import { AppAbility } from '.'
import { User } from './models/User'

type Role = 'ADMIN' | 'MEMBER'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(user, { can }) {
    can('manage', 'all')
  },
  MEMBER(user, { can }) {
    can('invite', 'User')
    can('manage', 'Project')
  },
}

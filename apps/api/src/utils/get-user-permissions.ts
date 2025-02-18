import { type Role, defineAbilityFor, userSchema } from "@sass/auth";

export function getUserPermissions(id: string, role: Role) {
	const authUser = userSchema.parse({
		id,
		role,
	});

	const ability = defineAbilityFor(authUser);

	return ability;
}

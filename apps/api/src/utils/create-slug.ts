export function createSlug(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w\\-]+/g, "")
		.replace(/\\-\\-+/g, "-");
}

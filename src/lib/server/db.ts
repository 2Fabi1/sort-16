export function getDB(platform: App.Platform | undefined): D1Database {
	if (!platform?.env?.DB) {
		throw new Error('D1 database binding not available — check wrangler.jsonc');
	}
	return platform.env.DB;
}

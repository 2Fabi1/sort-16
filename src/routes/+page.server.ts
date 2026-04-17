import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) return { records: [], completions: [] };

	const db = getDB(platform);

	const [recordsResult, completionsResult] = await db.batch([
		db.prepare('SELECT * FROM best_times WHERE username = ? ORDER BY difficulty ASC').bind(locals.user.username),
		db.prepare('SELECT difficulty, count FROM completions WHERE username = ? ORDER BY difficulty ASC').bind(locals.user.username),
	]);

	return {
		records: recordsResult.results,
		completions: completionsResult.results,
	};
};

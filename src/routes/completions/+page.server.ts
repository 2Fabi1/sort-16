import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db';

export const load: PageServerLoad = async ({ url, platform }) => {
	const difficulty = parseInt(url.searchParams.get('difficulty') || '8');
	const validDiff = Math.max(8, Math.min(36, isNaN(difficulty) ? 8 : difficulty));

	const db = getDB(platform);
	const { results } = await db
		.prepare('SELECT username, count FROM completions WHERE difficulty = ? ORDER BY count DESC')
		.bind(validDiff)
		.all<{ username: string; count: number }>();

	return { difficulty: validDiff, leaderboard: results };
};

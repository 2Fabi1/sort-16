import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const difficulty = parseInt(url.searchParams.get('difficulty') || '8');
	const validDiff = Math.max(8, Math.min(36, isNaN(difficulty) ? 8 : difficulty));

	const leaderboard = db
		.prepare('SELECT username, count FROM completions WHERE difficulty = ? ORDER BY count DESC')
		.all(validDiff) as { username: string; count: number }[];

	return { difficulty: validDiff, leaderboard };
};

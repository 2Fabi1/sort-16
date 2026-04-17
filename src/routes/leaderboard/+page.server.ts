import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const difficulty = parseInt(url.searchParams.get('difficulty') || '8');
	const validDiff = Math.max(8, Math.min(36, isNaN(difficulty) ? 8 : difficulty));

	const records = db
		.prepare('SELECT * FROM best_times WHERE difficulty = ? ORDER BY time ASC')
		.all(validDiff) as { username: string; time: number; moves: number; seed: string }[];

	return { difficulty: validDiff, records };
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, platform }) => {
	const difficulty = Number(params.difficulty);

	if (isNaN(difficulty)) {
		return json({ error: 'Invalid difficulty parameter.' }, { status: 400 });
	}

	const db = getDB(platform);
	const { results } = await db
		.prepare('SELECT * FROM best_times WHERE difficulty = ? ORDER BY time ASC')
		.bind(difficulty)
		.all();

	return json(results);
};

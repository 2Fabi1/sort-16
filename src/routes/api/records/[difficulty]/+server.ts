import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const difficulty = Number(params.difficulty);

	if (isNaN(difficulty)) {
		return json({ error: 'Invalid difficulty parameter.' }, { status: 400 });
	}

	const records = db
		.prepare('SELECT * FROM best_times WHERE difficulty = ? ORDER BY time ASC')
		.all(difficulty);

	return json(records);
};

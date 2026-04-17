import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const difficulty = Number(params.difficulty);

	if (isNaN(difficulty)) {
		return json({ error: 'Invalid difficulty parameter.' }, { status: 400 });
	}

	const completions = db
		.prepare('SELECT * FROM completions WHERE difficulty = ? ORDER BY count DESC')
		.all(difficulty);

	return json(completions);
};

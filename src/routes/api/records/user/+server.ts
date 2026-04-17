import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const db = getDB(platform);
	const { results } = await db
		.prepare('SELECT * FROM best_times WHERE username = ? ORDER BY difficulty ASC')
		.bind(locals.user.username)
		.all();

	return json(results);
};

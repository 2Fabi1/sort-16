import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const records = db
		.prepare('SELECT * FROM best_times WHERE username = ? ORDER BY difficulty ASC')
		.all(locals.user.username);

	return json(records);
};

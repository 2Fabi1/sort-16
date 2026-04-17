import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const { difficulty } = await request.json();
	const username = locals.user.username;

	if (difficulty == null) {
		return json({ error: 'difficulty is required.' }, { status: 400 });
	}

	db.prepare(
		`INSERT INTO completions (username, difficulty, count) VALUES (?, ?, 1)
		 ON CONFLICT(username, difficulty) DO UPDATE SET count = count + 1`
	).run(username, difficulty);

	const row = db
		.prepare('SELECT difficulty, count FROM completions WHERE username = ? AND difficulty = ?')
		.get(username, difficulty) as { difficulty: number; count: number };

	return json({ difficulty: row.difficulty, count: row.count }, { status: 201 });
};

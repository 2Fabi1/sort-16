import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const { difficulty } = (await request.json()) as { difficulty: number };
	const username = locals.user.username;

	if (difficulty == null) {
		return json({ error: 'difficulty is required.' }, { status: 400 });
	}

	const db = getDB(platform);

	await db.prepare(
		`INSERT INTO completions (username, difficulty, count) VALUES (?, ?, 1)
		 ON CONFLICT(username, difficulty) DO UPDATE SET count = count + 1`
	).bind(username, difficulty).run();

	const row = await db
		.prepare('SELECT difficulty, count FROM completions WHERE username = ? AND difficulty = ?')
		.bind(username, difficulty)
		.first<{ difficulty: number; count: number }>();

	return json({ difficulty: row!.difficulty, count: row!.count }, { status: 201 });
};

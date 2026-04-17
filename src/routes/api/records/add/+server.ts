import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const { time, difficulty, moves, seed } = await request.json();
	const username = locals.user.username;

	if (time == null || difficulty == null || moves == null) {
		return json({ error: 'time, difficulty, and moves are required.' }, { status: 400 });
	}

	const existing = db
		.prepare('SELECT time FROM best_times WHERE username = ? AND difficulty = ?')
		.get(username, difficulty) as { time: number } | undefined;

	if (existing && existing.time <= time) {
		return json({ message: 'No new record set.' }, { status: 200 });
	}

	const upsert = db.transaction(() => {
		db.prepare('DELETE FROM best_times WHERE username = ? AND difficulty = ?').run(
			username,
			difficulty
		);
		db.prepare(
			'INSERT INTO best_times (username, difficulty, time, moves, seed) VALUES (?, ?, ?, ?, ?)'
		).run(username, difficulty, time, moves, seed ?? null);
	});

	upsert();

	const record = db
		.prepare('SELECT * FROM best_times WHERE username = ? AND difficulty = ?')
		.get(username, difficulty);

	return json(record, { status: 201 });
};

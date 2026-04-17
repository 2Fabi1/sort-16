import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	const { time, difficulty, moves, seed } = (await request.json()) as { time: number; difficulty: number; moves: number; seed?: string };
	const username = locals.user.username;

	if (time == null || difficulty == null || moves == null) {
		return json({ error: 'time, difficulty, and moves are required.' }, { status: 400 });
	}

	const db = getDB(platform);

	const existing = await db
		.prepare('SELECT time FROM best_times WHERE username = ? AND difficulty = ?')
		.bind(username, difficulty)
		.first<{ time: number }>();

	if (existing && existing.time <= time) {
		return json({ message: 'No new record set.' }, { status: 200 });
	}

	await db.batch([
		db.prepare('DELETE FROM best_times WHERE username = ? AND difficulty = ?').bind(username, difficulty),
		db.prepare('INSERT INTO best_times (username, difficulty, time, moves, seed) VALUES (?, ?, ?, ?, ?)').bind(username, difficulty, time, moves, seed ?? ''),
	]);

	const record = await db
		.prepare('SELECT * FROM best_times WHERE username = ? AND difficulty = ?')
		.bind(username, difficulty)
		.first();

	return json(record, { status: 201 });
};

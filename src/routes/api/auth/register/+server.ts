import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { hashPassword } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { username, password } = (await request.json()) as { username: string; password: string };

	if (!username || typeof username !== 'string' || !username.trim()) {
		return json({ error: 'Username is required.' }, { status: 400 });
	}

	if (!password || typeof password !== 'string' || password.length < 8) {
		return json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
	}

	const db = getDB(platform);

	const existing = await db.prepare('SELECT username FROM users WHERE username = ?').bind(username).first();
	if (existing) {
		return json({ error: 'Username already exists.' }, { status: 409 });
	}

	const hashed = hashPassword(password);
	await db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').bind(username, hashed).run();

	return json({ message: 'Registered successfully.' }, { status: 201 });
};

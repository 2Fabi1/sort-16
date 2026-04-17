import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';
import { hashPassword } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { username, password } = body;

	if (!username || typeof username !== 'string' || !username.trim()) {
		return json({ error: 'Username is required.' }, { status: 400 });
	}

	if (!password || typeof password !== 'string' || password.length < 8) {
		return json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
	}

	const existing = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
	if (existing) {
		return json({ error: 'Username already exists.' }, { status: 409 });
	}

	const hashed = hashPassword(password);
	db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hashed);

	return json({ message: 'Registered successfully.' }, { status: 201 });
};

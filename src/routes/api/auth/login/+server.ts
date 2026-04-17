import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';
import { checkPassword, createToken } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { username, password } = body;

	if (!username || !password) {
		return json({ error: 'Username and password are required.' }, { status: 400 });
	}

	const user = db
		.prepare('SELECT username, password_hash FROM users WHERE username = ?')
		.get(username) as { username: string; password_hash: string } | undefined;

	if (!user || !checkPassword(password, user.password_hash)) {
		return json({ error: 'Invalid credentials.' }, { status: 401 });
	}

	const token = await createToken(user.username);

	cookies.set('jwt', token, {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});

	return json({ username: user.username });
};

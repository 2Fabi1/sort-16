import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { checkPassword, createToken } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	const { username, password } = (await request.json()) as { username: string; password: string };

	if (!username || !password) {
		return json({ error: 'Username and password are required.' }, { status: 400 });
	}

	const db = getDB(platform);

	const user = await db
		.prepare('SELECT username, password_hash FROM users WHERE username = ?')
		.bind(username)
		.first<{ username: string; password_hash: string }>();

	if (!user || !checkPassword(password, user.password_hash)) {
		return json({ error: 'Invalid credentials.' }, { status: 401 });
	}

	const token = await createToken(user.username, platform);

	cookies.set('jwt', token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7
	});

	return json({ username: user.username });
};

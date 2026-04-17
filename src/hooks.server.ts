import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('jwt');
	event.locals.user = token ? await verifyToken(token, event.platform) : null;
	return resolve(event);
};

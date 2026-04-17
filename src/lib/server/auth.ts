import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_ISSUER = 'Sort16';
const JWT_AUDIENCE = 'Sort16Players';

function getSecret(platform: App.Platform | undefined): Uint8Array {
	const raw = platform?.env?.JWT_SECRET || 'sort16-dev-secret-change-in-production';
	return new TextEncoder().encode(raw);
}

export async function createToken(username: string, platform: App.Platform | undefined): Promise<string> {
	return new SignJWT({ username })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUDIENCE)
		.setExpirationTime('7d')
		.sign(getSecret(platform));
}

export async function verifyToken(token: string, platform: App.Platform | undefined): Promise<{ username: string } | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret(platform), {
			issuer: JWT_ISSUER,
			audience: JWT_AUDIENCE,
		});
		return payload.username ? { username: payload.username as string } : null;
	} catch {
		return null;
	}
}

export function hashPassword(password: string): string {
	return bcrypt.hashSync(password, 12);
}

export function checkPassword(password: string, hash: string): boolean {
	return bcrypt.compareSync(password, hash);
}

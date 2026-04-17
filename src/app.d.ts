declare global {
	namespace App {
		interface Locals {
			user: { username: string } | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				JWT_SECRET?: string;
			};
		}
	}
}

export {};

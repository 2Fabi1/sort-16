import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return { records: [], completions: [] };

  const records = db.prepare(
    'SELECT * FROM best_times WHERE username = ? ORDER BY difficulty ASC'
  ).all(locals.user.username);

  const completions = db.prepare(
    'SELECT difficulty, count FROM completions WHERE username = ? ORDER BY difficulty ASC'
  ).all(locals.user.username);

  return { records, completions };
};

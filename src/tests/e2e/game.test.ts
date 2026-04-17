import { test, expect } from '@playwright/test';

test.describe('Game', () => {
	const password = 'password123';

	async function registerAndLogin(page: any) {
		const username = `player_${Date.now()}`;

		// Register via API
		await page.request.post('/api/auth/register', {
			data: { username, password }
		});

		// Login via UI
		await page.goto('/');
		await page.fill('input[placeholder="Username"]', username);
		await page.fill('input[placeholder="Password"]', password);
		await page.click('button[type="submit"]');
		await page.waitForTimeout(1000);
	}

	test('can start a game and see the game string', async ({ page }) => {
		await registerAndLogin(page);

		await page.selectOption('select', '8');
		await page.click('button:has-text("Play")');

		await expect(page.locator('.bracket-display')).toBeVisible();
		const text = await page.locator('.bracket-display').textContent();
		expect(text).toContain('[');
		expect(text).toContain(']');
	});

	test('can return to main menu', async ({ page }) => {
		await registerAndLogin(page);

		await page.selectOption('select', '8');
		await page.click('button:has-text("Play")');
		await expect(page.locator('.bracket-display')).toBeVisible();

		await page.click('button:has-text("Main Menu")');
		await expect(page.locator('.bracket-display')).not.toBeVisible();
		await expect(page.locator('select')).toBeVisible();
	});

	test('records sidebar shows difficulty levels', async ({ page }) => {
		await registerAndLogin(page);
		const rows = page.locator('.record-row');
		await expect(rows).toHaveCount(29);
	});
});

test.describe('Leaderboard pages', () => {
	test('difficulty leaderboard loads', async ({ page }) => {
		await page.goto('/leaderboard?difficulty=16');
		await expect(page.locator('h1')).toHaveText('Leaderboard');
		await expect(page.locator('.subtitle')).toContainText('16 characters');
	});

	test('completions leaderboard loads', async ({ page }) => {
		await page.goto('/completions?difficulty=16');
		await expect(page.locator('h1')).toHaveText('Leaderboard');
		await expect(page.locator('.subtitle')).toContainText('16 characters');
	});

	test('difficulty navigation wraps around', async ({ page }) => {
		await page.goto('/leaderboard?difficulty=8');
		await page.click('button:has-text("<")');
		await expect(page.locator('.subtitle')).toContainText('36 characters');
	});
});

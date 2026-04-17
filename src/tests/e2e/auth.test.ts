import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
	const password = 'testpassword123';

	test('shows login modal on first visit', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.overlay .modal')).toBeVisible();
		await expect(page.locator('.overlay .modal h2')).toHaveText('Log In');
	});

	test('can switch to signup and register', async ({ page }) => {
		await page.goto('/');
		await page.click('text=Sign up');
		await expect(page.locator('.modal h2')).toHaveText('Create Account');

		const username = `signup_${Date.now()}`;
		await page.fill('input[placeholder="Username"]', username);
		await page.fill('input[placeholder="Password"]', password);
		await page.click('button[type="submit"]');

		await expect(page.locator('.toast')).toContainText('Logged in');
	});

	test('can login with registered account', async ({ page }) => {
		const uniqueUser = `login_${Date.now()}`;

		// Register via API directly
		await page.request.post('/api/auth/register', {
			data: { username: uniqueUser, password }
		});

		// Login via UI
		await page.goto('/');
		await page.fill('input[placeholder="Username"]', uniqueUser);
		await page.fill('input[placeholder="Password"]', password);
		await page.click('button[type="submit"]');

		await expect(page.locator('.toast')).toContainText('Logged in');
		await expect(page.locator('.overlay')).not.toBeVisible();
	});
});

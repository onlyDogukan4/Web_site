import { test, expect } from '@playwright/test';

test.describe('Mobil menü', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    async function assertMobileDrawerWorks(page) {
        const nav = page.locator('#nav-links');
        const hamburger = page.locator('#hamburger-btn');
        const backdrop = page.locator('#nav-backdrop');

        await expect(nav).toHaveAttribute('data-docked', 'body');
        await expect(nav).not.toHaveClass(/active/);
        await expect(backdrop).toBeHidden();

        await hamburger.click();

        await expect(nav).toHaveClass(/active/);
        await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
        await expect(backdrop).toBeVisible();
        await expect(nav).toHaveAttribute('role', 'dialog');
        await expect(nav.locator('.nav-drawer-header strong')).toHaveText('Menü');

        await backdrop.click({ position: { x: 12, y: 120 } });
        await expect(nav).not.toHaveClass(/active/);
        await expect(backdrop).toBeHidden();
        await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    }

    test('ana sayfada hamburger çalışır', async ({ page }) => {
        await page.goto('/');
        await assertMobileDrawerWorks(page);
    });

    test('konsept alt sayfada hamburger çalışır', async ({ page }) => {
        await page.goto('/yilbasi.html');
        await assertMobileDrawerWorks(page);
    });

    test('sipariş takip sayfasında hamburger çalışır', async ({ page }) => {
        await page.goto('/takip.html');
        await assertMobileDrawerWorks(page);
    });
});

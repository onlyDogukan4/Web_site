import { test, expect } from '@playwright/test';

test.describe('Mobil menü', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('hamburger tam çekmece açar ve kapanır', async ({ page }) => {
        await page.goto('/');

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

        const links = nav.locator('li a[href]');
        await expect(links).toHaveCount(6);

        const box = await nav.boundingBox();
        const viewport = page.viewportSize();
        expect(box).toBeTruthy();
        expect(box.width).toBeGreaterThan(240);
        expect(box.width).toBeLessThanOrEqual(viewport.width * 0.9);
        expect(box.height).toBeGreaterThan(viewport.height * 0.85);

        await backdrop.click({ position: { x: 12, y: 120 } });
        await expect(nav).not.toHaveClass(/active/);
        await expect(backdrop).toBeHidden();
        await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });
});

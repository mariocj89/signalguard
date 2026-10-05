import { test, expect } from '@playwright/test';
test('browser inspection fails closed and navigation exposes local privacy and history', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SignalGuard', exact: true })).toBeVisible();
  await expect(page.getByText('Native monitoring is unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'START GUARD', exact: true })).toBeDisabled();
  await page.getByRole('tab', { name: /Settings/ }).click();
  await expect(page.getByText('Private by design')).toBeVisible();
  await expect(page.getByText('SignalGuard has no account, analytics or telemetry.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: /History/ }).click();
  await expect(page.getByText('No guards yet')).toBeVisible();
});
test('Spanish route content is complete', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8088');
  await expect(page.getByRole('button', { name: 'INICIAR GUARDIA', exact: true })).toBeDisabled();
  await page.getByRole('tab', { name: /Ajustes/ }).click();
  await expect(page.getByText('Privacidad desde el diseño')).toBeVisible();
  await page.getByRole('tab', { name: /Historial/ }).click();
  await expect(page.getByText('Todavía no hay guardias')).toBeVisible();
  await context.close();
});

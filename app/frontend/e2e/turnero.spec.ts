import { test, expect } from '@playwright/test';

test.describe('Suite End-to-End (E2E) — Flujos criticos de usuario en Turnero', () => {
  test('inicio de sesion exitoso como administrador y acceso al panel de control', async ({ page }) => {
    // 1. Navegar a la pantalla de login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Turnero/);

    // 2. Completar credenciales de administrador
    await page.fill('#login-email', 'admin@turnero.com');
    await page.fill('#login-password', 'admin123');

    // 3. Enviar el formulario
    await page.click('#login-submit');

    // 4. Verificar redireccion al dashboard de administracion
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('h1.page-title')).toContainText('Dashboard');
    await expect(page.locator('.user-role')).toContainText('Administrador');
  });

  test('intento de registro con email ya existente muestra alerta de error y bloquea el alta', async ({ page }) => {
    // 1. Navegar a la pantalla de registro
    await page.goto('/register');
    await expect(page.locator('.auth-title')).toContainText('Crear Cuenta');

    // 2. Intentar registrar un usuario con el email del administrador (ya registrado en DB)
    await page.fill('#reg-name', 'Admin Duplicado');
    await page.fill('#reg-email', 'admin@turnero.com');
    await page.fill('#reg-password', 'admin1234');

    // 3. Enviar formulario
    await page.click('#register-submit');

    // 4. Comprobar que permanece en /register y muestra la alerta de error devuelta por la API
    const alert = page.locator('.alert.alert-error');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/ya está registrado|registrado/i);
    await expect(page).toHaveURL(/\/register/);
  });

  test('registro de un nuevo cliente, navegacion en su dashboard y posterior cierre de sesion', async ({ page }) => {
    const timestamp = Date.now();
    const nombre = `Cliente E2E ${timestamp}`;
    const email = `cliente_${timestamp}@turnero.com`;

    // 1. Navegar a la pantalla de registro
    await page.goto('/register');
    await expect(page.locator('.auth-title')).toContainText('Crear Cuenta');

    // 2. Completar datos de alta
    await page.fill('#reg-name', nombre);
    await page.fill('#reg-email', email);
    await page.fill('#reg-password', 'pass1234');

    // 3. Enviar formulario de registro
    await page.click('#register-submit');

    // 4. Verificar ingreso al dashboard de cliente y elementos de bienvenida
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1.page-title')).toContainText('Cliente');
    await expect(page.locator('.stat-card', { hasText: 'Reservar Turno' })).toBeVisible();

    // 5. Cierre de sesion del usuario registrado
    await page.click('button.logout-btn');
    await expect(page).toHaveURL(/\/login/);
  });
});

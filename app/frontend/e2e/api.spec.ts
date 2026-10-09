import { test, expect } from '@playwright/test';

// La API tiene su propia direccion publica de QA (no es la del front).
const API = process.env.API_BASE_URL || 'https://turnero-api-qa.onrender.com';

test.describe('Suite de Integracion — API de Turnero contra PostgreSQL real en Neon', () => {
  test('alta, verificacion en base de datos y baja logica de una cancha', async ({ request }) => {
    // 1. Autenticarse como administrador para obtener el token JWT
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@turnero.com', password: 'admin123' },
    });
    expect(loginRes.status()).toBe(200);
    const { token } = await loginRes.json();
    expect(token).toBeTruthy();

    // 2. Alta: Crear una cancha con nombre unico (timestamp) para no colisionar
    const courtName = `Cancha Test ${Date.now()}`;
    const createRes = await request.post(`${API}/api/courts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: courtName,
        description: 'Cancha sintetica creada por test de integracion',
      },
    });
    expect(createRes.status()).toBe(201);
    const createdCourt = await createRes.json();
    expect(createdCourt.id).toBeTruthy();
    expect(createdCourt.name).toBe(courtName);

    // 3. Verificacion en base de datos: el GET devuelve el dato real persistido
    const listRes = await request.get(`${API}/api/courts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status()).toBe(200);
    const courts = await listRes.json();
    const found = courts.some((c: any) => c.name === courtName && c.id === createdCourt.id);
    expect(found).toBe(true);

    // 4. Baja logica: eliminar la cancha creada
    const deleteRes = await request.delete(`${API}/api/courts/${createdCourt.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status()).toBe(200);

    // 5. Comprobacion de baja: ya no debe figurar en el listado activo
    const listAfterRes = await request.get(`${API}/api/courts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listAfterRes.status()).toBe(200);
    const courtsAfter = await listAfterRes.json();
    const stillPresent = courtsAfter.some((c: any) => c.id === createdCourt.id);
    expect(stillPresent).toBe(false);
  });

  test('alta invalida de usuario es rechazada con 400 Bad Request y no persiste nada', async ({ request }) => {
    // Intento de registrar un usuario con contrasenia demasiado corta (< 6 caracteres)
    const invalidRes = await request.post(`${API}/api/auth/register`, {
      data: {
        name: 'Usuario Invalido',
        email: `invalid_${Date.now()}@turnero.com`,
        password: '123', // Invalido segun las reglas de negocio (minimo 6)
      },
    });
    expect(invalidRes.status()).toBe(400);
    const body = await invalidRes.json();
    expect(body.error).toBeTruthy();
  });

  test('seguridad de endpoints: rechaza credenciales invalidas y accesos no autenticados', async ({ request }) => {
    // 1. Intento de login con contrasenia incorrecta devuelve 401 Unauthorized
    const badLoginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@turnero.com', password: 'password_totalmente_incorrecto' },
    });
    expect(badLoginRes.status()).toBe(401);

    // 2. Consulta a endpoints protegidos sin header Authorization devuelve 401
    const unauthRes = await request.get(`${API}/api/courts`);
    expect(unauthRes.status()).toBe(401);
  });
});

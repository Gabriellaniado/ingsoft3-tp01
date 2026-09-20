import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../pages/Login';

// Mock del AuthContext: provee un login() sin-op y user=null
vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), user: null, isAuthenticated: false }),
}));

// Mock de la API de auth para evitar llamadas HTTP reales
vi.mock('../api/auth', () => ({
  login: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

// Test 1: botón deshabilitado cuando los campos están vacíos
describe('Login — botón Ingresar', () => {
  it('está deshabilitado si email y contraseña están vacíos', () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /ingresar/i });
    expect(btn).toBeDisabled();
  });

  // Test 2: botón se habilita al completar ambos campos
  it('se habilita cuando email y contraseña tienen contenido', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@ejemplo.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123');

    const btn = screen.getByRole('button', { name: /ingresar/i });
    expect(btn).not.toBeDisabled();
  });

  // Test parametrizado con it.each (Vitest)
  it.each([
    { email: '', password: '', expectedDisabled: true, desc: 'ambos campos vacíos' },
    { email: 'test@ejemplo.com', password: '', expectedDisabled: true, desc: 'solo email completado' },
    { email: '', password: 'secreto123', expectedDisabled: true, desc: 'solo contraseña completada' },
    { email: 'test@ejemplo.com', password: 'secreto123', expectedDisabled: false, desc: 'ambos campos completados' },
  ])(
    'evalúa habilitación del botón según campos: $desc',
    async ({ email, password, expectedDisabled }) => {
      const user = userEvent.setup();
      renderLogin();

      if (email) {
        await user.type(screen.getByLabelText(/email/i), email);
      }
      if (password) {
        await user.type(screen.getByLabelText(/contraseña/i), password);
      }

      const btn = screen.getByRole('button', { name: /ingresar/i });
      if (expectedDisabled) {
        expect(btn).toBeDisabled();
      } else {
        expect(btn).not.toBeDisabled();
      }
    }
  );
});

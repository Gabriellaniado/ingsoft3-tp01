import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// ---- Mocks ----

vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Tester', role: 'CLIENT' },
    isAuthenticated: true,
  }),
}));

// Mock que devuelve 1 cancha — el selector debe mostrarla
vi.mock('../api/courts', () => ({
  getCourts: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Cancha 1', description: '' }]),
}));

vi.mock('../api/bookings', () => ({
  getAvailability: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
}));

vi.mock('../components/Sidebar', () => ({ default: () => <nav data-testid="sidebar" /> }));
vi.mock('../components/LoadingSpinner', () => ({ default: () => <div>Cargando...</div> }));

import BookingCalendar from '../pages/client/BookingCalendar';

function renderCalendar() {
  return render(
    <MemoryRouter>
      <BookingCalendar />
    </MemoryRouter>
  );
}

// Test 3: el selector de cancha aparece con el nombre devuelto por el mock
// Si getCourts no se llama o el componente no muestra la opción, este test se pone en rojo.
describe('BookingCalendar — carga inicial', () => {
  it('muestra la cancha devuelta por el mock de getCourts en el selector', async () => {
    // Arrange
    renderCalendar();

    // Act + Assert
    // findByRole espera de forma asíncrona a que aparezca el combobox
    const courtSelect = await screen.findByRole('combobox');
    expect(courtSelect).toBeInTheDocument();

    // La opción con el nombre de la cancha mockeada debe estar en el DOM
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /cancha 1/i })).toBeInTheDocument();
    });
  });

  // Test 4 (caso de error / borde): cuando el mock de getCourts devuelve lista vacía,
  // NO se renderiza el selector y en su lugar aparece el mensaje de error del componente.
  // Si el componente no maneja el array vacío y rompe, este test se pone en rojo.
  it('muestra mensaje de error cuando getCourts devuelve lista vacía', async () => {
    // Arrange
    const { getCourts } = await import('../api/courts');
    vi.mocked(getCourts).mockResolvedValueOnce([]);

    renderCalendar();

    // Act + Assert
    // Esperar a que el spinner desaparezca (loadingCourts=false) y aparezca el mensaje
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });

    // Sin canchas el componente muestra este texto y NO el <select>
    expect(screen.getByText(/no hay canchas disponibles/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

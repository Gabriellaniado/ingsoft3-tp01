import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// ---- Mocks ----

vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Tester', role: 'CLIENT' },
    isAuthenticated: true,
  }),
}));

vi.mock('../api/courts', () => ({
  getCourts: vi.fn().mockResolvedValue([
    { id: 'c1', name: 'Cancha 1', description: 'Pasto sintético' },
    { id: 'c2', name: 'Cancha 2', description: '' },
  ]),
}));

vi.mock('../api/bookings', () => ({
  getAvailability: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
}));

vi.mock('../components/Sidebar', () => ({ default: () => <nav data-testid="sidebar" /> }));
vi.mock('../components/LoadingSpinner', () => ({ default: () => <div>Cargando...</div> }));

import BookingCalendar from '../pages/client/BookingCalendar';
import { getAvailability, createBooking } from '../api/bookings';

function renderCalendar() {
  return render(
    <MemoryRouter>
      <BookingCalendar />
    </MemoryRouter>
  );
}

describe('BookingCalendar — carga inicial', () => {
  it('muestra la cancha devuelta por el mock de getCourts en el selector', async () => {
    renderCalendar();

    const courtSelect = await screen.findByRole('combobox');
    expect(courtSelect).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /cancha 1/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /cancha 2/i })).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error cuando getCourts devuelve lista vacía', async () => {
    const { getCourts } = await import('../api/courts');
    vi.mocked(getCourts).mockResolvedValueOnce([]);

    renderCalendar();

    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no hay canchas disponibles/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('BookingCalendar — interacción y navegación', () => {
  it('permite cambiar de cancha y navegar entre meses', async () => {
    const user = userEvent.setup();
    renderCalendar();

    const courtSelect = await screen.findByRole('combobox');
    await user.selectOptions(courtSelect, 'c2');
    expect(courtSelect).toHaveValue('c2');

    const nextMonthBtn = screen.getByRole('button', { name: '›' });
    const prevMonthBtn = screen.getByRole('button', { name: '‹' });

    await user.click(nextMonthBtn);
    await user.click(prevMonthBtn);
  });

  it('muestra mensaje de sin horarios si la fecha no tiene turnos o falla la API', async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailability).mockResolvedValueOnce([]);

    const { container } = renderCalendar();
    await screen.findByRole('combobox');

    const activeDay = container.querySelector('.cal-day:not(.cal-disabled):not(.cal-empty)');
    expect(activeDay).toBeTruthy();
    await user.click(activeDay!);

    expect(await screen.findByText(/sin horarios disponibles/i)).toBeInTheDocument();
  });

  it('maneja error cuando falla la llamada a getAvailability', async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailability).mockRejectedValueOnce(new Error('Network error'));

    const { container } = renderCalendar();
    await screen.findByRole('combobox');

    const activeDay = container.querySelector('.cal-day:not(.cal-disabled):not(.cal-empty)');
    expect(activeDay).toBeTruthy();
    await user.click(activeDay!);

    expect(await screen.findByText(/sin horarios disponibles/i)).toBeInTheDocument();
  });
});

describe('BookingCalendar — flujo completo de reserva', () => {
  const mockSlots = [
    {
      start_time: '2026-09-25T14:00:00.000Z',
      end_time: '2026-09-25T15:00:00.000Z',
      available: true,
    },
    {
      start_time: '2026-09-25T15:00:00.000Z',
      end_time: '2026-09-25T16:00:00.000Z',
      available: false,
    },
  ];

  it('permite seleccionar un turno disponible y confirmar la reserva exitosamente', async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailability).mockResolvedValue(mockSlots);
    vi.mocked(createBooking).mockResolvedValueOnce({
      id: 'b1',
      court_id: 'c1',
      team_name: 'Los Halcones',
      start_time: mockSlots[0].start_time,
      status: 'PENDING',
    } as any);

    const { container } = renderCalendar();
    await screen.findByRole('combobox');

    const activeDay = container.querySelector('.cal-day:not(.cal-disabled):not(.cal-empty)');
    await user.click(activeDay!);

    // Verifica que se renderice el turno libre y el ocupado
    const libreBtn = await screen.findByRole('button', { name: /libre/i });
    const ocupadoBtn = screen.getByRole('button', { name: /ocupado/i });
    expect(ocupadoBtn).toBeDisabled();

    // Selecciona el turno libre
    await user.click(libreBtn);

    // Formulario de reserva
    const confirmBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    expect(confirmBtn).toBeDisabled();

    const teamInput = screen.getByLabelText(/nombre del equipo/i);
    await user.type(teamInput, 'Los Halcones');
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);

    expect(createBooking).toHaveBeenCalledWith(
      expect.any(String),
      'Los Halcones',
      mockSlots[0].start_time
    );
    expect(await screen.findByText(/¡reserva creada!/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando createBooking es rechazado por el servidor', async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailability).mockResolvedValue(mockSlots);
    vi.mocked(createBooking).mockRejectedValueOnce({
      response: { data: { error: 'El turno ya fue reservado' } },
    });

    const { container } = renderCalendar();
    await screen.findByRole('combobox');

    const activeDay = container.querySelector('.cal-day:not(.cal-disabled):not(.cal-empty)');
    await user.click(activeDay!);

    const libreBtn = await screen.findByRole('button', { name: /libre/i });
    await user.click(libreBtn);

    const teamInput = screen.getByLabelText(/nombre del equipo/i);
    await user.type(teamInput, 'Los Halcones');

    const confirmBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    await user.click(confirmBtn);

    expect(await screen.findByText(/el turno ya fue reservado/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error genérico cuando createBooking falla sin respuesta estructurada', async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailability).mockResolvedValue(mockSlots);
    vi.mocked(createBooking).mockRejectedValueOnce(new Error('Fallo general'));

    const { container } = renderCalendar();
    await screen.findByRole('combobox');

    const activeDay = container.querySelector('.cal-day:not(.cal-disabled):not(.cal-empty)');
    await user.click(activeDay!);

    const libreBtn = await screen.findByRole('button', { name: /libre/i });
    await user.click(libreBtn);

    const teamInput = screen.getByLabelText(/nombre del equipo/i);
    await user.type(teamInput, 'Los Halcones');

    const confirmBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    await user.click(confirmBtn);

    expect(await screen.findByText(/error al crear la reserva/i)).toBeInTheDocument();
  });
});


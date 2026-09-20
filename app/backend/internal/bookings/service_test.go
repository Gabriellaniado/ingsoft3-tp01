package bookings_test

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"turnero/internal/bookings"
	"turnero/internal/settings"
)

// ---- Mocks ----

type mockRepo struct {
	items      []*bookings.Booking
	hasOverlap bool
}

func (m *mockRepo) Create(b *bookings.Booking) error {
	m.items = append(m.items, b)
	return nil
}
func (m *mockRepo) FindByID(id uuid.UUID) (*bookings.Booking, error) {
	for _, b := range m.items {
		if b.ID == id {
			return b, nil
		}
	}
	return nil, errors.New("not found")
}
func (m *mockRepo) FindAll() ([]bookings.Booking, error)                       { return nil, nil }
func (m *mockRepo) FindMyFuture(uuid.UUID) ([]bookings.Booking, error)         { return nil, nil }
func (m *mockRepo) FindByCourt(uuid.UUID, time.Time) ([]bookings.Booking, error) { return nil, nil }
func (m *mockRepo) HasOverlap(uuid.UUID, time.Time, time.Time, *uuid.UUID) (bool, error) {
	return m.hasOverlap, nil
}
func (m *mockRepo) Update(b *bookings.Booking) error {
	for i, x := range m.items {
		if x.ID == b.ID {
			m.items[i] = b
			return nil
		}
	}
	return errors.New("not found")
}

type mockSettings struct{}

func (m *mockSettings) Get() (*settings.Settings, error) {
	return &settings.Settings{
		BasePrice:           5000,
		OpenTime:            "08:00",
		CloseTime:           "22:00",
		SlotDurationMinutes: 60,
	}, nil
}

func loc() *time.Location {
	l, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	return l
}

func futureSlot(h int) time.Time {
	t := time.Now().In(loc()).Add(24 * time.Hour)
	return time.Date(t.Year(), t.Month(), t.Day(), h, 0, 0, 0, loc()).UTC()
}

func newSvc(repo *mockRepo) *bookings.Service {
	return bookings.NewService(repo, &mockSettings{})
}

// RN #3 valid: future booking
func TestCreate_ValidFuture(t *testing.T) {
	// Arrange
	repo := &mockRepo{}
	svc := newSvc(repo)
	req := bookings.CreateRequest{
		CourtID:   uuid.New(),
		TeamName:  "Los Cracks",
		StartTime: futureSlot(10),
	}
	userID := uuid.New()

	// Act
	b, err := svc.Create(req, userID)

	// Assert
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if b == nil {
		t.Fatal("expected booking to be created, got nil")
	}
}

// RN #3 invalid: past booking
func TestCreate_PastBooking(t *testing.T) {
	// Arrange
	repo := &mockRepo{}
	svc := newSvc(repo)
	req := bookings.CreateRequest{
		CourtID:   uuid.New(),
		TeamName:  "Past FC",
		StartTime: time.Now().Add(-2 * time.Hour),
	}
	userID := uuid.New()

	// Act
	_, err := svc.Create(req, userID)

	// Assert
	if err == nil {
		t.Fatal("expected error for past booking")
	}
}

// RN #1 invalid: overlapping booking
func TestCreate_Overlap(t *testing.T) {
	// Arrange
	repo := &mockRepo{hasOverlap: true}
	svc := newSvc(repo)
	req := bookings.CreateRequest{
		CourtID:   uuid.New(),
		TeamName:  "Overlap FC",
		StartTime: futureSlot(10),
	}
	userID := uuid.New()

	// Act
	_, err := svc.Create(req, userID)

	// Assert
	if err == nil {
		t.Fatal("expected error for overlapping slot")
	}
}

// RN #2 invalid: outside operating hours (23:00 when close=22:00)
func TestCreate_OutsideHours(t *testing.T) {
	// Arrange
	repo := &mockRepo{}
	svc := newSvc(repo)
	req := bookings.CreateRequest{
		CourtID:   uuid.New(),
		TeamName:  "Noche FC",
		StartTime: futureSlot(23),
	}
	userID := uuid.New()

	// Act
	_, err := svc.Create(req, userID)

	// Assert
	if err == nil {
		t.Fatal("expected error for outside operating hours")
	}
}

// RN #2 valid: within operating hours (09:00)
func TestCreate_WithinHours(t *testing.T) {
	// Arrange
	repo := &mockRepo{}
	svc := newSvc(repo)
	req := bookings.CreateRequest{
		CourtID:   uuid.New(),
		TeamName:  "Morning FC",
		StartTime: futureSlot(9),
	}
	userID := uuid.New()

	// Act
	b, err := svc.Create(req, userID)

	// Assert
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if b == nil {
		t.Fatal("expected booking to be created, got nil")
	}
}

// RN #4 valid: PENDIENTE -> CONFIRMADO
func TestUpdateStatus_PendingToConfirmed(t *testing.T) {
	// Arrange
	id := uuid.New()
	repo := &mockRepo{items: []*bookings.Booking{{ID: id, Status: bookings.StatusPending, UserID: uuid.New()}}}
	svc := newSvc(repo)

	// Act
	b, err := svc.UpdateStatus(id, bookings.StatusConfirmed)

	// Assert
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if b.Status != bookings.StatusConfirmed {
		t.Errorf("expected CONFIRMADO, got %s", b.Status)
	}
}

// RN #4 invalid: CANCELADO -> CONFIRMADO (blocked)
func TestUpdateStatus_CancelledToConfirmed(t *testing.T) {
	// Arrange
	id := uuid.New()
	repo := &mockRepo{items: []*bookings.Booking{{ID: id, Status: bookings.StatusCancelled, UserID: uuid.New()}}}
	svc := newSvc(repo)

	// Act
	_, err := svc.UpdateStatus(id, bookings.StatusConfirmed)

	// Assert
	if err == nil {
		t.Fatal("expected error for invalid transition CANCELADO->CONFIRMADO")
	}
}

// RN #5 invalid: usuario intenta cancelar la reserva de otro (autorización)
func TestCancelMy_OtherUserForbidden(t *testing.T) {
	// Arrange
	id := uuid.New()
	ownerID := uuid.New()
	otherID := uuid.New()
	repo := &mockRepo{items: []*bookings.Booking{{ID: id, Status: bookings.StatusPending, UserID: ownerID}}}
	svc := newSvc(repo)

	// Act
	_, err := svc.CancelMy(id, otherID)

	// Assert
	if err == nil {
		t.Fatal("expected error: usuario no debe poder cancelar la reserva de otro")
	}
}

// ---- Test Parametrizado (Table-Driven Test en Go) ----
// Valida todas las combinaciones de transiciones de estado de reservas (RN #4)
func TestUpdateStatus_TransitionsTableDriven(t *testing.T) {
	// Arrange: definición de casos de prueba tabulados
	tests := []struct {
		name          string
		initialStatus string
		targetStatus  string
		expectError   bool
	}{
		{
			name:          "PENDIENTE a CONFIRMADO (valido)",
			initialStatus: bookings.StatusPending,
			targetStatus:  bookings.StatusConfirmed,
			expectError:   false,
		},
		{
			name:          "PENDIENTE a CANCELADO (valido)",
			initialStatus: bookings.StatusPending,
			targetStatus:  bookings.StatusCancelled,
			expectError:   false,
		},
		{
			name:          "CONFIRMADO a CANCELADO (valido)",
			initialStatus: bookings.StatusConfirmed,
			targetStatus:  bookings.StatusCancelled,
			expectError:   false,
		},
		{
			name:          "CANCELADO a CONFIRMADO (invalido - estado final)",
			initialStatus: bookings.StatusCancelled,
			targetStatus:  bookings.StatusConfirmed,
			expectError:   true,
		},
		{
			name:          "CANCELADO a PENDIENTE (invalido - no puede reactivarse)",
			initialStatus: bookings.StatusCancelled,
			targetStatus:  bookings.StatusPending,
			expectError:   true,
		},
		{
			name:          "CONFIRMADO a PENDIENTE (invalido - no puede volver a pendiente)",
			initialStatus: bookings.StatusConfirmed,
			targetStatus:  bookings.StatusPending,
			expectError:   true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Arrange
			id := uuid.New()
			repo := &mockRepo{items: []*bookings.Booking{{ID: id, Status: tc.initialStatus, UserID: uuid.New()}}}
			svc := newSvc(repo)

			// Act
			b, err := svc.UpdateStatus(id, tc.targetStatus)

			// Assert
			if tc.expectError {
				if err == nil {
					t.Fatalf("se esperaba un error para la transicion %s -> %s, pero fue nil", tc.initialStatus, tc.targetStatus)
				}
			} else {
				if err != nil {
					t.Fatalf("no se esperaba error para %s -> %s, pero dio: %v", tc.initialStatus, tc.targetStatus, err)
				}
				if b.Status != tc.targetStatus {
					t.Errorf("se esperaba estado %s, pero se obtuvo %s", tc.targetStatus, b.Status)
				}
			}
		})
	}
}


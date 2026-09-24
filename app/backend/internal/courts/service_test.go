package courts_test

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"turnero/internal/courts"
)

// ---- Mock ----

type mockCourtRepo struct {
	items      []*courts.Court
	createErr  error
	updateErr  error
	deleteErr  error
	findAllErr error
}

func (m *mockCourtRepo) FindAll() ([]courts.Court, error) {
	if m.findAllErr != nil {
		return nil, m.findAllErr
	}
	out := make([]courts.Court, len(m.items))
	for i, c := range m.items {
		out[i] = *c
	}
	return out, nil
}

func (m *mockCourtRepo) FindByID(id uuid.UUID) (*courts.Court, error) {
	for _, c := range m.items {
		if c.ID == id {
			return c, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockCourtRepo) Create(c *courts.Court) error {
	if m.createErr != nil {
		return m.createErr
	}
	m.items = append(m.items, c)
	return nil
}

func (m *mockCourtRepo) Update(c *courts.Court) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	for i, x := range m.items {
		if x.ID == c.ID {
			m.items[i] = c
			return nil
		}
	}
	return errors.New("not found")
}

func (m *mockCourtRepo) SoftDelete(id uuid.UUID) error {
	return m.deleteErr
}

func newCourtSvc(repo *mockCourtRepo) *courts.Service {
	return courts.NewService(repo)
}

// ---- Tests ----

// RN Canchas #1: crear una cancha válida la persiste y la devuelve con ID
func TestCreate_CourtValid(t *testing.T) {
	// Arrange
	repo := &mockCourtRepo{}
	svc := newCourtSvc(repo)
	req := courts.CreateRequest{Name: "Cancha 1", Description: "Césped natural"}

	// Act
	c, err := svc.Create(req)

	// Assert
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if c == nil || c.Name != "Cancha 1" {
		t.Errorf("expected court with name 'Cancha 1', got %+v", c)
	}
	if !c.IsActive {
		t.Error("expected court to be active by default")
	}
}

// RN Canchas #2 (error): actualizar una cancha que no existe devuelve error
func TestUpdate_CourtNotFound(t *testing.T) {
	// Arrange
	repo := &mockCourtRepo{} // vacío, no tiene canchas
	svc := newCourtSvc(repo)
	req := courts.UpdateRequest{Name: "Cancha Modificada", IsActive: true}

	// Act
	_, err := svc.Update(uuid.New(), req)

	// Assert
	if err == nil {
		t.Fatal("expected error for non-existent court, got nil")
	}
}

// RN Canchas #3: actualizar una cancha existente refleja los nuevos valores
func TestUpdate_CourtExists(t *testing.T) {
	// Arrange
	id := uuid.New()
	repo := &mockCourtRepo{
		items: []*courts.Court{{ID: id, Name: "Vieja", Description: "", IsActive: true}},
	}
	svc := newCourtSvc(repo)
	req := courts.UpdateRequest{Name: "Nueva", Description: "Con iluminación", IsActive: false}

	// Act
	c, err := svc.Update(id, req)

	// Assert
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if c.Name != "Nueva" {
		t.Errorf("expected name 'Nueva', got %q", c.Name)
	}
	if c.IsActive {
		t.Error("expected court to be inactive after update")
	}
}

// Parametrizado: tabla de creación de canchas con distintos estados de error del repo
func TestCreate_CourtTableDriven(t *testing.T) {
	tests := []struct {
		name        string
		repoErr     error
		expectError bool
	}{
		{name: "repo ok", repoErr: nil, expectError: false},
		{name: "repo falla", repoErr: errors.New("db error"), expectError: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Arrange
			repo := &mockCourtRepo{createErr: tc.repoErr}
			svc := newCourtSvc(repo)
			req := courts.CreateRequest{Name: "Test"}

			// Act
			_, err := svc.Create(req)

			// Assert
			if tc.expectError && err == nil {
				t.Fatalf("esperaba error pero no hubo")
			}
			if !tc.expectError && err != nil {
				t.Fatalf("no esperaba error, got %v", err)
			}
		})
	}
}

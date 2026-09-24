package courts

import (
	"errors"

	"github.com/google/uuid"
)

// CourtRepository is the interface used by Service (enables mocking in tests).
type CourtRepository interface {
	FindAll() ([]Court, error)
	FindByID(id uuid.UUID) (*Court, error)
	Create(c *Court) error
	Update(c *Court) error
	SoftDelete(id uuid.UUID) error
}

type CreateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

type Service struct{ repo CourtRepository }

// NewService crea una instancia del servicio de canchas con su repositorio asociado.
func NewService(repo CourtRepository) *Service { return &Service{repo: repo} }

// GetAll retorna todas las canchas activas en el sistema.
func (s *Service) GetAll() ([]Court, error) { return s.repo.FindAll() }

// Create crea una nueva cancha activa con identificador único.
func (s *Service) Create(req CreateRequest) (*Court, error) {
	c := &Court{ID: uuid.New(), Name: req.Name, Description: req.Description, IsActive: true}
	return c, s.repo.Create(c)
}

// Update actualiza la información y estado de una cancha existente.
// Retorna error si la cancha no existe (RN: no se puede actualizar lo que no existe).
func (s *Service) Update(id uuid.UUID, req UpdateRequest) (*Court, error) {
	c, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("cancha no encontrada")
	}
	c.Name = req.Name
	c.Description = req.Description
	c.IsActive = req.IsActive
	return c, s.repo.Update(c)
}

// Delete realiza el borrado lógico de una cancha por su identificador.
func (s *Service) Delete(id uuid.UUID) error { return s.repo.SoftDelete(id) }

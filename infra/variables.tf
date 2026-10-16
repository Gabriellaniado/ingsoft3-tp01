variable "neon_org_id" {
  type        = string
  description = "Identificador de la organización en Neon"
  default     = "org-shiny-grass-50551164"
}

variable "image_repo_api" {
  type        = string
  description = "Repositorio de la imagen de la API en GHCR (sin tag)"
  default     = "ghcr.io/gabriellaniado/ingsoft3-tp01-backend"
}

variable "image_repo_front" {
  type        = string
  description = "Repositorio de la imagen del frontend en GHCR (sin tag)"
  default     = "ghcr.io/gabriellaniado/ingsoft3-tp01-frontend"
}

variable "image_tag" {
  type        = string
  description = "Etiqueta inmutable de la imagen Docker (commit SHA de un merge del TP7)"
  default     = "sha-b0a3b1f04b8eb892bfff0923df51ded64f5f6a14"
}

variable "region" {
  type        = string
  description = "Región de Render para desplegar los servicios"
  default     = "oregon"
}

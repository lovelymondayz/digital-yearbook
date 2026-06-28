package model

import "net/http"

// Common error constructors
func NewNotFoundError(entity string) *APIError {
	return &APIError{
		Code:    "NOT_FOUND",
		Message: entity + " not found",
	}
}

func NewUnauthorizedError(message string) *APIError {
	if message == "" {
		message = "unauthorized"
	}
	return &APIError{
		Code:    "UNAUTHORIZED",
		Message: message,
	}
}

func NewForbiddenError(message string) *APIError {
	if message == "" {
		message = "forbidden"
	}
	return &APIError{
		Code:    "FORBIDDEN",
		Message: message,
	}
}

func NewValidationError(details ...string) *APIError {
	return &APIError{
		Code:    "VALIDATION_ERROR",
		Message: "validation failed",
		Details: details,
	}
}

func NewInternalError() *APIError {
	return &APIError{
		Code:    "INTERNAL_ERROR",
		Message: "an internal error occurred",
	}
}

func NewConflictError(message string) *APIError {
	return &APIError{
		Code:    "CONFLICT",
		Message: message,
	}
}

// HTTP status code mapping
func StatusCodeForError(err *APIError) int {
	switch err.Code {
	case "NOT_FOUND":
		return http.StatusNotFound
	case "UNAUTHORIZED":
		return http.StatusUnauthorized
	case "FORBIDDEN":
		return http.StatusForbidden
	case "VALIDATION_ERROR":
		return http.StatusBadRequest
	case "CONFLICT":
		return http.StatusConflict
	default:
		return http.StatusInternalServerError
	}
}

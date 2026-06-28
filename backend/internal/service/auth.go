package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/config"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	cfg   *config.Config
	db    *pgxpool.Pool
}

func NewAuthService(cfg *config.Config, db *pgxpool.Pool) *AuthService {
	return &AuthService{cfg: cfg, db: db}
}

func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.User, *model.TokenPair, error) {
	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, fmt.Errorf("hash password: %w", err)
	}

	// Create user
	var user model.User
	err = s.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, role, status)
		VALUES ($1, $2, $3, 'super_admin', 'active')
		RETURNING id, email, full_name, role, status, created_at, updated_at
	`, req.Email, string(hash), req.FullName).Scan(
		&user.ID, &user.Email, &user.FullName, &user.Role, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("create user: %w", err)
	}

	// Generate tokens
	tokens, err := s.generateTokenPair(ctx, user.ID, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.User, *model.TokenPair, error) {
	var user model.User
	var passwordHash string
	err := s.db.QueryRow(ctx, `
		SELECT id, email, password_hash, full_name, role, status, university_id, avatar_url, created_at, updated_at
		FROM users WHERE email = $1 AND deleted_at IS NULL
	`, req.Email).Scan(
		&user.ID, &user.Email, &passwordHash, &user.FullName, &user.Role, &user.Status,
		&user.UniversityID, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	if user.Status != "active" {
		return nil, nil, fmt.Errorf("account is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	// Update last login
	s.db.Exec(ctx, `UPDATE users SET last_login_at = NOW() WHERE id = $1`, user.ID)

	// Generate tokens
	tokens, err := s.generateTokenPair(ctx, user.ID, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*model.TokenPair, error) {
	// Hash the refresh token to look it up
	tokenHash := hashToken(refreshToken)

	var userID, role, sessionID string
	var expiresAt time.Time
	var isRevoked bool

	err := s.db.QueryRow(ctx, `
		SELECT user_id, role, session_id, refresh_expires_at, is_revoked
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.refresh_token_hash = $1 AND u.deleted_at IS NULL
	`, tokenHash).Scan(&userID, &role, &sessionID, &expiresAt, &isRevoked)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	if isRevoked || time.Now().After(expiresAt) {
		return nil, fmt.Errorf("refresh token expired or revoked")
	}

	// Revoke old session
	s.db.Exec(ctx, `UPDATE sessions SET is_revoked = TRUE WHERE session_id = $1`, sessionID)

	// Generate new token pair
	return s.generateTokenPair(ctx, userID, role)
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	tokenHash := hashToken(refreshToken)
	_, err := s.db.Exec(ctx, `UPDATE sessions SET is_revoked = TRUE WHERE refresh_token_hash = $1`, tokenHash)
	return err
}

func (s *AuthService) generateTokenPair(ctx context.Context, userID, role string) (*model.TokenPair, error) {
	// Generate access token
	accessClaims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"iss":     s.cfg.JWTIssuer,
		"exp":     time.Now().Add(s.cfg.AccessExpiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessStr, err := accessToken.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	// Generate refresh token
	refreshBytes := make([]byte, 32)
	rand.Read(refreshBytes)
	refreshStr := hex.EncodeToString(refreshBytes)
	refreshHash := hashToken(refreshStr)

	// Store session
	_, err = s.db.Exec(ctx, `
		INSERT INTO sessions (user_id, token_hash, refresh_token_hash, expires_at, refresh_expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, hashToken(accessStr), refreshHash,
		time.Now().Add(s.cfg.AccessExpiry), time.Now().Add(s.cfg.RefreshExpiry))
	if err != nil {
		return nil, fmt.Errorf("store session: %w", err)
	}

	return &model.TokenPair{
		AccessToken:  accessStr,
		RefreshToken: refreshStr,
		ExpiresIn:    int(s.cfg.AccessExpiry.Seconds()),
		TokenType:    "Bearer",
	}, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

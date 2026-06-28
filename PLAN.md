# Digital Yearbook — Implementation Plan

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + R3F + drei + Three.js + Framer Motion + Zustand
- **Backend:** Go 1.22 + Chi router + pgx (PostgreSQL driver)
- **Database:** PostgreSQL 16
- **Photo Storage:** Immich (external, via Docker network)
- **Auth:** JWT (HMAC-SHA256)
- **Deployment:** Docker Compose + manual `./scripts/update.sh`

## Database Schema (PostgreSQL)

### Core Tables
```
universities
  id, name, slug, logo_url, website, created_at

campuses
  id, university_id, name, slug, address, city, created_at

faculties
  id, campus_id, name, slug, created_at

departments
  id, faculty_id, name, slug, created_at

users
  id, email, password_hash, name, role (admin/student), department_id, created_at

yearbooks
  id, title, year, department_id, cover_url, is_published, created_at

yearbook_pages
  id, yearbook_id, page_number, layout_type, content (JSON), created_at

students
  id, yearbook_id, full_name, nickname, photo_url, quote, bio, slug, created_at

student_galleries
  id, student_id, image_url, caption, sort_order, created_at

tags
  id, name, slug, created_at

student_tags
  student_id, tag_id

bookmarks
  id, user_id, student_id, created_at

sessions
  id, user_id, token, expires_at, created_at

audit_logs
  id, user_id, action, entity_type, entity_id, details, created_at

analytics_events
  id, event_type, entity_type, entity_id, user_id, metadata, created_at

versions
  id, entity_type, entity_id, data (JSON), created_by, created_at

image_assets
  id, url, thumbnail_url, width, height, size_bytes, mime_type, uploaded_by, created_at

permissions
  id, role, resource, action, created_at

functions
  id, name, description, handler, created_at
```

## API Endpoints

### Public
```
GET  /api/v1/flipbook/years          → list yearbooks (with Immich thumbnails)
GET  /api/v1/flipbook/:yearId/pages  → get pages for flipbook
GET  /api/v1/students/:id            → student profile
GET  /api/v1/gallery/:studentId      → student gallery
GET  /api/v1/departments             → list departments
```

### Auth
```
POST /api/v1/auth/login    → {email, password} → {token}
GET  /api/v1/auth/me       → current user info
```

### Admin (JWT required)
```
CRUD /api/v1/admin/students       → student management
CRUD /api/v1/admin/yearbooks      → yearbook management
CRUD /api/v1/admin/pages          → page management
CRUD /api/v1/admin/galleries      → gallery management
CRUD /api/v1/admin/tags           → tag management
POST /api/v1/admin/upload         → image upload
GET  /api/v1/admin/analytics      → dashboard stats
GET  /api/v1/admin/audit-logs     → audit trail
```

## Frontend Routes (React Router)
```
/                    → Homepage (flipbook year selector)
/:year               → 3D flipbook viewer (e.g. /2026, /2027)
/student/:studentId  → Student profile page
/admin/login         → Admin login
/admin               → Admin dashboard
```

## Task Breakdown

### Phase 1: Foundation ✅
- [x] Project scaffold (backend + frontend + docker-compose)
- [x] Database schema (20+ migrations)
- [x] Go API skeleton with Chi router
- [x] React + Vite + Tailwind setup
- [x] JWT auth flow
- [x] Basic CRUD handlers

### Phase 2: Core Features ✅
- [x] Flipbook 3D view (R3F + Three.js)
- [x] Student profile pages
- [x] Gallery viewer
- [x] Admin dashboard
- [x] Image upload
- [x] Immich integration for thumbnails

### Phase 3: Polish ✅
- [x] Vite chunk splitting (three/r3f/vendor)
- [x] Texture loading via THREE.TextureLoader
- [x] Responsive design
- [x] Framer Motion animations
- [x] Zustand state management
- [x] nginx reverse proxy
- [x] Cloudflare Tunnel

### Phase 4: Deploy ✅
- [x] Docker production builds
- [x] Manual deploy script (`scripts/update.sh`)
- [x] nginx proxy for yearbook.thamrin.ac.id
- [x] Cloudflare Tunnel for yearbook.arjism.com

### Phase 5: Remaining / TODO
- [ ] Audit logs UI in admin
- [ ] Analytics dashboard
- [ ] Bookmark/favorite students
- [ ] Search functionality
- [ ] Bulk student import (CSV)
- [ ] Yearbook PDF export
- [ ] Student self-service profile editing
- [ ] Mobile app PWA manifest

## Deployment
1. `git add -A && git commit && git push`
2. SSH to VPS
3. `cd /root/hermes/digital-yearbook && ./scripts/update.sh`
4. Docker builds from committed code (NOT working directory)

## Constraints
- Vite chunks: three/r3f/vendor MUST be separate
- Texture loading: THREE.TextureLoader directly (useState+useEffect)
- NEVER use useTexture from drei (crashes silently)
- Tailwind requires postcss.config.js or no utilities are generated
- Always use theme.extend.colors, never top-level colors
- React 19.2.7 + R3F 9.6.1 + drei 10.7.7 + Three.js 0.184 (exact versions)

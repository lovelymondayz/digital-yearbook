# GitHub Repository Migration Guide

Moving `digital-yearbook` from `lovelymondayz` to a new GitHub account.

---

## Step 1 — Create the New Repo

On the **new account**, create a blank repository:

- Name: `digital-yearbook` (or your preferred name)
- **No README** — keep it empty
- **No .gitignore**
- **No license**

> Why blank? Pushing to a non-empty repo creates merge conflicts. The existing local repo already has everything.

---

## Step 2 — Switch the Remote

From the VPS where the project lives (`/root/hermes/digital-yearbook`):

```bash
cd /root/hermes/digital-yearbook

# Remove old remote
git remote remove origin

# Add new remote (replace <NEW_USER>)
git remote add origin https://github.com/<NEW_USER>/digital-yearbook.git
```

Verify:

```bash
git remote -v
# origin  https://github.com/<NEW_USER>/digital-yearbook.git (fetch)
# origin  https://github.com/<NEW_USER>/digital-yearbook.git (push)
```

---

## Step 3 — Push Everything

Push all branches and tags in one go:

```bash
git push -u origin --all
git push -u origin --tags
```

> `--all` pushes all branches. `--tags` pushes all tags. If you only need `main`:
> ```bash
> git push -u origin main
> ```

---

## Step 4 — Update VPS Deploy Config

The auto-deploy pipeline (`GitHub push → webhook → deploy`) has two credentials that need updating:

### 4a — Webhook Secret

GitHub sends each push with an HMAC signature. The VPS validates this using a stored secret.

Find where it lives:

```bash
cd /root/hermes/digital-yearbook
grep -r "WEBHOOK_SECRET" .
```

Update to the new secret from the new repo's webhook settings:

```bash
# Example — adjust path based on grep results
patch .env "WEBHOOK_SECRET=old_value" "WEBHOOK_SECRET=new_value"
```

### 4b — GitHub PAT

The Personal Access Token in `/root/.github/pat` must belong to the **new account** with `repo` scope.

```bash
# Verify current token owner
curl -s -H "Authorization: token $(cat /root/.github/pat)" \
  https://api.github.com/user | jq -r '.login'
```

If it returns the old account, replace it:

```bash
echo "ghp_NEW_TOKEN_HERE" > /root/.github/pat
chmod 600 /root/.github/pat
```

---

## Step 5 — Verify Deploy Pipeline

Trigger a test push to confirm the full chain works:

```bash
cd /root/hermes/digital-yearbook
git commit --allow-empty -m "test: verify deploy from new account"
git push origin main
```

Then check the containers:

```bash
docker compose ps
# All should show "Running" or "Healthy"
```

If the deploy succeeds, the migration is complete.

---

## Quick Reference

| What | Where | What Changes |
|------|-------|--------------|
| Remote URL | `.git/config` | `lovelymondayz` → `<NEW_USER>` |
| Webhook secret | `.env` or docker-compose | New repo's secret |
| GitHub PAT | `/root/.github/pat` | Token from new account |
| Deploy webhook | `deploy-webhook.py` | No code changes needed |

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `rejected: cannot lock ref` | New repo has conflicting files | Ensure new repo is empty |
| `403 Forbidden` during pull | Old PAT cached | Run `git credential reject` then retry |
| Webhook returns 403 | Secret mismatch | Check `.env` matches repo webhook |
| Containers stuck in restart | Build failed | `docker compose logs frontend` |

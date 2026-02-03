# Create a Duplicate GitHub Repository (Copy of Boston)

This guide creates a **second GitHub repo** with the same code as `boston` (e.g. for backup or a separate copy).

---

## Option A: Create duplicate via GitHub website (no CLI)

1. **Create a new empty repo on GitHub**
   - Go to: **https://github.com/new**
   - **Repository name:** e.g. `boston-duplicate` (or any name you like)
   - **Description:** e.g. "Duplicate of Boston - CC Designer"
   - **Visibility:** Private or Public
   - **Do not** add README, .gitignore, or license (your project already has them)
   - Click **Create repository**

2. **Add the new repo as a remote and push**
   - In Terminal, from this project folder run (replace `YOUR_USERNAME` and `REPO_NAME` if different):

   ```bash
   cd "/Users/robreich-storer/Library/Mobile Documents/com~apple~CloudDocs/CC Designer/boston"

   # Add the new repo as a remote (use the URL GitHub shows on the new repo page)
   git remote add duplicate https://github.com/rrs77/boston-duplicate.git

   # Push your current main branch to the duplicate
   git push duplicate main
   ```

   - If you want all branches (e.g. `pwa-offline`) in the duplicate:

   ```bash
   git push duplicate --all
   ```

3. **Done.** Your duplicate repo is at:  
   `https://github.com/rrs77/boston-duplicate` (or whatever name you chose).

---

## Option B: Create duplicate via GitHub CLI

1. **Re-authenticate GitHub CLI** (your current token is invalid):

   ```bash
   gh auth login -h github.com
   ```

   Follow the prompts (browser or token).

2. **Create the duplicate repo and push** (from this project folder):

   ```bash
   cd "/Users/robreich-storer/Library/Mobile Documents/com~apple~CloudDocs/CC Designer/boston"

   gh repo create boston-duplicate --private --source=. --remote=duplicate --push
   ```

   - Change `boston-duplicate` to any repo name you want.
   - Use `--public` instead of `--private` if you want a public repo.

---

## Summary

| Current repo (original) | Duplicate (new copy)        |
|------------------------|----------------------------|
| `origin` → rrs77/boston | `duplicate` → rrs77/boston-duplicate |

After this, `origin` stays as your main boston repo; `duplicate` is the new copy. Push to either when you want:

- `git push origin main`   → updates boston  
- `git push duplicate main` → updates boston-duplicate  

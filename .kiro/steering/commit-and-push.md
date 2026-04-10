# Commit and Push

Always use `commit-and-push.sh` to commit and push changes. Never use raw `git commit` directly.

## Usage

```bash
bash commit-and-push.sh "your commit message"
```

## What it does

1. Stages all changes with `git add -A`
2. Commits with a fixed author identity:
   - Name: `The Styx`
   - Email: `thestyxquest@protonmail.com`
3. Pushes to `origin main`

## Notes

- The commit message is passed as the first argument `$1` — always provide one
- Author and committer are both set to The Styx regardless of local git config
- Always pushes to `main` branch on `origin`

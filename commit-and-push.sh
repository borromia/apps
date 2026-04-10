#\!/usr/bin/env bash
git add -A;
GIT_COMMITTER_NAME="The Styx" GIT_COMMITTER_EMAIL="thestyxquest@protonmail.com" git commit --author="The Styx <thestyxquest@protonmail.com>" -m "$1";
git push origin main;

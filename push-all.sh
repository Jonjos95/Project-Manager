#!/bin/bash

# Push to all Git remotes
# Usage: ./push-all.sh "commit message"

set -e

if [ -z "$1" ]; then
    echo "Error: Commit message required"
    echo "Usage: ./push-all.sh \"your commit message\""
    exit 1
fi

COMMIT_MSG="$1"

echo "📝 Adding all changes..."
git add -A

echo "✅ Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo "🚀 Pushing to GitHub (origin)..."
git push origin main

echo "🤗 Pushing to Hugging Face..."
git push huggingface main

echo ""
echo "✨ Successfully pushed to all remotes!"
echo "  - GitHub: https://github.com/Jonjos95/Project-Manager"
echo "  - Hugging Face: https://huggingface.co/spaces/jjosephdev/taskmaster-pro"
echo "  - AWS deployment will start automatically via GitHub Actions"


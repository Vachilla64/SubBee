#!/bin/bash
git filter-branch -f --index-filter 'git rm --cached --ignore-unmatch apps/frontend/optimize-images.js apps/frontend/generate-icons.js' --prune-empty HEAD

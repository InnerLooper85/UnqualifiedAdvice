#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( dirname "$SCRIPT_DIR" )"

# Go to project directory
cd "$PROJECT_DIR"

# Run the sync script in automated mode
/usr/local/bin/node scripts/sync-substack.js --automated 
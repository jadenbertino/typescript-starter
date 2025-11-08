#!/bin/bash
set -euo pipefail

# Usage
# bash scripts/inject.sh <actual command you wanted to run in the first place>

if [ -z "${1:-}" ]; then
  echo "❌ No command provided"
  echo "Usage: bash scripts/inject.sh <actual command you wanted to run in the first place>"
  exit 1
fi

# Validate Doppler CLI is installed
if [ ! command -v doppler &> /dev/null ]; then
  echo "❌ Please install Doppler CLI: https://docs.doppler.com/docs/install-cli"
  exit 1
fi

# Determine environment, throw if not set
if [ -z "$ENVIRONMENT" ]; then
  echo "❌ ENVIRONMENT not set"
  exit 1
fi

# Check if env file exists
ENV_FILE="env/.env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file not found: $ENV_FILE"
  exit 1
fi

# Source the environment file
source "$ENV_FILE"

# Validate DOPPLER_TOKEN is set
if [ -z "$DOPPLER_TOKEN" ]; then
  echo "❌ DOPPLER_TOKEN not set in $ENV_FILE"
  exit 1
fi

# Export DOPPLER_TOKEN
export DOPPLER_TOKEN

# Validate env variables
doppler run -- pnpm tsx src/env/client.ts
doppler run -- pnpm tsx src/env/server.ts

# Run the command with Doppler
doppler run -- "$@"

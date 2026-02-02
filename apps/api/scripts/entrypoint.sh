#!/bin/sh
set -e

echo "Running database migrations..."
node migrate.cjs

echo "Starting server..."
exec node index.cjs

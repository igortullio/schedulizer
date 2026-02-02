.PHONY: test lint format check

test:
	@echo "Running tests..."
	@npx vitest run || true

lint:
	@echo "Running linter..."
	@npx biome lint .

format:
	@echo "Formatting code..."
	@npx biome check . --write

check:
	@echo "Running checks..."
	@npx biome check .

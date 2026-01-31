.PHONY: dev dev-down

dev:
	@if [ -f apps/frontend/.env ]; then \
		set -a && . apps/frontend/.env && set +a && tilt up; \
	else \
		echo "Error: apps/frontend/.env not found. Copy from apps/frontend/.env.example"; \
		exit 1; \
	fi

dev-down:
	tilt down

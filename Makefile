.PHONY: build up dev dev-backend dev-frontend test seed clean validate down

build:
	docker-compose build

up:
	docker-compose up -d

dev:
	docker-compose up

dev-backend:
	cd backend && ./venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

dev-frontend:
	npm run dev

desktop-dev:
	npm run desktop-dev

desktop:
	npm run desktop

down:
	docker-compose down

seed:
	docker-compose run --rm backend python seed.py
# Local: cd backend && ./venv/bin/python seed.py  (re-seed: SEED_FORCE=1 ./venv/bin/python seed.py)

test:
	docker-compose run --rm backend pytest
	npx playwright test

validate:
	@echo "Tool-server contract smoke (expects backend on localhost:8000)"
	curl -sf http://127.0.0.1:8000/health | grep -q healthy
	curl -sf http://127.0.0.1:8000/tools | grep -q '"tools"'
	curl -sf -X POST http://127.0.0.1:8000/step -H 'Content-Type: application/json' \
		-d '{"action":{"tool_name":"list_users","parameters":{}}}' | grep -q observation

clean:
	docker-compose down -v
	rm -rf uploads/*

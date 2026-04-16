.PHONY: build dev test seed clean

build:
	docker-compose build

dev:
	docker-compose up

down:
	docker-compose down

seed:
	docker-compose run --rm backend python seed.py

test:
	docker-compose run --rm backend pytest
	npx playwright test

clean:
	docker-compose down -v
	rm -rf uploads/*

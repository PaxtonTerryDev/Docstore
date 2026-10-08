.PHONY: install up down migrate seed dev build lint typecheck setup

install:
	npm install

up:
	docker compose up -d

down:
	docker compose down

migrate:
	npm run migrate -w @workspace/db

seed:
	npm run seed -w @workspace/db

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

setup: install up migrate seed

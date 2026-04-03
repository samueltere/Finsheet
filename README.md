<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run locally with your own database

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bfe4f502-0eca-4394-bdf0-b8872924b14c

## Run locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Start your own API (Express + SQLite):
   `npm run api`
4. In a second terminal, start the frontend:
   `npm run dev`

## Database

- Database engine: SQLite (`data/hotel.sqlite`)
- API base path: `/api`
- Key endpoints:
  - `POST /api/db/:collection/query`
  - `GET /api/db/:collection/:id`
  - `POST /api/db/:collection`
  - `PUT /api/db/:collection/:id`
  - `PATCH /api/db/:collection/:id`
  - `DELETE /api/db/:collection/:id`
  - `POST /api/db/batch`

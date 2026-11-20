# Hungry Games

A multiplayer, AI-narrated Hunger Games party game. The React frontend (built with [Vite](https://vite.dev/))
talks to a Node server (`server.js`, Express + Socket.IO) that generates the story with Google Gemini.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite)
- A Gemini API key in a `.env` file at the project root:

  ```
  GEMINI_KEY=your-key-here
  ```

## Running locally

Install dependencies:

```sh
npm install
```

Start the game server (Socket.IO on [http://localhost:3001](http://localhost:3001); override with `PORT`):

```sh
npm run server
```

In a second terminal, start the frontend dev server on [http://localhost:3000](http://localhost:3000):

```sh
npm run dev
```

The client connects to the socket server at `http://localhost:3001`, and the server only accepts
Socket.IO connections from `http://localhost:3000`, so keep both ports as they are.

## Available scripts

- `npm run dev` (or `npm start`): Vite dev server with hot reload on port 3000.
- `npm run build`: production build into `build/`.
- `npm run preview`: serve the production build locally on port 3000.
- `npm run server`: run the game server (`node server.js`).

## Environment variables

Only the server reads environment variables (`GEMINI_KEY`, optional `PORT`). The frontend uses none.
If you add client-side variables, Vite only exposes ones prefixed with `VITE_`, read through
`import.meta.env.VITE_*` (the old Create React App `REACT_APP_*` / `process.env` convention no longer works).

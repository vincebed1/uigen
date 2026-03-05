# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install deps + generate Prisma client + run migrations
npm run setup

# Dev server (use this - the package.json script fails on Windows due to Unix env syntax)
NODE_OPTIONS='--require ./node-compat.cjs' npx next dev --turbopack

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Production build
NODE_OPTIONS='--require ./node-compat.cjs' npx next build

# Reset database (destructive)
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Create a new migration after schema changes
npx prisma migrate dev --name <migration-name>
```

> On Windows, `npm run dev` fails because the script uses Unix `VAR=val` syntax. Run the dev server directly with `NODE_OPTIONS=...` via bash as shown above.

## Architecture

UIGen is a Next.js 15 App Router application that lets users generate React components via AI chat with a live preview.

### Request flow

1. User types a prompt in `ChatInterface` -> `ChatProvider` (wrapping `useAIChat` from Vercel AI SDK) sends `POST /api/chat` with the serialized virtual file system and conversation history.
2. `src/app/api/chat/route.ts` reconstructs a `VirtualFileSystem`, calls `streamText` (Vercel AI SDK) with two AI tools: `str_replace_editor` and `file_manager`.
3. The AI streams tool calls back. The client-side `onToolCall` handler in `ChatProvider` dispatches them to `FileSystemContext.handleToolCall`, which mutates the in-memory VFS and triggers a re-render.
4. `PreviewFrame` reacts to `refreshTrigger`, transforms all `.jsx/.tsx` files via Babel (`@babel/standalone`) in-browser, generates a native ES module import map with blob URLs, and writes `srcdoc` on an `<iframe>` — no server round-trip for preview updates.
5. On stream finish, the server persists the full message history and serialized VFS to the `Project` row in SQLite via Prisma.

### Key abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory tree of `FileNode`s. Supports create/read/update/delete/rename and serialization. The single source of truth for generated files; nothing is written to disk.
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): React context wrapping the VFS instance. Exposes `handleToolCall` which bridges AI tool responses to VFS mutations. Uses `refreshTrigger` (counter) to propagate changes to consumers.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`, serializes the VFS on every submit, and wires `onToolCall` to `FileSystemContext`.
- **AI tools** (`src/lib/tools/`): `str_replace_editor` (create/str_replace/insert/view commands) and `file_manager` (rename/delete). These run server-side during streaming and their args are replayed client-side via `handleToolCall`.
- **JSX transformer** (`src/lib/transform/jsx-transformer.ts`): Runs fully in the browser. Transforms JSX/TSX with Babel, builds a native importmap, resolves `@/` aliases, auto-fetches unknown third-party packages from `esm.sh`, and injects Tailwind CSS CDN. Missing local imports get placeholder stub modules instead of erroring.
- **Provider** (`src/lib/provider.ts`): Returns the real `claude-haiku-4-5` model when `ANTHROPIC_API_KEY` is set; otherwise falls back to `MockLanguageModel` which streams pre-baked component code.

### Auth

JWT-based, stored in an `httpOnly` cookie (`auth-token`). `src/lib/auth.ts` is marked `server-only`. Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`. Anonymous users can generate components without signing in; their work is tracked in `sessionStorage` via `anon-work-tracker.ts` and can be saved on sign-up.

### Data model

The full schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the structure of data stored in the database.

Two Prisma models in SQLite:
- `User`: email + bcrypt password
- `Project`: belongs to a `User` (nullable for anonymous), stores `messages` (JSON string) and `data` (JSON string — serialized VFS)

### Routing

- `/` — anonymous workspace or redirect to most-recent project for authenticated users
- `/[projectId]` — authenticated project workspace; loads saved messages + VFS from DB

### `node-compat.cjs`

Required at startup via `NODE_OPTIONS`. Deletes `globalThis.localStorage` and `globalThis.sessionStorage` on the server to fix Node 25+ Web Storage SSR issues where those globals exist but are non-functional.

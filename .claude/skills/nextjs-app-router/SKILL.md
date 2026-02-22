---
name: nextjs-app-router
description: "Next.js 15 App Router patterns and conventions. Use when creating pages, API routes, layouts, middleware, server components, client components, server actions, or any Next.js-specific code."
---

## Framework Version
Next.js 15 with App Router. Do NOT use Pages Router patterns.

## Server Components (default)
- All components are Server Components by default
- Only add `"use client"` when the component needs: useState, useEffect, useRef, event handlers (onClick, onChange, onSubmit), browser APIs (window, document, localStorage), or third-party client-only libraries
- Server Components can directly await async operations (database queries, fetch)
- Server Components CANNOT use hooks or event handlers

## Client Components
- Add `"use client"` directive at the top of the file
- Keep client components as small as possible — extract the interactive part into a client component and keep the rest as server
- Client components can import server components as children, but not the other way around

## API Routes
- Located in `app/api/[route]/route.ts`
- Use `NextRequest` and `NextResponse` from `next/server`
- Export named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Always validate request body with Zod before processing
- Always wrap in try/catch and return proper error responses with status codes
- Example pattern:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.producto.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
```

## Dynamic Routes
- Use `[param]` folder naming: `app/api/productos/[id]/route.ts`
- Access params as second argument: `{ params }: { params: { id: string } }`
- In Next.js 15, params is a Promise — use `const { id } = await params`

## Layouts and Groups
- `layout.tsx` wraps all child pages and persists across navigations
- Use `(group)` folders to share layouts without affecting URL: `(auth)/login`, `(dashboard)/productos`
- `loading.tsx` for loading states, `error.tsx` for error boundaries

## Navigation
- Use `next/navigation` (NOT `next/router`): `useRouter`, `usePathname`, `useSearchParams`
- Use `<Link>` from `next/link` for navigation links
- Use `redirect()` from `next/navigation` for server-side redirects

## Middleware
- File: `src/middleware.ts` (at src root, not inside app/)
- Used for route protection based on authentication and roles
- Keep middleware logic minimal — only check auth tokens and redirect

## Images
- Use `<Image>` from `next/image` with explicit width/height or fill prop
- Store static images in `public/`

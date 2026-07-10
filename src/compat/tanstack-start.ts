/* eslint-disable @typescript-eslint/no-explicit-any */
// Compatibility shim for @tanstack/react-start on the Vite SPA stack.
// Server functions are now plain client wrappers that call Supabase Edge
// Functions, so `useServerFn` simply returns the function unchanged.
export function useServerFn<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

// Kept for any residual references; not used for real server execution.
export function createServerFn(_opts?: any) {
  const builder: any = {
    validator: () => builder,
    inputValidator: () => builder,
    middleware: () => builder,
    handler: (fn: any) => fn,
  };
  return builder;
}

export function createMiddleware(_opts?: any) {
  const builder: any = {
    server: (fn: any) => fn,
    client: (fn: any) => fn,
  };
  return builder;
}

export function createStart(fn: any) {
  return typeof fn === "function" ? fn() : fn;
}

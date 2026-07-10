/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Compatibility shim: exposes a TanStack-Router-like surface backed by
 * react-router-dom, so the existing route files and shared components keep
 * working on the Vite SPA stack.
 */
import {
  createContext,
  useContext,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  Link as RRLink,
  NavLink,
  Outlet as RROutlet,
  useLocation,
  useNavigate as useRRNavigate,
  useParams as useRRParams,
  useSearchParams,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, type QueryClient } from "@tanstack/react-query";

export { RROutlet as Outlet };

function cx(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

let _queryClient: QueryClient | null = null;
export function __setQueryClient(qc: QueryClient) {
  _queryClient = qc;
}

/** Build a concrete URL from a TanStack `to` template + params/search. */
export function buildPath(
  to: unknown,
  params?: Record<string, unknown>,
  search?: Record<string, unknown> | ((p: any) => any),
  hash?: string,
): string {
  let path = typeof to === "string" ? to : "/";
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`$${k}`, encodeURIComponent(String(v)));
    }
  }
  if (search && typeof search === "object") {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(search)) {
      if (v !== undefined && v !== null && v !== "") clean[k] = String(v);
    }
    const qs = new URLSearchParams(clean).toString();
    if (qs) path += `?${qs}`;
  }
  if (hash) path += `#${hash}`;
  return path;
}

type LinkProps = {
  to?: string;
  params?: Record<string, unknown>;
  search?: Record<string, unknown>;
  hash?: string;
  activeProps?: { className?: string; style?: CSSProperties };
  inactiveProps?: { className?: string; style?: CSSProperties };
  activeOptions?: { exact?: boolean };
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
};

export function Link({
  to,
  params,
  search,
  hash,
  activeProps,
  inactiveProps,
  activeOptions,
  className,
  style,
  children,
  ...rest
}: LinkProps) {
  const path = buildPath(to, params, search, hash);
  if (activeProps || inactiveProps) {
    return (
      <NavLink
        to={path}
        end={activeOptions?.exact ?? path === "/"}
        className={({ isActive }) =>
          cx(className, isActive ? activeProps?.className : inactiveProps?.className)
        }
        style={({ isActive }) => ({
          ...(style ?? {}),
          ...((isActive ? activeProps?.style : inactiveProps?.style) ?? {}),
        })}
        {...(rest as any)}
      >
        {children as any}
      </NavLink>
    );
  }
  return (
    <RRLink to={path} className={className} style={style} {...(rest as any)}>
      {children as any}
    </RRLink>
  );
}

export function useNavigate() {
  const navigate = useRRNavigate();
  return (opts: any) => {
    if (typeof opts === "string") return navigate(opts);
    const path = buildPath(opts?.to, opts?.params, opts?.search, opts?.hash);
    return navigate(path, { replace: opts?.replace });
  };
}

export function useRouterState(opts?: { select?: (s: any) => any }) {
  const loc = useLocation();
  const state = {
    location: {
      pathname: loc.pathname,
      search: loc.search,
      hash: loc.hash,
      href: loc.pathname + loc.search + loc.hash,
    },
  };
  return opts?.select ? opts.select(state) : state;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    navigate,
    invalidate: async () => {
      if (_queryClient) await _queryClient.invalidateQueries();
    },
    history: {
      back: () => window.history.back(),
      go: (n: number) => window.history.go(n),
    },
  };
}

export function useParams(_opts?: any) {
  return useRRParams() as Record<string, string>;
}

export function useSearch(_opts?: any) {
  const [sp] = useSearchParams();
  return Object.fromEntries(sp.entries());
}

export function redirect(opts: any) {
  const e: any = new Error("redirect");
  e.isRedirect = true;
  e.to = buildPath(opts?.to, opts?.params, opts?.search, opts?.hash);
  return e;
}

export function notFound() {
  const e: any = new Error("notFound");
  e.isNotFound = true;
  return e;
}

/* ----- Head + loader-data glue ----- */

const LoaderDataContext = createContext<any>(undefined);
export function useLoaderDataCtx() {
  return useContext(LoaderDataContext);
}

export function HeadContent() {
  return null;
}
export function Scripts() {
  return null;
}
export function useHydrated() {
  return true;
}
export function ClientOnly({
  children,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{children}</>;
}

type RouteConfig = {
  component?: (props?: any) => any;
  loader?: (args: any) => any;
  head?: (args: any) => any;
  errorComponent?: (props?: any) => any;
  notFoundComponent?: (props?: any) => any;
  pendingComponent?: (props?: any) => any;
  [key: string]: unknown;
};

type RouteObject = RouteConfig & {
  useLoaderData: (o?: { select?: (d: any) => any }) => any;
  useParams: (o?: any) => any;
  useSearch: (o?: any) => any;
  useNavigate: () => ReturnType<typeof useNavigate>;
  useRouteContext: () => any;
  fullPath: string;
};

function makeRoute(config: RouteConfig): RouteObject {
  const route = {
    ...config,
    useLoaderData: (o?: { select?: (d: any) => any }) => {
      const d = useLoaderDataCtx();
      return o?.select ? o.select(d) : d;
    },
    useParams,
    useSearch,
    useNavigate,
    useRouteContext: () => ({ queryClient: _queryClient }),
    fullPath: "",
  } as RouteObject;
  return route;
}

export function createFileRoute(_path?: string) {
  return (config: RouteConfig) => makeRoute(config);
}
export function createRootRoute(config: RouteConfig) {
  return makeRoute(config);
}
export function createRootRouteWithContext<_T = unknown>() {
  return (config: RouteConfig) => makeRoute(config);
}

function HeadFromRoute({ head }: { head: any }) {
  if (!head) return null;
  const meta: any[] = head.meta ?? [];
  const links: any[] = head.links ?? [];
  const scripts: any[] = head.scripts ?? [];
  const title = meta.find((m) => m && typeof m.title === "string")?.title;
  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {meta.map((m, i) => {
        if (!m || m.title) return null;
        if (m.charSet) return <meta key={i} charSet={m.charSet} />;
        if (m.name) return <meta key={i} name={m.name} content={m.content} />;
        if (m.property)
          return <meta key={i} property={m.property} content={m.content} />;
        return null;
      })}
      {links.map((l, i) => (
        <link key={i} rel={l.rel} href={l.href} />
      ))}
      {scripts.map((s, i) => (
        <script key={i} type={s.type}>
          {s.children}
        </script>
      ))}
    </Helmet>
  );
}

/**
 * Renders a shim route: runs its loader through react-query, applies head()
 * metadata via Helmet, exposes loader data through context, and renders the
 * route component.
 */
export function RouteRenderer({ route }: { route: RouteObject }) {
  const params = useRRParams();
  const [sp] = useSearchParams();
  const loc = useLocation();
  const search = Object.fromEntries(sp.entries());
  const Component = route.component ?? (() => null);
  const hasLoader = typeof route.loader === "function";

  const query = useQuery({
    queryKey: ["__route", loc.pathname, loc.search],
    queryFn: async () =>
      (await route.loader!({
        params,
        search,
        deps: search,
        context: { queryClient: _queryClient },
        location: loc,
      })) ?? null,
    enabled: hasLoader,
    staleTime: 0,
  });

  const loaderData = hasLoader ? query.data : undefined;

  let head: any = undefined;
  try {
    head = route.head?.({ params, loaderData, search });
  } catch {
    head = undefined;
  }

  if (hasLoader && query.isError && route.errorComponent) {
    const Err = route.errorComponent;
    return (
      <>
        <HeadFromRoute head={head} />
        <Err error={query.error} reset={() => query.refetch()} />
      </>
    );
  }

  // Do not render the component until the loader has resolved — route
  // components typically destructure loader data immediately.
  if (hasLoader && !query.isSuccess) {
    const Pending = route.pendingComponent;
    return (
      <>
        <HeadFromRoute head={head} />
        {Pending ? <Pending /> : null}
      </>
    );
  }

  return (
    <LoaderDataContext.Provider value={loaderData}>
      <HeadFromRoute head={head} />
      <Component />
    </LoaderDataContext.Provider>
  );
}
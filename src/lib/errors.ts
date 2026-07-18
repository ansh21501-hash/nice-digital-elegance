// Central helpers to normalize errors into user-friendly messages.

export function getErrorMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const anyErr = err as { message?: unknown; error?: unknown };
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.error === "string") return anyErr.error;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}

/**
 * Convert any thrown value into a short, human-friendly message.
 * Falls back to `fallback` for network / opaque failures.
 */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = getErrorMessage(err).trim();
  if (!raw) return fallback;

  const lower = raw.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) {
    return "Network issue — please check your connection and try again.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The request took too long. Please try again in a moment.";
  }
  if (lower.includes("unauthorized") || lower.includes("jwt") || lower.includes("401")) {
    return "Your session has expired. Please sign in again.";
  }
  if (lower.includes("forbidden") || lower.includes("403") || lower.includes("permission")) {
    return "You don't have permission to do that.";
  }
  if (lower.includes("not available") || lower.includes("sold out") || lower.includes("409")) {
    return raw;
  }
  if (lower.includes("missing supabase")) {
    return "The site is temporarily unavailable. Please try again shortly.";
  }

  // If the raw message is short and looks user-facing, keep it.
  if (raw.length <= 160) return raw;
  return fallback;
}
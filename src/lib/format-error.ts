/** Turn Supabase / fetch errors into a user-visible message. */
export function formatErrorMessage(err: unknown, fallback = "Failed to save"): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return fallback;
}

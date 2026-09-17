export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const apiNotFound = () =>
  Response.json(
    {
      error: {
        code: "not_found",
        message: "API route not found.",
      },
    },
    { status: 404 },
  );

const worker = {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    const { pathname } = new URL(request.url);

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return apiNotFound();
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export default worker;

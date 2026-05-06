const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";

type ApiResponse<T = unknown> = {
  status: number;
  body: T;
};

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const json = await response.json().catch(() => null);

  return { status: response.status, body: json as T };
}

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T = unknown>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
};

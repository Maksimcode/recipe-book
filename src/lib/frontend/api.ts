export type ApiError = {
  code: string;
  message: string;
  dishes?: Array<{ id: string; name: string }>;
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: ApiError;

  constructor(status: number, details: ApiError) {
    super(details.message);
    this.status = status;
    this.code = details.code;
    this.details = details;
  }
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = (payload?.error ?? {
      code: "INTERNAL_ERROR",
      message: "Unexpected error",
    }) as ApiError;
    throw new ApiClientError(response.status, error);
  }

  return payload.data as T;
}

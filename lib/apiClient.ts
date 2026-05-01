import { ApiError } from "./errors";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "OPTIONS";

export async function apiClient<TBody, TResponse>(
  path: string,
  method: HttpMethod = "GET",
  body?: TBody
): Promise<TResponse> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText, data);
  }

  return data as TResponse;
}

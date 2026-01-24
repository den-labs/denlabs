import { logger } from "./logger";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  private buildUrl(
    endpoint: string,
    params?: RequestOptions["params"],
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    logger.debug({ endpoint, method: options.method || "GET" }, "API request");

    const fetchConfig: RequestInit = {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(fetchOptions.headers as Record<string, string>),
      },
    };

    if (body !== undefined) {
      fetchConfig.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchConfig);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.warn(
        { endpoint, status: response.status, error: errorData },
        "API request failed",
      );
      throw new ClientApiError(
        response.status,
        errorData.error || `Request failed: ${response.status}`,
        errorData,
      );
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: RequestOptions["params"]) {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PATCH", body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // For endpoints that return text (not JSON)
  async text(
    endpoint: string,
    params?: RequestOptions["params"],
  ): Promise<string> {
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ClientApiError(
        response.status,
        errorData.error || `Request failed: ${response.status}`,
        errorData,
      );
    }

    return response.text();
  }
}

export const api = new ApiClient();

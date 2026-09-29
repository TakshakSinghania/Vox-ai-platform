export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

export interface SystemStatusResponse {
  status: "ok" | "degraded";
  configured: {
    callmissed: boolean;
    llm: boolean;
    image: boolean;
  };
  environment: string;
  message?: string;
}

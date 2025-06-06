export interface Route {
  id: string;
  path: string;
  method: string;
  backend_url: string;
  rate_limit?: number;
  input?: {
    schema: Record<string, any>;
  };
  input_transform?: string;
  output_transform?: string;
  mock?: boolean;
  mock_response?: any;
  timeout?: number;
}

export interface RouteStats {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  lastRequest?: Date;
} 
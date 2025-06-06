export interface LoadedRoute {
  id: string;
  method: string;
  path: string;
  backend_url: string;
  mock?: boolean;
  mock_response?: any;
  timeout?: number | string;
  rate_limit?: {
    points: number;
    duration: number;
  };
  input?: {
    validate_schema?: any;
  };
  input_transform?: string;
  output_transform?: string;
  // Ajoute d'autres propriétés si besoin
} 
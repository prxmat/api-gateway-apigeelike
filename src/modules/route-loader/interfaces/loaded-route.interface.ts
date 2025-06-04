export interface LoadedRoute {
  path: string;
  method: string;
  backend_url: string;
  rate_limit?: {
    points: number;
    duration: number;
  };
  mock?: boolean;
  input?: {
    validate_schema?: Record<string, any>;
  };
  output?: {
    validate_schema?: Record<string, any>;
  };
  // Ajoute d'autres propriétés si besoin
} 
import { Environments } from './environment.interface';

export interface LoadedRoute {
  id: string;
  path: string;
  method: string;
  environments: Environments;
  rate_limit?: {
    points: number;
    duration: number;
  };
  input?: {
    validate_schema: any;
  };
  input_transform?: string;
  output_transform?: string;
  timeout?: string;
  backend_url: string;
  mock?: boolean;
  mock_response?: any;
  // Ajoute d'autres propriétés si besoin
} 
export interface Environment {
  backend_url: string;
  mock: boolean;
  mock_response?: any;
}

export interface Environments {
  integration: Environment;
  staging: Environment;
  production: Environment;
}

export interface App {
  id: string;
  name: string;
  routes: Route[];
}

export interface Route {
  id: string;
  path: string;
  method: string;
  environments: Environments;
  input?: any;
  output?: any;
  backend_url?: string;
  input_transform?: string;
  output_transform?: string;
} 
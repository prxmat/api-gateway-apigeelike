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
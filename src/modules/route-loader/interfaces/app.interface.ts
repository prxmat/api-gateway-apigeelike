import { LoadedRoute } from './loaded-route.interface';

export interface App {
  id: string;
  name: string;
  routes: LoadedRoute[];
  environments?: Record<string, any>;
} 
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

interface OpenAPIPath {
  [method: string]: {
    summary?: string;
    requestBody?: {
      content: {
        [contentType: string]: {
          schema: any;
        };
      };
    };
    responses: {
      [status: string]: {
        content: {
          [contentType: string]: {
            schema: any;
          };
        };
      };
    };
  };
}

interface OpenAPISpec {
  paths: {
    [path: string]: OpenAPIPath;
  };
}

interface Route {
  id: string;
  path: string;
  method: string;
  backend_url: string;
  input?: {
    validate_schema: any;
  };
  output?: {
    validate_schema: any;
  };
}

function convertOpenAPIToRoutes(openapiSpec: OpenAPISpec, appName: string): { routes: Route[] } {
  const routes: Route[] = [];

  for (const [path, pathItem] of Object.entries(openapiSpec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        const route: Route = {
          id: `${appName}-${method}-${path.replace(/\//g, '-')}`,
          path: path,
          method: method.toUpperCase(),
          backend_url: `http://localhost:8080${path}`,
        };

        // Add input validation if request body exists
        if (operation.requestBody?.content['application/json']?.schema) {
          route.input = {
            validate_schema: operation.requestBody.content['application/json'].schema
          };
        }

        // Add output validation if response schema exists
        const successResponse = operation.responses['200'] || operation.responses['201'];
        if (successResponse?.content['application/json']?.schema) {
          route.output = {
            validate_schema: successResponse.content['application/json'].schema
          };
        }

        routes.push(route);
      }
    }
  }

  return { routes };
}

function processOpenAPIFile(filePath: string, appName: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const openapiSpec = yaml.parse(content);
  const routes = convertOpenAPIToRoutes(openapiSpec, appName);
  
  const outputPath = path.join(process.cwd(), `routes.${appName}.yaml`);
  fs.writeFileSync(outputPath, yaml.stringify(routes));
  console.log(`Generated routes file: ${outputPath}`);
}

// Example usage:
// processOpenAPIFile('path/to/openapi.yaml', 'payments'); 
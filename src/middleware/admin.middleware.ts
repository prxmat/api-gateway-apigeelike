import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Si c'est une route admin, on la laisse passer au contrôleur admin
    if (req.path.startsWith('/api/admin')) {
      // On ajoute un flag pour indiquer que c'est une route admin
      (req as any).isAdminRoute = true;
    }
    next();
  }
} 
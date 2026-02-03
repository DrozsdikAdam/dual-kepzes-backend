import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to sanitize incoming request bodies.
 * Trims strings recursively.
 */
export const sanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
     if (req.body) {
          req.body = sanitizeObject(req.body);
     }
     if (req.query) {
          const sanitizedQuery = sanitizeObject(req.query);
          for (const key in sanitizedQuery) {
               (req.query as any)[key] = sanitizedQuery[key];
          }
     }
     if (req.params) {
          const sanitizedParams = sanitizeObject(req.params);
          for (const key in sanitizedParams) {
               (req.params as any)[key] = sanitizedParams[key];
          }
     }
     next();
};

function sanitizeObject(obj: any): any {
     if (typeof obj !== 'object' || obj === null) {
          return obj;
     }

     if (Array.isArray(obj)) {
          return obj.map(item => sanitizeObject(item));
     }

     const sanitized: any = {};
     for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
               let value = obj[key];
               if (typeof value === 'string') {
                    // Trim string and basic escaping if necessary
                    // (Using simple trim for now as per instructions)
                    value = value.trim();
               } else if (typeof value === 'object') {
                    value = sanitizeObject(value);
               }
               sanitized[key] = value;
          }
     }
     return sanitized;
}

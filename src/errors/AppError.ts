import { ErrorCodes } from "../constants";

export class AppError extends Error {
     constructor(
          public statusCode: number,
          public code: string,
          message: string,
          public isOperational = true,
          public details?: Record<string, any>
     ) {
          super(message);
          Object.setPrototypeOf(this, AppError.prototype);
          Error.captureStackTrace(this, this.constructor);
     }
}

export class ValidationError extends AppError {
     constructor(message: string, details?: Record<string, any>) {
          super(400, ErrorCodes.VALIDATION_ERROR, message, true, details);
     }
}

export class NotFoundError extends AppError {
     constructor(resource: string) {
          super(404, ErrorCodes.NOT_FOUND, `${resource} nem található.`, true);
     }
}

export class UnauthorizedError extends AppError {
     constructor(message = 'Nincs jogosultságod.') {
          super(401, ErrorCodes.UNAUTHORIZED, message, true);
     }
}

export class ForbiddenError extends AppError {
     constructor(message = 'Nincs jogosultságod a művelet végrehajtásához.') {
          super(403, ErrorCodes.FORBIDDEN, message, true);
     }
}

export class BadRequestError extends AppError {
     constructor(message: string, details?: Record<string, any>) {
          super(400, ErrorCodes.BAD_REQUEST, message, true, details);
     }
}

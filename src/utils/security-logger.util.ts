/**
 * 🛡️ Never Trust The Client - Security Logger Utility
 * 
 * Biztonsági események logolása:
 * - Sikertelen hozzáférési kísérletek (401, 403)
 * - Gyanús aktivitás detektálása (rate limit, brute force)
 * - Érvénytelen input kísérletek
 */

import { Request } from 'express';
import prisma from '../config/prisma';

/**
 * Biztonsági esemény típusok
 */
export enum SecurityEventType {
     // Hozzáférési hibák
     UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
     FORBIDDEN_ACCESS = 'FORBIDDEN_ACCESS',

     // Hitelesítési események
     LOGIN_FAILED = 'LOGIN_FAILED',
     TOKEN_INVALID = 'TOKEN_INVALID',
     TOKEN_EXPIRED = 'TOKEN_EXPIRED',

     // Validációs események
     INVALID_INPUT = 'INVALID_INPUT',
     INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
     INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',

     // Gyanús aktivitás
     RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
     SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
     OWNERSHIP_VIOLATION = 'OWNERSHIP_VIOLATION'
}

/**
 * Biztonsági esemény súlyossága
 */
export enum SecuritySeverity {
     LOW = 'LOW',
     MEDIUM = 'MEDIUM',
     HIGH = 'HIGH',
     CRITICAL = 'CRITICAL'
}

/**
 * Biztonsági esemény paraméterei
 */
interface SecurityLogParams {
     eventType: SecurityEventType;
     severity: SecuritySeverity;
     message: string;
     details?: Record<string, any>;
     userId?: string;
     ipAddress?: string;
     userAgent?: string;
     endpoint?: string;
     method?: string;
}

/**
 * IP cím kinyerése a request-ből
 */
function getClientIp(req: Request): string {
     const forwarded = req.headers['x-forwarded-for'];
     if (typeof forwarded === 'string') {
          return forwarded.split(',')[0].trim();
     }
     return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Biztonsági esemény logolása az adatbázisba
 */
export async function logSecurityEvent(
     req: Request | null,
     params: SecurityLogParams
): Promise<void> {
     try {
          const logData = {
               action: `SECURITY_${params.eventType}`,
               entity: 'SecurityEvent',
               entityId: undefined,
               details: {
                    eventType: params.eventType,
                    severity: params.severity,
                    message: params.message,
                    ipAddress: params.ipAddress || (req ? getClientIp(req) : 'unknown'),
                    userAgent: params.userAgent || (req?.headers['user-agent'] || 'unknown'),
                    endpoint: params.endpoint || (req ? req.originalUrl : 'unknown'),
                    method: params.method || (req?.method || 'unknown'),
                    timestamp: new Date().toISOString(),
                    ...(params.details || {})
               }
          };

          await prisma.auditLog.create({
               data: {
                    userId: params.userId || req?.user?.userId || null,
                    action: logData.action,
                    entity: logData.entity,
                    entityId: logData.entityId,
                    details: logData.details
               }
          });

          // Konzol log is - kritikus és magas súlyosságúaknál mindig
          if (params.severity === SecuritySeverity.CRITICAL || params.severity === SecuritySeverity.HIGH) {
               console.warn(`[SECURITY][${params.severity}] ${params.eventType}: ${params.message}`);
          }
     } catch (error) {
          console.error('[SECURITY_LOG_ERROR] Hiba a biztonsági log írásakor:', error);
     }
}

/**
 * Sikertelen hozzáférési kísérlet logolása (401/403 hibák)
 */
export async function logAccessDenied(
     req: Request,
     reason: string,
     statusCode: 401 | 403
): Promise<void> {
     const eventType = statusCode === 401
          ? SecurityEventType.UNAUTHORIZED_ACCESS
          : SecurityEventType.FORBIDDEN_ACCESS;

     await logSecurityEvent(req, {
          eventType,
          severity: SecuritySeverity.MEDIUM,
          message: reason,
          details: {
               statusCode,
               requestBody: sanitizeRequestBody(req.body)
          }
     });
}

/**
 * Érvénytelen státusz átmenet logolása
 */
export async function logInvalidStatusTransition(
     req: Request,
     currentStatus: string,
     attemptedStatus: string,
     entityType: string
): Promise<void> {
     await logSecurityEvent(req, {
          eventType: SecurityEventType.INVALID_STATUS_TRANSITION,
          severity: SecuritySeverity.MEDIUM,
          message: `Érvénytelen ${entityType} státusz átmenet: ${currentStatus} → ${attemptedStatus}`,
          details: {
               entityType,
               currentStatus,
               attemptedStatus
          }
     });
}

/**
 * Ownership sértés logolása
 */
export async function logOwnershipViolation(
     req: Request,
     resourceType: string,
     resourceId: string
): Promise<void> {
     await logSecurityEvent(req, {
          eventType: SecurityEventType.OWNERSHIP_VIOLATION,
          severity: SecuritySeverity.HIGH,
          message: `Ownership sértés: ${resourceType} (${resourceId}) - a felhasználónak nincs jogosultsága`,
          details: {
               resourceType,
               resourceId
          }
     });
}

/**
 * Sikertelen bejelentkezés logolása
 */
export async function logLoginFailure(
     req: Request,
     email: string,
     reason: string
): Promise<void> {
     await logSecurityEvent(req, {
          eventType: SecurityEventType.LOGIN_FAILED,
          severity: SecuritySeverity.MEDIUM,
          message: `Sikertelen bejelentkezés: ${email}`,
          details: {
               email,
               reason
          }
     });
}

/**
 * Érvénytelen fájltípus logolása
 */
export async function logInvalidFileType(
     req: Request,
     filename: string,
     detectedType: string
): Promise<void> {
     await logSecurityEvent(req, {
          eventType: SecurityEventType.INVALID_FILE_TYPE,
          severity: SecuritySeverity.MEDIUM,
          message: `Érvénytelen fájltípus feltöltési kísérlet: ${filename} (${detectedType})`,
          details: {
               filename,
               detectedType
          }
     });
}

/**
 * Request body sanitizálása logoláshoz (jelszavak, tokenek eltávolítása)
 */
function sanitizeRequestBody(body: any): any {
     if (!body || typeof body !== 'object') return body;

     const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey'];
     const sanitized = { ...body };

     for (const key of Object.keys(sanitized)) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
               sanitized[key] = '[REDACTED]';
          }
     }

     return sanitized;
}

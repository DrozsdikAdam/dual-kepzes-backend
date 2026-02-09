/**
 * 🛡️ Never Trust The Client - Idempotency Middleware
 * 
 * Dupla submit védelem kritikus végpontokon.
 * A kliens egy egyedi Idempotency-Key header-t küld,
 * és a szerver gyorsítótárazza az eredményt, hogy azonos kulcs esetén
 * ne hajtsa végre újra a műveletet.
 */

import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/AppError';

/**
 * Idempotency cache bejegyzés
 */
interface IdempotencyCacheEntry {
     response: {
          statusCode: number;
          body: any;
     };
     createdAt: number;
     inProgress: boolean;
}

/**
 * Memória-alapú idempotency cache
 * Élesben Redis vagy más perzisztens megoldás ajánlott!
 */
const idempotencyCache = new Map<string, IdempotencyCacheEntry>();

/**
 * Cache tisztítási intervallum (5 perc)
 */
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Cache bejegyzés élettartama (1 óra)
 */
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Automatikus cache tisztítás indítása
 */
setInterval(() => {
     const now = Date.now();
     for (const [key, entry] of idempotencyCache.entries()) {
          if (now - entry.createdAt > CACHE_TTL) {
               idempotencyCache.delete(key);
          }
     }
}, CACHE_CLEANUP_INTERVAL);

/**
 * Idempotency kulcs generálása
 * A kulcs a felhasználó ID-jából és az Idempotency-Key header-ből áll
 */
function generateCacheKey(req: Request): string | null {
     const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

     if (!idempotencyKey || typeof idempotencyKey !== 'string') {
          return null;
     }

     const userId = req.user?.userId || 'anonymous';
     const endpoint = `${req.method}:${req.originalUrl}`;

     return `${userId}:${endpoint}:${idempotencyKey}`;
}

/**
 * Idempotency middleware
 * 
 * Használat:
 * router.post('/positions', authenticateToken, requireIdempotency(), createPosition);
 * 
 * A kliens küldjön egy egyedi Idempotency-Key header-t:
 * Idempotency-Key: <uuid>
 * 
 * @param options Konfigurációs opciók
 * @param options.required Ha true, a header kötelező (default: false)
 */
export function requireIdempotency(options: { required?: boolean } = {}) {
     const { required = false } = options;

     return async (req: Request, res: Response, next: NextFunction) => {
          const cacheKey = generateCacheKey(req);

          // Ha nincs idempotency kulcs
          if (!cacheKey) {
               if (required) {
                    return next(new BadRequestError('Idempotency-Key header kötelező ehhez a végponthoz.'));
               }
               // Ha nem kötelező, folytatjuk a kérést normálisan
               return next();
          }

          // Ellenőrizzük, hogy létezik-e már bejegyzés
          const existingEntry = idempotencyCache.get(cacheKey);

          if (existingEntry) {
               // Ha még folyamatban van a korábbi kérés
               if (existingEntry.inProgress) {
                    return res.status(409).json({
                         success: false,
                         message: 'A kérés feldolgozása már folyamatban van. Kérjük, várjon.',
                         error: {
                              code: 'IDEMPOTENCY_IN_PROGRESS',
                              message: 'Duplicate request is being processed.'
                         }
                    });
               }

               // Ha már van gyorsítótárazott válasz, visszaadjuk
               console.log(`[IDEMPOTENCY] Gyorsítótárazott válasz visszaadása: ${cacheKey}`);
               return res.status(existingEntry.response.statusCode).json(existingEntry.response.body);
          }

          // Új bejegyzés létrehozása "folyamatban" státusszal
          idempotencyCache.set(cacheKey, {
               response: { statusCode: 0, body: null },
               createdAt: Date.now(),
               inProgress: true
          });

          // Eredeti res.json felülírása a válasz gyorsítótárazásához
          const originalJson = res.json.bind(res);
          res.json = (body: any) => {
               // Válasz gyorsítótárazása
               idempotencyCache.set(cacheKey!, {
                    response: {
                         statusCode: res.statusCode,
                         body
                    },
                    createdAt: Date.now(),
                    inProgress: false
               });

               return originalJson(body);
          };

          // Hiba esetén töröljük a folyamatban lévő bejegyzést
          res.on('close', () => {
               if (res.statusCode >= 400) {
                    const entry = idempotencyCache.get(cacheKey!);
                    if (entry?.inProgress) {
                         idempotencyCache.delete(cacheKey!);
                    }
               }
          });

          next();
     };
}

/**
 * Idempotency cache statisztikák lekérdezése (debug)
 */
export function getIdempotencyCacheStats(): { size: number; entries: string[] } {
     return {
          size: idempotencyCache.size,
          entries: Array.from(idempotencyCache.keys())
     };
}

/**
 * Idempotency cache ürítése (teszteléshez)
 */
export function clearIdempotencyCache(): void {
     idempotencyCache.clear();
}

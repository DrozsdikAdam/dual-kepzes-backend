export const ErrorCodes = {
     UNAUTHORIZED: 'UNAUTHORIZED',
     FORBIDDEN: 'FORBIDDEN',
     NOT_FOUND: 'NOT_FOUND',
     BAD_REQUEST: 'BAD_REQUEST',
     VALIDATION_ERROR: 'VALIDATION_ERROR',
     INTERNAL_ERROR: 'INTERNAL_ERROR',
     DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export const ErrorMessages = {
     USER_NOT_FOUND: 'A felhasználó nem található.',
     INVALID_CREDENTIALS: 'Hibás email vagy jelszó.',
     PARTNERSHIP_NOT_FOUND: 'Partnerség nem található.',
     APPLICATION_NOT_FOUND: 'Jelentkezés nem található.',
     UNAUTHORIZED: 'Nincs jogosultságod.',
     FORBIDDEN: 'Nincs jogosultságod a művelet végrehajtásához.',
     GENERIC_ERROR: 'Valami hiba történt.',
     INTERNAL_SERVER_ERROR: 'Belső szerver hiba.',
} as const;

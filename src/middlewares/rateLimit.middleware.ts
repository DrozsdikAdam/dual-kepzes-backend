import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 perc
    max: 5, // 2 perc alatt maximum 5 kérés
    message: "Túl sok kísérlet, kérjük próbálja újra később.",
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 perc
    max: 100, // 2 perc alatt maximum 100 kérés
    message: "Túl sok kérés, kérjük próbálja újra később.",
    standardHeaders: true,
    legacyHeaders: false,
});
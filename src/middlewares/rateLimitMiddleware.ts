import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 perc
    max: 5, // 15 perc alatt maximum 5 kérés
    message: "Túl sok kísérlet, kérjük próbálja újra később.",
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 perc
    max: 100, // 10 perc alatt maximum 100 kérés
    message: "Túl sok kérés, kérjük próbálja újra később.",
    standardHeaders: true,
    legacyHeaders: false,
});
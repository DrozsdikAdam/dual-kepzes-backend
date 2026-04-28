import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod"

export const validate = (schema: ZodObject<any, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });

            req.body = parsed.body;
            if (parsed.query) {
                req.query = parsed.query as Request["query"];
            }
            if (parsed.params) {
                req.params = parsed.params as Request["params"];
            }
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: "error",
                    message: "Validációs hiba",
                    errors: error.issues.map((e) => ({
                        field: e.path.join(".").replace("body.", ""),
                        message: e.message,
                    })),
                });
            }
            next(error);
        }
    }
}

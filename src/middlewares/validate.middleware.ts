import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { ValidationError } from "../errors/AppError";

export const validate = (schema: ZodObject<any, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
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
                return next(
                    new ValidationError("Validacios hiba.", {
                        issues: error.issues.map((issue) => ({
                            field: issue.path.join(".").replace("body.", ""),
                            message: issue.message,
                        })),
                    })
                );
            }

            return next(error);
        }
    };
};

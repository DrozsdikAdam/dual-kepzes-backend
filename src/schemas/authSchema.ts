import { z } from 'zod';

export const RoleEnum = z.enum([
    "STUDENT",
    "COMPANY_ADMIN",
    "MENTOR",
    "UNIVERSITY_USER",
    "SYSTEM_ADMIN"
]);

export const RegisterSchema = z.object({
    body: z.object({
        email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
        password: z.string().trim().min(8), //todo: add more complex password rules
        role: RoleEnum,

        fullName: z.string().trim().min(1),
        mothersName: z.string().trim().min(1),
        dateOfBirth: z.date().min(new Date("1900-01-01"), { error: "Túl öreg!" }).max(new Date().getFullYear() - 18, { error: "Túl fiatal!" }),
        zipCode: z.string().trim().min(4).max(10),
        city: z.string().trim().min(1),

        highSchool: z.string().trim().min(1),
        neptuneCode: z.string().trim().length(6, { message: "A neptun kód pontosan 6 karakter hosszú." }).optional(),
        currentMajor: z.string().trim().min(1),
        studyMode: z.enum(["NAPPALI", "LEVELEZŐ"]),
        graduationYear: z.number().min(2000, { message: "Érvénytelen érettségi év" }).max(new Date().getFullYear() + 1, { message: "Érvénytelen érettségi év" }),
        hasLanguageCert: z.boolean()
    })
})

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
        password: z.string().trim().min(8), //todo: add more complex password rules
    })
})

export type RegisterInput = z.infer<typeof RegisterSchema>['body']
export type LoginInput = z.infer<typeof LoginSchema>['body']
import { z } from 'zod';

export const RoleEnum = z.enum([
    "STUDENT",
    "COMPANY_ADMIN",
    "MENTOR",
    "UNIVERSITY_USER",
    "SYSTEM_ADMIN"
]);
const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

export const RegisterSchema = z.object({
    body: z.object({
        email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
        password: z.string().trim().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,64}$/),
        role: RoleEnum,

        fullName: z.string().trim().includes(" ", { message: "A teljes név legalább egy szóközt tartalmaz" }).min(1),
        mothersName: z.string().trim().includes(" ", { message: "A teljes név legalább egy szóközt tartalmaz" }).includes(" ").min(1),


        // A sémában:
        dateOfBirth: z.coerce.date()
            .min(new Date("1900-01-01"), { message: "Túl öreg!" })
            .max(eighteenYearsAgo, { message: "Túl fiatal! 18 éven aluliak nem regisztrálhatnak." }),
        zipCode: z.int().min(1000).max(9999).optional(),
        city: z.string().trim().min(1).optional(),
        streetAddress: z.string().trim().includes(" ").optional(),

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
        password: z.string().trim().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,64}$/),
    })
})

export type RegisterInput = z.infer<typeof RegisterSchema>['body']
export type LoginInput = z.infer<typeof LoginSchema>['body']
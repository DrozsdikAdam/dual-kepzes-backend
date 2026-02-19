import { z } from "zod";

export const RoleEnum = z.enum([
    "STUDENT",
    "COMPANY_ADMIN",
    "MENTOR",
    "UNIVERSITY_USER",
    "SYSTEM_ADMIN"
]);
const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const baseUserSchema = z.object({
    email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
    password: z.string().trim().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,64}$/, { message: "A jelszónak legalább 12 karakter hosszúnak kell lennie, és tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert." }),
    fullName: z.string().trim().includes(" ", { message: "A teljes név legalább egy szóközt tartalmaz" }).min(1),
    phoneNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/, { message: "Érvénytelen telefonszám formátum" }),
    isEmailEnabled: z.boolean().optional(),
});

export const studentBaseSchema = baseUserSchema.extend({
    role: z.literal(RoleEnum.enum.STUDENT),

    mothersName: z.string().trim().includes(" ", { message: "Az anyja neve legalább egy szóközt tartalmaz" }).min(1),
    dateOfBirth: z.coerce.date()
        .min(new Date("1900-01-01"), { message: "Túl öreg!" })
        .max(eighteenYearsAgo, { message: "Túl fiatal! 18 éven aluliak nem regisztrálhatnak." }),
    location: z.object({
        country: z.string().trim().min(1).optional(),
        zipCode: z.coerce.number().min(1000).max(9999).optional(),
        city: z.string().trim().min(1).optional(),
        address: z.string().trim().includes(" ").optional(),
    }).optional(),
    highSchool: z.string().trim().min(1),
    highSchoolLocation: z.string().trim().min(1, { message: "A középiskola helyszíne kötelező." }),
    neptunCode: z.string().trim().length(6, { message: "A neptun kód pontosan 6 karakter hosszú." }).optional(),
    majorId: z.string().uuid("Érvénytelen szak azonosító").optional(),
    studyMode: z.enum(["NAPPALI", "LEVELEZŐ"]),
    graduationYear: z.number().min(2000, { message: "Érvénytelen érettségi év" }).max(new Date().getFullYear() + 1, { message: "Érvénytelen érettségi év" }),

    // Új mezők
    isInHighSchool: z.boolean().default(false),
    firstChoiceId: z.string().uuid("Érvénytelen szak azonosító").optional(),
    secondChoiceId: z.string().uuid("Érvénytelen szak azonosító").optional(),

    hasLanguageCert: z.boolean(),
    language: z.string().trim().min(1).optional(),
    languageLevel: z.string().trim().min(1).optional(),

    motivationLetter: z.string().trim().max(500, { message: "A motivációs levél maximum 500 karakter lehet." }).optional(),
});

export const studentSchema = studentBaseSchema.superRefine((data, ctx) => {
    // Ha középiskolás, akkor firstChoiceId és secondChoiceId kötelező
    if (data.isInHighSchool) {
        if (!data.firstChoiceId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Első választás kötelező középiskolások számára.",
                path: ["firstChoiceId"]
            });
        }
        if (!data.secondChoiceId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Második választás kötelező középiskolások számára.",
                path: ["secondChoiceId"]
            });
        }
    }

    // Ha van nyelvvizsga, akkor language és languageLevel kötelező
    if (data.hasLanguageCert) {
        if (!data.language) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Nyelv megadása kötelező, ha van nyelvvizsga.",
                path: ["language"]
            });
        }
        if (!data.languageLevel) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Nyelvvizsga szint megadása kötelező.",
                path: ["languageLevel"]
            });
        }
    }
});

export const mentorSchema = baseUserSchema.extend({
    role: z.literal(RoleEnum.enum.MENTOR),
    companyId: z.string().uuid(),
    jobTitle: z.string(),
});

export const companyAdminSchema = baseUserSchema.extend({
    role: z.literal(RoleEnum.enum.COMPANY_ADMIN),
    companyId: z.string().uuid(),
    jobTitle: z.string()
});

export const systemAdminSchema = baseUserSchema.extend({
    role: z.literal(RoleEnum.enum.SYSTEM_ADMIN),
})

export const universityUserSchema = baseUserSchema.extend({
    role: z.literal(RoleEnum.enum.UNIVERSITY_USER),
});

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
        password: z.string().trim().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,64}$/, { message: "A jelszónak legalább 12 karakter hosszúnak kell lennie, és tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert." }),
    })
});

export const RequestPasswordResetSchema = z.object({
    body: z.object({
        email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
    })
});

export const ResetPasswordSchema = z.object({
    body: z.object({
        token: z.string().trim().min(32, { message: "Érvénytelen token formátum" }),
        newPassword: z.string().trim().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,64}$/, { message: "A jelszónak legalább 12 karakter hosszúnak kell lennie, és tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert." }),
    })
});

export const VerifyEmailSchema = z.object({
    body: z.object({
        token: z.string().trim().min(32, { message: "Érvénytelen token formátum" }),
    })
});

export const ResendVerificationSchema = z.object({
    body: z.object({
        email: z.string().trim().email({ message: "Érvénytelen email cím formátum" }),
    })
});

export const RegisterSchema = z.object({
    body: z.discriminatedUnion("role", [
        studentSchema,
        mentorSchema,
        universityUserSchema
    ])
});

export const CompanyAdminRegisterSchema = z.object({
    body: companyAdminSchema
});

export const SystemAdminRegisterSchema = z.object({
    body: systemAdminSchema
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type CompanyAdminRegisterInput = z.infer<typeof CompanyAdminRegisterSchema>["body"];
export type SystemAdminRegisterInput = z.infer<typeof SystemAdminRegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>["body"];
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>["body"];
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>["body"];
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>["body"];


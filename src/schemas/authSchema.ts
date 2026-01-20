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
});

export const studentSchema = baseUserSchema.extend({
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
    neptunCode: z.string().trim().length(6, { message: "A neptun kód pontosan 6 karakter hosszú." }).optional(),
    currentMajor: z.string().trim().min(1),
    studyMode: z.enum(["NAPPALI", "LEVELEZŐ"]),
    graduationYear: z.number().min(2000, { message: "Érvénytelen érettségi év" }).max(new Date().getFullYear() + 1, { message: "Érvénytelen érettségi év" }),
    hasLanguageCert: z.boolean()
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

export const RegisterSchema = z.object({
    body: z.discriminatedUnion("role", [
        studentSchema,
        mentorSchema,
        universityUserSchema,
        companyAdminSchema,
        systemAdminSchema
    ])
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];

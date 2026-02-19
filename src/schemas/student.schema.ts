import { z } from "zod";
import { studentBaseSchema } from "./auth.schema";

export const StudentUpdateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Érvénytelen felhasználó azonosító"),
    }),
    body: z.object({
        // Alapadatok (User)
        fullName: z.string().min(2).optional(),
        phoneNumber: z.string().optional(),
        isEmailEnabled: z.boolean().optional(),

        // Profil adatok (StudentProfile)
        neptunCode: z.string().optional(),
        mothersName: z.string().optional(),
        highSchool: z.string().optional(),
        highSchoolLocation: z.string().min(1, { message: "A középiskola helyszíne kötelező." }).optional(),
        graduationYear: z.number().optional(),
        studyMode: z.string().optional(),
        location: z.object({
            country: z.string().optional(),
            zipCode: z.string().optional(),
            city: z.string().optional(),
            address: z.string().optional(),
        }).optional(),

        // Új mezők
        isInHighSchool: z.boolean().optional(),
        majorId: z.string().uuid().optional(),
        firstChoiceId: z.string().uuid().optional(),
        secondChoiceId: z.string().uuid().optional(),
        hasLanguageCert: z.boolean().optional(),
        language: z.string().optional(),
        languageLevel: z.string().optional(),
        motivationLetter: z.string().max(500, { message: "A motivációs levél maximum 500 karakter lehet." }).optional(),
        isAvailableForWork: z.boolean().optional(),
    }).superRefine((data, ctx) => {
        if (data.isAvailableForWork && !data.motivationLetter) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A motivációs levél megadása kötelező, ha munkát keresel.",
                path: ["motivationLetter"]
            });
        }
    })
});

export const MyProfileUpdateSchema = z.object({
    body: studentBaseSchema
        .extend({
            isAvailableForWork: z.boolean().optional(),
        })
        .omit({
            role: true,
            email: true,
            password: true
        })
        .partial()
        .superRefine((data, ctx) => {
            if (data.isAvailableForWork && !data.motivationLetter) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "A motivációs levél megadása kötelező, ha munkát keresel.",
                    path: ["motivationLetter"]
                });
            }
        })
});


export const UniversityTransitionSchema = z.object({
    body: z.object({
        neptunCode: z.string().min(6, "A Neptun kód legalább 6 karakter kell legyen"),
        majorId: z.string().uuid("Érvénytelen szak azonosító"),
        graduationYear: z.number().int().min(1900).max(2100).optional()
    })
});

export const ExpressInterestSchema = z.object({
    params: z.object({
        id: z.string().uuid("Érvénytelen hallgató azonosító"),
    }),
    body: z.object({
        message: z.string().max(500, { message: "Az üzenet maximum 500 karakter lehet." }).optional(),
    })
});

export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>["body"];
export type MyProfileUpdateInput = z.infer<typeof MyProfileUpdateSchema>["body"];
export type UniversityTransitionInput = z.infer<typeof UniversityTransitionSchema>["body"];
export type ExpressInterestInput = z.infer<typeof ExpressInterestSchema>["body"];
import { z } from "zod";
import { studentSchema } from "./auth.schema";

export const StudentUpdateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Érvénytelen felhasználó azonosító"),
    }),
    body: z.object({
        // Alapadatok (User)
        fullName: z.string().min(2).optional(),
        phoneNumber: z.string().optional(),

        // Profil adatok (StudentProfile) - Ezeket hozzá kell adni!
        currentMajor: z.string().optional(),
        neptunCode: z.string().optional(),
        mothersName: z.string().optional(),
        highSchool: z.string().optional(),
        graduationYear: z.number().optional(),
        studyMode: z.string().optional(),
        location: z.object({
            country: z.string().optional(),
            zipCode: z.string().optional(),
            city: z.string().optional(),
            address: z.string().optional(),
        }).optional(),
    })
});

export const MyProfileUpdateSchema = z.object({
    body: studentSchema
        .omit({
            role: true,
            email: true,
            password: true
        })
        .partial()
});


export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>["body"];
export type MyProfileUpdateInput = z.infer<typeof MyProfileUpdateSchema>["body"];
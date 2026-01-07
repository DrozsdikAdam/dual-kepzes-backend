import { z } from "zod";
import { studentSchema } from "./authSchema";

export const StudentUpdateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Érvénytelen felhasználó azonosító"),
    }),
    body: studentSchema.omit({
        role: true,     // Szerepkört nem módosítunk
        email: true,    // Emailt külön folyamatban módosítunk
        password: true
    }).partial()
})

export const MyProfileUpdateSchema = z.object({
    body: studentSchema
        .omit({
            role: true,
            email: true,
            password: true
        })
        .partial()
});


export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>['body'];
export type MyProfileUpdateInput = z.infer<typeof MyProfileUpdateSchema>['body'];
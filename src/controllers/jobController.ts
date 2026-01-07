import { Request, Response } from "express";
import prisma from "../config/prisma";
import { CompanyInput, PositionInput, TagInput } from "../schemas/jobSchema";

export const createTag = async (
    req: Request<{}, {}, TagInput>,
    res: Response
) => {
    try {
        const tag = await prisma.tag.create({
            data: { name: req.body.name },
        });
        res.status(201).json(tag);
    } catch (error) {
        res.status(500).json({ message: "Hiba a címke létrehozásakor." });
    }
};

export const createCompany = async (
    req: Request<{}, {}, CompanyInput>,
    res: Response
) => {
    const data = req.body;
    try {
        const existingCompany = await prisma.company.findUnique({
            where: { taxId: data.taxId },
        });

        if (existingCompany) {
            return res
                .status(400)
                .json({ message: "Már létezik cég a megadott adószámmal." });
        }

        const newCompany = await prisma.company.create({
            data: {
                name: data.name,
                taxId: data.taxId,
                hqCountry: data.hqCountry,
                hqZipCode: String(data.hqZipCode) || "",
                hqCity: data.hqCity || "",
                hqAddress: data.hqAddress || "",
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                website: data.website,
                logoUrl: data.logoUrl,
            },
        });

        res
            .status(201)
            .json({ message: "Sikeres cég létrehozás", company: newCompany });
    } catch (error) {
        console.error("Company Creation Error:", error);
        return res
            .status(500)
            .json({ message: "Hiba történt a cég létrehozásakor." });
    }
};

export const createPosition = async (
    req: Request<{}, {}, PositionInput>,
    res: Response
) => {
    const data = req.body;
    try {
        const company = await prisma.company.findUnique({
            where: { id: data.companyId },
        });

        if (!company) {
            return res.status(404).json({ message: "A megadott cég nem találhazó." });
        }

        const newPosition = await prisma.position.create({
            data: {
                companyId: data.companyId,
                title: data.title,
                description: data.description,
                zipCode: data.zipCode,
                city: data.city,
                address: data.address,
                deadline: data.deadline,
                // Címkék kezelése: keresés vagy létrehozás név alapján
                tags: data.tagNames
                    ? {
                        connectOrCreate: data.tagNames.map((name) => ({
                            where: { name: name }, // Itt feltételezzük, hogy a 'name' mező @unique a sémában
                            create: { name: name },
                        })),
                    }
                    : undefined,
            },
            include: {
                tags: true, // Visszaadjuk a mentett címkéket is az ellenőrzéshez
            },
        });
        res.status(201).json({
            message: "Pozíció sikeresen meghirdetve",
            position: newPosition,
        });
    } catch (error) {
        console.error("Position Creation Error:", error);
        res.status(500).json({ message: "Hiba történt a pozíció mentése során." });
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    try {
        const updatedCompany = await prisma.company.update({
            where: { id },
            data: data,
        })
        res.json({ message: "Cég adatai frissítve", company: updatedCompany });
    } catch (error) {
        res.status(500).json({ message: "Hiba a cég frissítésekor. Lehet, hogy az ID nem létezik." });
    }
}

export const updatePosition = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tagNames, ...data } = req.body;

    try {
        const updatedPosition = await prisma.position.update({
            where: { id },
            data: {
                ...data,
                tags: tagNames ? {
                    set: [],
                    connectOrCreate: tagNames.map((name: string) => ({
                        where: { name },
                        create: { name }
                    }))
                } : undefined
            },
            include: { tags: true }
        })
        res.json({ message: "Pozíció frissítve", position: updatedPosition });
    } catch (error) {
        res.status(500).json({ message: "Hiba a pozíció frissítésekor." });
    }
}

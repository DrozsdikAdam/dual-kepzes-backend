import { Request, Response } from "express";
import prisma from "../config/prisma";
import { CompanyInput, PositionInput, TagInput } from "../schemas/jobSchema";

export const getAllCompanies = async (req: Request, res: Response) => {
    try {
        const companies = await prisma.company.findMany({
            where: { deletedAt: null },
            include: {
                _count: { select: { positions: true } }
            }
        })
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: "Hiba a cégek lekérésekor." });
    }
}

export const getCompanyById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const company = await prisma.company.findUnique({
            where: { id, deletedAt: null },
            include: {
                positions: { where: { deletedAt: null } },
                employees: { select: { jobTitle: true, user: { select: { fullName: true } } } }
            }
        })

        if (!company) return res.status(404).json({ message: "Cég nem található." });
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: "Hiba a cég lekérésekor." });
    }
}

export const getAllPositions = async (req: Request, res: Response) => {
    try {
        const positions = await prisma.position.findMany({
            where: { deletedAt: null, isActive: true },
            include: {
                company: { select: { name: true, logoUrl: true, hqCity: true } },
                tags: { select: { name: true } }
            },
            orderBy: { deadline: 'asc' }

        })
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: "Hiba a pozíciók lekérésekor." });
    }
}

export const getPositionById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const position = await prisma.position.findUnique({
            where: { id, deletedAt: null },
            include: {
                company: true,
                tags: true
            }
        })
        if (!position) return res.status(404).json({ message: "Pozíció nem található." });
        res.json(position);
    } catch (error) {
        res.status(500).json({ message: "Hiba a pozíció lekérésekor." });
    }
}

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
        // 1. Cég ellenőrzése
        const company = await prisma.company.findUnique({
            where: { id: data.companyId, deletedAt: null },
        });

        if (!company) {
            return res.status(404).json({ message: "A megadott cég nem található." });
        }

        // 2. Pozíció létrehozása
        const newPosition = await prisma.position.create({
            data: {
                title: data.title,
                description: data.description,
                zipCode: data.zipCode,
                city: data.city,
                address: data.address,
                deadline: data.deadline,
                // Reláció a céghez (companyId helyett így biztosabb a típuskezelés)
                company: {
                    connect: { id: data.companyId }
                },
                // Címkék (kategóriák) kezelése
                tags: data.tags && data.tags.length > 0
                    ? {
                        connectOrCreate: data.tags.map((tag) => ({
                            where: { name: tag.name },
                            create: {
                                name: tag.name,
                                category: tag.category
                            },
                        })),
                    }
                    : undefined,
            },
            include: {
                tags: true,
                company: true // Opcionális: a válaszban a cég adatai is benne lesznek
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

export const deleteCompany = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {

        await prisma.company.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date()
            }
        })

        // A céghez tartozó összes pozíció deaktiválása is
        await prisma.position.updateMany({
            where: { companyId: id },
            data: { isActive: false, deletedAt: new Date() }
        });

        res.json({ message: "Cég és kapcsolódó pozíciói törölve." });
    } catch (error) {
        res.status(500).json({ message: "Hiba a cég törlésekor." });
    }
}

export const deletePosition = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {

        await prisma.position.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date()
            }
        })
        res.json({ message: "Pozíció sikeresen törölve." });
    } catch (error) {
        res.status(500).json({ message: "Hiba a pozíció törlésekor." });
    }
}
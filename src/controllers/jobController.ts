import { Request, Response } from "express";
import prisma from "../config/prisma";
import { CompanyInput, PositionInput, TagInput } from "../schemas/jobSchema";
import { logAction } from "../utils/logger";

// 1. Központi SELECT definíciók
const companySelect = {
    id: true,
    name: true,
    taxId: true,
    hqCountry: true,
    hqZipCode: true,
    hqCity: true,
    hqAddress: true,
    contactName: true,
    contactEmail: true,
    website: true,
    logoUrl: true,
    isActive: true,
    createdAt: true,
};

const positionSelect = {
    id: true,
    title: true,
    description: true,
    zipCode: true,
    city: true,
    address: true,
    deadline: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    tags: {
        select: {
            name: true,
            category: true
        }
    }
};

export const getAllCompanies = async (req: Request, res: Response) => {
    try {
        const companies = await prisma.company.findMany({
            select: {
                ...companySelect,
                _count: {
                    select: {
                        positions: {
                            where: { deletedAt: null }
                        }
                    }
                }
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
            where: { id },
            select: {
                ...companySelect,
                positions: {
                    where: {
                        isActive: true,
                        deletedAt: null
                    },
                    select: positionSelect
                },
                employees: {
                    where: {
                        deletedAt: null
                    },
                    select: {
                        id: true,
                        jobTitle: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        if (!company) return res.status(404).json({ message: "Cég nem található." });

        await logAction(req, {
            action: "VIEW_COMPANY",
            entity: "Company",
            entityId: id,
            details: { viewById: req.user?.userId, name: company.name }
        });

        res.json(company);
    } catch (error) {
        res.status(500).json({ message: "Hiba a cég lekérésekor." });
    }
}

export const getAllPositions = async (req: Request, res: Response) => {
    try {
        const positions = await prisma.position.findMany({
            where: { isActive: true },
            select: {
                ...positionSelect,
                company: {
                    select: {
                        name: true,
                        logoUrl: true,
                        hqCity: true
                    }
                }
            },
            orderBy: { deadline: "asc" }
        });
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: "Hiba a pozíciók lekérésekor." });
    }
}

export const getPositionById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const position = await prisma.position.findUnique({
            where: { id },
            select: {
                ...positionSelect,
                company: {
                    select: companySelect
                }
            }
        });
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
                ...data,
                hqZipCode: String(data.hqZipCode),
                hqCity: data.hqCity || "",
                hqAddress: data.hqAddress || "",
                hqCountry: data.hqCountry || "Magyarország"
            },
            select: companySelect
        });

        await logAction(req, {
            action: "CREATE_COMPANY",
            entity: "Company",
            entityId: newCompany.id,
            details: { createdById: req.user?.userId, name: newCompany.name, taxId: newCompany.taxId }
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
        const newPosition = await prisma.position.create({
            data: {
                title: data.title,
                description: data.description,
                zipCode: data.zipCode,
                city: data.city,
                address: data.address,
                deadline: data.deadline,
                company: { connect: { id: data.companyId } },
                tags: data.tags && data.tags.length > 0 ? {
                    connectOrCreate: data.tags.map((tag) => ({
                        where: { name: tag.name },
                        create: { name: tag.name, category: tag.category },
                    })),
                } : undefined,
            },
            select: positionSelect
        });

        await logAction(req, {
            action: "CREATE_POSITION",
            entity: "Position",
            entityId: newPosition.id,
            details: { createdById: req.user?.userId, title: newPosition.title, companyId: data.companyId }
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
    const { companyId } = req.params;
    const data = req.body;

    if (data.hqZipCode) {
        data.hqZipCode = String(data.hqZipCode);
    }

    try {
        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: data,
            select: companySelect
        });

        await logAction(req, {
            action: "UPDATE_COMPANY",
            entity: "Company",
            entityId: companyId,
            details: { updatedById: req.user?.userId, updatedFields: Object.keys(data) }
        });

        return res.json({ message: "Cég adatai frissítve", company: updatedCompany });
    } catch (error) {
        // Fontos: Logold a konkrét hibát a Railway konzolra!
        console.error("Prisma Update Error:", error);
        return res.status(500).json({ message: "Hiba a cég frissítésekor. Ellenőrizd az adatokat!" });
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
                        create: { name, category: "Technology" }
                    }))
                } : undefined
            },
            select: positionSelect
        });

        await logAction(req, {
            action: "UPDATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { updatedById: req.user?.userId, title: updatedPosition.title, changedFields: Object.keys(data) }
        });

        return res.json({
            message: "Pozíció adatai sikeresen frissítve",
            position: updatedPosition
        });

    } catch (error) {
        return res.status(500).json({ message: "Hiba a pozíció frissítésekor." });
    }
}

export const deleteCompany = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.company.update({
            where: { id },
            data: { isActive: false, deletedAt: new Date() }
        })
        await prisma.position.updateMany({
            where: { companyId: id },
            data: { isActive: false, deletedAt: new Date() }
        });
        await prisma.companyEmployee.updateMany({
            where: { companyId: id },
            data: { deletedAt: new Date() }
        });
        const employees = await prisma.companyEmployee.findMany({
            where: { companyId: id },
            select: { userId: true }
        });

        const employeeUserIds = employees.map(e => e.userId);

        if (employeeUserIds.length > 0) {
            await prisma.user.updateMany({
                where: { id: { in: employeeUserIds } },
                data: { deletedAt: new Date() }
            });
        }

        await logAction(req, {
            action: "DELETE_COMPANY",
            entity: "Company",
            entityId: id,
            details: { name: id, deletedById: req.user?.userId }
        });

        return res.json({ message: "Cég és kapcsolódó pozíciói törölve." });
    } catch (error) {
        return res.status(500).json({ message: "Hiba a cég törlésekor." });
    }
}

export const deletePosition = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.position.update({
            where: { id },
            data: { isActive: false, deletedAt: new Date() }
        });

        await logAction(req, {
            action: "DELETE_POSITION",
            entity: "Position",
            entityId: id,
            details: { deletedById: req.user?.userId }
        });

        return res.json({ message: "Pozíció sikeresen törölve." }); // JAVÍTVA: return hozzáadva
    } catch (error) {
        return res.status(500).json({ message: "Hiba a pozíció törlésekor." });
    }
}

export const deactivatePosition = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const position = await prisma.position.findFirst({
            where: { id, deletedAt: null }
        });

        if (!position) {
            return res.status(404).json({ message: "Nem található aktív pozíció ezzel az ID-val." });
        }

        const updatedPosition = await prisma.position.update({
            where: { id },
            data: { isActive: false },
            select: positionSelect
        });

        await logAction(req, {
            action: "DEACTIVATE_POSITION",
            entity: "Position",
            entityId: id,
            details: {
                deactivatedBy: req.user?.userId
            }
        });

        return res.json({ message: "Pozíció sikeresen deaktiválva.", position: updatedPosition });
    } catch (error) {
        return res.status(500).json({ message: "Hiba a pozíció deaktiválásakor." });
    }
}
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { PositionInput, TagInput } from "../schemas/jobSchema";
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
    isDual: true,
    createdAt: true,
    updatedAt: true,
    tags: {
        select: {
            name: true,
            category: true
        }
    }
};

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

        return res.json({ message: "Pozíció sikeresen törölve." });
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

export const reactivatePosition = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const position = await prisma.position.findFirst({
            where: { id, deletedAt: null }
        });

        if (!position) {
            return res.status(404).json({ message: "Nem található deaktivált pozíció ezzel az ID-val." });
        }

        const updatedPosition = await prisma.position.update({
            where: { id },
            data: { isActive: true },
            select: positionSelect
        });

        await logAction(req, {
            action: "REACTIVATE_POSITION",
            entity: "Position",
            entityId: id,
            details: {
                reactivatedBy: req.user?.userId
            }
        });

        return res.json({ message: "Pozíció sikeresen reaktiválva.", position: updatedPosition });
    } catch (error) {
        return res.status(500).json({ message: "Hiba a pozíció reaktiválásakor." });
    }
}

export const getInactivePositions = async (req: Request, res: Response) => {
    try {
        const positions = await prisma.position.findMany({
            where: { isActive: false, deletedAt: null },
            select: positionSelect
        });
        return res.json(positions);
    } catch (error) {
        return res.status(500).json({ message: "Hiba a deaktivált pozíciók lekérésekor." });
    }
}

export const getMyCompanyPositions = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Nem vagy bejelentkezve." });
        }

        const employee = await prisma.companyEmployee.findFirst({
            where: {
                userId: req.user.userId,
                deletedAt: null
            }
        });

        if (!employee) {
            return res.status(403).json({ message: "Nem tartozol egyetlen céghez sem." });
        }

        const positions = await prisma.position.findMany({
            where: { companyId: employee.companyId, deletedAt: null },
            select: positionSelect
        });
        return res.json(positions);
    } catch (error) {
        console.error("Error fetching company positions:", error);
        return res.status(500).json({ message: "Hiba a saját cégek pozíciók lekérésekor." });
    }
}
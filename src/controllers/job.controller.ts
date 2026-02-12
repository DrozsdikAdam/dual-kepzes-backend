import { Request, Response, NextFunction } from "express";
import { jobService } from "../services/job.service";
import { PositionInput, TagInput, PositionUpdateInput } from "../schemas/job.schema";
import { logAction } from "../utils/logger.util";
import { mapPosition } from "../utils/mapper.util";
import { getCompanyIdForUser, checkPositionOwnership } from "../utils/company.util";
import { getPaginationParams } from "../utils/pagination.util";
import { ForbiddenError } from "../errors/AppError";

/**
 * Get job positions (supports optional filtering by dual/non-dual)
 * @route GET /api/jobs/positions
 * @group Jobs - Operations related to job positions
 * @param {boolean} isDual.query.optional - Filter by dual/non-dual status (true/false)
 * @returns {object} 200 - Paginated list of positions
 */
export const getAllPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const isDual = req.query.isDual !== undefined ? req.query.isDual === 'true' : undefined;
        const result = await jobService.getAll(params, isDual);
        res.json({
            success: true,
            data: result.data.map(mapPosition),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get only dual job positions
 * @route GET /api/jobs/positions/dual
 * @group Jobs - Operations related to job positions
 * @returns {object} 200 - Paginated list of dual positions
 */
export const getDualPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const result = await jobService.getAll(params, true);
        res.json({
            success: true,
            data: result.data.map(mapPosition),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get only non-dual job positions
 * @route GET /api/jobs/positions/non-dual
 * @group Jobs - Operations related to job positions
 * @returns {object} 200 - Paginated list of non-dual positions
 */
export const getNonDualPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const result = await jobService.getAll(params, false);
        res.json({
            success: true,
            data: result.data.map(mapPosition),
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

export const getPositionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const position = await jobService.getById(id);
        res.json({
            success: true,
            data: mapPosition(position)
        });
    } catch (error) {
        next(error);
    }
};

export const getPositionsByCompanyId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params;
        const positions = await jobService.getByCompany(companyId);
        res.json({
            success: true,
            data: positions.map(mapPosition)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new tag
 * @route POST /api/jobs/tags
 * @group Tags - Job position tags
 * @param {object} tag.body.required - Tag name
 * @returns {object} 201 - Tag created
 */
export const createTag = async (
    req: Request<{}, {}, TagInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const tag = await jobService.createTag(req.body.name);
        res.status(201).json({
            success: true,
            message: "Tag sikeresen létrehozva",
            data: tag
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new job position
 * @route POST /api/jobs/positions
 * @group Jobs - Job operations
 * @param {object} position.body.required - Position details
 * @returns {object} 201 - Position created
 * @security bearerAuth
 */
export const createPosition = async (
    req: Request<{}, {}, PositionInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        // companyId a tokenből, nem a body-ból
        const { userId } = req.user!;
        const companyId = await getCompanyIdForUser(userId);

        if (!companyId) {
            throw new ForbiddenError("Nem tartozol egyetlen céghez sem. Csak céghez tartozó felhasználók hozhatnak létre pozíciókat.");
        }

        // Body-ból érkező companyId figyelmen kívül hagyása
        const { companyId: _ignoredCompanyId, ...positionData } = req.body;

        const newPosition = await jobService.create({
            ...positionData,
            companyId // Szerver-oldali érték
        });

        await logAction(req, {
            action: "CREATE_POSITION",
            entity: "Position",
            entityId: newPosition.id,
            details: { createdById: userId, title: newPosition.title, companyId }
        });

        res.status(201).json({
            success: true,
            message: "Pozíció sikeresen meghirdetve",
            data: mapPosition(newPosition),
        });
    } catch (error) {
        next(error);
    }
};

export const updatePosition = async (req: Request<{ id: string }, {}, PositionUpdateInput>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        // Ownership ellenőrzés
        const isOwner = await checkPositionOwnership(userId, id);
        if (!isOwner) {
            throw new ForbiddenError("Nincs jogosultságod módosítani ezt a pozíciót.");
        }

        // Body-ból érkező companyId figyelmen kívül hagyása
        const positionData = req.body;

        const updated = await jobService.update(id, positionData);

        await logAction(req, {
            action: "UPDATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { updatedById: userId, title: updated.title, changedFields: Object.keys(positionData) }
        });

        res.json({
            success: true,
            message: "Pozíció adatai sikeresen fríssítve",
            data: mapPosition(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const deletePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        // Ownership ellenőrzés
        const isOwner = await checkPositionOwnership(userId, id);
        if (!isOwner) {
            throw new ForbiddenError("Nincs jogosultságod törölni ezt a pozíciót.");
        }

        await jobService.delete(id);

        await logAction(req, {
            action: "DELETE_POSITION",
            entity: "Position",
            entityId: id,
            details: { deletedById: userId }
        });

        res.json({ success: true, message: "Pozíció sikeresen törölve." });
    } catch (error) {
        next(error);
    }
};

export const deactivatePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        // Ownership ellenőrzés
        const isOwner = await checkPositionOwnership(userId, id);
        if (!isOwner) {
            throw new ForbiddenError("Nincs jogosultságod deaktiválni ezt a pozíciót.");
        }

        const updated = await jobService.setStatus(id, false);

        await logAction(req, {
            action: "DEACTIVATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { deactivatedBy: userId }
        });

        res.json({
            success: true,
            message: "Pozíció sikeresen deaktiválva.",
            data: mapPosition(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const reactivatePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        // Ownership ellenőrzés
        const isOwner = await checkPositionOwnership(userId, id);
        if (!isOwner) {
            throw new ForbiddenError("Nincs jogosultságod reaktiválni ezt a pozíciót.");
        }

        const updated = await jobService.setStatus(id, true);

        await logAction(req, {
            action: "REACTIVATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { reactivatedBy: userId }
        });

        res.json({
            success: true,
            message: "Pozíció sikeresen reaktiválva.",
            data: mapPosition(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const getInactivePositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const positions = await jobService.getInactive();
        res.json({
            success: true,
            data: positions.map(mapPosition)
        });
    } catch (error) {
        next(error);
    }
};

export const getMyCompanyPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = await getCompanyIdForUser(req.user!.userId);
        if (!companyId) {
            throw new ForbiddenError("Nem tartozol egyetlen céghez sem.");
        }

        const positions = await jobService.getByCompany(companyId);
        res.json({
            success: true,
            data: positions.map(mapPosition)
        });
    } catch (error) {
        next(error);
    }
};

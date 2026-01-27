import { Request, Response, NextFunction } from "express";
import { jobService } from "../services/job.service";
import { PositionInput, TagInput } from "../schemas/jobSchema";
import { logAction } from "../utils/logger";
import { mapPosition } from "../utils/mappers";
import { getCompanyIdForUser } from "../utils/companyUtils";
import { getPaginationParams } from "../utils/pagination";

/**
 * Get all job positions
 * @route GET /api/jobs
 * @group Jobs - Operations related to job positions
 * @returns {object} 200 - Paginated list of positions
 */
export const getAllPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = getPaginationParams(req.query);
        const result = await jobService.getAll(params);
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
        res.json(mapPosition(position));
    } catch (error) {
        next(error);
    }
};

export const getPositionsByCompanyId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params;
        const positions = await jobService.getByCompany(companyId);
        res.json(positions.map(mapPosition));
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
        res.status(201).json(tag);
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new job position
 * @route POST /api/jobs
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
        const newPosition = await jobService.create(req.body);

        await logAction(req, {
            action: "CREATE_POSITION",
            entity: "Position",
            entityId: newPosition.id,
            details: { createdById: req.user?.userId, title: newPosition.title, companyId: req.body.companyId }
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

export const updatePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updated = await jobService.update(id, req.body);

        await logAction(req, {
            action: "UPDATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { updatedById: req.user?.userId, title: updated.title, changedFields: Object.keys(req.body) }
        });

        res.json({
            success: true,
            message: "Pozíció adatai sikeresen frissítve",
            data: mapPosition(updated)
        });
    } catch (error) {
        next(error);
    }
};

export const deletePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await jobService.delete(id);

        await logAction(req, {
            action: "DELETE_POSITION",
            entity: "Position",
            entityId: id,
            details: { deletedById: req.user?.userId }
        });

        res.json({ success: true, message: "Pozíció sikeresen törölve." });
    } catch (error) {
        next(error);
    }
};

export const deactivatePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updated = await jobService.setStatus(id, false);

        await logAction(req, {
            action: "DEACTIVATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { deactivatedBy: req.user?.userId }
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
        const updated = await jobService.setStatus(id, true);

        await logAction(req, {
            action: "REACTIVATE_POSITION",
            entity: "Position",
            entityId: id,
            details: { reactivatedBy: req.user?.userId }
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
        res.json(positions.map(mapPosition));
    } catch (error) {
        next(error);
    }
};

export const getMyCompanyPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = await getCompanyIdForUser(req.user!.userId);
        if (!companyId) {
            return res.status(403).json({ message: "Nem tartozol egyetlen céghez sem." });
        }

        const positions = await jobService.getByCompany(companyId);
        res.json(positions.map(mapPosition));
    } catch (error) {
        next(error);
    }
};

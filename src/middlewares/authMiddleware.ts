import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: 'Hozzáférés megtagadva: nincs token megadva.' })
    }

    jwt.verify(token, process.env.JWT_SECRET || 'backup_titkos_kulcs_jwt_hez', (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Érvénytelen token' })
        }
        req.user = user
        next()
    })
}
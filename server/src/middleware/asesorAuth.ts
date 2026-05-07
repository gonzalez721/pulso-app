import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'

export interface AsesorRequest extends Request {
  asesorId?: string
  asesorEmail?: string
}

export function requireAsesorAuth(req: AsesorRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' }); return
  }

  const token = header.slice(7)
  try {
    const payload = verifyAccessToken(token)
    // Asesor tokens carry role:'asesor' in the sub field via userId prefix
    if (!(payload as any).role || (payload as any).role !== 'asesor') {
      res.status(403).json({ error: 'Acceso denegado — se requiere cuenta de asesor' }); return
    }
    req.asesorId    = payload.userId
    req.asesorEmail = payload.email
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

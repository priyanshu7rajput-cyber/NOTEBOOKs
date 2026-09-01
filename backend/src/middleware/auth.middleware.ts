import { Request, Response, NextFunction } from 'express';
import { createSupabaseClientWithAuth } from '../services/supabase.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized: Missing authorization header.' });
    return;
  }

  try {
    const supabase = createSupabaseClientWithAuth(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired session token.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized: Authentication failed.' });
  }
}

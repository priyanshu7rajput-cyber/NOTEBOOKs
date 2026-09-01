"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const supabase_service_1 = require("../services/supabase.service");
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized: Missing authorization header.' });
        return;
    }
    try {
        const supabase = (0, supabase_service_1.createSupabaseClientWithAuth)(authHeader);
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
    }
    catch (err) {
        res.status(401).json({ error: 'Unauthorized: Authentication failed.' });
    }
}

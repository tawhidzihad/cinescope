// ==========================================================================
// Auth Middleware — session-based admin protection
// ==========================================================================

export function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in as an administrator.'
    });
}
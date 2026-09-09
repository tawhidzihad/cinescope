// ==========================================================================
// Auth Controller — login/logout/me over authService + sessions
// ==========================================================================

import * as authService from '../services/authService.js';

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await authService.verifyCredentials(email, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        req.session.userId = String(user.id);
        req.session.userEmail = user.email;
        req.session.userRole = user.role;

        res.json({
            success: true,
            data: {
                id: String(user.id),
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
}

export async function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err.message);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('cinescope.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
}

export async function me(req, res) {
    try {
        const user = await authService.getUserById(req.session.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        res.json({ success: true, data: user });
    } catch (err) {
        console.error('Auth check error:', err.message);
        res.status(500).json({ success: false, message: 'Auth check failed' });
    }
}

export { seedAdmin } from '../services/authService.js';
import { User } from '../models/User.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;

    res.json({
      success: true,
      data: {
        id: user._id,
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
    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Auth check error:', err.message);
    res.status(500).json({ success: false, message: 'Auth check failed' });
  }
}

export async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    // password uses `select: false`, so it must be explicitly included for
    // the comparison below to work.
    const existing = await User.findOne({ email: normalizedEmail }).select('+password');

    if (existing) {
      // Keep the stored password in sync with ADMIN_PASSWORD so the
      // environment remains the single source of truth for the admin
      // account (otherwise a stale hash silently breaks login forever).
      const matches = await existing.comparePassword(password);
      if (!matches) {
        existing.password = password;
        await existing.save();
        console.log(`Admin password resynced for ${normalizedEmail}`);
      } else {
        console.log('Admin user already exists');
      }
      return;
    }

    const admin = new User({
      email: email.toLowerCase().trim(),
      password,
      role: 'admin'
    });
    await admin.save();
    console.log(`Admin user created: ${email}`);
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
}

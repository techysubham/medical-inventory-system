// Role-based access control middleware

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role !== 'superadmin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access requires one of roles: ${allowedRoles.join(', ')}` });
  }
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Super admin bypasses all permission checks
  if (req.user.role === 'superadmin' || req.user.isSuperAdmin) {
    return next();
  }
  if (!req.user.permissions || !req.user.permissions.includes(permission)) {
    return res.status(403).json({ error: `Permission required: ${permission}` });
  }
  next();
};

export const requireAnyPermission = (permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role === 'superadmin' || req.user.isSuperAdmin) {
    return next();
  }
  if (!req.user.permissions || !permissions.some((p) => req.user.permissions.includes(p))) {
    return res.status(403).json({ error: `One of these permissions required: ${permissions.join(', ')}` });
  }
  next();
};

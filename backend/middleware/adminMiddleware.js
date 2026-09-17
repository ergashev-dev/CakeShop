export const adminMiddleware = (req, res, next) => {
  if (!req.user || !['superadmin', 'super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Ushbu amalni bajarish uchun administrator ruxsati zarur.' });
  }
  next();
};

export const superAdminMiddleware = (req, res, next) => {
  if (!req.user || !['superadmin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Ushbu amalni faqat Bosh Administrator (Super Admin) bajara oladi.' });
  }
  next();
};

export const confectionerMiddleware = (req, res, next) => {
  if (!req.user || !['superadmin', 'super_admin', 'admin', 'confectioner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Ushbu amalni faqat qandolatchi yoki administrator bajara oladi.' });
  }
  next();
};

export const courierMiddleware = (req, res, next) => {
  if (!req.user || !['superadmin', 'super_admin', 'admin', 'courier'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Ushbu amalni faqat kuryer yoki administrator bajara oladi.' });
  }
  next();
};

export const staffMiddleware = (req, res, next) => {
  if (!req.user || !['superadmin', 'super_admin', 'admin', 'confectioner', 'courier'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Ushbu amalni faqat xodimlar bajara oladi.' });
  }
  next();
};

import BugReport from '../models/BugReport.js';

export const bugController = {
  /**
   * Submit bug report
   */
  async createBugReport(req, res) {
    try {
      const { title, description, screenshot, deviceInfo } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Xatolik mavzusi va tavsifi kiritilishi shart.' });
      }

      const bug = await BugReport.create({
        user: req.user ? req.user._id : null,
        userName: req.user ? req.user.name : 'Mehmon foydalanuvchi',
        userEmail: req.user ? req.user.email : (req.body.email || ''),
        title: title.trim(),
        description: description.trim(),
        screenshot: screenshot || '',
        deviceInfo: deviceInfo || req.headers['user-agent'] || '',
        status: 'Yangi',
      });

      return res.status(201).json({
        message: 'Xatolik haqida xabar qabul qilindi. Muammoni tez orada ko‘rib chiqamiz!',
        bug,
      });
    } catch (error) {
      console.error('Create bug report error:', error);
      return res.status(500).json({ error: 'Xabarni yuborishda xatolik yuz berdi.' });
    }
  },

  /**
   * Get all bug reports (Admin only)
   */
  async getBugReports(req, res) {
    try {
      const { status } = req.query;
      const filter = {};
      if (status && status !== 'all') filter.status = status;

      const bugs = await BugReport.find(filter);
      return res.json({ bugs });
    } catch (error) {
      console.error('Get bug reports error:', error);
      return res.status(500).json({ error: 'Xatoliklar ro‘yxatini yuklashda xatolik.' });
    }
  },

  /**
   * Update bug report status & admin notes
   */
  async updateBugStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const bug = await BugReport.findById(id);
      if (!bug) {
        return res.status(404).json({ error: 'Xatolik hisoboti topilmadi.' });
      }

      if (status) bug.status = status;
      if (adminNotes !== undefined) bug.adminNotes = adminNotes;

      await bug.save();

      return res.json({
        message: 'Xatolik hisoboti yangilandi.',
        bug,
      });
    } catch (error) {
      console.error('Update bug report error:', error);
      return res.status(500).json({ error: 'Yangilashda xatolik.' });
    }
  },
};

const ContactMessage = require('../models/ContactMessage');

const createContactMessage = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message is too long' });
    }

    const contactMessage = await ContactMessage.create({
      user: req.user.id,
      message,
    });

    return res.status(201).json({ message: 'Message submitted successfully', contactMessage });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to submit message', error: error.message });
  }
};

const listAdminContactMessages = async (_req, res) => {
  try {
    const contactMessages = await ContactMessage.find()
      .populate('user', 'phone role')
      .sort({ createdAt: -1 });

    return res.json({ contactMessages });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load contact messages', error: error.message });
  }
};

module.exports = {
  createContactMessage,
  listAdminContactMessages,
};
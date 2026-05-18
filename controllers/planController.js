const Plan = require('../models/Plan');
const cloudinary = require('../config/cloudinary');

const uploadImage = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'corona/plans',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

const listPlans = async (_req, res) => {
  try {
    const plans = await Plan.find({}).sort({ order: 1, createdAt: 1 });
    return res.json({ plans });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load plans', error: error.message });
  }
};

const createPlan = async (req, res) => {
  try {
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ message: 'Plan image is required' });
    }

    const uploadResult = req.file ? await uploadImage(req.file) : null;
    const plan = await Plan.create({
      ...req.body,
      imageUrl: uploadResult?.secure_url || req.body.imageUrl,
    });
    return res.status(201).json({ plan });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create plan', error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const updatePayload = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadImage(req.file);
      updatePayload.imageUrl = uploadResult.secure_url;
    }

    const plan = await Plan.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    return res.json({ plan });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update plan', error: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Disable any existing purchases that reference this deleted plan so users stop receiving income
    try {
      const Purchase = require('../models/Purchase');
      await Purchase.updateMany({ plan: plan._id, active: true }, { $set: { active: false } });
    } catch (err) {
      // ignore errors here but log in non-production
      if (process.env.NODE_ENV !== 'production') console.warn('Failed to disable purchases for deleted plan', err && err.message);
    }

    return res.json({ message: 'Plan deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete plan', error: error.message });
  }
};

module.exports = {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
};

const express = require('express');
const router = express.Router();
const fcmController = require('../controllers/fcmController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/register', fcmController.registerToken);
router.delete('/unregister', fcmController.removeToken);
router.post('/send', authorize(['admin', 'superadmin']), fcmController.sendNotification);

module.exports = router; 
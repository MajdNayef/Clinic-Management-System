const express = require('express');
const protect = require('../middlewares/auth');
const {
    notifyUserHandler,
    getNotifications
} = require('../controllers/notificationController');

const router = express.Router();

router.post('/', protect, notifyUserHandler);
router.get('/', protect, getNotifications);

module.exports = router;

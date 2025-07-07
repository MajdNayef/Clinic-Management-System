// src/controllers/notificationController.js
const { ObjectId } = require('mongodb');
const transporter = require('../services/mailer');
const { collection } = require('../config/db');

/**
 * Core helper: send the email + record in your DB.
 * Returns the inserted notification object.
 */
async function sendNotificationToUser(userId, content) {
    const uid = new ObjectId(userId);
    const user = await collection('users').findOne({ _id: uid });
    if (!user) throw new Error('User not found');

    const sentAt = new Date().toLocaleString();

    // 1) Send templated HTML email
    await transporter.sendMail({
        from: `"MedConnect" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: '🔔 MedConnect Notification',
        template: 'notification',       // matches `notification.hbs`
        context: { user, content, sentAt }
    });

    // 2) Persist to notifications
    const note = { user_id: uid, content, sent_at: new Date(), status: 'Sent' };
    const { insertedId } = await collection('notifications').insertOne(note);
    return { ...note, _id: insertedId };
}


/**
 * Express handler for POST /api/notifications
 */
async function notifyUserHandler(req, res, next) {
    try {
        const { userId, content } = req.body;
        const note = await sendNotificationToUser(userId, content);
        res.json({ success: true, notification: note });
    } catch (err) {
        next(err);
    }
}

/**
 * Express handler for GET /api/notifications
 */
async function getNotifications(req, res, next) {
    try {
        const uid = new ObjectId(req.userId);
        const notes = await collection('notifications')
            .find({ user_id: uid })
            .sort({ sent_at: -1 })
            .toArray();
        res.json(notes);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    sendNotificationToUser, // your helper
    notifyUserHandler,      // POST /api/notifications
    getNotifications,       // GET /api/notifications
};

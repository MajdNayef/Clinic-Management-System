// server/src/routes/dialogflow.js
const express = require('express');
const dialogflow = require('@google-cloud/dialogflow');
const router = express.Router();
const sessionClient = new dialogflow.SessionsClient();

router.post('/detectIntent', async (req, res, next) => {
    console.log('👉 [Dialogflow] payload:', req.body);
    try {
        const { text, sessionId } = req.body;
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        console.log('   projectId=', projectId, 'sessionId=', sessionId);

        const sessionPath = sessionClient.projectAgentSessionPath(
            projectId,
            sessionId
        );

        const [response] = await sessionClient.detectIntent({
            session: sessionPath,
            queryInput: { text: { text, languageCode: 'en-US' } },
        });
        console.log('   reply=', response.queryResult.fulfillmentText);
        res.json({ reply: response.queryResult.fulfillmentText });
    } catch (err) {
        // Log full error:
        console.error('💥 [Dialogflow] ERROR:', err);
        // Return the error message so you can see it in Postman/Browser:
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

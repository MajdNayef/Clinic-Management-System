import path from 'path';
import { config } from 'dotenv';
import { IntentsClient } from '@google-cloud/dialogflow';
import faqData from './data/faqData.json' assert { type: 'json' };

// Load the correct .env
config({ path: path.resolve(process.cwd(), 'src/config/.env') });

async function importFaqs() {
    const client = new IntentsClient();
    const agentPath = client.projectAgentPath(process.env.GOOGLE_CLOUD_PROJECT);
    const allFaqs = Object.values(faqData).flat();

    for (const faq of allFaqs) {
        const intent = {
            displayName: faq.id,
            trainingPhrases: [{ type: 'EXAMPLE', parts: [{ text: faq.question }] }],
            messages: [{ text: { text: [faq.answer] } }]
        };
        console.log(`Creating intent ${faq.id}: "${faq.question}"`);
        await client.createIntent({ parent: agentPath, intent });
    }
    const safeInsertMany = async (col, docs, label) => {
        for (const doc of docs) {
            const exists = await col.findOne({ _id: doc._id });
            if (exists) {
                console.log(`↺  ${label}: ${doc._id} already present – skipped`);
            } else {
                await col.insertOne(doc);
                console.log(`➕  ${label}: inserted ${doc._id}`);
            }
        }
    };

    await safeInsertMany(usersCol, userDocs, 'user');
    await safeInsertMany(doctorsCol, doctorDocs, 'doctor');
    await safeInsertMany(patientsCol, patientDocs, 'patient');

    console.log('✅ All FAQ intents created!');
}

importFaqs().catch((err) => {
    console.error('❌ Failed to import FAQs:', err);
    process.exit(1);
});

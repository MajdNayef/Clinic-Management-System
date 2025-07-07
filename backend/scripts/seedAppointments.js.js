// scripts/seedAppointments.js node scripts/seedAppointments.js

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  // adjust to your own URI / DB name if needed
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medconnect';
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();

  try {
    const db = client.db();              // uses "medconnect"
    const appts = db.collection('appointments');

    // put here as many as you like
    const seedData = [
      {
        doctor_id: new ObjectId('681f442314ae1da60eef5b61'),
        patient_id: new ObjectId('681f5e76cc2ae1dd596ca67b'),
        status:       'Scheduled',
        date:         '2025-06-01',
        time:         '09:00',
        appointment_type: 'In-Person',
        createdAt:    new Date()
      },
      {
        doctor_id: new ObjectId('681f442314ae1da60eef5b61'),
        patient_id: new ObjectId('681f5e76cc2ae1dd596ca67b'),
        status:       'Scheduled',
        date:         '2025-06-01',
        time:         '09:30',
        appointment_type: 'Virtual',
        createdAt:    new Date()
      },
      {
        doctor_id: new ObjectId('68a1234abcd5678ef9012345'),
        patient_id: new ObjectId('681f5e76cc2ae1dd596ca67b'),
        status:       'Scheduled',
        date:         '2025-06-02',
        time:         '10:00',
        appointment_type: 'In-Person',
        createdAt:    new Date()
      },

    ];

    const result = await appts.insertMany(seedData);
    console.log(`✅ Inserted ${result.insertedCount} appointments`);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

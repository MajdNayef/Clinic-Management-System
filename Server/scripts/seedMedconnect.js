// seedMedconnect.js
// -----------------------------------------------------------------------------
// Inserts users, doctors, patients in one go – no changes to existing data.
// -----------------------------------------------------------------------------
// USAGE
//   MONGO_URI='mongodb://user:pass@host:port' node seedMedconnect.js
// -----------------------------------------------------------------------------

const { MongoClient, ObjectId } = require('mongodb');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  // ── 1.  SAMPLE DATA  ───────────────────────────────────────────────
  // Replace / extend these arrays; do NOT change field names.
  // Every user referenced in doctors[] or patients[] MUST appear here.
  const userDocs = [
    {
      _id: new ObjectId('681f5e76cc2ae1dd596ca67b'),        // keep or generate
      first_name: 'Majid',
      last_name:  'Nayef',
      phone_number: '966535707155',
      address: 'Melana',
      email: 'Majidyoussef@graduate.utm.my',
      password: '$2b$12$gzIoV.q4w2vC7MK...hash...',        // already-hashed!
      role: 'Patient',                                     // ᴵᴹᴾᵀ: exactly as app expects
      notifications_enabled: true,
      createdAt: new Date('2025-05-10T14:11:02.683Z'),
      profile_image: '/uploads/avatars/b6e6a3db87b070388f134ac28d0375c3'
    },
    {
      _id: new ObjectId('681fae480045c4d7c447dbd4'),
      first_name: 'Dr Aisha',
      last_name:  'Rahman',
      phone_number: '60123456789',
      address: 'Kuala Lumpur',
      email: 'aisha.rahman@dmc.my',
      password: '$2b$12$anotherPreHashedPassword=====',
      role: 'Doctor',
      notifications_enabled: true,
      createdAt: new Date(),
      profile_image: '/uploads/avatars/aisha.png'
    }
  ];

  const doctorDocs = [
    {
      _id: new ObjectId('685e8ce98c0ec8a7da434302'),
      user_id: new ObjectId('681fae480045c4d7c447dbd4'),    // ← matches Dr Aisha
      available_days: ['Monday', 'Wednesday', 'Friday'],
      bio: 'Consultant cardiologist with a passion for preventive care.',
      specialization: 'Cardiology',
      available_start_time: '08:30',
      available_end_time: '17:00',
      years_of_experience: '10'
    }
  ];

  const patientDocs = [
    {
      _id: new ObjectId('684f07ee060ecc1bd82732d5'),
      user_id: new ObjectId('681f5e76cc2ae1dd596ca67b'),     // ← matches Majid
      medical_history_id: null
    }
  ];

  // ── 2.  CONNECT & INSERT  ──────────────────────────────────────────
  try {
    await client.connect();
    const db = client.db('medconnect');
    const usersCol     = db.collection('users');
    const doctorsCol   = db.collection('doctors');
    const patientsCol  = db.collection('patients');

    // helper: upsertWithoutOverwrite (insert-only if _id not present)
    const safeInsertMany = async (col, docs) => {
      for (const doc of docs) {
        const exists = await col.findOne({ _id: doc._id });
        if (exists) continue;                   // skip – don’t touch existing row
        await col.insertOne(doc);
      }
    };

    await safeInsertMany(usersCol,    userDocs);
    await safeInsertMany(doctorsCol,  doctorDocs);
    await safeInsertMany(patientsCol, patientDocs);

    console.log('✅ Seed complete – nothing modified except missing rows.');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await client.close();
  }
})();

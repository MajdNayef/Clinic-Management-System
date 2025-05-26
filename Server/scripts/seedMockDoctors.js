// scripts/seedMockDoctors.js

//! this is only to send mock data to the db , to run use this line in the therminal 
// node scripts/seedMockDoctors.js

const { MongoClient, ObjectId } = require('mongodb');

async function seedMockDoctors() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('medconnect');
        const users = db.collection('users');
        const doctors = db.collection('doctors');

        // 1) Define 10 departments
        const specs = [
            'Cardiology', 'Neurology', 'Pediatrics', 'Dermatology', 'Orthopedics',
            'Radiology', 'Psychiatry', 'Ophthalmology', 'Gastroenterology', 'Endocrinology'
        ];

        // 2) Create one user per department
        const userDocs = specs.map((spec, i) => {
            const first = spec + 'First';
            const last = spec + 'Last';
            return {
                _id: new ObjectId(),
                first_name: first,
                last_name: last,
                email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
                phone_number: '0500000000',
                address: `123 ${spec} St, MedCity`,
                profile_image: '',
                createdAt: new Date()
            };
        });
        await users.insertMany(userDocs);
        console.log('Inserted', userDocs.length, 'mock user accounts');

        // 3) Insert matching doctor records
        const doctorDocs = userDocs.map((u, i) => ({
            user_id: u._id,
            specialization: specs[i],
            bio: `Dr. ${u.first_name} ${u.last_name} is a board-certified ${specs[i]} specialist.`,
            createdAt: new Date()
        }));
        await doctors.insertMany(doctorDocs);
        console.log('Inserted', doctorDocs.length, 'mock doctor profiles');

    } finally {
        await client.close();
    }
}

seedMockDoctors()
    .then(() => console.log('Seeding complete'))
    .catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });

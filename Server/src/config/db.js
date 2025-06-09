// src/config/db.js
const { MongoClient } = require('mongodb');

let db;                              // shared singleton

async function connect() {
    const client = await MongoClient.connect(process.env.MONGO_URI);
    db = client.db();                 // defaults to DB name in the URI
    console.log('🗄️  Mongo connected');
}

function collection(name) {
    if (!db) throw new Error('DB not initialised – call connect() first');
    return db.collection(name);
}

module.exports = { connect, collection };

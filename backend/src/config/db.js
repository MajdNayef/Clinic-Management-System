const { MongoClient } = require('mongodb');

let db;
let client;

async function connect() {
    client = new MongoClient(process.env.MONGO_URI, {
        // Optional: you can remove these since they're deprecated
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await client.connect();
    db = client.db(); // uses DB name from URI
    console.log('🗄️  Mongo connected to database:', db.databaseName);
}

function collection(name) {
    if (!db) throw new Error('DB not initialised – call connect() first');
    return db.collection(name);
}

// ✅ Export client through a getter (so it's always fresh)
function getClient() {
    if (!client) throw new Error('MongoClient not initialized. Call connect() first.');
    return client;
}

module.exports = {
    connect,
    collection,
    getClient // ✅ export a function, not the variable
};

require('dotenv').config();                 // loads .env

const http = require('http');
const app = require('./app');              // your Express app
const { connect } = require('./config/db'); // ← native-driver connect()

(async () => {
    await connect();                          // MUST be awaited before listen()

    const server = http.createServer(app);    // or just app.listen if no sockets
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () =>
        console.log(`🚀  Server listening on :${PORT}`)
    );
})();

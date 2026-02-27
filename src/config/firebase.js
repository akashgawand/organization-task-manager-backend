const admin = require('firebase-admin');
const serviceAccount = require('../../apexquants-3ba48-firebase-adminsdk-fbsvc-4ea61cef89.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
}

module.exports = admin;

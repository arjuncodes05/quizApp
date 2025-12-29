const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

class Database {
    constructor() {
        // Vercel provides environment variables differently
        const uri = process.env.MONGODB_URI || process.env.ATLAS_URI;
        
        if (!uri) {
            console.error('MongoDB URI is missing!');
            throw new Error('MongoDB URI not configured');
        }
        
        console.log('MongoDB URI found, length:', uri.length);
        
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 10, // Limit connections for serverless
            minPoolSize: 1,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        });
        
        this.dbName = 'quiz-app';
        this.connected = false;
    }

    // ... rest of your Database class methods ...
}

// Create singleton instance
const database = new Database();

// Test connection immediately
database.connect().catch(err => {
    console.error('Failed to connect to MongoDB on startup:', err);
});

module.exports = database;
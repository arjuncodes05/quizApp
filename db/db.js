const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
class Database {
    constructor() {
        const uri = process.env.MONGODB_URI 
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        
        this.dbName = 'quiz-app';
        this.connected = false;
    }

    async connect() {
        if (this.connected) return this.client.db(this.dbName);
        
        try {
            await this.client.connect();
            await this.client.db("admin").command({ ping: 1 });
            console.log("Successfully connected to MongoDB Atlas!");
            this.connected = true;
            return this.client.db(this.dbName);
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    async close() {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
            console.log('MongoDB connection closed');
        }
    }

    async getCollection(collectionName) {
        const db = await this.connect();
        return db.collection(collectionName);
    }

    // Test connection
    async testConnection() {
        try {
            const db = await this.connect();
            const collections = await db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const database = new Database();

module.exports = database;
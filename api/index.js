const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('../db/db.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Predefined topics data
const predefinedTopics = {
    temples: {
        name: 'temples',
        displayName: 'Temples',
        isCustom: false,
        topics: [
            {
                reading: {
                    heading: "Famous Temples of India",
                    points: [
                        "The Tirupati Balaji Temple is one of the richest temples in the world.",
                        "The Kashi Vishwanath Temple in Varanasi is dedicated to Lord Shiva.",
                        "The Jagannath Temple in Puri is famous for its annual Rath Yatra.",
                        "The Meenakshi Temple in Madurai is known for its stunning architecture.",
                        "The Golden Temple in Amritsar is the holiest shrine for Sikhs."
                    ]
                },
                test: [
                    {
                        question: "Which temple is known for its annual Rath Yatra?",
                        options: [
                            "Tirupati Balaji Temple",
                            "Jagannath Temple",
                            "Meenakshi Temple",
                            "Golden Temple"
                        ],
                        correctAnswer: 1
                    },
                    {
                        question: "Which temple is dedicated to Lord Shiva?",
                        options: [
                            "Kashi Vishwanath Temple",
                            "Jagannath Temple",
                            "Golden Temple",
                            "Meenakshi Temple"
                        ],
                        correctAnswer: 0
                    }
                ]
            }
        ]
    },
    classicalDance: {
        name: 'classicalDance',
        displayName: 'Classical Dance',
        isCustom: false,
        topics: [
            {
                reading: {
                    heading: "Classical Dance Forms of India",
                    points: [
                        "Bharatanatyam originated in Tamil Nadu and is one of the oldest dance forms.",
                        "Kathak originated in North India and was developed in Mughal courts.",
                        "Kathakali is from Kerala and is known for its elaborate costumes and makeup.",
                        "Odissi from Odisha is characterized by fluid movements and sculpturesque poses.",
                        "Kuchipudi from Andhra Pradesh combines dance, gesture, speech, and song."
                    ]
                },
                test: [
                    {
                        question: "Which dance form originated in Tamil Nadu?",
                        options: [
                            "Kathak",
                            "Bharatanatyam",
                            "Kathakali",
                            "Odissi"
                        ],
                        correctAnswer: 1
                    }
                ]
            }
        ]
    }
};

// Initialize database with predefined topics
async function initializeDatabase() {
    try {
        const quizzesCollection = await database.getCollection('quizzes');
        
        // Create indexes
        await quizzesCollection.createIndex({ name: 1 }, { unique: true });
        await quizzesCollection.createIndex({ isCustom: 1 });
        
        // Insert predefined topics if they don't exist
        for (const [key, topic] of Object.entries(predefinedTopics)) {
            const existingTopic = await quizzesCollection.findOne({ name: topic.name });
            if (!existingTopic) {
                await quizzesCollection.insertOne({
                    ...topic,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`Created predefined topic: ${topic.name}`);
            }
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Test database connection on startup
async function testDBConnection() {
    try {
        const connected = await database.testConnection();
        if (connected) {
            await initializeDatabase();
        }
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

// API Routes

// Get all topics
app.get('/api/topics', async (req, res) => {
    try {
        const quizzesCollection = await database.getCollection('quizzes');
        const quizzes = await quizzesCollection.find(
            {},
            { projection: { name: 1, displayName: 1, isCustom: 1 } }
        ).sort({ isCustom: 1, displayName: 1 }).toArray();
        
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Failed to fetch topics' });
    }
});

// Get a specific topic
app.get('/api/topic/:topicName', async (req, res) => {
    try {
        const topicName = req.params.topicName;
        
        // Check if it's a predefined topic
        if (predefinedTopics[topicName]) {
            return res.json(predefinedTopics[topicName].topics);
        }
        
        // Look in database
        const quizzesCollection = await database.getCollection('quizzes');
        const quiz = await quizzesCollection.findOne({ name: topicName });
        
        if (!quiz) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        res.json(quiz.topics);
    } catch (error) {
        console.error('Error loading topic:', error);
        res.status(500).json({ error: 'Failed to load topic' });
    }
});

// Save a new quiz
app.post('/save-quiz', async (req, res) => {
    try {
        const { quizName, jsonData } = req.body;

        /* ---------- BASIC VALIDATION ---------- */
        if (!quizName || !jsonData) {
            return res.status(400).json({
                success: false,
                error: 'Quiz name and JSON data are required'
            });
        }

        if (!Array.isArray(jsonData)) {
            return res.status(400).json({
                success: false,
                error: 'JSON must be an array'
            });
        }

        /* ---------- DEEP STRUCTURE VALIDATION ---------- */
        for (let i = 0; i < jsonData.length; i++) {
            const topic = jsonData[i];

            if (!topic.reading || !topic.test) {
                return res.status(400).json({
                    success: false,
                    error: `Topic ${i + 1} must have both 'reading' and 'test'`
                });
            }

            if (
                !topic.reading.heading ||
                !Array.isArray(topic.reading.points)
            ) {
                return res.status(400).json({
                    success: false,
                    error: `Topic ${i + 1} reading must have 'heading' and 'points' array`
                });
            }

            if (!Array.isArray(topic.test)) {
                return res.status(400).json({
                    success: false,
                    error: `Topic ${i + 1} test must be an array`
                });
            }

            for (let j = 0; j < topic.test.length; j++) {
                const question = topic.test[j];

                if (
                    !question.question ||
                    !Array.isArray(question.options) ||
                    typeof question.correctAnswer !== 'number'
                ) {
                    return res.status(400).json({
                        success: false,
                        error: `Topic ${i + 1}, Question ${j + 1} is invalid`
                    });
                }

                if (question.options.length < 2) {
                    return res.status(400).json({
                        success: false,
                        error: `Topic ${i + 1}, Question ${j + 1} must have at least 2 options`
                    });
                }

                if (
                    question.correctAnswer < 0 ||
                    question.correctAnswer >= question.options.length
                ) {
                    return res.status(400).json({
                        success: false,
                        error: `Topic ${i + 1}, Question ${j + 1} has invalid correctAnswer index`
                    });
                }
            }
        }

        /* ---------- CLEAN QUIZ NAME ---------- */
        const cleanName = quizName
            .trim()
            .replace(/[^a-zA-Z0-9\s_-]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                error: 'Invalid quiz name after cleaning'
            });
        }

        /* ---------- DATABASE ---------- */
        const quizzesCollection = await database.getCollection('quizzes');

        // Check duplicate
        const existingQuiz = await quizzesCollection.findOne({ name: cleanName });
        if (existingQuiz) {
            return res.status(400).json({
                success: false,
                error: 'A quiz with this name already exists'
            });
        }

        /* ---------- INSERT ---------- */
        await quizzesCollection.insertOne({
            name: cleanName,
            displayName: quizName,
            isCustom: true,
            topics: jsonData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        /* ---------- SUCCESS ---------- */
        return res.status(200).json({
            success: true,
            message: 'Quiz saved successfully',
            quiz: {
                name: cleanName,
                displayName: quizName,
                isCustom: true
            }
        });

    } catch (error) {
        console.error('Error saving quiz:', error);

        // Mongo duplicate key safety
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'A quiz with this name already exists'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to save quiz'
        });
    }
});


// Delete a quiz
app.delete('/api/delete-quiz', async (req, res) => {
    try {
        const { quizName } = req.body;

        if (!quizName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Quiz name is required' 
            });
        }

        // Don't allow deletion of predefined topics
        if (predefinedTopics[quizName]) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete predefined topics' 
            });
        }

        const quizzesCollection = await database.getCollection('quizzes');
        const result = await quizzesCollection.deleteOne({ name: quizName });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Quiz not found' 
            });
        }

        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete quiz' 
        });
    }
});

// Update a quiz (optional)
app.put('/api/update-quiz', async (req, res) => {
    try {
        const { quizName, jsonData } = req.body;

        if (!quizName || !jsonData) {
            return res.status(400).json({ 
                success: false, 
                error: 'Quiz name and JSON data are required' 
            });
        }

        // Don't allow updating predefined topics
        if (predefinedTopics[quizName]) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot update predefined topics' 
            });
        }

        const quizzesCollection = await database.getCollection('quizzes');
        const result = await quizzesCollection.updateOne(
            { name: quizName },
            { 
                $set: { 
                    topics: jsonData,
                    updatedAt: new Date()
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Quiz not found' 
            });
        }

        res.json({
            success: true,
            message: 'Quiz updated successfully'
        });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update quiz' 
        });
    }
});

// Get quiz details (for debugging)
app.get('/api/quiz/:quizName/details', async (req, res) => {
    try {
        const quizzesCollection = await database.getCollection('quizzes');
        const quiz = await quizzesCollection.findOne({ name: req.params.quizName });
        
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        res.json(quiz);
    } catch (error) {
        console.error('Error fetching quiz details:', error);
        res.status(500).json({ error: 'Failed to fetch quiz details' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const quizzesCollection = await database.getCollection('quizzes');
        const count = await quizzesCollection.countDocuments();
        
        res.json({
            status: 'healthy',
            database: 'connected',
            totalQuizzes: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// Start server
// async function startServer() {
//     try {
//         // Test database connection
//         await testDBConnection();
        
//         app.listen(PORT, () => {
//             console.log(`Server running at http://localhost:${PORT}`);
//             console.log(`Database: MongoDB Atlas`);
//             console.log(`API Base URL: http://localhost:${PORT}/api`);
//         });
//     } catch (error) {
//         console.error('Failed to start server:', error);
//         process.exit(1);
//     }
// }

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

// startServer();

// Export for Vercel
module.exports = app;
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Paths
const TOPICS_DIR = path.join(__dirname, 'topics');

// Ensure topics directory exists
async function ensureTopicsDir() {
    try {
        await fs.mkdir(TOPICS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating topics directory:', error);
    }
}


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Get list of all topics
app.get('/api/topics', async (req, res) => {
    try {
        await ensureTopicsDir();

        const files = await fs.readdir(TOPICS_DIR);
        const topics = [];

        // Add predefined topics
        const predefinedTopics = [
            { name: 'temples', displayName: 'Temples', isCustom: false },
            { name: 'classicalDance', displayName: 'Classical Dance', isCustom: false },
        ];

        topics.push(...predefinedTopics);

        // Add custom topics from files
        for (const file of files) {
            if (file.endsWith('.json')) {
                const topicName = path.basename(file, '.json');
                // Skip predefined topics
                if (!predefinedTopics.some(t => t.name === topicName)) {
                    topics.push({
                        name: topicName,
                        displayName: topicName.replace(/_/g, ' '),
                        isCustom: true
                    });
                }
            }
        }

        res.json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Failed to fetch topics' });
    }
});

// Get a specific topic
app.get('/api/topic/:topicName', async (req, res) => {
    try {
        const topicName = req.params.topicName;
        const filePath = path.join(TOPICS_DIR, `${topicName}.json`);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            // If file doesn't exist, check for predefined demo data
            const demoData = getDemoData(topicName);
            if (demoData) {
                return res.json(demoData);
            }
            return res.status(404).json({ error: 'Topic not found' });
        }

        // Read and parse the file
        const fileContent = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        res.json(jsonData);
    } catch (error) {
        console.error('Error loading topic:', error);
        res.status(500).json({ error: 'Failed to load topic' });
    }
});

// Save a new quiz
app.post('/api/save-quiz', async (req, res) => {
    try {
        const { quizName, jsonData } = req.body;

        if (!quizName || !jsonData) {
            return res.status(400).json({ error: 'Quiz name and JSON data are required' });
        }

        await ensureTopicsDir();

        // Clean the filename
        const cleanName = quizName
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();

        const filePath = path.join(TOPICS_DIR, `${cleanName}.json`);

        // Check if file already exists
        try {
            await fs.access(filePath);
            return res.status(400).json({ error: 'A quiz with this name already exists' });
        } catch {
            // File doesn't exist, continue
        }

        // Write the file
        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'Quiz saved successfully',
            filename: `${cleanName}.json`
        });
    } catch (error) {
        console.error('Error saving quiz:', error);
        res.status(500).json({ error: 'Failed to save quiz' });
    }
});

// Delete a quiz
app.delete('/api/delete-quiz', async (req, res) => {
    try {
        const { quizName } = req.body;

        if (!quizName) {
            return res.status(400).json({ error: 'Quiz name is required' });
        }

        const filePath = path.join(TOPICS_DIR, `${quizName}.json`);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Delete the file
        await fs.unlink(filePath);

        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// Demo data fallback
function getDemoData(topicName) {
    const demoData = {
        temples: [
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
        ],
        classicalDance: [
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
    };

    return demoData[topicName] || null;
}

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
//     console.log(`Topics directory: ${TOPICS_DIR}`);
// });


module.exports = app;

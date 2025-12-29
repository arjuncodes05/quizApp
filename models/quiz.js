const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length >= 2;
            },
            message: 'At least 2 options are required'
        }
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0
    }
});

const readingSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true
    },
    points: {
        type: [String],
        required: true
    }
});

const topicSchema = new mongoose.Schema({
    reading: readingSchema,
    test: [questionSchema]
});

const quizSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true
    },
    isCustom: {
        type: Boolean,
        default: true
    },
    topics: [topicSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
quizSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Quiz', quizSchema);
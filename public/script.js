// Backend API URL (will be set when server runs)
const API_BASE_URL = window.location.origin; // Same origin as frontend

// App state
let currentTopicIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let studyData = [];
let totalQuestions = 0;
let attemptedQuestions = 0;
let skippedQuestions = 0;
let correctAnswers = 0;
let currentTopic = '';
let allTopics = [];

// Timer variables
let questionTimerInterval = null;
let quizTimerInterval = null;
let timeRemaining = 30;
let quizStartTime = null;
let totalElapsedTime = 0;
let lastResumeTime = null;
let isQuizTimerPaused = false;

// DOM elements
const homeScreen = document.getElementById('home-screen');
const readingScreen = document.getElementById('reading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const readingTitle = document.getElementById('reading-title');
const readingPoints = document.getElementById('reading-points');
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options');
const feedbackElement = document.getElementById('feedback');
const warningElement = document.getElementById('warning');
const nextQuestionButton = document.getElementById('next-question');
const skipQuestionButton = document.getElementById('skip-question');
const endQuizButton = document.getElementById('end-quiz');
const startQuizButton = document.getElementById('start-quiz');
const progressBar = document.getElementById('progress-bar');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart');
const backToHomeButton = document.getElementById('back-to-home');
const readingBackButton = document.getElementById('reading-back');
const quizBackButton = document.getElementById('quiz-back');
const timerElement = document.getElementById('timer');

// Counter elements
const readingCounter = document.getElementById('reading-counter');
const topicCounter = document.getElementById('topic-counter');
const questionCounter = document.getElementById('question-counter');

// Result elements
const totalQuestionsElement = document.getElementById('total-questions');
const attemptedQuestionsElement = document.getElementById('attempted-questions');
const skippedQuestionsElement = document.getElementById('skipped-questions');
const correctAnswersElement = document.getElementById('correct-answers');
const percentageScoreElement = document.getElementById('percentage-score');
const timeTakenElement = document.getElementById('time-taken');

// Topic elements
const topicsGrid = document.getElementById('topics-grid');

// Audio elements
const clickSound = document.getElementById('click-sound');
const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');
const completeSound = document.getElementById('complete-sound');
const timerSound = document.getElementById('timer-sound');

// Custom Quiz Modal elements
const addCustomBtn = document.getElementById('add-custom-btn');
const customQuizModal = document.getElementById('custom-quiz-modal');
const cancelCustomBtn = document.getElementById('cancel-custom');
const saveCustomBtn = document.getElementById('save-custom');
const quizNameInput = document.getElementById('quiz-name');
const jsonDataInput = document.getElementById('json-data');
const successMessage = document.getElementById('success-message');
const nameError = document.getElementById('name-error');
const jsonError = document.getElementById('json-error');

// ============ BACKEND API FUNCTIONS ============

// Fetch all topics from backend
async function fetchAllTopics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/topics`);
        if (!response.ok) throw new Error('Failed to fetch topics');
        return await response.json();
    } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
}

// Save a new quiz to backend
async function saveQuizToBackend(quizName, jsonData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/save-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quizName: quizName,
                jsonData: jsonData
            })
        });

        if (!response.ok) throw new Error('Failed to save quiz');
        return await response.json();
    } catch (error) {
        console.error('Error saving quiz:', error);
        throw error;
    }
}

// Delete a quiz from backend
async function deleteQuizFromBackend(quizName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/delete-quiz`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quizName: quizName })
        });

        if (!response.ok) throw new Error('Failed to delete quiz');
        return await response.json();
    } catch (error) {
        console.error('Error deleting quiz:', error);
        throw error;
    }
}

// Load a specific topic from backend
async function loadTopicFromBackend(topicName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/topic/${topicName}`);
        if (!response.ok) throw new Error('Failed to load topic');
        return await response.json();
    } catch (error) {
        console.error('Error loading topic:', error);
        throw error;
    }
}

// ============ TOPIC MANAGEMENT ============

// Load and display all topics
async function loadAndDisplayTopics() {
    try {
        allTopics = await fetchAllTopics();
        displayTopics(allTopics);
    } catch (error) {
        console.error('Error loading topics:', error);
        // Fallback to hardcoded topics if backend fails
        displayTopics(getHardcodedTopics());
    }
}

// Display topics in grid
function displayTopics(topics) {
    topicsGrid.innerHTML = '';

    topics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = `topic-item ${topic.isCustom ? 'custom-topic' : ''}`;
        topicItem.setAttribute('data-topic', topic.name);
        topicItem.textContent = topic.displayName || topic.name;

        // Add delete button for custom topics
        if (topic.isCustom) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-quiz-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete this quiz';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTopic(topic.name);
            });
            topicItem.appendChild(deleteBtn);
        }

        // Add click event
        topicItem.addEventListener('click', () => {
            selectTopic(topic.name);
        });

        topicsGrid.appendChild(topicItem);
    });
}

// Hardcoded topics fallback
function getHardcodedTopics() {
    return [
        { name: 'temples', displayName: 'Temples', isCustom: false },
        { name: 'classicalDance', displayName: 'Classical Dance', isCustom: false },
    ];
}

// Select a topic
async function selectTopic(topicName) {
    try {
        // Update URL
        window.history.replaceState({}, '', `?topic=${topicName}`);

        // Load topic data
        studyData = await loadTopicFromBackend(topicName);
        calculateTotalQuestions();
        currentTopic = topicName;

        showReadingScreen();
    } catch (error) {
        console.error('Error loading topic:', error);
        // Fallback to demo data
        studyData = getDemoDataForTopic(topicName);
        calculateTotalQuestions();
        currentTopic = topicName;
        showReadingScreen();
    }
}

// Delete a topic
async function deleteTopic(topicName) {
    if (!confirm(`Are you sure you want to delete "${topicName}"?`)) return;

    try {
        await deleteQuizFromBackend(topicName);
        playSound(clickSound);
        await loadAndDisplayTopics(); // Refresh topic list
    } catch (error) {
        alert(`Error deleting quiz: ${error.message}`);
        playSound(incorrectSound);
    }
}

// ============ CUSTOM QUIZ FUNCTIONS ============

// Validate JSON
function isValidJSON(jsonString) {
    try {
        const json = JSON.parse(jsonString);

        // Validate the structure
        if (!Array.isArray(json)) {
            return { valid: false, error: "JSON must be an array" };
        }

        // Check each topic
        for (let i = 0; i < json.length; i++) {
            const topic = json[i];

            if (!topic.reading || !topic.test) {
                return { valid: false, error: `Topic ${i + 1} must have both 'reading' and 'test' properties` };
            }

            if (!topic.reading.heading || !Array.isArray(topic.reading.points)) {
                return { valid: false, error: `Topic ${i + 1} reading must have 'heading' and 'points' array` };
            }

            if (!Array.isArray(topic.test)) {
                return { valid: false, error: `Topic ${i + 1} test must be an array` };
            }

            // Check each question
            for (let j = 0; j < topic.test.length; j++) {
                const question = topic.test[j];

                if (!question.question || !Array.isArray(question.options) || typeof question.correctAnswer !== 'number') {
                    return { valid: false, error: `Topic ${i + 1}, Question ${j + 1} must have 'question', 'options' array, and 'correctAnswer' number` };
                }

                if (question.options.length < 2) {
                    return { valid: false, error: `Topic ${i + 1}, Question ${j + 1} must have at least 2 options` };
                }

                if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
                    return { valid: false, error: `Topic ${i + 1}, Question ${j + 1} has invalid correctAnswer index` };
                }
            }
        }

        return { valid: true, data: json };
    } catch (error) {
        return { valid: false, error: "Invalid JSON format: " + error.message };
    }
}

// Save custom quiz
async function saveCustomQuiz() {
    const name = quizNameInput.value.trim();
    const jsonString = jsonDataInput.value.trim();

    // Reset messages
    nameError.textContent = '';
    nameError.classList.remove('show');
    jsonError.textContent = '';
    jsonError.classList.remove('show');
    successMessage.textContent = '';
    successMessage.classList.remove('show');

    // Validate name
    if (!name) {
        nameError.textContent = 'Please enter a quiz name';
        nameError.classList.add('show');
        playSound(incorrectSound);
        return;
    }

    // Validate JSON
    if (!jsonString) {
        jsonError.textContent = 'Please paste JSON data';
        jsonError.classList.add('show');
        playSound(incorrectSound);
        return;
    }

    const validation = isValidJSON(jsonString);
    if (!validation.valid) {
        jsonError.textContent = validation.error;
        jsonError.classList.add('show');
        playSound(incorrectSound);
        return;
    }

    try {
        // Save to backend
        const result = await saveQuizToBackend(name, validation.data);

        if (result.success) {
            // Show success message
            successMessage.textContent = 'Quiz saved successfully!';
            successMessage.classList.add('show');
            playSound(correctSound);

            // Refresh topic list
            await loadAndDisplayTopics();

            // Clear form and close modal after delay
            setTimeout(() => {
                quizNameInput.value = '';
                jsonDataInput.value = '';
                nameError.textContent = '';
                jsonError.textContent = '';
                successMessage.classList.remove('show');
                customQuizModal.classList.remove('active');
            }, 2000);
        } else {
            jsonError.textContent = result.error || 'Error saving quiz';
            jsonError.classList.add('show');
            playSound(incorrectSound);
        }
    } catch (error) {
        jsonError.textContent = 'Error saving quiz: ' + error.message;
        jsonError.classList.add('show');
        playSound(incorrectSound);
    }
}

// ============ MAIN APP FUNCTIONS ============

// Initialize the app
async function initApp() {
    try {
        // Load topics
        await loadAndDisplayTopics();

        // Check URL for topic parameter
        const urlParams = new URLSearchParams(window.location.search);
        const topicFromUrl = urlParams.get('topic');

        if (topicFromUrl) {
            await selectTopic(topicFromUrl);
        }

        setupEventListeners();

    } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback to home screen
        showHomeScreen();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Custom quiz modal
    addCustomBtn.addEventListener('click', () => {
        customQuizModal.classList.add('active');
        playSound(clickSound);
    });

    cancelCustomBtn.addEventListener('click', () => {
        customQuizModal.classList.remove('active');
        resetModal();
        playSound(clickSound);
    });

    saveCustomBtn.addEventListener('click', saveCustomQuiz);

    // Close modal on outside click
    customQuizModal.addEventListener('click', (e) => {
        if (e.target === customQuizModal) {
            customQuizModal.classList.remove('active');
            resetModal();
        }
    });

    // Original quiz event listeners
    startQuizButton.addEventListener('click', startQuiz);
    nextQuestionButton.addEventListener('click', goToNextQuestion);
    skipQuestionButton.addEventListener('click', skipQuestion);
    endQuizButton.addEventListener('click', endQuiz);
    restartButton.addEventListener('click', restartQuiz);
    backToHomeButton.addEventListener('click', goToHome);
    readingBackButton.addEventListener('click', goToHome);
    quizBackButton.addEventListener('click', goToReadingScreen);

    // Audio feedback
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            playSound(clickSound);
        });
    });
}

// Reset modal
function resetModal() {
    quizNameInput.value = '';
    jsonDataInput.value = '';
    nameError.textContent = '';
    nameError.classList.remove('show');
    jsonError.textContent = '';
    jsonError.classList.remove('show');
    successMessage.textContent = '';
    successMessage.classList.remove('show');
}

// ============ ORIGINAL QUIZ FUNCTIONS (KEEP AS IS) ============

// Get demo data (fallback)
function getDemoDataForTopic(topic) {
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

    return demoData[topic] || demoData.temples;
}

// Calculate total questions
function calculateTotalQuestions() {
    totalQuestions = studyData.reduce((total, topic) => total + topic.test.length, 0);
}

// Play sound function
function playSound(audioElement) {
    console.log("Playing sound:", audioElement.id);

    // Reset and play the sound
    audioElement.currentTime = 0;
    audioElement.play().catch(error => {
        console.log("Audio play failed:", error);
        // Handle autoplay restrictions
    });
}

// Show home screen
function showHomeScreen() {
    window.history.replaceState({}, '', window.location.pathname);
    homeScreen.classList.add('active');
    readingScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
}

// Show reading screen
function showReadingScreen() {
    const topic = studyData[currentTopicIndex];
    readingTitle.textContent = topic.reading.heading;

    readingCounter.textContent = `${formatNumber(currentTopicIndex + 1)}/${formatNumber(studyData.length)}`;

    readingPoints.innerHTML = '';
    topic.reading.points.forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        readingPoints.appendChild(li);
    });

    homeScreen.classList.remove('active');
    readingScreen.classList.add('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
}

// Go back to reading screen
function goToReadingScreen() {
    stopQuestionTimer();
    pauseQuizTimer();
    readingScreen.classList.add('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
}

// Format numbers
function formatNumber(num) {
    return num.toString().padStart(2, '0');
}

// Format time
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${formatNumber(hrs)}:${formatNumber(mins)}:${formatNumber(secs)}`;
}

// Start quiz
function startQuiz() {
    readingScreen.classList.remove('active');
    quizScreen.classList.add('active');
    resultsScreen.classList.remove('active');
    resumeQuizTimer();

    if (!quizTimerInterval) {
        startQuizTimer();
    }

    currentQuestionIndex = 0;
    showQuestion();
}

// Show question
function showQuestion() {
    const topic = studyData[currentTopicIndex];
    const question = topic.test[currentQuestionIndex];

    questionCounter.textContent = `Q: ${formatNumber(currentQuestionIndex + 1)}/${formatNumber(topic.test.length)}`;

    const progress = ((currentQuestionIndex + 1) / topic.test.length) * 100;
    progressBar.style.width = `${progress}%`;

    questionElement.textContent = question.question;

    optionsContainer.innerHTML = '';
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    nextQuestionButton.disabled = true;
    selectedOption = null;
    warningElement.style.display = 'none';

    question.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = option;
        div.dataset.index = index;
        div.addEventListener('click', selectOption);
        optionsContainer.appendChild(div);
    });

    startQuestionTimer();
}

// Select option
function selectOption(e) {
    if (selectedOption !== null) return;

    stopQuestionTimer();
    selectedOption = parseInt(e.target.dataset.index);
    const topic = studyData[currentTopicIndex];
    const question = topic.test[currentQuestionIndex];

    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    e.target.classList.add('selected');

    attemptedQuestions++;

    if (selectedOption === question.correctAnswer) {
        e.target.classList.add('correct');
        feedbackElement.textContent = 'Correct! Well done.';
        feedbackElement.classList.add('correct-feedback');
        playSound(correctSound);
        score++;
        correctAnswers++;
    } else {
        e.target.classList.add('incorrect');
        options[question.correctAnswer].classList.add('correct');
        feedbackElement.textContent = 'Incorrect. The right answer is highlighted.';
        feedbackElement.classList.add('incorrect-feedback');
        playSound(incorrectSound);
    }

    nextQuestionButton.disabled = false;
    warningElement.style.display = 'none';
}

// Skip question
function skipQuestion() {
    stopQuestionTimer();
    skippedQuestions++;
    goToNextQuestion();
}

// End quiz
function endQuiz() {
    stopQuestionTimer();
    stopQuizTimer();
    showResultsScreen();
}

// Go to next question
function goToNextQuestion() {
    const topic = studyData[currentTopicIndex];

    if (currentQuestionIndex < topic.test.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        if (currentTopicIndex < studyData.length - 1) {
            pauseQuizTimer();
            currentTopicIndex++;
            showReadingScreen();
        } else {
            showResultsScreen();
        }
    }
}

// Show results
function showResultsScreen() {
    stopQuestionTimer();
    stopQuizTimer();

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    finalScoreElement.textContent = `${correctAnswers}/${totalQuestions}`;

    totalQuestionsElement.textContent = totalQuestions;
    attemptedQuestionsElement.textContent = attemptedQuestions;
    skippedQuestionsElement.textContent = skippedQuestions;
    correctAnswersElement.textContent = correctAnswers;
    timeTakenElement.textContent = formatTime(totalElapsedTime);
    percentageScoreElement.textContent = `${percentage}%`;

    homeScreen.classList.remove('active');
    readingScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.add('active');

    playSound(completeSound);
}

// Restart quiz
function restartQuiz() {
    currentTopicIndex = 0;
    currentQuestionIndex = 0;
    score = 0;
    selectedOption = null;
    attemptedQuestions = 0;
    skippedQuestions = 0;
    correctAnswers = 0;
    totalElapsedTime = 0;
    timeRemaining = 30;

    stopQuestionTimer();
    stopQuizTimer();

    showReadingScreen();
}

// Timer functions
function startQuizTimer() {
    quizStartTime = new Date();
    lastResumeTime = new Date();
    isQuizTimerPaused = false;

    quizTimerInterval = setInterval(() => {
        if (!isQuizTimerPaused && lastResumeTime) {
            const now = new Date();
            const timeSinceResume = Math.floor((now - lastResumeTime) / 1000);
            totalElapsedTime = timeSinceResume + (totalElapsedTime || 0);
            lastResumeTime = now;
        }
    }, 1000);
}

function pauseQuizTimer() {
    if (!isQuizTimerPaused) {
        isQuizTimerPaused = true;
        if (lastResumeTime) {
            const now = new Date();
            const timeSinceResume = Math.floor((now - lastResumeTime) / 1000);
            totalElapsedTime += timeSinceResume;
        }
    }
}

function resumeQuizTimer() {
    if (isQuizTimerPaused) {
        isQuizTimerPaused = false;
        lastResumeTime = new Date();
    }
}

function stopQuizTimer() {
    if (quizTimerInterval) {
        if (lastResumeTime && !isQuizTimerPaused) {
            const now = new Date();
            const timeSinceResume = Math.floor((now - lastResumeTime) / 1000);
            totalElapsedTime += timeSinceResume;
        }

        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
        lastResumeTime = null;
    }
}

function startQuestionTimer() {
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
    }

    timeRemaining = 30;
    timerElement.textContent = `${timeRemaining}s`;
    timerElement.classList.remove('warning');

    questionTimerInterval = setInterval(() => {
        timeRemaining--;
        timerElement.textContent = `${timeRemaining}s`;

        if (timeRemaining <= 10) {
            timerElement.classList.add('warning');
            playSound(timerSound);
        }

        if (timeRemaining <= 0) {
            clearInterval(questionTimerInterval);
            skipQuestion();
        }
    }, 1000);
}

function stopQuestionTimer() {
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        questionTimerInterval = null;
    }
}

// Go to home
function goToHome() {
    stopQuestionTimer();
    stopQuizTimer();
    showHomeScreen();
}

// Initialize app
window.addEventListener('load', initApp);




document.addEventListener('DOMContentLoaded', function () {
    const showBtn = document.getElementById('showImageBtn');
    const hideBtn = document.getElementById('hideImageBtn');
    const imageContainer = document.getElementById('imageContainer');
    const displayedImage = document.getElementById('displayedImage');

    const originalText = "Arjun has a greeting for you! Click here to view it.";
    const temporaryText = "Delivered to you heart, hope you can feel it 😊";

    // Function to temporarily change text for 10 seconds
    function changeTextTemporarily() {
        showBtn.textContent = temporaryText;

        // Revert back after 10 seconds
        setTimeout(() => {
            showBtn.textContent = originalText;
        }, 10000); // 10 seconds = 10000 milliseconds
    }

    // Show image with fade-in
    showBtn.addEventListener('click', function () {
        imageContainer.style.display = 'block';
        imageContainer.style.animation = 'fadeIn 0.5s ease';
        showBtn.style.display = 'none';
        hideBtn.style.display = 'block';

        // Change text when image is shown
        changeTextTemporarily();
    });

    // Hide image with fade-out
    hideBtn.addEventListener('click', function () {
        // Add fade-out animation
        imageContainer.style.animation = 'fadeOut 0.5s ease forwards';

        // Wait for animation to complete before hiding
        setTimeout(function () {
            imageContainer.style.display = 'none';
            hideBtn.style.display = 'none';
            showBtn.style.display = 'block';
        }, 500); // Match this duration with animation duration
    });

});



// In your existing script.js, update these functions:

// Fetch all topics from backend
async function fetchAllTopics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/topics`);
        if (!response.ok) throw new Error('Failed to fetch topics');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
}

// Load a specific topic from backend
async function loadTopicFromBackend(topicName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/topic/${topicName}`);
        if (!response.ok) throw new Error('Failed to load topic');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading topic:', error);
        throw error;
    }
}

// Delete a topic - Update to match new API response
async function deleteTopic(topicName) {
    if (!confirm(`Are you sure you want to delete "${topicName}"?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/delete-quiz`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quizName: topicName })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete quiz');
        }

        if (result.success) {
            playSound(clickSound);
            await loadAndDisplayTopics(); // Refresh topic list
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        alert(`Error deleting quiz: ${error.message}`);
        playSound(incorrectSound);
    }
}

// Save custom quiz - Update to match new API response
async function saveCustomQuiz() {
    const name = quizNameInput.value.trim();
    const jsonString = jsonDataInput.value.trim();

    // Reset messages
    nameError.textContent = '';
    nameError.classList.remove('show');
    jsonError.textContent = '';
    jsonError.classList.remove('show');
    successMessage.textContent = '';
    successMessage.classList.remove('show');

    // Validate name
    if (!name) {
        nameError.textContent = 'Please enter a quiz name';
        nameError.classList.add('show');
        playSound(incorrectSound);
        return;
    }

    // Validate JSON
    if (!jsonString) {
        jsonError.textContent = 'Please paste JSON data';
        jsonError.classList.add('show');
        playSound(incorrectSound);
        return;
    }

    const validation = isValidJSON(jsonString);
    if (!validation.valid) {
        jsonError.textContent = validation.error;
        jsonError.classList.add('show');
        playSound(incorrectSound);
        return;
    }

    try {
        // Save to backend
        const response = await fetch(`${API_BASE_URL}/api/save-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quizName: name,
                jsonData: validation.data
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save quiz');
        }

        if (result.success) {
            // Show success message
            successMessage.textContent = 'Quiz saved successfully!';
            successMessage.classList.add('show');
            playSound(correctSound);

            // Refresh topic list
            await loadAndDisplayTopics();

            // Clear form and close modal after delay
            setTimeout(() => {
                quizNameInput.value = '';
                jsonDataInput.value = '';
                nameError.textContent = '';
                jsonError.textContent = '';
                successMessage.classList.remove('show');
                customQuizModal.classList.remove('active');
            }, 2000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        jsonError.textContent = 'Error saving quiz: ' + error.message;
        jsonError.classList.add('show');
        playSound(incorrectSound);
    }
}




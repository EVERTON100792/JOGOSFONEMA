// =======================================================
// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
// =======================================================
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentClassId = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = 'AEIOU'.split('');

let gameState = {};
let speechReady = false;
let selectedVoice = null;


// =======================================================
// PARTE 2: CONTEÚDO DO JOGO (COM NOVA FASE 3)
// =======================================================

const gameInstructions = {
    1: "Ouça o som com atenção e clique na letra correta. Vamos lá!",
    2: "Que legal! Agora, olhe a figura e escolha a VOGAL que começa a palavra.",
    3: "Você está indo muito bem! Agora o desafio é com ENCONTROS DE VOGAIS. Complete a palavra!"
};

const PHASE_2_WORDS = [
    { word: 'ABELHA', image: '🐝', vowel: 'A' },
    { word: 'ELEFANTE', image: '🐘', vowel: 'E' },
    { word: 'IGREJA', image: '⛪', vowel: 'I' },
    { word: 'ÔNIBUS', image: '🚌', vowel: 'O' },
    { word: 'UVA', image: '🍇', vowel: 'U' }
];

const PHASE_3_WORDS = [
    { word: 'PAI', image: '👨‍👦', meeting: 'AI' },
    { word: 'MÃE', image: '👩‍👧', meeting: 'ÃE' },
    { word: 'BOI', image: '🐂', meeting: 'OI' },
    { word: 'RIO', image: '🏞️', meeting: 'IO' },
    { word: 'LUA', image: '🌙', meeting: 'UA' },
    { word: 'PÃO', image: '🍞', meeting: 'ÃO' },
    { word: 'CÉU', image: '☁️', meeting: 'ÉU' },
    { word: 'LEITE', image: '🥛', meeting: 'EI' },
    { word: 'CAIXA', image: '📦', meeting: 'AI' },
    { word: 'ROUPA', image: '👕', meeting: 'OU' }
];

// =======================================================
// PARTE 3: CRIPTOGRAFIA E FUNÇÕES UTILITÁRIAS
// =======================================================
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, storedHash) {
    const newHash = await hashPassword(password);
    return newHash === storedHash;
}

function generateRandomPassword() {
    const words = ['sol', 'lua', 'rio', 'mar', 'flor', 'gato', 'cao', 'pato', 'rei', 'luz'];
    const word = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${word}${number}`;
}

// =======================================================
// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
// =======================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    if (!window.supabase) {
        alert("ERRO CRÍTICO: O sistema de banco de dados (Supabase) não carregou.");
        return;
    }
    
    initializeSpeech();
    setupAllEventListeners();

    const studentSession = sessionStorage.getItem('currentUser');
    if (studentSession) {
        currentUser = JSON.parse(studentSession);
        await startGame();
    } else {
        await checkSession();
    }
}

function setupAllEventListeners() {
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        if (type === 'teacher') showTeacherLogin();
        else if (type === 'student') showStudentLogin();
    }));

    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    
    document.getElementById('generatePasswordBtn')?.addEventListener('click', () => {
        const passwordField = document.getElementById('createStudentPassword');
        passwordField.type = 'text';
        passwordField.value = generateRandomPassword();
    });

    document.getElementById('startButton')?.addEventListener('click', () => {
        showScreen('gameScreen');
        startQuestion();
    });
    document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio);
    document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('continueButton')?.addEventListener('click', nextPhase);
    document.getElementById('retryButton')?.addEventListener('click', retryPhase);
    document.getElementById('restartButton')?.addEventListener('click', restartGame);
    document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame);
}

// =======================================================
// PARTE 5: AUTENTICAÇÃO E SESSÃO (Original)
// =======================================================
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        if (currentUser.user_metadata.role === 'teacher') {
            await showTeacherDashboard();
        } else {
            await logout();
        }
    } else {
        showUserTypeScreen();
    }
}

async function handleTeacherLogin(e) { e.preventDefault(); /* Código original */ }
async function handleTeacherRegister(e) { e.preventDefault(); /* Código original */ }
async function handleStudentLogin(e) { e.preventDefault(); /* Código original */ }
async function logout() { /* Código original */ }
function handleExitGame() { /* Código original */ }


// =======================================================
// PARTE 6: DASHBOARD DO PROFESSOR (Original)
// =======================================================
async function showTeacherDashboard() { /* Código original */ }
async function loadTeacherData() { /* Código original */ }
async function loadTeacherClasses() { /* Código original */ }
function renderClasses(classes) { /* Código original */ }
async function handleCreateClass(e) { e.preventDefault(); /* Código original */ }
async function handleDeleteClass(classId, className) { /* Código original */ }
async function manageClass(classId, className) { /* Código original */ }
async function loadClassStudents() { /* Código original */ }
function renderStudents(students) { /* Código original */ }
async function loadStudentProgress() { /* Código original */ }
async function assignPhase(studentId, selectElement) { /* Código original */ }
async function handleCreateStudent(event) { /* Código original */ }
async function handleDeleteStudent(studentId, studentName) { /* Código original */ }
async function handleResetStudentPassword(studentId, studentName) { /* Código original */ }

// =======================================================
// PARTE 7: LÓGICA DO JOGO (Atualizada)
// =======================================================
async function startGame() {
    await loadGameState();
    showScreen('startScreen');
}

async function loadGameState() {
    const { data: progressData } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single();
    
    if (progressData && progressData.game_state && progressData.game_state.questions) {
        gameState = progressData.game_state;
    } else {
        gameState = {
            currentPhase: 1,
            score: 0,
            attempts: 2,
            questions: generateQuestions(1),
            currentQuestionIndex: 0
        };
        await saveGameState();
    }
}

async function saveGameState() {
    if (!currentUser || currentUser.type !== 'student') return;
    const { error } = await supabaseClient.from('progress').upsert({
        student_id: currentUser.id,
        current_phase: gameState.currentPhase,
        game_state: gameState,
        last_played: new Date().toISOString()
    }, { onConflict: 'student_id' });
    if (error) console.error("Erro ao salvar progresso:", error);
}

function generateQuestions(phase) {
    let questions = [];
    const questionCount = 10;

    switch (phase) {
        case 1:
            const letters = [...ALPHABET].sort(() => 0.5 - Math.random());
            for (let i = 0; i < questionCount; i++) {
                const correctLetter = letters[i % letters.length];
                questions.push({ type: 'letter_sound', correctAnswer: correctLetter, options: generateOptions(correctLetter, ALPHABET, 4) });
            }
            break;
        case 2:
            const words_p2 = [...PHASE_2_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < questionCount; i++) {
                const item = words_p2[i % words_p2.length];
                questions.push({ type: 'initial_vowel', word: item.word, image: item.image, correctAnswer: item.vowel, options: generateOptions(item.vowel, VOWELS, 4) });
            }
            break;
        case 3:
            const words_p3 = [...PHASE_3_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < questionCount; i++) {
                const item = words_p3[i % words_p3.length];
                const allMeetings = [...new Set(PHASE_3_WORDS.map(w => w.meeting))];
                questions.push({ type: 'vowel_meeting', word: item.word, image: item.image, correctAnswer: item.meeting, options: generateOptions(item.meeting, allMeetings, 4) });
            }
            break;
    }
    return questions;
}

function generateOptions(correctItem, sourceArray, count) {
    const options = new Set([correctItem]);
    const availableItems = sourceArray.filter(l => l !== correctItem);
    while (options.size < count && availableItems.length > 0) {
        options.add(availableItems.splice(Math.floor(Math.random() * availableItems.length), 1)[0]);
    }
    return Array.from(options).sort(() => 0.5 - Math.random());
}

function startQuestion() {
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        return endPhase();
    }
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    updateUI();

    switch(currentQuestion.type) {
        case 'letter_sound': renderPhase1UI(currentQuestion); break;
        case 'initial_vowel': renderPhase2UI(currentQuestion); break;
        case 'vowel_meeting': renderPhase3UI(currentQuestion); break;
    }
    
    renderOptions(currentQuestion.options);
    if(currentQuestion.type === 'letter_sound') {
      setTimeout(playCurrentAudio, 500);
    }
}

function renderPhase1UI(question) {
    document.getElementById('audioQuestionArea').style.display = 'block';
    document.getElementById('imageQuestionArea').style.display = 'none';
    document.getElementById('questionText').textContent = 'Qual letra faz este som?';
    document.getElementById('repeatAudio').style.display = 'inline-block';
}

function renderPhase2UI(question) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = question.image;
    document.getElementById('wordDisplay').textContent = `__${question.word.substring(1)}`;
    document.getElementById('questionText').textContent = 'Qual vogal completa a palavra?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderPhase3UI(question) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = question.image;
    const wordWithBlank = question.word.replace(question.correctAnswer, '__');
    document.getElementById('wordDisplay').textContent = wordWithBlank;
    document.getElementById('questionText').textContent = 'Qual encontro de vogais completa esta palavra?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderOptions(options) {
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = options.map(option => `<button class="letter-button">${option}</button>`).join('');
    lettersGrid.querySelectorAll('.letter-button').forEach(btn => btn.addEventListener('click', (e) => selectAnswer(e.target.textContent)));
}

async function selectAnswer(selectedAnswer) {
    document.querySelectorAll('.letter-button').forEach(btn => btn.disabled = true);
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    document.querySelectorAll('.letter-button').forEach(btn => {
        if (btn.textContent === currentQuestion.correctAnswer) btn.classList.add('correct');
        if (btn.textContent === selectedAnswer && !isCorrect) btn.classList.add('incorrect');
    });

    if (isCorrect) {
        gameState.score++;
        showFeedback('Muito bem! Você acertou!', 'success');
        if(currentQuestion.type !== 'letter_sound') {
            document.getElementById('wordDisplay').textContent = currentQuestion.word;
        }
    } else {
        gameState.attempts--;
        showFeedback(`Quase! A resposta correta era ${currentQuestion.correctAnswer}`, 'error');
    }

    await saveGameState();
    updateUI();
    
    if(gameState.attempts <= 0) {
        setTimeout(endPhase, 1500);
    } else {
        setTimeout(() => document.getElementById('nextQuestion').style.display = 'block', 1500);
    }
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    startQuestion();
}

function endPhase() {
    const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0;
    const passed = accuracy >= 70;
    showResultScreen(accuracy, passed);
}

function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;
    
    if (passed) {
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        document.getElementById('resultMessage').textContent = 'Você completou a fase!';
        document.getElementById('continueButton').style.display = (gameState.currentPhase < 3) ? 'inline-block' : 'none';
        document.getElementById('retryButton').style.display = 'none';
    } else {
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais para passar. Tente novamente!';
        document.getElementById('continueButton').style.display = 'none';
        document.getElementById('retryButton').style.display = 'inline-block';
    }
}

async function nextPhase() {
    gameState.currentPhase++;
    resetPhaseState();
    showScreen('gameScreen');
    startQuestion();
}

async function retryPhase() {
    resetPhaseState();
    showScreen('gameScreen');
    startQuestion();
}

function resetPhaseState() {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.attempts = 2;
    gameState.questions = generateQuestions(gameState.currentPhase);
    saveGameState();
}

async function restartGame() {
    showScreen('startScreen');
}

async function playCurrentAudio() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (currentQuestion.type !== 'letter_sound') return;
    speak(currentQuestion.correctAnswer);
}

// =======================================================
// PARTE 8: SISTEMA DE VOZ E UI (Simplificado)
// =======================================================

function initializeSpeech() {
    function loadVoices() {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            selectedVoice = voices.find(voice => voice.lang === 'pt-BR');
            speechReady = true;
        }
    }
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
}

function speak(text) {
    if (!window.speechSynthesis || !speechReady) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    if (selectedVoice) utterance.voice = selectedVoice;
    speechSynthesis.speak(utterance);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

function showFeedback(message, type = 'info') {
    const el = document.getElementById('globalFeedback');
    if (!el) return;
    el.querySelector('.feedback-text').textContent = message;
    el.className = `show ${type}`;
    setTimeout(() => { el.className = el.className.replace('show', ''); }, 3000);
}

function updateUI() {
    const gameScreen = document.getElementById('gameScreen');
    if(gameScreen.classList.contains('active') && gameState.questions && gameState.questions.length > 0) {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('totalQuestions').textContent = gameState.questions.length;
        document.getElementById('attempts').textContent = `${gameState.attempts} tentativa(s)`;
        document.getElementById('currentPhase').textContent = gameState.currentPhase;
        const progress = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('nextQuestion').style.display = 'none';
    }
}

// Demais funções de UI (closeModal, showTab, etc.) mantidas do código original.

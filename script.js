// =======================================================
// JOGO DAS LETRAS - SCRIPT ATUALIZADO (AGO/2025)
// Fases alinhadas ao currículo e focadas na letra F
// =======================================================

// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6';
let currentUser = null, currentClassId = null, studentProgressData = [], currentChart = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), VOWELS = 'AEIOU'.split('');
const CUSTOM_AUDIO_KEYS = {'instruction_1': 'Instrução - Fase 1', 'instruction_2': 'Instrução - Fase 2', 'instruction_3': 'Instrução - Fase 3', 'instruction_4': 'Instrução - Fase 4', 'instruction_5': 'Instrução - Fase 5', 'feedback_correct': 'Feedback - Acerto', 'feedback_incorrect': 'Feedback - Erro'};
let gameState = {}, mediaRecorder, audioChunks = [], timerInterval, speechReady = false, selectedVoice = null;

// PARTE 2: CONTEÚDO DO JOGO (REESTRUTURADO)

const gameInstructions = {
    1: "Ouça o som e clique na letra correta!",
    2: "Qual é a vogal que começa o nome da figura?",
    3: "Complete a palavra com o encontro de vogais correto.",
    4: "Vamos explorar a letra F! Complete ou encontre a palavra correta.",
    5: "Detetive dos Sons! Ouça com atenção e escolha a palavra correta.",
    6: "Clique nas palavras na ordem certa para montar a frase.",
    7: "Se tirarmos um pedaço da palavra, qual nova palavra formamos?",
    8: "Jogo da Memória! Encontre os pares de letras maiúsculas e minúsculas.",
    9: "Coloque as letras na ordem certa do alfabeto!",
    10: "Quantas palavras existem nesta frase? Conte e escolha o número certo."
};

const PHASE_DESCRIPTIONS = {
    1: "Sons e Letras (Alfabeto)",
    2: "Vogal Inicial",
    3: "Encontros Vocálicos",
    4: "Foco na Letra F",
    5: "Pares Sonoros (F/V, P/B, T/D)",
    6: "Montando Frases",
    7: "Formando Novas Palavras",
    8: "Memória: Maiúscula e Minúscula",
    9: "Ordem Alfabética",
    10: "Contando Palavras na Frase"
};

const PHASE_2_WORDS = [
    { word: 'ABELHA', image: '🐝', vowel: 'A' }, { word: 'ELEFANTE', image: '🐘', vowel: 'E' },
    { word: 'IGREJA', image: '⛪', vowel: 'I' }, { word: 'ÔNIBUS', image: '🚌', vowel: 'O' },
    { word: 'UVA', image: '🍇', vowel: 'U' }, { word: 'ÍNDIO', image: '🏹', vowel: 'I' },
    { word: 'OVO', image: '🥚', vowel: 'O' }, { word: 'ESQUILO', image: '🐿️', vowel: 'E' },
    { word: 'AVIÃO', image: '✈️', vowel: 'A' }, { word: 'URSO', image: '🐻', vowel: 'U' },
    { word: 'ÓCULOS', image: '👓', vowel: 'O' }, { word: 'ESTRELA', image: '⭐', vowel: 'E' }
];
const PHASE_3_ENCONTROS = [
    { word: 'PEIXE', image: '🐠', encontro: 'EI' }, { word: 'BOI', image: '🐂', encontro: 'OI' },
    { word: 'CAIXA', image: '📦', encontro: 'AI' }, { word: 'CÉU', image: '☁️', encontro: 'ÉU' },
    { word: 'MÃE', image: '👩‍👧', encontro: 'ÃE' }, { word: 'PÃO', image: '🍞', encontro: 'ÃO' },
    { word: 'LEITE', image: '🥛', encontro: 'EI' }, { word: 'SAIA', image: '👗', encontro: 'AI' },
    { word: 'BALÃO', image: '🎈', encontro: 'ÃO' }, { word: 'PAI', image: '👨‍👧', encontro: 'AI' }
];
const VOWEL_ENCOUNTERS = ['AI', 'EI', 'OI', 'UI', 'AU', 'EU', 'ÃO', 'ÃE', 'UA', 'ÉU'];
const PHASE_4_WORDS_F = [
    { word: 'FACA', image: '🔪', question: 'FA', type: 'initial_syllable', options: ['FA', 'FO', 'VA'] },
    { word: 'FOGO', image: '🔥', question: 'FO', type: 'initial_syllable', options: ['FE', 'VO', 'FO'] },
    { word: 'FITA', image: '🎀', question: 'FI', type: 'initial_syllable', options: ['VI', 'FI', 'FA'] },
    { word: 'GARRAFA', image: '🍾', question: 'FA', type: 'middle_syllable', options: ['VA', 'FA', 'FO'] },
    { word: 'ALFINETE', image: '🧷', question: 'FI', type: 'middle_syllable', options: ['FI', 'VI', 'FE'] },
    { word: 'FOTO', image: '📷', question: 'FOTO', type: 'full_word', options: ['FOTO', 'VOTO', 'FOGO'] },
    { word: 'FIO', image: '🧵', question: 'FIO', type: 'full_word', options: ['FIO', 'VIO', 'FILA'] },
    { word: 'SOFÁ', image: '🛋️', question: 'FÁ', type: 'middle_syllable', options: ['FÁ', 'VÁ', 'SÁ'] },
    { word: 'FADA', image: '🧚‍♀️', question: 'FADA', type: 'full_word', options: ['FADA', 'VADA', 'FALA'] },
    { word: 'CAFÉ', image: '☕', question: 'FÉ', type: 'middle_syllable', options: ['FÉ', 'VÉ', 'PÉ'] },
    { word: 'FUMAÇA', image: '💨', question: 'FU', type: 'initial_syllable', options: ['FU', 'VU', 'FA'] },
    { word: 'BIFE', image: '🥩', question: 'FE', type: 'middle_syllable', options: ['VE', 'FE', 'FI'] }
];
const PHASE_5_SOUND_PAIRS = [
    { word: 'VACA', image: '🐄', correct: 'VACA', incorrect: 'FACA' },
    { word: 'PATO', image: '🦆', correct: 'PATO', incorrect: 'BATO' },
    { word: 'DADO', image: '🎲', correct: 'DADO', incorrect: 'TADO' },
    { word: 'FOTO', image: '📷', correct: 'FOTO', incorrect: 'VOTO' },
    { word: 'BOTE', image: '🚤', correct: 'BOTE', incorrect: 'POTE' },
    { word: 'TELA', image: '🖼️', correct: 'TELA', incorrect: 'DELA' },
    { word: 'GOLA', image: '👕', correct: 'GOLA', incorrect: 'COLA' },
    { word: 'VELA', image: '🕯️', correct: 'VELA', incorrect: 'FELA' },
    { word: 'BICO', image: '🦜', correct: 'BICO', incorrect: 'PICO' },
    { word: 'DIA', image: '☀️', correct: 'DIA', incorrect: 'TIA' }
];
const PHASE_6_SENTENCES = [
    { sentence: ['O', 'FOGO', 'QUEIMA'], image: '🔥', answer: 'O FOGO QUEIMA' },
    { sentence: ['O', 'CAFÉ', 'É', 'FORTE'], image: '☕', answer: 'O CAFÉ É FORTE' },
    { sentence: ['A', 'FADA', 'VOOU'], image: '🧚‍♀️', answer: 'A FADA VOOU' },
    { sentence: ['A', 'FOCA', 'É', 'FELIZ'], image: '🦭', answer: 'A FOCA É FELIZ' },
    { sentence: ['O', 'SOFÁ', 'É', 'FOFO'], image: '🛋️', answer: 'O SOFÁ É FOFO' },
    { sentence: ['EU', 'VI', 'UMA', 'FOTO'], image: '📷', answer: 'EU VI UMA FOTO' },
    { sentence: ['A', 'FACA', 'CORTA'], image: '🔪', answer: 'A FACA CORTA' },
    { sentence: ['ELE', 'GOSTA', 'DE', 'FIGO'], image: '🍈', answer: 'ELE GOSTA DE FIGO' },
    { sentence: ['A', 'FITA', 'É', 'ROSA'], image: '🎀', answer: 'A FITA É ROSA' },
    { sentence: ['O', 'BIFE', 'ESTÁ', 'NO', 'PRATO'], image: '🥩', answer: 'O BIFE ESTÁ NO PRATO' }
];
const PHASE_7_WORD_TRANSFORM = [
    { image: '👟', initialWord: 'SAPATO', toRemove: 'SA', correctAnswer: 'PATO', options: ['PATO', 'SAPO', 'MATO'] },
    { image: '🧤', initialWord: 'LUVA', toRemove: 'L', correctAnswer: 'UVA', options: ['UVA', 'LUA', 'VILA'] },
    { image: ' солдат', initialWord: 'SOLDADO', toRemove: 'SOL', correctAnswer: 'DADO', options: ['DADO', 'SOLD', 'LADO'] },
    { image: '🧥', initialWord: 'CASACO', toRemove: 'CA', correctAnswer: 'SACO', options: ['SACO', 'CASO', 'CACO'] },
    { image: '🐔', initialWord: 'GALINHA', toRemove: 'GA', correctAnswer: 'LINHA', options: ['LINHA', 'NINHA', 'GALO'] },
    { image: '🦎', initialWord: 'CAMALEÃO', toRemove: 'CAMA', correctAnswer: 'LEÃO', options: ['LEÃO', 'MÃO', 'ALHO'] },
    { image: 'TUCANO', image: '🦜', toRemove: 'TU', correctAnswer: 'CANO', options: ['CANO', 'TUCA', 'NANO'] },
    { image: 'SERPENTE', image: '🐍', toRemove: 'SER', correctAnswer: 'PENTE', options: ['PENTE', 'DENTE', 'GENTE'] },
    { image: 'ESCOLA', image: '🏫', toRemove: 'ES', correctAnswer: 'COLA', options: ['COLA', 'SOLA', 'BOLA'] },
    { image: 'BANANA', image: '🍌', toRemove: 'BA', correctAnswer: 'NANA', options: ['NANA', 'BANA', 'ANA'] }
];
const PHASE_8_MEMORY_PAIRS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PHASE_9_ALPHABET_ORDER = [
    { sequence: ['B', 'C', 'D', 'E'] }, { sequence: ['L', 'M', 'N', 'O'] },
    { sequence: ['P', 'Q', 'R', 'S'] }, { sequence: ['F', 'G', 'H', 'I'] },
    { sequence: ['T', 'U', 'V', 'W'] }, { sequence: ['J', 'K', 'L', 'M'] },
    { sequence: ['R', 'S', 'T', 'U'] }, { sequence: ['D', 'E', 'F', 'G'] },
    { sequence: ['X', 'Y', 'Z'] }, { sequence: ['H', 'I', 'J', 'K'] }
];
const PHASE_10_WORD_COUNT = [
    { sentence: 'O GATO BEBE LEITE', image: '🐈', count: 4 },
    { sentence: 'A FOCA BRINCA', image: '🦭', count: 3 },
    { sentence: 'EU GOSTO DE BOLO', image: '🍰', count: 4 },
    { sentence: 'A BOLA É AZUL', image: '⚽', count: 4 },
    { sentence: 'O SOL BRILHA FORTE', image: '☀️', count: 4 },
    { sentence: 'A FADA VOOU', image: '🧚‍♀️', count: 3 },
    { sentence: 'O CARRO É RÁPIDO', image: '🚗', count: 4 },
    { sentence: 'A FLOR CHEIRA BEM', image: '🌸', count: 4 },
    { sentence: 'NÓS VAMOS PASSEAR', image: '🚶‍♂️', count: 3 },
    { sentence: 'O LIVRO TEM FIGURAS', image: '📖', count: 4 }
];

// PARTE 3: FUNÇÕES UTILITÁRIAS
async function hashPassword(password) { const encoder = new TextEncoder(); const data = encoder.encode(password); const hashBuffer = await window.crypto.subtle.digest('SHA-256', data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); }
async function verifyPassword(password, storedHash) { const newHash = await hashPassword(password); return newHash === storedHash; }
function generateRandomPassword() { const words = ['sol', 'lua', 'rio', 'mar', 'flor', 'gato', 'cao', 'pato', 'rei', 'luz']; const word = words[Math.floor(Math.random() * words.length)]; const number = Math.floor(100 + Math.random() * 900); return `${word}${number}`; }
function formatErrorMessage(error) { if (!error || !error.message) { return 'Ocorreu um erro inesperado. Tente mais tarde.'; } const message = error.message.toLowerCase(); if (message.includes('duplicate key')) { return 'Este nome de usuário já existe. Escolha outro.'; } if (message.includes('invalid login credentials') || message.includes('usuário ou senha inválidos.')) { return 'Usuário ou senha inválidos.'; } console.error("Erro não tratado:", error); return 'Ocorreu um erro inesperado. Tente mais tarde.'; }

// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
document.addEventListener('DOMContentLoaded', initApp);
async function initApp() { if (!window.supabase) { alert("ERRO CRÍTICO: Supabase não carregou."); return; } initializeSpeech(); setupAllEventListeners(); const studentSession = sessionStorage.getItem('currentUser'); if (studentSession) { currentUser = JSON.parse(studentSession); await restoreOrStartGame(); } else { await checkSession(); } }
async function restoreOrStartGame() { await loadGameState(); if (gameState.phaseCompleted) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100; showResultScreen(accuracy, true); } else if (gameState.attempts <= 0) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; showResultScreen(accuracy, false); } else { showScreen('gameScreen'); startQuestion(); } }
function setupAllEventListeners() { document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => { const type = e.currentTarget.getAttribute('data-type'); if (type === 'teacher') showScreen('teacherLoginScreen'); else if (type === 'student') showScreen('studentLoginScreen'); })); document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => { const targetScreen = e.currentTarget.getAttribute('data-target'); showScreen(targetScreen); })); document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen')); document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen')); document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin); document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister); document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin); document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal')); document.getElementById('showAudioSettingsModalBtn').addEventListener('click', showAudioSettingsModal); document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass); document.getElementById('showCreateStudentFormBtn').addEventListener('click', showCreateStudentForm); document.getElementById('hideCreateStudentFormBtn').addEventListener('click', hideCreateStudentForm); document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent); document.getElementById('startButton')?.addEventListener('click', startGame); document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio); document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio); document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion); document.getElementById('continueButton')?.addEventListener('click', nextPhase); document.getElementById('retryButton')?.addEventListener('click', retryPhase); document.getElementById('restartButton')?.addEventListener('click', restartGame); document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame); document.querySelectorAll('[data-close]').forEach(btn => { btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))); }); document.querySelectorAll('#manageClassModal .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => showTab(e.currentTarget)); }); document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload); document.getElementById('recordBtn')?.addEventListener('click', startRecording); document.getElementById('stopBtn')?.addEventListener('click', stopRecording); document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording); document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial); document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials); document.getElementById('copyResetPasswordBtn')?.addEventListener('click', handleCopyResetPassword); document.querySelectorAll('.password-toggle').forEach(toggle => { toggle.addEventListener('click', () => { const passwordInput = toggle.previousElementSibling; const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; passwordInput.setAttribute('type', type); toggle.classList.toggle('fa-eye-slash'); }); }); document.querySelectorAll('.sort-btn').forEach(btn => { btn.addEventListener('click', (e) => { const sortBy = e.currentTarget.dataset.sort; document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); renderStudentProgress(sortBy); }); }); document.getElementById('reportClassSelector').addEventListener('change', handleReportClassSelection); }

// PARTE 5: AUTENTICAÇÃO E SESSÃO
async function checkSession() { const { data: { session } } = await supabaseClient.auth.getSession(); if (session && session.user) { currentUser = session.user; if (currentUser.user_metadata.role === 'teacher') { await showTeacherDashboard(); } else { await logout(); } } else { showScreen('userTypeScreen'); } }
async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]');

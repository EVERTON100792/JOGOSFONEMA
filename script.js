// =======================================================
// JOGO DAS LETRAS - VERSÃO FINAL CORRIGIDA (COM MECÂNICA DE CLIQUE ROBUSTA)
// =======================================================

// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
const GEMINI_API_KEY = "SUA_CHAVE_API_DO_GOOGLE_GEMINI_AQUI"; // <-- COLOQUE SUA CHAVE AQUI!
const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6';

let currentUser = null, currentClassId = null, studentProgressData = [], currentChart = null, currentEvolutionChart = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), VOWELS = 'AEIOU'.split('');
let gameState = {}, mediaRecorder, audioChunks = [], timerInterval, speechReady = false, selectedVoice = null;
let confettiAnimationId;
let selectedItemForClickMove = null; // Variável para a nova mecânica de clique

// VARIÁVEIS PARA O STATUS EM TEMPO REAL
let teacherChannel = null;
let onlineStudents = new Set();
let studentChannel = null;

// =======================================================
// LÓGICA DE ÁUDIO E SONS
// =======================================================
const soundEffects = {
    click: new Audio('sounds/click.mp3'),
    correct: new Audio('sounds/correct.mp3'),
    incorrect: new Audio('sounds/incorrect.mp3'),
    phaseWin: new Audio('sounds/phase_win.mp3'),
    drop: new Audio('sounds/drop.mp3') // Usaremos para a ação de "colocar"
};

function playSound(soundName) {
    if (soundEffects[soundName]) {
        soundEffects[soundName].currentTime = 0;
        soundEffects[soundName].play().catch(error => console.error(`Erro ao tocar som ${soundName}:`, error));
    }
}

let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked || !Object.values(soundEffects).length) return;
    Object.values(soundEffects).forEach(sound => {
        sound.volume = 0;
        sound.play().catch(() => {});
        sound.pause();
        sound.currentTime = 0;
        sound.volume = 1;
    });
    audioUnlocked = true;
    console.log("Contexto de áudio desbloqueado.");
}

// =======================================================
// PARTE 2: CONTEÚDO DO JOGO (20 FASES)
// =======================================================
const PHASE_DESCRIPTIONS = {
    1: "O Som das Letras", 2: "Jogo da Memória", 3: "Formando Sílabas", 4: "Caça-Palavras da Letra F", 5: "Pares Surdos/Sonoros", 6: "Contando Palavras na Frase", 7: "Montando Frases", 8: "Identificação de Vogais", 9: "Contando Sílabas", 10: "Caça-Sílaba Inicial", 11: "Completando Palavras", 12: "Formando Novas Palavras", 13: "Invertendo Sílabas", 14: "Fábrica de Rimas", 15: "Contando Sons (Fonemas)", 16: "Sílabas Complexas", 17: "Rima ou Não Rima?", 18: "Qual é a Letra Intrometida?", 19: "Detetive de Palavras", 20: "Leitura Rápida (Desafio)"
};
const PHASE_1_LETTER_SOUNDS = [
    { letter: 'F', audioKey: 'F', description: 'de soprar uma vela (ffff...)?', optionsPool: 'AMOPV' }, { letter: 'V', audioKey: 'V', description: 'de um motor vibrando (vvvv...)?', optionsPool: 'AMOPF' }, { letter: 'S', audioKey: 'S', description: 'da cobrinha (ssss...)?', optionsPool: 'AMOPZ' }, { letter: 'Z', audioKey: 'Z', description: 'da abelhinha (zzzz...)?', optionsPool: 'AMOPS' }, { letter: 'M', audioKey: 'M', description: 'de quando a comida está gostosa (mmmm...)?', optionsPool: 'AOPNS' }, { letter: 'P', audioKey: 'P', description: 'de uma pequena explosão, sem voz (p, p, p)?', optionsPool: 'AFOVB' }, { letter: 'B', audioKey: 'B', description: 'de uma pequena explosão, com voz (b, b, b)?', optionsPool: 'AFOVP' }, { letter: 'T', audioKey: 'T', description: 'da batidinha da língua no dente, sem voz (t, t, t)?', optionsPool: 'AFOVD' }, { letter: 'D', audioKey: 'D', description: 'da batidinha da língua no dente, com voz (d, d, d)?', optionsPool: 'AFOVT' }, { letter: 'L', audioKey: 'L', description: 'com a língua no céu da boca (llll...)?', optionsPool: 'ARFMN' }
];
const PHASE_3_SYLLABLE_F = [
    { base: 'F', vowel: 'A', result: 'FA', image: '🔪', word: 'FACA' }, { base: 'F', vowel: 'E', result: 'FE', image: '🌱', word: 'FEIJÃO' }, { base: 'F', vowel: 'I', result: 'FI', image: '🎀', word: 'FITA' }, { base: 'F', vowel: 'O', result: 'FO', image: '🔥', word: 'FOGO' }, { base: 'F', vowel: 'U', result: 'FU', image: '💨', word: 'FUMAÇA' }, { base: 'F', vowel: 'A', result: 'FA', image: '🧚‍♀️', word: 'FADA' }, { base: 'F', vowel: 'E', result: 'FE', image: '😀', word: 'FELIZ' }, { base: 'F', vowel: 'I', result: 'FI', image: 'Figo', word: 'FIGO' }, { base: 'F', vowel: 'O', result: 'FO', image: '🦭', word: 'FOCA' }, { base: 'F', vowel: 'U', result: 'FU', image: '⚽', word: 'FUTEBOL' }
];
const PHASE_4_WORDS_F = [
    { word: 'FOTO', image: '📷', options: ['FOTO', 'VOTO', 'POTE'] }, { word: 'FIO', image: '🧵', options: ['FIO', 'VIO', 'RIO'] }, { word: 'FACA', image: '🔪', options: ['FACA', 'VACA', 'PACA'] }, { word: 'FOCA', image: '🦭', options: ['FOCA', 'POCA', 'VOCA'] }, { word: 'FADA', image: '🧚‍♀️', options: ['FADA', 'VADA', 'NADA'] }, { word: 'FOGO', image: '🔥', options: ['FOGO', 'POGO', 'JOGO'] }, { word: 'FITA', image: '🎀', options: ['FITA', 'VITA', 'BITA'] }, { word: 'FESTA', image: '🎉', options: ['FESTA', 'RESTA', 'TESTA'] }, { word: 'FILA', image: '🧍🧍‍♀️🧍‍♂️', options: ['FILA', 'VILA', 'PILA'] }, { word: 'FAROL', image: '🚦', options: ['FAROL', 'CAROL', 'ROL'] }
];
const PHASE_5_SOUND_PAIRS = [
    { correct: 'VACA', incorrect: 'FACA', image: '🐄' }, { correct: 'PATO', incorrect: 'BATO', image: '🦆' }, { correct: 'DADO', incorrect: 'TADO', image: '🎲' }, { correct: 'BOTE', incorrect: 'POTE', image: '⛵' }, { correct: 'GOLA', incorrect: 'COLA', image: '👕' }, { correct: 'ZELO', incorrect: 'SELO', image: '😇' }, { correct: 'JOGO', incorrect: 'XOGO', image: '🎮' }, { correct: 'CHAVE', incorrect: 'JAVE', image: '🔑' }, { correct: 'GALO', incorrect: 'CALO', image: '🐓' }, { correct: 'FACA', incorrect: 'VACA', image: '🔪' }
];
const PHASE_6_SENTENCES_COUNT = [
    { sentence: 'A FADA VOOU', image: '🧚‍♀️', words: 3 }, { sentence: 'O GATO BEBE LEITE', image: '🐈', words: 4 }, { sentence: 'O SOL É AMARELO', image: '☀️', words: 4 }, { sentence: 'EU GOSTO DE BOLO', image: '🎂', words: 4 }, { sentence: 'A BOLA É REDONDA', image: '⚽', words: 4 }, { sentence: 'O CACHORRO LATE ALTO', image: '🐕', words: 4 }, { sentence: 'A LUA BRILHA NO CÉU', image: '🌙', words: 5 }, { sentence: 'A FLOR É CHEIROSA', image: '🌸', words: 4 }, { sentence: 'O SAPO PULA NO LAGO', image: '🐸', words: 5 }, { sentence: 'O PEIXE VIVE NA ÁGUA', image: '🐠', words: 5 }
];
const PHASE_7_SENTENCES_BUILD = [
    { sentence: ['O', 'FOGO', 'QUEIMA'], image: '🔥', answer: 'O FOGO QUEIMA' }, { sentence: ['A', 'BOLA', 'É', 'REDONDA'], image: '⚽', answer: 'A BOLA É REDONDA' }, { sentence: ['EU', 'AMO', 'LER'], image: '📚', answer: 'EU AMO LER' }, { sentence: ['O', 'PEIXE', 'NADA'], image: '🐠', answer: 'O PEIXE NADA' }, { sentence: ['O', 'SOL', 'É', 'QUENTE'], image: '☀️', answer: 'O SOL É QUENTE' }, { sentence: ['A', 'CASA', 'É', 'GRANDE'], image: '🏠', answer: 'A CASA É GRANDE' }, { sentence: ['O', 'GATO', 'DORME'], image: '😴', answer: 'O GATO DORME' }, { sentence: ['A', 'FLOR', 'É', 'BONITA'], image: '🌻', answer: 'A FLOR É BONITA' }, { sentence: ['NÓS', 'VAMOS', 'BRINCAR'], image: '🤹', answer: 'NÓS VAMOS BRINCAR' }, { sentence: ['O', 'CARRO', 'É', 'AZUL'], image: '🚗', answer: 'O CARRO É AZUL' }
];
const PHASE_9_SYLLABLE_COUNT = [
    { word: 'SOL', image: '☀️', syllables: 1 }, { word: 'PÃO', image: '🍞', syllables: 1 }, { word: 'FLOR', image: '🌸', syllables: 1 }, { word: 'MAR', image: '🌊', syllables: 1 }, { word: 'BOLA', image: '⚽', syllables: 2 }, { word: 'CASA', image: '🏠', syllables: 2 }, { word: 'LUA', image: '🌙', syllables: 2 }, { word: 'LIVRO', image: '📖', syllables: 2 }, { word: 'SAPATO', image: '👟', syllables: 3 }, { word: 'JANELA', image: '🖼️', syllables: 3 }, { word: 'MACACO', image: '🐒', syllables: 3 }, { word: 'CASTELO', image: '🏰', syllables: 3 }, { word: 'BORBOLETA', image: '🦋', syllables: 4 }, { word: 'TELEFONE', image: '📞', syllables: 4 }, { word: 'ABACAXI', image: '🍍', syllables: 4 }, { word: 'HIPOPÓTAMO', image: '🦛', syllables: 5 }
];
const PHASE_10_INITIAL_SYLLABLE = [
    { word: 'BOLO', image: '🎂', correctAnswer: 'BO' }, { word: 'MACACO', image: '🐒', correctAnswer: 'MA' }, { word: 'SAPATO', image: '👟', correctAnswer: 'SA' }, { word: 'JANELA', image: '🖼️', correctAnswer: 'JA' }, { word: 'VACA', image: '🐄', correctAnswer: 'VA' }, { word: 'GATO', image: '🐈', correctAnswer: 'GA' }, { word: 'DADO', image: '🎲', correctAnswer: 'DA' }, { word: 'RATO', image: '🐀', correctAnswer: 'RA' }, { word: 'FOCA', image: '🦭', correctAnswer: 'FO' }, { word: 'LIVRO', image: '📖', correctAnswer: 'LI' }
];
const PHASE_11_F_POSITION = [
    { word: 'FADA', image: '🧚‍♀️', syllable: 'FA', blanked: '__DA' }, { word: 'FIVELA', image: '🪢', syllable: 'FI', blanked: '__VELA' }, { word: 'GARRAFA', image: '🍾', syllable: 'FA', blanked: 'GARRA__' }, { word: 'ALFINETE', image: '🧷', syllable: 'FI', blanked: 'AL__NETE' }, { word: 'CAFÉ', image: '☕', syllable: 'FÉ', blanked: 'CA__' }, { word: 'GIRAFA', image: '🦒', syllable: 'FA', blanked: 'GIRA__' }, { word: 'SOFÁ', image: '🛋️', syllable: 'FÁ', blanked: 'SO__' }, { word: 'BIFE', image: '🥩', syllable: 'FE', blanked: 'BI__' }, { word: 'FÓSFORO', image: 'Matches', syllable: 'FOS', blanked: '__FORO' }, { word: 'GOLFINHO', image: '🐬', syllable: 'FI', blanked: 'GOL__NHO' }
];
const PHASE_12_WORD_TRANSFORM = [
    { initialWord: 'SAPATO', toRemove: 'SA', correctAnswer: 'PATO', image: '🦆' }, { initialWord: 'LUVA', toRemove: 'L', correctAnswer: 'UVA', image: '🍇' }, { initialWord: 'CAMALEÃO', toRemove: 'CAMA', correctAnswer: 'LEÃO', image: '🦁' }, { initialWord: 'GALINHA', toRemove: 'GA', correctAnswer: 'LINHA', image: '🧵' }, { initialWord: 'SOLDADO', toRemove: 'SOL', correctAnswer: 'DADO', image: '🎲' }, { initialWord: 'SERPENTE', toRemove: 'SER', correctAnswer: 'PENTE', image: 'comb' }, { initialWord: 'TUCANO', toRemove: 'TU', correctAnswer: 'CANO', image: 'pipe' }, { initialWord: 'ESCADA', toRemove: 'ES', correctAnswer: 'CADA', image: 'ladder' }, { initialWord: 'REPOLHO', toRemove: 'RE', correctAnswer: 'POLHO', image: 'cabbage' }, { initialWord: 'SACOLA', toRemove: 'SA', correctAnswer: 'COLA', image: 'glue' }
];
const PHASE_13_INVERT_SYLLABLES = [
    { word: 'BOLO', image: '🎂', inverted: 'LOBO', imageInverted: '🐺' }, { word: 'MACA', image: '🍎', inverted: 'CAMA', imageInverted: '🛏️' }, { word: 'GATO', image: '🐈', inverted: 'TOGA', imageInverted: '🎓' }, { word: 'LAMA', image: '💩', inverted: 'MALA', imageInverted: '👜' }, { word: 'TOPA', image: '🤝', inverted: 'PATO', imageInverted: '🦆' }, { word: 'CASA', image: '🏠', inverted: 'SACA', imageInverted: '💰' }, { word: 'LICA', image: '👱‍♀️', inverted: 'CALI', imageInverted: '🌆' }, { word: 'DICA', image: '💡', inverted: 'CADI', imageInverted: '🛒' }, { word: 'MAGO', image: '🧙‍♂️', inverted: 'GOMA', imageInverted: '🍬' }, { word: 'SECA', image: '🏜️', inverted: 'CASE', imageInverted: '💼' }
];
const PHASE_14_RHYMES = [
    { word: 'PÃO', image: '🍞', rhyme: 'MÃO' }, { word: 'GATO', image: '🐈', rhyme: 'PATO' }, { word: 'JANELA', image: '🖼️', rhyme: 'PANELA' }, { word: 'ANEL', image: '💍', rhyme: 'PASTEL' }, { word: 'FIVELA', image: '🪢', rhyme: 'CANELA' }, { word: 'CADEIRA', image: '🪑', rhyme: 'BANDEIRA' }, { word: 'MARTELO', image: '🔨', rhyme: 'CASTELO' }, { word: 'SOLDADO', image: '🎖️', rhyme: 'ADOÇADO' }, { word: 'CEBOLA', image: '🧅', rhyme: 'ARGOLA' }, { word: 'CENOURA', image: '🥕', rhyme: 'TESOURA' }
];
const PHASE_15_PHONEME_COUNT = [
    { word: 'LUA', image: '🌙', sounds: 3 }, { word: 'SOL', image: '☀️', sounds: 3 }, { word: 'PÉ', image: '🦶', sounds: 2 }, { word: 'BOLA', image: '⚽', sounds: 4 }, { word: 'FACA', image: '🔪', sounds: 4 }, { word: 'REI', image: '👑', sounds: 3 }, { word: 'UVA', image: '🍇', sounds: 3 }, { word: 'CASA', image: '🏠', sounds: 4 }, { word: 'RUA', image: '🛣️', sounds: 3 }, { word: 'DEDO', image: '☝️', sounds: 4 }
];
const PHASE_16_COMPLEX_SYLLABLES = [
    { word: 'LIVRO', image: '📖', syllable: 'VRO', blanked: 'LI__' }, { word: 'BRUXA', image: '🧙‍♀️', syllable: 'BRU', blanked: '__XA' }, { word: 'PALHAÇO', image: '🤡', syllable: 'LHA', blanked: 'PA__ÇO' }, { word: 'NINHO', image: '둥지', syllable: 'NHO', blanked: 'NI__' }, { word: 'DRAGÃO', image: '🐲', syllable: 'DRA', blanked: '__GÃO' }, { word: 'FLOR', image: '🌸', syllable: 'FLOR', blanked: '__' }, { word: 'PRATO', image: '🍽️', syllable: 'PRA', blanked: '__TO' }, { word: 'CHAVE', image: '🔑', syllable: 'CHA', blanked: '__VE' }, { word: 'GLOBO', image: '🌍', syllable: 'GLO', blanked: '__BO' }, { word: 'TREM', image: '🚂', syllable: 'TREM', blanked: '__' }
];
const PHASE_17_RHYME_DISCRIMINATION = [
    { target: 'GATO', image: '🐈', correct: 'PATO', incorrect: 'BOLA' }, { target: 'JANELA', image: '🖼️', correct: 'PANELA', incorrect: 'FOGO' }, { target: 'MÃO', image: '✋', correct: 'PÃO', incorrect: 'DEDO' }, { target: 'ANEL', image: '💍', correct: 'PASTEL', incorrect: 'LUVA' }, { target: 'CADEIRA', image: '🪑', correct: 'BANDEIRA', incorrect: 'MESA' }, { target: 'CEBOLA', image: '🧅', correct: 'ARGOLA', incorrect: 'ALHO' }, { target: 'GALO', image: '🐓', correct: 'BOLO', incorrect: 'CAMA' }, { target: 'COLA', image: '💧', correct: 'BOLA', incorrect: 'LÁPIS' }, { target: 'FOGO', image: '🔥', correct: 'JOGO', incorrect: 'ÁGUA' }, { target: 'LATA', image: '🥫', correct: 'BARATA', incorrect: 'COPO' }
];
const PHASE_18_INTRUDER_LETTER = [
    { word: 'GATO', image: '🐈', intruder: 'R', display: 'GARTO' }, { word: 'BOLA', image: '⚽', intruder: 'C', display: 'BOCLA' }, { word: 'CASA', image: '🏠', intruder: 'I', display: 'CAISA' }, { word: 'PATO', image: '🦆', intruder: 'N', display: 'PANTO' }, { word: 'LUA', image: '🌙', intruder: 'S', display: 'LUSA' }, { word: 'SOL', image: '☀️', intruder: 'V', display: 'SOVL' }, { word: 'FACA', image: '🔪', intruder: 'M', display: 'FAMCA' }, { word: 'DADO', image: '🎲', intruder: 'L', display: 'DALDO' }, { word: 'LIVRO', image: '📖', intruder: 'E', display: 'LIVEIRO' }, { word: 'PEIXE', image: '🐠', intruder: 'U', display: 'PEIUXE' }
];
const PHASE_19_WORD_DETECTIVE = [
    { sentence: 'O ____ é amarelo.', image: '☀️', answer: 'SOL', options: ['SAL', 'SUL', 'SOL'] }, { sentence: 'A ____ é redonda.', image: '⚽', answer: 'BOLA', options: ['BULA', 'BOLA', 'BALA'] }, { sentence: 'O ____ bebe leite.', image: '🐈', answer: 'GATO', options: ['RATO', 'PATO', 'GATO'] }, { sentence: 'Eu como ____ no almoço.', image: '🍚', answer: 'ARROZ', options: ['ARROZ', 'AMOR', 'ATROZ'] }, { sentence: 'A ____ brilha no céu.', image: '🌙', answer: 'LUA', options: ['LUA', 'LUVA', 'LUTA'] }, { sentence: 'A ____ é cheirosa.', image: '🌸', answer: 'FLOR', options: ['COR', 'FLOR', 'DOR'] }, { sentence: 'O ____ vive na água.', image: '🐠', answer: 'PEIXE', options: ['PEIXE', 'FEIXE', 'DEIXE'] }, { sentence: 'Eu uso o ____ para escrever.', image: '✏️', answer: 'LÁPIS', options: ['PAPEL', 'LÁPIS', 'LIVRO'] }, { sentence: 'A ____ é grande.', image: '🏠', answer: 'CASA', options: ['BOLA', 'MALA', 'CASA'] }, { sentence: 'O ____ faz au au.', image: '🐕', answer: 'CACHORRO', options: ['GATO', 'LEÃO', 'CACHORRO'] }
];
const PHASE_20_SPEED_READING = [
    { word: 'GATO', image: '🐈' }, { word: 'BOLA', image: '⚽' }, { word: 'SOL', image: '☀️' }, { word: 'LUA', image: '🌙' }, { word: 'CASA', image: '🏠' }, { word: 'PATO', image: '🦆' }, { word: 'FACA', image: '🔪' }, { word: 'DADO', image: '🎲' }, { word: 'PÃO', image: '🍞' }, { word: 'FLOR', image: '🌸' }, { word: 'UVA', image: '🍇' }, { word: 'REI', image: '👑' }
];

// =======================================================
// PARTE 3: FUNÇÕES UTILITÁRIAS
// =======================================================
async function hashPassword(password) { const encoder = new TextEncoder(); const data = encoder.encode(password); const hashBuffer = await window.crypto.subtle.digest('SHA-256', data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); }
async function verifyPassword(password, storedHash) { const newHash = await hashPassword(password); return newHash === storedHash; }
function generateRandomPassword() { const words = ['sol', 'lua', 'rio', 'mar', 'flor', 'gato', 'cao', 'pato', 'rei', 'luz']; const word = words[Math.floor(Math.random() * words.length)]; const number = Math.floor(100 + Math.random() * 900); return `${word}${number}`; }
function formatErrorMessage(error) { if (!error || !error.message) { return 'Ocorreu um erro inesperado. Tente mais tarde.'; } const message = error.message.toLowerCase(); if (message.includes('duplicate key')) { return 'Este nome de usuário já existe. Escolha outro.'; } if (message.includes('invalid login credentials') || message.includes('usuário ou senha inválidos.')) { return 'Usuário ou senha inválidos.'; } console.error("Erro não tratado:", error); return 'Ocorreu um erro inesperado. Tente mais tarde.'; }

function _generateOptions(correctItem, sourceArray, count) {
    const options = new Set([correctItem]);
    const availableItems = [...sourceArray].filter(l => l !== correctItem);
    while (options.size < count && availableItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        options.add(availableItems.splice(randomIndex, 1)[0]);
    }
    return Array.from(options).sort(() => 0.5 - Math.random());
}

// =======================================================
// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
// =======================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    if (!window.supabase) {
        alert("ERRO CRÍTICO: Supabase não carregou.");
        return;
    }
    initializeSpeech();
    setupAllEventListeners();
    const studentSession = sessionStorage.getItem('currentUser');
    
    if (studentSession) {
        currentUser = JSON.parse(studentSession);
        await showStudentGame();
    } else {
        await checkSession();
    }
}

function setupAllEventListeners() {
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => { const type = e.currentTarget.getAttribute('data-type'); if (type === 'teacher') showScreen('teacherLoginScreen'); else if (type === 'student') showScreen('studentLoginScreen'); }));
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => { const targetScreen = e.currentTarget.getAttribute('data-target'); showScreen(targetScreen); }));
    document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen'));
    document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen'));
    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal'));
    document.getElementById('showAudioSettingsModalBtn').addEventListener('click', showAudioSettingsModal);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('showCreateStudentFormBtn').addEventListener('click', showCreateStudentForm);
    document.getElementById('hideCreateStudentFormBtn').addEventListener('click', hideCreateStudentForm);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    document.getElementById('generatePasswordBtn').addEventListener('click', () => { document.getElementById('createStudentPassword').value = generateRandomPassword(); });
    document.getElementById('startButton')?.addEventListener('click', startGame);
    document.getElementById('startCustomActivityBtn')?.addEventListener('click', startCustomActivity);
    document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio);
    document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('continueButton')?.addEventListener('click', nextPhase);
    document.getElementById('retryButton')?.addEventListener('click', retryPhase);
    document.getElementById('restartButton')?.addEventListener('click', restartGame);
    document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame);
    document.querySelectorAll('[data-close]').forEach(btn => { btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))); });
    document.querySelectorAll('#manageClassModal .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => showTab(e.currentTarget)); });
    document.querySelectorAll('#audioSettingsModal .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => showTab(e.currentTarget)); });
    document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload);
    document.getElementById('recordBtn')?.addEventListener('click', startRecording);
    document.getElementById('stopBtn')?.addEventListener('click', stopRecording);
    document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording);
    document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial);
    document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials);
    document.getElementById('copyResetPasswordBtn')?.addEventListener('click', handleCopyResetPassword);
    document.querySelectorAll('.password-toggle').forEach(toggle => { toggle.addEventListener('click', () => { const passwordInput = toggle.previousElementSibling; const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; passwordInput.setAttribute('type', type); toggle.classList.toggle('fa-eye-slash'); }); });
    document.querySelectorAll('.sort-btn').forEach(btn => { btn.addEventListener('click', (e) => { const sortBy = e.currentTarget.dataset.sort; document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); renderStudentProgress(sortBy); }); });
    document.getElementById('reportClassSelector').addEventListener('change', handleReportClassSelection);

    const sidebar = document.getElementById('dashboardSidebar');
    sidebar.addEventListener('click', (event) => {
        const navLink = event.target.closest('.sidebar-nav a');
        const logoutButton = event.target.closest('#logoutBtnSidebar');
        
        if (navLink) {
            event.preventDefault();
            handleSidebarClick(navLink);
        }
        if (logoutButton) {
            logout();
        }
    });
}

// =======================================================
// PARTE 5: AUTENTICAÇÃO E SESSÃO
// =======================================================
async function checkSession() { const { data: { session } } = await supabaseClient.auth.getSession(); if (session && session.user) { currentUser = session.user; if (currentUser.user_metadata.role === 'teacher') { await showTeacherDashboard(); } else { await logout(); } } else { showScreen('userTypeScreen'); } }
async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const email = document.getElementById('teacherEmail').value; const password = document.getElementById('teacherPassword').value; try { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; currentUser = data.user; await showTeacherDashboard(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleTeacherRegister(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...'; const name = document.getElementById('teacherRegName').value; const email = document.getElementById('teacherRegEmail').value; const password = document.getElementById('teacherRegPassword').value; try { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, role: 'teacher' } } }); if (error) throw error; showFeedback('Cadastro realizado! Link de confirmação enviado para seu e-mail.', 'success'); showScreen('teacherLoginScreen'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }

async function handleStudentLogin(e) {
    e.preventDefault();
    unlockAudio();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value.trim();
    try {
        const { data: studentData, error } = await supabaseClient
            .from('students')
            .select('*, assigned_phases, assigned_activity')
            .ilike('username', username)
            .single();
        
        if (error) { throw new Error('Usuário ou senha inválidos.'); }

        const match = await verifyPassword(password, studentData.password);
        if (!match) { throw new Error('Usuário ou senha inválidos.'); }

        currentUser = { ...studentData, type: 'student' };
        
        try { sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); } 
        catch (jsonError) { console.error("ERRO CRÍTICO: Falha ao processar os dados do aluno.", jsonError); throw new Error("Não foi possível carregar os dados do aluno. Contate o suporte."); }

        await showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(formatErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

async function logout() { 
    if (teacherChannel) { supabaseClient.removeChannel(teacherChannel); teacherChannel = null; }
    await supabaseClient.auth.signOut(); 
    currentUser = null; currentClassId = null; 
    sessionStorage.removeItem('currentUser'); 
    showScreen('userTypeScreen'); 
}
function handleExitGame() { 
    if (confirm('Tem certeza que deseja sair? Seu progresso ficará salvo.')) { 
        if (studentChannel) { studentChannel.untrack(); supabaseClient.removeChannel(studentChannel); studentChannel = null; }
        sessionStorage.removeItem('currentUser'); 
        currentUser = null; 
        showScreen('userTypeScreen'); 
    } 
}

// =======================================================
// PARTE 6: DASHBOARD DO PROFESSOR
// =======================================================
async function showTeacherDashboard() {
    showScreen('teacherDashboard');
    await loadTeacherData();
    showDashboardView('viewTurmas');
    connectTeacherToRealtime();
}

function handleSidebarClick(navLinkElement) {
    const viewId = navLinkElement.dataset.view;
    showDashboardView(viewId);
}

function showDashboardView(viewId) { 
    document.querySelectorAll('.dashboard-view').forEach(view => { view.classList.remove('active'); }); 
    const activeView = document.getElementById(viewId); 
    if (activeView) { activeView.classList.add('active'); } 
    document.querySelectorAll('.sidebar-nav a').forEach(link => { link.classList.remove('active'); if (link.dataset.view === viewId) { link.classList.add('active'); } }); 
    const linkText = document.querySelector(`.sidebar-nav a[data-view="${viewId}"] span`).textContent; 
    document.getElementById('dashboard-title').textContent = linkText; 
    if (viewId === 'viewRelatorios') { populateReportClassSelector(); } 
}

function connectTeacherToRealtime() {
    if (teacherChannel) { supabaseClient.removeChannel(teacherChannel); }
    const channelId = `teacher-room-${currentUser.id}`;
    teacherChannel = supabaseClient.channel(channelId, { config: { presence: { key: currentUser.email } } });

    const updateOnlineStatus = () => {
        const presenceState = teacherChannel.presenceState();
        onlineStudents.clear();
        for (const id in presenceState) {
            presenceState[id].forEach(presence => {
                if (presence.student_id) { onlineStudents.add(presence.student_id); }
            });
        }
        const progressList = document.getElementById('studentProgressList');
        if (progressList && progressList.offsetParent !== null) { renderStudentProgress(); }
    };

    teacherChannel
        .on('presence', { event: 'sync' }, updateOnlineStatus)
        .on('presence', { event: 'join' }, updateOnlineStatus)
        .on('presence', { event: 'leave' }, updateOnlineStatus)
        .subscribe();
}

async function loadTeacherData() { if (!currentUser) return; document.getElementById('teacherName').textContent = currentUser.user_metadata.full_name || 'Professor(a)'; const audioSettingsButton = document.getElementById('showAudioSettingsModalBtn'); if (currentUser.id === SUPER_ADMIN_TEACHER_ID) { audioSettingsButton.style.display = 'block'; } else { audioSettingsButton.style.display = 'none'; } await loadTeacherClasses(); }
async function loadTeacherClasses() { const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id); if (error) { console.error('Erro ao carregar turmas:', error); return; } renderClasses(data); }
function renderClasses(classes) { const container = document.getElementById('classesList'); if (!classes || classes.length === 0) { container.innerHTML = '<p>Nenhuma turma criada ainda.</p>'; return; } container.innerHTML = classes.map(cls => { const studentCount = cls.students[0]?.count || 0; return ` <div class="class-card"> <h3>${cls.name}</h3> <span class="student-count">👥 ${studentCount} aluno(s)</span> <div class="class-card-actions"> <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button> <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma"> <i class="fas fa-trash"></i> </button> </div> </div>`; }).join(''); }
async function handleCreateClass(e) { e.preventDefault(); const name = document.getElementById('className').value; if (!name) return; const { error } = await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); return; } closeModal('createClassModal'); await loadTeacherClasses(); showFeedback('Turma criada com sucesso!', 'success'); document.getElementById('createClassForm').reset(); }
async function handleDeleteClass(classId, className) { if (!confirm(`ATENÇÃO! Deseja excluir a turma "${className}"?\nTODOS os alunos e progressos serão apagados.`)) return; const { error } = await supabaseClient.from('classes').delete().eq('id', classId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Turma "${className}" excluída.`, 'success'); await loadTeacherClasses(); } }
async function manageClass(classId, className) { currentClassId = classId; document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`; const modal = document.getElementById('manageClassModal'); modal.querySelectorAll('.tab-btn').forEach(btn => { const tabId = btn.dataset.tab; if (!btn.getAttribute('data-listener')) { btn.setAttribute('data-listener', 'true'); btn.addEventListener('click', () => { if (tabId === 'studentsTab') loadClassStudents(); else if (tabId === 'studentProgressTab') loadStudentProgress(); }); } }); showTab(document.querySelector('#manageClassModal .tab-btn[data-tab="studentsTab"]')); await loadClassStudents(); showModal('manageClassModal'); }
async function loadClassStudents() { const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId).order('name', { ascending: true }); if (error) { console.error('Erro ao carregar alunos:', error); document.getElementById('studentsList').innerHTML = '<p>Erro ao carregar.</p>'; return; } renderStudents(data); }
function renderStudents(students) { const container = document.getElementById('studentsList'); if (!students || students.length === 0) { container.innerHTML = '<p>Nenhum aluno cadastrado.</p>'; return; } container.innerHTML = students.map(student => ` <div class="student-item"> <div class="student-info"> <h4>${student.name}</h4> <p>Usuário: ${student.username}</p> </div> <div class="student-actions"> <button onclick="handleShowOrResetPassword('${student.id}', '${student.name.replace(/'/g, "\\'")}')" class="btn small" title="Ver/Redefinir Senha"> <i class="fas fa-key"></i> </button> <button onclick="handleDeleteStudent('${student.id}', '${student.name.replace(/'/g, "\\'")}')" class="btn small danger" title="Excluir Aluno"> <i class="fas fa-trash"></i> </button> </div> </div>`).join(''); }

async function loadStudentProgress() {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando progresso dos alunos...</p>';
    try {
        const { data: studentsData, error: studentsError } = await supabaseClient
            .from('students')
            .select(`id, name, assigned_phases`)
            .eq('class_id', currentClassId);

        if (studentsError) throw studentsError;
        if (!studentsData || studentsData.length === 0) {
            progressList.innerHTML = '<p>Nenhum aluno nesta turma para exibir o progresso.</p>';
            return;
        }

        const studentIds = studentsData.map(s => s.id);
        const { data: progressData, error: progressError } = await supabaseClient
            .from('progress')
            .select('*')
            .in('student_id', studentIds);

        if (progressError) throw progressError;

        const combinedData = studentsData.map(student => {
            const progress = progressData.find(p => p.student_id === student.id);
            return { ...student, progress };
        });

        studentProgressData = combinedData;
        renderStudentProgress('last_played');
    } catch (error) {
        console.error("Erro ao carregar progresso:", error);
        progressList.innerHTML = `<p style="color:red;">Erro ao carregar o progresso: ${error.message}</p>`;
    }
}

function renderStudentProgress(sortBy = 'last_played') {
    const container = document.getElementById('studentProgressList');
    document.querySelector('.sort-btn.active')?.classList.remove('active');
    document.querySelector(`.sort-btn[data-sort="${sortBy}"]`)?.classList.add('active');

    const sortedData = [...studentProgressData].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        const dateA = a.progress?.last_played ? new Date(a.progress.last_played) : new Date(0);
        const dateB = b.progress?.last_played ? new Date(b.progress.last_played) : new Date(0);
        return dateB - dateA;
    });
    
    container.innerHTML = sortedData.map(student => {
        const progress = student.progress;
        const assignedPhases = student.assigned_phases || [1];
        const currentPhase = progress?.current_phase || 'N/J';
        const gameState = progress?.game_state;

        let statusHTML = '';
        if (onlineStudents.has(student.id)) { statusHTML = `<div class="status-indicator online" title="Online Agora"></div>`; } 
        else if (progress?.last_played) {
            const lastDate = new Date(progress.last_played);
            const diffDays = Math.ceil(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24)) - 1;
            if (diffDays <= 1) statusHTML = `<div class="status-indicator recent" title="Acessou hoje ou ontem"></div>`;
            else if (diffDays <= 7) statusHTML = `<div class="status-indicator week" title="Inativo há ${diffDays} dias"></div>`;
            else statusHTML = `<div class="status-indicator inactive" title="Inativo há mais de 7 dias"></div>`;
        } else { statusHTML = `<div class="status-indicator never" title="Nunca jogou"></div>`; }
        
        let score = 0, total = 0, accuracy = 0;
        if (gameState?.questions?.length > 0) {
            score = gameState.score ?? 0;
            total = gameState.questions[0]?.type === 'memory_game' ? (gameState.memoryGame?.totalPairs || 8) : gameState.questions.length;
            accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        }
        const lastPlayedStr = progress?.last_played ? new Date(progress.last_played).toLocaleDateString('pt-BR') : 'Nunca';

        const phaseModules = {
            "Módulo 1: Consciência Fonológica": [1, 2, 5, 8, 14, 15, 17],
            "Módulo 2: Princípio Alfabético": [3, 4, 10, 11, 16, 18],
            "Módulo 3: Fluência e Estrutura": [6, 7, 9, 12, 13, 19, 20],
        };
        let phaseCheckboxesHTML = '';
        for (const moduleName in phaseModules) {
            phaseCheckboxesHTML += `<h4 class="phase-module-title">${moduleName}</h4>`;
            phaseCheckboxesHTML += phaseModules[moduleName].map(phaseNum => {
                const phaseName = PHASE_DESCRIPTIONS[phaseNum] || `Fase ${phaseNum}`;
                const isChecked = assignedPhases.includes(phaseNum);
                return `<label class="phase-checkbox-label" title="${phaseName}">
                            <input type="checkbox" class="phase-checkbox" value="${phaseNum}" ${isChecked ? 'checked' : ''}>
                            <span><strong>Fase ${phaseNum}:</strong> ${phaseName}</span>
                        </label>`;
            }).join('');
        }

        return `
            <div class="student-progress-accordion" id="accordion-${student.id}">
                <button class="accordion-header" onclick="toggleAccordion('${student.id}')">
                    <div class="student-info"><h4>${statusHTML} ${student.name}</h4><p>Último Acesso: ${lastPlayedStr} | Fase Atual: <strong>${currentPhase}</strong></p></div>
                    <div class="student-progress-container"><div class="student-progress-bar" title="Progresso na fase ${currentPhase}: ${accuracy}%"><div class="student-progress-fill" style="width: ${accuracy}%;"></div></div></div>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="accordion-content">
                    <h5><i class="fas fa-tasks"></i> Designar Fases</h5>
                    <div class="phase-checkbox-grid">${phaseCheckboxesHTML}</div>
                    <div class="accordion-actions"><button class="btn primary" onclick="assignPhases('${student.id}')"><i class="fas fa-save"></i> Salvar Fases</button></div>
                </div>
            </div>`;
    }).join('');
}

function toggleAccordion(studentId) {
    const accordion = document.getElementById(`accordion-${studentId}`);
    document.querySelectorAll('.student-progress-accordion').forEach(acc => {
        if (acc.id !== accordion.id) { acc.classList.remove('open'); }
    });
    accordion.classList.toggle('open');
}

async function assignPhases(studentId) {
    const accordion = document.getElementById(`accordion-${studentId}`);
    const checkboxes = accordion.querySelectorAll('.phase-checkbox');
    const student = studentProgressData.find(s => s.id === studentId);
    if (!student) return;

    const newPhases = Array.from(checkboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value)).sort((a, b) => a - b);
    if (newPhases.length === 0) { showFeedback("O aluno precisa ter pelo menos uma fase designada.", "error"); return; }

    showFeedback(`Atualizando fases para ${student.name}...`, 'info');

    try {
        const { error: assignError } = await supabaseClient.from('students').update({ assigned_phases: newPhases }).eq('id', studentId);
        if (assignError) throw assignError;

        const firstNewPhase = newPhases[0];
        let progressNeedsReset = student.progress ? !newPhases.includes(student.progress.current_phase) : false;
        
        if (progressNeedsReset) {
            const newGameState = { ...student.progress.game_state, currentPhase: firstNewPhase, score: 0, attempts: 3, currentQuestionIndex: 0, phaseCompleted: false, questions: generateQuestions(firstNewPhase) };
            const { error: progressError } = await supabaseClient.from('progress').update({ current_phase: firstNewPhase, game_state: newGameState }).eq('student_id', studentId);
            if (progressError) throw progressError;
            showFeedback(`Fases atualizadas! O progresso de ${student.name} foi reiniciado para a Fase ${firstNewPhase}.`, 'success');
        } else {
            showFeedback(`Fases de ${student.name} atualizadas com sucesso!`, 'success');
        }
        await loadStudentProgress();
    } catch (error) {
        console.error("Erro ao designar fases:", error);
        showFeedback(`Erro ao atualizar: ${error.message}`, 'error');
    }
}

async function handleCreateStudent(event) { event.preventDefault(); const username = document.getElementById('createStudentUsername').value.trim(); const password = document.getElementById('createStudentPassword').value; const submitButton = document.getElementById('createStudentSubmitBtn'); if (!username || !password) { return showFeedback("Preencha nome e senha.", "error"); } if (!currentClassId || !currentUser?.id) { return showFeedback("Erro de sessão.", "error"); } submitButton.disabled = true; submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...'; try { const hashedPassword = await hashPassword(password); const { error } = await supabaseClient.from('students').insert([{ name: username, username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }]); if (error) throw error; document.getElementById('newStudentUsername').textContent = username; document.getElementById('newStudentPassword').textContent = password; showModal('studentCreatedModal'); hideCreateStudentForm(); await loadClassStudents(); await loadStudentProgress(); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { submitButton.disabled = false; submitButton.innerHTML = 'Criar Aluno'; } }
async function handleDeleteStudent(studentId, studentName) { if (!confirm(`Tem certeza que deseja excluir "${studentName}"?`)) return; const { error } = await supabaseClient.from('students').delete().eq('id', studentId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Aluno "${studentName}" excluído.`, 'success'); await loadClassStudents(); await loadStudentProgress(); } }
async function handleShowOrResetPassword(studentId, studentName) { showFeedback(`Redefinindo senha para ${studentName}...`, 'info'); const newPassword = generateRandomPassword(); try { const hashedPassword = await hashPassword(newPassword); const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId); if (error) throw error; document.getElementById('resetStudentName').textContent = studentName; document.getElementById('resetStudentPassword').textContent = newPassword; showModal('resetPasswordModal'); } catch (error) { showFeedback(`Erro ao tentar alterar a senha: ${error.message}`, 'error'); } }
function handleCopyCredentials() { const username = document.getElementById('newStudentUsername').textContent; const password = document.getElementById('newStudentPassword').textContent; const textToCopy = `Usuário: ${username}\nSenha: ${password}`; navigator.clipboard.writeText(textToCopy).then(() => { showFeedback('Copiado!', 'success'); }).catch(() => { showFeedback('Erro ao copiar.', 'error'); }); }
function handleCopyResetPassword() { const password = document.getElementById('resetStudentPassword').textContent; navigator.clipboard.writeText(password).then(() => { showFeedback('Nova senha copiada!', 'success'); }).catch(() => { showFeedback('Erro ao copiar a senha.', 'error'); }); }

// =======================================================
// PARTE 7: ÁUDIO E GRAVAÇÃO
// =======================================================
async function handleAudioUpload() { const files = document.getElementById('audioUpload').files; if (files.length === 0) return; const uploadStatus = document.getElementById('uploadStatus'); uploadStatus.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Enviando...</p>`; let successCount = 0, errorCount = 0; for (const file of files) { const fileName = file.name.split('.').slice(0, -1).join('.').toUpperCase(); const filePath = `${currentUser.id}/${fileName}.${file.name.split('.').pop()}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true }); if (error) throw error; successCount++; } catch (error) { console.error(`Erro no upload:`, error); errorCount++; } } uploadStatus.innerHTML = `<p style="color: green;">${successCount} enviados!</p>`; if (errorCount > 0) { uploadStatus.innerHTML += `<p style="color: red;">Falha em ${errorCount}.</p>`; } }
async function startRecording() { const recordBtn = document.getElementById('recordBtn'), stopBtn = document.getElementById('stopBtn'), statusEl = document.getElementById('recordStatus'); recordBtn.disabled = true; statusEl.textContent = 'Pedindo permissão...'; try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioChunks = []; mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data)); mediaRecorder.addEventListener('stop', () => { const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const audioUrl = URL.createObjectURL(audioBlob); document.getElementById('audioPlayback').src = audioUrl; document.getElementById('saveRecordingBtn').disabled = false; stream.getTracks().forEach(track => track.stop()); }); mediaRecorder.start(); statusEl.textContent = 'Gravando...'; stopBtn.disabled = false; startTimer(); } catch (err) { console.error("Erro ao gravar:", err); alert("Não foi possível gravar. Verifique as permissões."); statusEl.textContent = 'Falha.'; recordBtn.disabled = false; } }
function stopRecording() { if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); stopTimer(); document.getElementById('recordBtn').disabled = false; document.getElementById('stopBtn').disabled = true; document.getElementById('recordStatus').textContent = 'Parado.'; } }
async function saveRecording() { if (audioChunks.length === 0) return; const saveButton = document.getElementById('saveRecordingBtn'); saveButton.disabled = true; saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; const selectedItem = document.getElementById('letterSelect').value; const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const fileName = `${selectedItem}.webm`; const filePath = `${currentUser.id}/${fileName}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, audioBlob, { upsert: true }); if (error) throw error; showFeedback(`Áudio para "${selectedItem}" salvo!`, 'success'); audioChunks = []; document.getElementById('audioPlayback').src = ''; } catch (error) { showFeedback(`Erro: ${error.message}`, 'error'); } finally { saveButton.disabled = false; saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar'; } }
function startTimer() { stopTimer(); let seconds = 0; const timerEl = document.getElementById('recordTimer'); timerEl.textContent = '00:00'; timerInterval = setInterval(() => { seconds++; const mins = Math.floor(seconds / 60).toString().padStart(2, '0'); const secs = (seconds % 60).toString().padStart(2, '0'); timerEl.textContent = `${mins}:${secs}`; }, 1000); }
function stopTimer() { clearInterval(timerInterval); }

// =======================================================
// PARTE 8: LÓGICA DO JOGO
// =======================================================
async function showStudentGame() { await checkForCustomActivities(); await loadGameState(); const canResume = gameState.currentQuestionIndex > 0 && gameState.attempts > 0 && !gameState.phaseCompleted; document.getElementById('startButton').innerHTML = canResume ? '<i class="fas fa-play"></i> Continuar Aventura' : '<i class="fas fa-play"></i> Começar Aventura'; showScreen('startScreen'); }
async function startGame() { unlockAudio(); gameState.isCustomActivity = false; await loadGameState(); if (gameState.phaseCompleted || gameState.attempts <= 0) { gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.phaseCompleted = false; gameState.questions = generateQuestions(gameState.currentPhase); } showScreen('gameScreen'); startQuestion(); connectStudentToRealtime(); }
async function startCustomActivity() { unlockAudio(); if (!currentUser.assigned_activity) return; gameState.isCustomActivity = true; gameState.questions = currentUser.assigned_activity.questions; gameState.currentPhase = "Reforço"; gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.phaseCompleted = false; showScreen('gameScreen'); startQuestion(); connectStudentToRealtime(); }
async function connectStudentToRealtime() { if (studentChannel) { await studentChannel.unsubscribe(); } const channelId = `teacher-room-${currentUser.teacher_id}`; studentChannel = supabaseClient.channel(channelId); studentChannel.subscribe(async (status) => { if (status === 'SUBSCRIBED') { await studentChannel.track({ student_id: currentUser.id, student_name: currentUser.name, online_at: new Date().toISOString(), }); } }); }
window.addEventListener('beforeunload', () => { if (studentChannel) { studentChannel.untrack(); supabaseClient.removeChannel(studentChannel); } });
async function loadGameState() { const { data: progressData, error } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single(); if (error && error.code !== 'PGRST116') { console.error("Erro ao carregar progresso:", error); } const assignedPhases = currentUser.assigned_phases && currentUser.assigned_phases.length > 0 ? currentUser.assigned_phases : [1]; const firstAssignedPhase = assignedPhases[0]; if (progressData?.game_state?.questions) { gameState = progressData.game_state; if (!assignedPhases.includes(gameState.currentPhase)) { gameState = { currentPhase: firstAssignedPhase, score: 0, attempts: 3, questions: generateQuestions(firstAssignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } if (!gameState.tutorialsShown) gameState.tutorialsShown = []; } else { gameState = { currentPhase: firstAssignedPhase, score: 0, attempts: 3, questions: generateQuestions(firstAssignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } }
async function saveGameState() { if (!currentUser || currentUser.type !== 'student' || gameState.isCustomActivity) return; await supabaseClient.from('progress').upsert({ student_id: currentUser.id, current_phase: gameState.currentPhase, game_state: gameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' }); }

function generateQuestions(phase) {
    let questions = [];
    const questionCount = 10;
    const shuffleAndTake = (arr, num) => [...arr].sort(() => 0.5 - Math.random()).slice(0, num);

    switch (phase) {
        case 1:
            questions = shuffleAndTake(PHASE_1_LETTER_SOUNDS, questionCount).map(item => ({ type: 'letter_sound', correctAnswer: item.letter, audioKey: item.audioKey, description: item.description, options: _generateOptions(item.letter, item.optionsPool, 4) }));
            break;
        case 2:
            questions = [{ type: 'memory_game' }];
            break;
        case 3:
            questions = shuffleAndTake(PHASE_3_SYLLABLE_F, questionCount).map(item => ({ type: 'click_form_syllable', ...item, correctAnswer: item.result, options: ['A','E','I','O','U'] }));
            break;
        case 4:
            questions = shuffleAndTake(PHASE_4_WORDS_F, questionCount).map(item => ({ type: 'f_word_search', ...item, correctAnswer: item.word, options: [...item.options].sort(() => 0.5 - Math.random()) }));
            break;
        case 5:
            questions = shuffleAndTake(PHASE_5_SOUND_PAIRS, questionCount).map(item => ({ type: 'sound_detective', image: item.image, correctAnswer: item.correct, options: [item.correct, item.incorrect].sort(() => 0.5 - Math.random()) }));
            break;
        case 6: 
            questions = shuffleAndTake(PHASE_6_SENTENCES_COUNT, questionCount).map(item => ({ type: 'count_words', ...item, correctAnswer: item.words.toString(), options: _generateOptions(item.words.toString(), ['2', '3', '4', '5'], 4) }));
            break;
        case 7:
            questions = shuffleAndTake(PHASE_7_SENTENCES_BUILD, questionCount).map(item => ({ type: 'click_build_sentence', image: item.image, correctAnswer: item.answer, options: [...item.sentence].sort(() => 0.5 - Math.random()) }));
            break;
        case 8: 
            const vowelSet = [...VOWELS, ...VOWELS].sort(() => 0.5 - Math.random());
            questions = vowelSet.map(vowel => ({ type: 'vowel_sound', correctAnswer: vowel, options: _generateOptions(vowel, VOWELS, 4) }));
            break;
        case 9:
            questions = shuffleAndTake(PHASE_9_SYLLABLE_COUNT, questionCount).map(item => ({ type: 'count_syllables', ...item, correctAnswer: item.syllables.toString(), options: _generateOptions(item.syllables.toString(), ['1', '2', '3', '4', '5'], 4) }));
            break;
        case 10: 
            questions = shuffleAndTake(PHASE_10_INITIAL_SYLLABLE, questionCount).map(item => ({ type: 'initial_syllable', ...item, options: _generateOptions(item.correctAnswer, ['BA','CA','DA','FA','GA','LA','MA','NA','PA','RA','SA','TA','VA'], 3) }));
            break;
        case 11:
            questions = shuffleAndTake(PHASE_11_F_POSITION, questionCount).map(item => ({ type: 'click_f_position', ...item, correctAnswer: item.syllable, options: _generateOptions(item.syllable, ['FA', 'FE', 'FI', 'FO', 'FU'], 4) }));
            break;
        case 12: 
            questions = shuffleAndTake(PHASE_12_WORD_TRANSFORM, questionCount).map(item => ({ type: 'word_transform', ...item, correctAnswer: item.correctAnswer, options: _generateOptions(item.correctAnswer, item.initialWord.split(''), 3) }));
            break;
        case 13:
             questions = shuffleAndTake(PHASE_13_INVERT_SYLLABLES, questionCount).map(item => ({ type: 'invert_syllables', ...item, correctAnswer: item.inverted, options: _generateOptions(item.inverted, PHASE_13_INVERT_SYLLABLES.map(i=>i.word), 4) }));
             break;
        case 14:
            questions = shuffleAndTake(PHASE_14_RHYMES, questionCount).map(item => {
                const rhymeOptionsSource = PHASE_14_RHYMES.map(r => r.rhyme).filter(r => r !== item.rhyme);
                return { type: 'find_rhyme', ...item, correctAnswer: item.rhyme, options: _generateOptions(item.rhyme, rhymeOptionsSource, 4) };
            });
            break;
        case 15:
            questions = shuffleAndTake(PHASE_15_PHONEME_COUNT, questionCount).map(item => ({ type: 'count_phonemes', ...item, correctAnswer: item.sounds.toString(), options: _generateOptions(item.sounds.toString(), ['2','3','4','5'], 4) }));
            break;
        case 16:
            questions = shuffleAndTake(PHASE_16_COMPLEX_SYLLABLES, questionCount).map(item => ({ type: 'complex_syllable', ...item, correctAnswer: item.syllable, options: _generateOptions(item.syllable, ['BRA','LHA','NHO','VRO','CRE'], 4) }));
            break;
        case 17:
            questions = shuffleAndTake(PHASE_17_RHYME_DISCRIMINATION, questionCount).map(item => ({ type: 'rhyme_discrimination', ...item, correctAnswer: item.correct, options: [item.correct, item.incorrect].sort(() => 0.5 - Math.random()) }));
            break;
        case 18:
            questions = shuffleAndTake(PHASE_18_INTRUDER_LETTER, questionCount).map(item => ({ type: 'intruder_letter', ...item, correctAnswer: item.intruder }));
            break;
        case 19:
            questions = shuffleAndTake(PHASE_19_WORD_DETECTIVE, questionCount).map(item => ({ type: 'word_detective', ...item, options: [...item.options].sort(() => 0.5 - Math.random()) }));
            break;
        case 20:
            questions = [{ type: 'speed_reading', words: shuffleAndTake(PHASE_20_SPEED_READING, 15) }];
            break;
    }
    return questions;
}

async function startQuestion() {
    if (gameState.phaseCompleted || !gameState.questions || !gameState.questions[gameState.currentQuestionIndex]) { return endPhase(); }
    
    // Limpeza da UI
    selectedItemForClickMove = null;
    const UIElements = ['audioQuestionArea', 'imageQuestionArea', 'lettersGrid', 'memoryGameGrid', 'interactiveArea', 'optionsArea', 'wordDisplay', 'questionText'];
    UIElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            if (['lettersGrid', 'memoryGameGrid', 'interactiveArea', 'optionsArea'].includes(id)) {
                el.innerHTML = '';
            } else {
                el.textContent = '';
            }
        }
    });

    const repeatAudioBtn = document.getElementById('repeatAudio');
    if(repeatAudioBtn) repeatAudioBtn.style.display = 'none';
    
    const attemptsEl = document.getElementById('attempts');
    if (attemptsEl) attemptsEl.parentElement.style.visibility = 'visible';
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    
    const renderMap = {
        'letter_sound': renderPhase1UI, 'memory_game': renderPhase2UI, 'click_form_syllable': renderPhase3UI,
        'f_word_search': renderPhase4UI, 'sound_detective': renderPhase5UI, 'count_words': renderPhase6UI,
        'click_build_sentence': renderPhase7UI, 'vowel_sound': renderPhase8UI, 'count_syllables': renderPhase9UI,
        'initial_syllable': renderPhase10UI, 'click_f_position': renderPhase11UI, 'word_transform': renderPhase12UI,
        'invert_syllables': renderPhase13UI, 'find_rhyme': renderPhase14UI, 'count_phonemes': renderPhase15UI,
        'complex_syllable': renderPhase16UI, 'rhyme_discrimination': renderPhase17UI, 'intruder_letter': renderPhase18UI,
        'word_detective': renderPhase19UI, 'speed_reading': renderPhase20UI
    };

    if (q && renderMap[q.type]) {
        renderMap[q.type](q);
        playTeacherAudio(`instruction_phase_${gameState.currentPhase}`, "Vamos lá!");
    } else {
        console.error("Tipo de questão desconhecido ou questão não encontrada:", q);
    }
    
    updateUI(); 
}

// =======================================================
// FUNÇÕES DE RENDERIZAÇÃO DAS FASES (REVISADAS E ROBUSTAS)
// =======================================================

function renderPhase1UI(q) { document.getElementById('audioQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('questionText').textContent = `Qual letra faz o som ${q.description}`; document.getElementById('repeatAudio').style.display = 'inline-block'; renderOptions(q.options, 'letter-button'); setTimeout(playCurrentAudio, 500); }
function renderPhase2UI(q) { const memoryGrid = document.getElementById('memoryGameGrid'); if (!memoryGrid) return; memoryGrid.innerHTML = ''; memoryGrid.style.display = 'grid'; document.getElementById('questionText').textContent = 'Encontre os pares de letras maiúsculas e minúsculas!'; document.getElementById('attempts').parentElement.style.visibility = 'hidden'; const shuffleAndTake = (arr, num) => [...arr].sort(() => 0.5 - Math.random()).slice(0, num); const letters = shuffleAndTake(ALPHABET, 8); const cards = [...letters, ...letters.map(l => l.toLowerCase())].sort(() => 0.5 - Math.random()); memoryGrid.innerHTML = cards.map(letter => ` <div class="memory-card" data-letter="${letter.toLowerCase()}"> <div class="card-inner"> <div class="card-face card-front"></div> <div class="card-face card-back">${letter}</div> </div> </div> `).join(''); gameState.score = 0; gameState.memoryGame = { flippedCards: [], matchedPairs: 0, totalPairs: letters.length, canFlip: true, mistakesMade: 0, startTime: Date.now() }; updateUI(); memoryGrid.querySelectorAll('.memory-card').forEach(card => card.addEventListener('click', () => handleCardFlip(card))); }
function renderPhase3UI(q) { const interactiveArea = document.getElementById('interactiveArea'); const optionsArea = document.getElementById('optionsArea'); if (!interactiveArea || !optionsArea) return; interactiveArea.style.display = 'flex'; optionsArea.style.display = 'flex'; document.getElementById('questionText').textContent = `Toque na vogal e depois no sinal de '+' para formar a sílaba da palavra ${q.word}.`; interactiveArea.innerHTML = ` <div class="syllable-base">${q.base}</div> <div class="syllable-dropzone" data-correct-vowel="${q.vowel}">+</div> `; optionsArea.innerHTML = q.options.map(opt => `<div class="clickable-item letter" data-value="${opt}">${opt}</div>`).join(''); setupClickToMoveInteraction(); }
function renderPhase4UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('questionText').textContent = 'Qual é o nome desta figura?'; renderOptions(q.options, 'word-option-button'); }
function renderPhase5UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('questionText').textContent = 'Qual é o nome correto desta figura?'; renderOptions(q.options, 'word-option-button'); }
function renderPhase6UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.sentence; document.getElementById('questionText').textContent = 'Quantas palavras tem nesta frase?'; renderOptions(q.options, 'letter-button'); }
function renderPhase7UI(q) { const interactiveArea = document.getElementById('interactiveArea'); const optionsArea = document.getElementById('optionsArea'); if (!interactiveArea || !optionsArea) return; interactiveArea.style.display = 'flex'; optionsArea.style.display = 'flex'; document.getElementById('questionText').textContent = 'Toque nas palavras na ordem certa para formar a frase.'; interactiveArea.innerHTML = `<div id="sentenceDropzone" class="sentence-dropzone empty"></div>`; optionsArea.innerHTML = q.options.map(opt => `<div class="clickable-item word" data-value="${opt}">${opt}</div>`).join(''); setupClickToMoveSentence(q.correctAnswer); }
function renderPhase8UI(q) { document.getElementById('audioQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('questionText').textContent = 'Qual VOGAL faz este som?'; document.getElementById('repeatAudio').style.display = 'inline-block'; renderOptions(q.options, 'letter-button'); setTimeout(playCurrentAudio, 500); }
function renderPhase9UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.word; document.getElementById('questionText').textContent = 'Quantas sílabas (pedaços) tem esta palavra?'; renderOptions(q.options, 'letter-button'); }
function renderPhase10UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = `__${q.word.substring(q.correctAnswer.length)}`; document.getElementById('questionText').textContent = 'Qual sílaba começa esta palavra?'; renderOptions(q.options, 'word-option-button'); }
function renderPhase11UI(q) { const interactiveArea = document.getElementById('interactiveArea'); const optionsArea = document.getElementById('optionsArea'); if (!interactiveArea || !optionsArea) return; interactiveArea.style.display = 'flex'; optionsArea.style.display = 'flex'; document.getElementById('questionText').textContent = 'Toque na sílaba e depois no espaço para completar a palavra.'; const parts = q.blanked.split('__'); interactiveArea.innerHTML = ` <span class="word-part">${parts[0]}</span> <div class="syllable-dropzone word-completion" data-correct-syllable="${q.correctAnswer}"></div> <span class="word-part">${parts[1]}</span> `; optionsArea.innerHTML = q.options.map(opt => `<div class="clickable-item syllable" data-value="${opt}">${opt}</div>`).join(''); setupClickToMoveInteraction(); }
function renderPhase12UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.initialWord; document.getElementById('questionText').textContent = `Se tirarmos "${q.toRemove}", qual palavra formamos?`; renderOptions(q.options, 'word-option-button'); }
function renderPhase13UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.imageInverted; document.getElementById('wordDisplay').textContent = q.word; document.getElementById('questionText').textContent = `Se invertermos as sílabas de ${q.word}, qual palavra formamos?`; renderOptions(q.options, 'word-option-button'); }
function renderPhase14UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.word; document.getElementById('questionText').textContent = `Qual palavra rima com ${q.word}?`; renderOptions(q.options, 'word-option-button'); }
function renderPhase15UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.word; document.getElementById('questionText').textContent = 'Quantos SONS (não letras) você ouve nesta palavra?'; renderOptions(q.options, 'letter-button'); }
function renderPhase16UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.blanked; document.getElementById('questionText').textContent = 'Qual sílaba complexa completa a palavra?'; renderOptions(q.options, 'word-option-button'); }
function renderPhase17UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.target; document.getElementById('questionText').textContent = `Qual palavra rima com ${q.target}?`; renderOptions(q.options, 'word-option-button'); }
function renderPhase18UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('wordDisplay').innerHTML = q.display.split('').map(letter => `<span class="clickable-letter">${letter}</span>`).join(''); document.getElementById('questionText').textContent = `Clique na letra intrometida da palavra.`; document.querySelectorAll('.clickable-letter').forEach(span => { span.addEventListener('click', () => selectAnswer(span.textContent)); }); }
function renderPhase19UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.sentence; document.getElementById('questionText').textContent = 'Qual palavra completa a frase?'; renderOptions(q.options, 'word-option-button'); }
function renderPhase20UI(q) { document.getElementById('questionText').textContent = 'Clique na palavra certa o mais rápido que puder!'; document.getElementById('attempts').parentElement.style.visibility = 'hidden'; gameState.speedReading = { words: q.words, currentIndex: 0, correctCount: 0, timer: null, timeLeft: 10 }; setupSpeedReadingScreen(); nextSpeedReadingWord(); }

function renderOptions(options, buttonClass) { const lettersGrid = document.getElementById('lettersGrid'); lettersGrid.style.display = 'grid'; lettersGrid.innerHTML = options.map(option => `<button class="${buttonClass}">${option}</button>`).join(''); lettersGrid.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e) => selectAnswer(e.target.textContent))); }

function handleCardFlip(card) { const { flippedCards, canFlip } = gameState.memoryGame; if (!canFlip || card.classList.contains('flipped')) return; card.classList.add('flipped'); flippedCards.push(card); if (flippedCards.length === 2) { gameState.memoryGame.canFlip = false; const [card1, card2] = flippedCards; if (card1.dataset.letter === card2.dataset.letter) { setTimeout(() => { card1.classList.add('matched'); card2.classList.add('matched'); gameState.memoryGame.matchedPairs++; gameState.score++; updateUI(); playSound('correct'); gameState.memoryGame.flippedCards = []; gameState.memoryGame.canFlip = true; if (gameState.memoryGame.matchedPairs === gameState.memoryGame.totalPairs) { playTeacherAudio('feedback_correct', 'Excelente'); showFeedback('Excelente! Todos os pares encontrados!', 'success'); playSound('phaseWin'); const endTime = Date.now(); const durationInSeconds = Math.round((endTime - gameState.memoryGame.startTime) / 1000); gameState.memoryGame.completionTime = durationInSeconds; document.getElementById('nextQuestion').style.display = 'block'; } }, 800); } else { gameState.memoryGame.mistakesMade++; playTeacherAudio('feedback_incorrect', 'Tente de novo'); playSound('incorrect'); updateUI(); setTimeout(() => { card1.classList.remove('flipped'); card2.classList.remove('flipped'); gameState.memoryGame.flippedCards = []; gameState.memoryGame.canFlip = true; }, 1200); } } }

async function selectAnswer(selectedAnswer) {
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q || q.type === 'memory_game' || q.type === 'speed_reading' ) return;

    document.querySelectorAll('.letter-button, .word-option-button, .clickable-letter, .clickable-item').forEach(btn => {
        btn.style.pointerEvents = 'none';
    });

    const isCorrect = String(selectedAnswer) === String(q.correctAnswer);

    const buttons = document.querySelectorAll('.letter-button, .word-option-button');
    buttons.forEach(btn => {
        if (btn.textContent === q.correctAnswer) btn.classList.add('correct');
        if (!isCorrect && btn.textContent === selectedAnswer) btn.classList.add('incorrect');
    });

    document.querySelectorAll('.clickable-letter').forEach(span => {
        if (span.textContent === q.correctAnswer) span.classList.add('correct');
        if (!isCorrect && span.textContent === selectedAnswer) span.classList.add('incorrect');
    });

    if (isCorrect) {
        playSound('correct');
        gameState.score++;
        showFeedback('Muito bem!', 'success');
        playTeacherAudio('feedback_correct', 'Acertou');
        setTimeout(nextQuestion, 1500); 
    } else {
        playSound('incorrect');
        gameState.attempts--;
        logStudentError({ question: q, selectedAnswer: selectedAnswer }).catch(console.error);
        showFeedback(`Quase! A resposta correta era "${q.correctAnswer}"`, 'error');
        playTeacherAudio('feedback_incorrect', 'Tente de novo');
        setTimeout(() => {
            if (gameState.attempts <= 0) {
                endPhase();
            } else {
                nextQuestion();
            }
        }, 2000);
    }

    updateUI();
    await saveGameState();
}

function nextQuestion() { 
    if (gameState.questions[0].type === 'memory_game' || gameState.questions[0].type === 'speed_reading') { 
        return endPhase(); 
    } 
    gameState.currentQuestionIndex++; 
    startQuestion(); 
}
async function endPhase() { 
    stopConfetti();
    if (gameState.speedReading && gameState.speedReading.timer) {
        clearTimeout(gameState.speedReading.timer);
    }
    
    let totalQuestions;
    let accuracy;

    if(gameState.questions[0]?.type === 'speed_reading') {
        totalQuestions = gameState.speedReading.words.length;
        gameState.score = gameState.speedReading.correctCount;
        accuracy = totalQuestions > 0 ? Math.round((gameState.score / totalQuestions) * 100) : 0;
    } else {
        totalQuestions = gameState.questions[0]?.type === 'memory_game' ? gameState.memoryGame.totalPairs : gameState.questions.length;
        accuracy = totalQuestions > 0 ? Math.round((gameState.score / totalQuestions) * 100) : 0;
    }
    
    const passed = accuracy >= 70; 
    
    if (passed) { 
        playSound('phaseWin');
        playTeacherAudio('feedback_phase_win', 'Fase concluída!');
        startConfetti();
    } 
    
    if (gameState.isCustomActivity) { 
        await logCustomActivityCompletion(accuracy); 
        await clearAssignedActivity(); 
    } else { 
        const q = gameState.questions[0]; 
        let metadata = null; 
        if (q?.type === 'memory_game' && gameState.memoryGame) { 
            metadata = { time_seconds: gameState.memoryGame.completionTime || 0, mistakes: gameState.memoryGame.mistakesMade || 0 }; 
        } 
        await logPhaseCompletionToHistory(accuracy, metadata); 
    } 
    
    showResultScreen(accuracy, passed); 
}
async function clearAssignedActivity() { await supabaseClient.from('students').update({ assigned_activity: null }).eq('id', currentUser.id); currentUser.assigned_activity = null; sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); }
function showResultScreen(accuracy, passed) { showScreen('resultScreen'); document.getElementById('finalScore').textContent = gameState.score; document.getElementById('accuracy').textContent = accuracy; const continueBtn = document.getElementById('continueButton'); const retryBtn = document.getElementById('retryButton'); const restartBtn = document.getElementById('restartButton'); if (gameState.isCustomActivity) { document.getElementById('resultTitle').textContent = 'Atividade de Reforço Concluída!'; document.getElementById('resultMessage').innerHTML = `Você acertou ${accuracy}% das questões. Continue praticando!`; continueBtn.style.display = 'none'; retryBtn.style.display = 'none'; restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; return; } const assignedPhases = currentUser.assigned_phases || [1]; const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase); const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1; if (passed) { document.getElementById('resultTitle').textContent = 'Parabéns!'; retryBtn.style.display = 'none'; gameState.phaseCompleted = true; saveGameState(); if (hasNextPhase) { document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!'; continueBtn.style.display = 'inline-block'; restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; } else { document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor para designar mais fases!'; continueBtn.style.display = 'none'; } } else { document.getElementById('resultTitle').textContent = 'Não desanime!'; document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!'; continueBtn.style.display = 'none'; retryBtn.style.display = 'inline-block'; restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; gameState.phaseCompleted = false; saveGameState(); } }
async function nextPhase() { playSound('click'); const assignedPhases = currentUser.assigned_phases || [1]; const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase); const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1; if (hasNextPhase) { const nextPhaseNum = assignedPhases[currentPhaseIndex + 1]; gameState.currentPhase = nextPhaseNum; gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.questions = generateQuestions(gameState.currentPhase); gameState.phaseCompleted = false; await saveGameState(); showScreen('gameScreen'); startQuestion(); } else { showResultScreen(100, true); } }
async function retryPhase() { playSound('click'); gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.phaseCompleted = false; gameState.questions = generateQuestions(gameState.currentPhase); await saveGameState(); showScreen('gameScreen'); startQuestion(); }
async function restartGame() { playSound('click'); await showStudentGame(); }
async function playCurrentAudio() {
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (q.type === 'vowel_sound') {
        playTeacherAudio(`vowel_${q.correctAnswer}`, q.correctAnswer);
    } else if(q.type === 'letter_sound') {
        playTeacherAudio(q.audioKey, q.correctAnswer);
    }
}

// =======================================================
// PARTE 9: SÍNTESE DE VOZ, ÁUDIOS E PERSONALIZAÇÃO
// =======================================================

const ALL_AUDIO_KEYS = {
    "Boas-Vindas e Feedback": { "welcome": "Mensagem de boas-vindas (Robô)", "feedback_correct": "Feedback de acerto", "feedback_incorrect": "Feedback de erro", "feedback_phase_win": "Feedback de fase concluída" },
    "Letras e Vogais": { ...Object.fromEntries(ALPHABET.map(l => [l, `Letra ${l}`])), ...Object.fromEntries(VOWELS.map(v => [`vowel_${v}`, `Vogal ${v}`])) },
    "Instruções das Fases": { ...Object.fromEntries(Object.keys(PHASE_DESCRIPTIONS).map(n => [`instruction_phase_${n}`, `Instrução - Fase ${n}`])) },
    "Palavras e Frases (Exemplos)": { "GATO": "Palavra 'GATO'", "PATO": "Palavra 'PATO'", "BOLA": "Palavra 'BOLA'" }
};

function initializeSpeech() { const checkVoices = (resolve) => { const voices = speechSynthesis.getVoices(); if (voices.length > 0) { selectedVoice = voices.find(v => v.lang === 'pt-BR'); if (!selectedVoice) selectedVoice = voices[0]; speechReady = true; resolve(); } }; return new Promise((resolve) => { if (speechSynthesis.getVoices().length > 0) { checkVoices(resolve); } else { speechSynthesis.onvoiceschanged = () => checkVoices(resolve); } }); }
function speak(text, onEndCallback) { if (!window.speechSynthesis) return; if (!speechReady) { initializeSpeech().then(() => speak(text, onEndCallback)); return; } speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'pt-BR'; if(selectedVoice) utterance.voice = selectedVoice; if (onEndCallback) utterance.onend = onEndCallback; speechSynthesis.speak(utterance); }
async function playTeacherAudio(key, fallbackText, onEndCallback) { const teacherId = SUPER_ADMIN_TEACHER_ID; if (!teacherId) { speak(fallbackText, onEndCallback); return; } try { const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` }); if (data && data.length > 0) { const audioFileName = data[0].name; const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${audioFileName}`); const audio = new Audio(publicUrl); audio.onerror = () => speak(fallbackText, onEndCallback); if (onEndCallback) audio.onended = onEndCallback; audio.play(); } else { speak(fallbackText, onEndCallback); } } catch (error) { console.error(`[Áudio] Erro ao buscar áudio:`, error); speak(fallbackText, onEndCallback); } }

// =======================================================
// PARTE 10: FUNÇÕES GERAIS DE UI E LOGS
// =======================================================
function showScreen(screenId) { 
    if(screenId !== 'resultScreen') stopConfetti();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    const screenEl = document.getElementById(screenId);
    if (screenEl) screenEl.classList.add('active'); 
}
function showModal(modalId) { const modalEl = document.getElementById(modalId); if (modalEl) modalEl.classList.add('show'); }
function closeModal(modalId) { const modalEl = document.getElementById(modalId); if (modalEl) modalEl.classList.remove('show'); }
function showCreateStudentForm() { const formEl = document.getElementById('createStudentForm'); if(formEl) formEl.style.display = 'block'; }
function hideCreateStudentForm() { const formEl = document.getElementById('createStudentForm'); if(formEl) { formEl.style.display = 'none'; document.getElementById('createStudentFormElement').reset(); } }
function showAudioSettingsModal() { 
    const letterSelect = document.getElementById('letterSelect');
    if (letterSelect) {
        let optionsHtml = '';
        for (const groupName in ALL_AUDIO_KEYS) {
            optionsHtml += `<optgroup label="${groupName}">`;
            for (const key in ALL_AUDIO_KEYS[groupName]) {
                optionsHtml += `<option value="${key}">${ALL_AUDIO_KEYS[groupName][key]}</option>`;
            }
            optionsHtml += '</optgroup>';
        }
        letterSelect.innerHTML = optionsHtml;
    }
    showModal('audioSettingsModal');
    const firstTab = document.querySelector('#audioSettingsModal .tab-btn');
    if(firstTab) showTab(firstTab);
}
function showTab(clickedButton) { const parent = clickedButton.closest('.modal-content'); if(!parent) return; const tabId = clickedButton.getAttribute('data-tab'); parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); clickedButton.classList.add('active'); parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active')); const tabContent = parent.querySelector('#' + tabId); if(tabContent) tabContent.classList.add('active'); }
function showFeedback(message, type = 'info') { const el = document.getElementById('globalFeedback'); if (!el) return; const textEl = el.querySelector('.feedback-text'); if (textEl) textEl.textContent = message; el.className = `feedback-toast show ${type}`; setTimeout(() => { el.className = el.className.replace('show', ''); }, 3000); }
function updateUI() {
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen && gameScreen.classList.contains('active') && gameState.questions && gameState.questions.length > 0) {
        let total = gameState.questions.length;
        const q = gameState.questions[gameState.currentQuestionIndex];

        if (q?.type === 'memory_game' && gameState.memoryGame) {
            total = gameState.memoryGame.totalPairs;
        }
        document.getElementById('attempts').textContent = `${gameState.attempts}`;
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('totalQuestions').textContent = total;
        document.getElementById('currentPhase').textContent = gameState.isCustomActivity ? "Reforço" : gameState.currentPhase;
        
        let progress = (gameState.currentQuestionIndex / gameState.questions.length) * 100;
        if(q?.type === 'speed_reading' && gameState.speedReading) {
            progress = (gameState.speedReading.currentIndex / gameState.speedReading.words.length) * 100;
        }
        const progressFill = document.getElementById('progressFill');
        if(progressFill) progressFill.style.width = `${progress}%`;
    }
}
function hideTutorial() { const tutorial = document.getElementById('tutorialOverlay'); if(tutorial) tutorial.classList.remove('show'); }
async function logStudentError({ question, selectedAnswer }) { if (!currentUser || currentUser.type !== 'student') { return; } const errorData = { student_id: currentUser.id, teacher_id: currentUser.teacher_id, class_id: currentUser.class_id, phase: gameState.currentPhase, question_type: question.type, correct_answer: String(question.correctAnswer), selected_answer: String(selectedAnswer) }; const { error } = await supabaseClient.from('student_errors').insert([errorData]); if (error) { console.error('Falha ao registrar erro:', error); } }
async function logPhaseCompletionToHistory(accuracy, metadata = null) {
    if (!currentUser || currentUser.type !== 'student') return;
    const { error } = await supabaseClient
        .from('phase_history')
        .insert({ student_id: currentUser.id, phase: gameState.currentPhase, accuracy: accuracy, metadata: metadata });
    if (error) console.error("Erro ao salvar histórico da fase:", error);
}
async function logCustomActivityCompletion(accuracy) {
    if (!currentUser || currentUser.type !== 'student') return;
    const activityData = {
        student_id: currentUser.id,
        teacher_id: currentUser.teacher_id,
        score: gameState.score,
        total_questions: gameState.questions[0]?.type === 'memory_game' ? gameState.memoryGame.totalPairs : gameState.questions.length,
        accuracy: accuracy,
    };
    const { error } = await supabaseClient.from('activity_history').insert([activityData]);
    if (error) console.error("Erro ao salvar histórico da atividade de reforço:", error);
}

// =======================================================
// PARTE 11: LÓGICA DE RELATÓRIOS E IA
// =======================================================
async function populateReportClassSelector() { const selector = document.getElementById('reportClassSelector'); selector.innerHTML = '<option value="">Carregando turmas...</option>'; document.getElementById('reportContentContainer').style.display = 'none'; const { data, error } = await supabaseClient.from('classes').select('id, name').eq('teacher_id', currentUser.id).order('name', { ascending: true }); if (error || !data) { selector.innerHTML = '<option value="">Erro ao carregar</option>'; return; } if (data.length === 0) { selector.innerHTML = '<option value="">Nenhuma turma encontrada</option>'; return; } selector.innerHTML = '<option value="">-- Selecione uma turma --</option>'; data.forEach(cls => { selector.innerHTML += `<option value="${cls.id}">${cls.name}</option>`; }); }
function handleReportClassSelection(event) { const classId = event.target.value; const reportContainer = document.getElementById('reportContentContainer'); if (classId) { reportContainer.style.display = 'block'; loadAndDisplayClassReports(classId); } else { reportContainer.style.display = 'none'; reportContainer.innerHTML = ''; } }

async function loadAndDisplayClassReports(classId) {
    const reportContainer = document.getElementById('reportContentContainer');
    reportContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando relatórios...</p>';
    try {
        const { data: students, error: studentsError } = await supabaseClient.from('students').select('id, name').eq('class_id', classId).order('name', { ascending: true });
        if (studentsError) throw studentsError;
        if (!students || students.length === 0) { reportContainer.innerHTML = `<div class="report-section"><p>Esta turma ainda não tem alunos cadastrados.</p></div>`; return; }
        const studentIds = students.map(s => s.id);
        const [errorsRes, activitiesRes] = await Promise.all([
            supabaseClient.from('student_errors').select('*').eq('class_id', classId),
            supabaseClient.from('activity_history').select('*').in('student_id', studentIds)
        ]);
        if (errorsRes.error || activitiesRes.error) throw errorsRes.error || activitiesRes.error;
        reportContainer.innerHTML = `<div class="report-section"><h4><i class="fas fa-fire"></i> Mapa de Calor da Turma</h4><p>Os itens que a turma mais errou.</p><div id="classHeatmapContainer"></div></div><div class="report-section"><h4><i class="fas fa-user-graduate"></i> Relatório Individual</h4><p>Clique em um aluno para ver seus erros e histórico de reforço.</p><div id="individualReportsContainer"></div></div>`;
        renderClassHeatmap(errorsRes.data, 'classHeatmapContainer');
        renderIndividualReports(students, errorsRes.data, activitiesRes.data, 'individualReportsContainer');
    } catch (error) { console.error("Erro detalhado ao carregar dados da turma:", error); reportContainer.innerHTML = '<p style="color: red; font-weight: bold;">Erro ao carregar dados da turma.</p>'; }
}

function renderClassHeatmap(errors, containerId) {
    const heatmapContainer = document.getElementById(containerId);
    if (!errors || errors.length === 0) { heatmapContainer.innerHTML = '<p>Nenhum erro registrado para esta turma. Ótimo trabalho! 🎉</p>'; return; }
    const errorCounts = errors.reduce((acc, error) => { if (error.correct_answer) { const key = `Fase ${error.phase}: "${error.correct_answer}"`; acc[key] = (acc[key] || 0) + 1; } return acc; }, {});
    if (Object.keys(errorCounts).length === 0) { heatmapContainer.innerHTML = '<p>Nenhum erro válido registrado.</p>'; return; }
    const sortedErrors = Object.entries(errorCounts).sort(([, a], [, b]) => b - a);
    const maxErrors = sortedErrors[0][1];
    let heatmapHTML = sortedErrors.map(([error, count]) => { const intensity = Math.max(0.1, count / maxErrors); const color = `rgba(255, 107, 107, ${intensity})`; return `<span class="heatmap-item" style="background-color: ${color};" title="${count} erro(s)">${error}</span>`; }).join('');
    heatmapContainer.innerHTML = heatmapHTML;
}

function renderIndividualReports(students, allErrors, allActivities, containerId) {
    const container = document.getElementById(containerId);
    if (!students || students.length === 0) { container.innerHTML = '<p>Nenhum aluno na turma.</p>'; return; }
    container.innerHTML = students.map(student => `<div class="student-item student-report-item" data-student-id="${student.id}" data-student-name="${student.name}"><div class="student-info"><h4>${student.name}</h4></div> <i class="fas fa-chevron-down"></i></div><div class="student-errors-details" id="errors-for-${student.id}" style="display: none;"></div>`).join('');
    container.querySelectorAll('.student-report-item').forEach(item => {
        item.addEventListener('click', () => {
            const studentId = item.dataset.studentId; const studentName = item.dataset.studentName; const detailsContainer = document.getElementById(`errors-for-${studentId}`); const isVisible = detailsContainer.style.display === 'block';
            container.querySelectorAll('.student-errors-details').forEach(d => d.style.display = 'none');
            container.querySelectorAll('.student-report-item i').forEach(i => i.className = 'fas fa-chevron-down');
            if (!isVisible) {
                detailsContainer.style.display = 'block'; item.querySelector('i').className = 'fas fa-chevron-up';
                const studentErrors = allErrors.filter(e => e.student_id === studentId);
                const studentActivities = allActivities.filter(a => a.student_id === studentId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                let reportHTML = '<h5>Principais Dificuldades</h5>';
                if (studentErrors.length > 0) {
                    const errorCounts = studentErrors.reduce((acc, error) => { if (error.correct_answer) { acc[error.correct_answer] = (acc[error.correct_answer] || 0) + 1; } return acc; }, {});
                    if (Object.keys(errorCounts).length > 0) { reportHTML += `<ul>${Object.entries(errorCounts).sort((a,b) => b[1]-a[1]).slice(0,5).map(([key, val]) => `<li>Erro em "${key}" (${val}x)</li>`).join('')}</ul>`; } 
                    else { reportHTML += '<p>Nenhum erro válido para exibir.</p>'; }
                } else { reportHTML += '<p>Nenhum erro registrado. Ótimo trabalho! 🌟</p>'; }
                reportHTML += '<h5 style="margin-top: 20px;"><i class="fas fa-star-of-life"></i> Histórico de Atividades de Reforço</h5>';
                if (studentActivities.length > 0) { reportHTML += `<ul class="activity-history-list">${studentActivities.map(act => `<li> <span>${new Date(act.created_at).toLocaleDateString('pt-BR')}</span> <strong>${act.score}/${act.total_questions} (${act.accuracy}%)</strong> ${act.accuracy >= 70 ? '✅' : '⚠️'} </li>`).join('')}</ul>`; } 
                else { reportHTML += '<p>Nenhuma atividade de reforço concluída.</p>'; }
                const safeStudentName = studentName.replace(/'/g, "\\'");
                reportHTML += `<div class="student-details-actions"><button class="modal-btn" onclick="showEvolutionChart('${studentId}', '${safeStudentName}')"><i class="fas fa-chart-line"></i> Ver Evolução</button><button class="modal-btn" onclick="generateAndAssignActivity('${studentId}', '${safeStudentName}')"><i class="fas fa-magic"></i> Criar Atividade</button><button class="modal-btn primary" onclick="handleGenerateLessonPlan('${studentId}', '${safeStudentName}')"><i class="fas fa-rocket"></i> Analisar com IA</button></div>`;
                detailsContainer.innerHTML = reportHTML;
            }
        });
    });
}

async function showEvolutionChart(studentId, studentName) {
    showFeedback(`Carregando evolução de ${studentName}...`, 'info');
    try {
        const { data, error } = await supabaseClient.from('phase_history').select('phase, accuracy, created_at').eq('student_id', studentId).order('created_at', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) { showFeedback(`${studentName} ainda não tem histórico de fases concluídas.`, 'info'); return; }
        document.getElementById('chartModalTitle').textContent = `Evolução de ${studentName}`;
        const chartCanvas = document.getElementById('myChartCanvas');
        if (currentEvolutionChart) currentEvolutionChart.destroy();
        currentEvolutionChart = new Chart(chartCanvas, { type: 'line', data: { labels: data.map(item => `Fase ${item.phase} (${new Date(item.created_at).toLocaleDateString('pt-BR')})`), datasets: [{ label: 'Precisão (%)', data: data.map(item => item.accuracy), fill: true, backgroundColor: 'rgba(118, 75, 162, 0.2)', borderColor: '#764ba2', tension: 0.1 }] }, options: { responsive: true, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentual de Acerto' } } }, plugins: { tooltip: { callbacks: { label: ctx => `Acertos: ${ctx.raw}%` } } } } });
        showModal('chartModal');
    } catch(err) { console.error("Erro ao carregar gráfico de evolução:", err); showFeedback(`Erro ao buscar dados de ${studentName}.`, 'error'); }
}

async function handleGenerateLessonPlan(studentId, studentName) {
    const aiContainer = document.getElementById('aiTipsContent');
    aiContainer.innerHTML = '<div class="loading-ai"><i class="fas fa-spinner fa-spin"></i> Analisando e gerando plano de aula...</div>';
    showModal('aiTipsModal');
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "SUA_CHAVE_API_DO_GOOGLE_GEMINI_AQUI") {
        aiContainer.innerHTML = `<p class="error"><strong>Erro de Configuração:</strong> A chave de API do Gemini não foi inserida no arquivo script.js.</p>`;
        return; 
    }

    try {
        const { data: studentErrors, error } = await supabaseClient.from('student_errors').select('*').eq('student_id', studentId).limit(20);
        if (error || !studentErrors || studentErrors.length === 0) { aiContainer.innerHTML = '<p>Este aluno não possui erros registrados para análise.</p>'; return; }
        const errorSummary = studentErrors.map(e => `Na fase '${PHASE_DESCRIPTIONS[e.phase]}', a resposta correta era '${e.correct_answer}' e o aluno escolheu '${e.selected_answer}'.`).join('\n');
        const prompt = `Você é um especialista em pedagogia da alfabetização no Brasil. Um professor precisa de um relatório e uma atividade para o aluno ${studentName}, que apresentou as seguintes dificuldades: ${errorSummary}. Crie uma resposta em duas partes. A resposta DEVE seguir EXATAMENTE esta estrutura de Markdown: ## 🔍 Análise Pedagógica (Faça um parágrafo curto e claro resumindo a principal dificuldade do aluno com base nos erros. Ex: "A análise indica uma dificuldade recorrente na distinção de fonemas surdos e sonoros, especificamente com os pares P/B e F/V.") ## 💡 Sugestão de Atividade Prática (Mini Plano de Aula) ### 🎯 Foco da Atividade: (Descreva em uma frase o ponto a ser trabalhado). ### ✂️ Materiais Necessários: (Liste 2 ou 3 itens simples de sala de aula). ### 👣 Passo a Passo (10-15 min): (Crie 3 passos curtos e práticos. Comece cada passo com "1.", "2.", etc.).`;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) });
        if (!response.ok) throw new Error('Erro na API do Gemini');
        const result = await response.json();
        if (result.candidates?.[0].content?.parts?.[0]) { let text = result.candidates[0].content.parts[0].text; text = text.replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/\n(\d)\. (.*)/g, '<p class="lesson-step"><strong>Passo $1:</strong> $2</p>').replace(/\n/g, '<br>'); aiContainer.innerHTML = text; } 
        else { throw new Error("Resposta da IA em formato inesperado."); }
    } catch (err) { console.error("Falha ao gerar o plano de aula com a IA:", err); aiContainer.innerHTML = `<p class="error"><strong>Desculpe, ocorreu um erro ao gerar a atividade.</strong></p>`; }
}
async function generateAndAssignActivity(studentId, studentName) {
    showFeedback(`Gerando atividade de reforço para ${studentName}...`, 'info');
    const { data: studentErrors, error } = await supabaseClient.from('student_errors').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20);
    if (error || !studentErrors || studentErrors.length < 1) { showFeedback(`O aluno ${studentName} não tem erros recentes para gerar uma atividade.`, 'error'); return; }
    const errorCounts = studentErrors.reduce((acc, err) => { const key = `${err.phase}|${err.correct_answer}`; if (!acc[key]) { acc[key] = { count: 0, questionTemplate: err }; } acc[key].count++; return acc; }, {});
    const topErrors = Object.values(errorCounts).sort((a, b) => b.count - a.count);
    let customQuestions = []; const questionCount = 10; let safeguard = 0;
    while (customQuestions.length < questionCount && topErrors.length > 0 && safeguard < 50) {
        const randomErrorTemplate = topErrors[Math.floor(Math.random() * topErrors.length)].questionTemplate;
        const newQuestion = generateSingleQuestionFromError(randomErrorTemplate);
        if (newQuestion) { customQuestions.push(newQuestion); }
        safeguard++;
    }
    if (customQuestions.length < 1) { showFeedback(`Não foi possível gerar uma atividade.`, 'error'); return; }
    const activity = { questions: customQuestions.sort(() => 0.5 - Math.random()) };
    const { error: updateError } = await supabaseClient.from('students').update({ assigned_activity: activity }).eq('id', studentId);
    if (updateError) { showFeedback(`Erro ao designar atividade: ${updateError.message}`, 'error'); } 
    else { showFeedback(`Atividade de reforço enviada para ${studentName}!`, 'success'); }
}

function generateSingleQuestionFromError(errorTemplate) {
    const phase = parseInt(errorTemplate.phase);
    const correctAnswer = errorTemplate.correct_answer;

    switch(phase) {
        case 1:
            const letterSoundData = PHASE_1_LETTER_SOUNDS.find(l => l.letter === correctAnswer);
            if (!letterSoundData) return null;
            return { type: 'letter_sound', ...letterSoundData, options: _generateOptions(correctAnswer, letterSoundData.optionsPool, 4) };
        case 2:
            return null; 
        case 3:
            const syllableFData = PHASE_3_SYLLABLE_F.find(s => s.result === correctAnswer);
            if (!syllableFData) return null;
            return { type: 'click_form_syllable', ...syllableFData, correctAnswer: syllableFData.result, options: ['A','E','I','O','U'] };
        case 4:
            const wordData = PHASE_4_WORDS_F.find(w => w.word === correctAnswer) || PHASE_4_WORDS_F[0];
            return { type: 'f_word_search', ...wordData, correctAnswer: wordData.word, options: [...wordData.options].sort(() => 0.5-Math.random()) };
        case 5:
            const pairData = PHASE_5_SOUND_PAIRS.find(p => p.correct === correctAnswer) || PHASE_5_SOUND_PAIRS[0];
            return { type: 'sound_detective', ...pairData, options: [pairData.correct, pairData.incorrect].sort(()=>0.5-Math.random()) };
        case 6:
            const sentenceCountData = PHASE_6_SENTENCES_COUNT.find(s => String(s.words) === String(correctAnswer));
            if (!sentenceCountData) return null;
            return { type: 'count_words', ...sentenceCountData, correctAnswer: correctAnswer, options: _generateOptions(correctAnswer, ['2', '3', '4', '5'], 4) };
        case 7:
             const sentenceBuildData = PHASE_7_SENTENCES_BUILD.find(s => s.answer === correctAnswer);
             if (!sentenceBuildData) return null;
             return { type: 'click_build_sentence', image: sentenceBuildData.image, correctAnswer: sentenceBuildData.answer, options: [...sentenceBuildData.sentence].sort(() => 0.5 - Math.random()) };
        case 8:
            return { type: 'vowel_sound', correctAnswer: correctAnswer, options: _generateOptions(correctAnswer, VOWELS, 4) };
        case 9:
            const syllableData = PHASE_9_SYLLABLE_COUNT.find(p => String(p.syllables) === String(correctAnswer)) || PHASE_9_SYLLABLE_COUNT[0];
            return { type: 'count_syllables', ...syllableData, correctAnswer: syllableData.syllables.toString(), options: _generateOptions(syllableData.syllables.toString(), ['1','2','3','4'], 4) };
        case 10:
            const initialSyllableData = PHASE_10_INITIAL_SYLLABLE.find(p => p.correctAnswer === correctAnswer) || PHASE_10_INITIAL_SYLLABLE[0];
            return { type: 'initial_syllable', ...initialSyllableData, options: _generateOptions(initialSyllableData.correctAnswer, ['BA','CA','DA','FA','GA','LA','MA','NA','PA','RA','SA','TA','VA'], 4) };
        case 11:
            const fPositionData = PHASE_11_F_POSITION.find(p => p.syllable === correctAnswer);
            if (!fPositionData) return null;
            return { type: 'click_f_position', ...fPositionData, options: _generateOptions(correctAnswer, ['FA', 'FE', 'FI', 'FO', 'FU'], 4) };
        case 12:
            const wordTransformData = PHASE_12_WORD_TRANSFORM.find(t => t.correctAnswer === correctAnswer);
            if (!wordTransformData) return null;
            const distractorOptions = [wordTransformData.correctAnswer, wordTransformData.toRemove, wordTransformData.initialWord.substring(0, 2)];
            return { type: 'word_transform', ...wordTransformData, options: _generateOptions(correctAnswer, distractorOptions, 3) };
        case 13:
            const invertSyllableData = PHASE_13_INVERT_SYLLABLES.find(i => i.inverted === correctAnswer);
            if (!invertSyllableData) return null;
            const allWords = PHASE_13_INVERT_SYLLABLES.map(i => i.word);
            return { type: 'invert_syllables', ...invertSyllableData, correctAnswer: correctAnswer, options: _generateOptions(correctAnswer, allWords, 4) };
        case 14:
            const rhymeData = PHASE_14_RHYMES.find(r => r.rhyme === correctAnswer) || PHASE_14_RHYMES.find(r => r.word === errorTemplate.question?.word);
            if (!rhymeData) return null;
            const rhymeOptions = PHASE_14_RHYMES.map(r => r.rhyme);
            return { type: 'find_rhyme', ...rhymeData, correctAnswer: rhymeData.rhyme, options: _generateOptions(rhymeData.rhyme, rhymeOptions, 4) };
        case 15:
            const phonemeData = PHASE_15_PHONEME_COUNT.find(p => String(p.sounds) === String(correctAnswer));
            if (!phonemeData) return null;
            return { type: 'count_phonemes', ...phonemeData, correctAnswer: correctAnswer, options: _generateOptions(correctAnswer, ['2','3','4','5'], 4) };
        case 16:
            const complexData = PHASE_16_COMPLEX_SYLLABLES.find(c => c.syllable === correctAnswer);
            if (!complexData) return null;
            return { type: 'complex_syllable', ...complexData, correctAnswer: correctAnswer, options: _generateOptions(correctAnswer, ['BRA','LHA','NHO','VRO','CRE'], 4) };
        case 17:
            const rhymeDiscriminationData = PHASE_17_RHYME_DISCRIMINATION.find(r => r.correct === correctAnswer);
            if (!rhymeDiscriminationData) return null;
            return { type: 'rhyme_discrimination', ...rhymeDiscriminationData, correctAnswer: rhymeDiscriminationData.correct, options: [rhymeDiscriminationData.correct, rhymeDiscriminationData.incorrect].sort(() => 0.5 - Math.random()) };
        case 18:
            const intruderData = PHASE_18_INTRUDER_LETTER.find(i => i.intruder === correctAnswer);
            if (!intruderData) return null;
            return { type: 'intruder_letter', ...intruderData, correctAnswer: intruderData.intruder };
        case 19:
            const detectiveData = PHASE_19_WORD_DETECTIVE.find(d => d.answer === correctAnswer);
            if (!detectiveData) return null;
            return { type: 'word_detective', ...detectiveData, options: [...detectiveData.options].sort(() => 0.5 - Math.random()) };
        case 20:
            return null;
        default:
            return null;
    }
}

async function checkForCustomActivities() {
    if (!currentUser || currentUser.type !== 'student') return;
    const { data, error } = await supabaseClient.from('students').select('assigned_activity').eq('id', currentUser.id).single();
    if (error) { console.error("Erro ao checar atividades:", error); return; }
    currentUser.assigned_activity = data.assigned_activity;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    const customActivityBtn = document.getElementById('startCustomActivityBtn');
    if (currentUser.assigned_activity && currentUser.assigned_activity.questions) { customActivityBtn.style.display = 'inline-block'; } else { customActivityBtn.style.display = 'none'; }
}

// =======================================================
// NOVA LÓGICA DE JOGO (CLICK-TO-MOVE) - ROBUSTA
// =======================================================

function setupClickToMoveInteraction() {
    const items = document.querySelectorAll('.clickable-item');
    const dropzone = document.querySelector('.syllable-dropzone');
    if (!items.length || !dropzone) return; 

    items.forEach(item => {
        item.addEventListener('click', () => {
            if (selectedItemForClickMove) {
                selectedItemForClickMove.classList.remove('selected');
            }
            item.classList.add('selected');
            selectedItemForClickMove = item;
            playSound('click');
        });
    });

    dropzone.addEventListener('click', () => {
        if (!selectedItemForClickMove) {
            showFeedback("Primeiro, selecione um item abaixo!", "info");
            return;
        }

        playSound('drop');
        dropzone.textContent = selectedItemForClickMove.textContent;
        dropzone.classList.add('filled');
        selectedItemForClickMove.style.visibility = 'hidden';

        document.querySelectorAll('.clickable-item, .syllable-dropzone').forEach(el => el.style.pointerEvents = 'none');

        const q = gameState.questions[gameState.currentQuestionIndex];
        const selectedValue = selectedItemForClickMove.dataset.value;
        const isCorrect = selectedValue === (q.correctAnswer || q.vowel || q.syllable);
        
        dropzone.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        if (isCorrect) {
            playSound('correct');
            gameState.score++;
            showFeedback('Muito bem!', 'success');
            playTeacherAudio('feedback_correct', 'Acertou');
            setTimeout(nextQuestion, 1500);
        } else {
            playSound('incorrect');
            gameState.attempts--;
            logStudentError({ question: q, selectedAnswer: selectedValue }).catch(console.error);
            showFeedback(`Quase!`, 'error');
            playTeacherAudio('feedback_incorrect', 'Tente de novo');
            setTimeout(() => {
                if (gameState.attempts <= 0) { endPhase(); } 
                else { nextQuestion(); }
            }, 2000);
        }
        updateUI();
        saveGameState();
    });
}

function setupClickToMoveSentence(correctAnswer) {
    const items = document.querySelectorAll('.clickable-item');
    const dropzone = document.getElementById('sentenceDropzone');
    if (!items.length || !dropzone) return; 

    dropzone.classList.remove('empty');

    items.forEach(item => {
        item.addEventListener('click', () => {
            playSound('click');
            item.style.visibility = 'hidden';
            
            const newWordInSentence = document.createElement('div');
            newWordInSentence.className = 'word-in-sentence';
            newWordInSentence.textContent = item.textContent;
            newWordInSentence.dataset.value = item.dataset.value;
            dropzone.appendChild(newWordInSentence);
            
            const hiddenItems = document.querySelectorAll('.clickable-item[style*="visibility: hidden"]');
            if (hiddenItems.length === items.length) {
                document.querySelectorAll('.clickable-item').forEach(el => el.style.pointerEvents = 'none');
                const constructedSentence = Array.from(dropzone.children).map(child => child.dataset.value).join(' ');
                dropzone.classList.add(constructedSentence === correctAnswer ? 'correct' : 'incorrect');
                selectAnswer(constructedSentence);
            }
        });
    });
}

function setupSpeedReadingScreen() {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('interactiveArea').style.display = 'block';
    document.getElementById('interactiveArea').innerHTML = `<div class="timer-bar-container"><div id="timerBar" class="timer-bar"></div></div>`;
}

function nextSpeedReadingWord() {
    const { speedReading } = gameState;
    if (speedReading.currentIndex >= speedReading.words.length) {
        return endPhase();
    }

    const currentWordData = speedReading.words[speedReading.currentIndex];
    document.getElementById('imageEmoji').textContent = currentWordData.image;

    const allWords = PHASE_20_SPEED_READING.map(w => w.word);
    const options = _generateOptions(currentWordData.word, allWords, 3);
    
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = options.map(opt => `<button class="word-option-button">${opt}</button>`).join('');
    
    lettersGrid.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => handleSpeedReadingAnswer(btn.textContent === currentWordData.word, btn));
    });

    startTimerBar(10);
}

function handleSpeedReadingAnswer(isCorrect, button) {
    clearTimeout(gameState.speedReading.timer);
    document.querySelectorAll('#lettersGrid button').forEach(b => b.disabled = true);

    if (isCorrect) {
        playSound('correct');
        button.classList.add('correct');
        gameState.speedReading.correctCount++;
        gameState.score = gameState.speedReading.correctCount;
    } else {
        playSound('incorrect');
        if (button) button.classList.add('incorrect');
    }
    updateUI();
    
    gameState.speedReading.currentIndex++;
    setTimeout(nextSpeedReadingWord, 1200);
}

function startTimerBar(seconds) {
    const timerBar = document.getElementById('timerBar');
    if (!timerBar) return;
    
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    
    setTimeout(() => {
        timerBar.style.transition = `width ${seconds}s linear`;
        timerBar.style.width = '0%';
    }, 100);

    gameState.speedReading.timer = setTimeout(() => {
        handleSpeedReadingAnswer(false, null);
    }, seconds * 1000);
}


// =======================================================
// EFEITO DE CONFETTI
// =======================================================
function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let particles = [];
    const particleCount = 200;
    const colors = ["#4ECDC4", "#FF6B6B", "#FFD700", "#667EEA", "#764BA2"];

    function Particle(x, y) {
        this.x = x; this.y = y;
        this.radius = Math.random() * 6 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vx = Math.random() * 10 - 5;
        this.vy = Math.random() * -20 - 5;
        this.gravity = 0.4;
    }

    Particle.prototype.update = function() { this.vy += this.gravity; this.x += this.vx; this.y += this.vy; };
    Particle.prototype.draw = function(ctx) { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); ctx.closePath(); };

    for (let i = 0; i < particleCount; i++) { particles.push(new Particle(width / 2, height)); }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(ctx); });
        particles = particles.filter(p => p.y < height && p.x > 0 && p.x < width);
        if (particles.length > 0) { confettiAnimationId = requestAnimationFrame(animate); } 
        else { stopConfetti(); }
    }
    animate();
}

function stopConfetti() {
    cancelAnimationFrame(confettiAnimationId);
    const canvas = document.getElementById('confettiCanvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
    }
}

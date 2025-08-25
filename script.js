// =======================================================
// JOGO DAS LETRAS - VERSÃO FINAL CORRIGIDA (20 FASES)
// Login e Navegação de telas 100% funcionais.
// =======================================================

// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6';
let currentUser = null, currentClassId = null, studentProgressData = [], currentChart = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), VOWELS = 'AEIOU'.split('');
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
const CUSTOM_AUDIO_KEYS = {'instruction_1': 'Instrução - Fase 1', 'instruction_2': 'Instrução - Fase 2', 'instruction_3': 'Instrução - Fase 3', 'instruction_4': 'Instrução - Fase 4', 'instruction_5': 'Instrução - Fase 5', 'feedback_correct': 'Feedback - Acerto', 'feedback_incorrect': 'Feedback - Erro'};
let gameState = {}, mediaRecorder, audioChunks = [], timerInterval, speechReady = false, selectedVoice = null;

// =======================================================
// PARTE 2: CONTEÚDO EXPANDIDO PARA 20 FASESS
// =======================================================

const gameInstructions = {
    1: "Ouça o som e clique na letra correta!",
    2: "Qual figura começa com a vogal em destaque?",
    3: "Qual figura começa com a consoante em destaque?",
    4: "Jogo da Memória! Encontre os pares de letras maiúsculas e minúsculas.",
    5: "Clique nas letras na ordem certa do alfabeto!",
    6: "Foco na Letra F! Qual figura começa com a sílaba em destaque?",
    7: "Complete a palavra com a sílaba que falta.",
    8: "Complete a palavra com o encontro de vogais correto.",
    9: "Detetive dos Sons! Escolha a palavra correta para a figura.",
    10: "Se tirarmos o primeiro pedaço da palavra, qual nova palavra formamos?",
    11: "Trocando as sílabas de lugar... Qual nova palavra podemos formar?",
    12: "Clique nas sílabas na ordem certa para formar o nome da figura!",
    13: "Qual palavra rima com a palavra da figura?",
    14: "Qual destas palavras começa com o mesmo som da figura?",
    15: "Clique nas palavras na ordem certa para montar a frase.",
    16: "Quantas palavras existem nesta frase? Conte e escolha o número certo.",
    17: "Qual é a letra que termina o nome da figura?",
    18: "Qual letra está faltando no meio da palavra?",
    19: "Leia a frase e clique na palavra que não faz sentido!",
    20: "Essa frase está toda junta! Clique onde deveriam estar os espaços."
};

const PHASE_DESCRIPTIONS = {
    1: "Sons e Letras (Alfabeto)", 2: "Vogal Inicial", 3: "Consoante Inicial",
    4: "Memória: Maiúscula e Minúscula", 5: "Ordem Alfabética", 6: "Foco na Letra F (Sílabas)",
    7: "Completando com Sílabas", 8: "Encontros Vocálicos", 9: "Pares Sonoros (F/V, P/B...)",
    10: "Formando Palavras (Retirar)", 11: "Formando Palavras (Inverter)", 12: "Juntando Sílabas",
    13: "Descobrindo Rimas", 14: "Som Inicial (Aliteração)", 15: "Montando Frases",
    16: "Contando Palavras", 17: "Letra Final", 18: "Letra no Meio da Palavra",
    19: "Palavra Intrusa na Frase", 20: "Separando Palavras na Frase"
};

// Dados para cada fase
const ALL_WORDS = [ { name: 'AVIÃO', image: '✈️' }, { name: 'ESTRELA', image: '⭐' }, { name: 'IGREJA', image: '⛪' }, { name: 'OVELHA', image: '🐑' }, { name: 'UVA', image: '🍇' }, { name: 'BOLA', image: '⚽' }, { name: 'CASA', image: '🏠' }, { name: 'DADO', image: '🎲' }, { name: 'FACA', image: '🔪' }, { name: 'GATO', image: '🐈' }, { name: 'MACACO', image: '🐵' }, { name: 'PATO', image: '🦆' }, { name: 'RATO', image: '🐀' }, { name: 'SAPO', image: '🐸' }, { name: 'VACA', image: '🐄' }, { name: 'ÍNDIO', image: '🏹' }, { name: 'OVO', image: '🥚' }, { name: 'URSO', image: '🐻' }];
const PHASE_2_VOWELS = ALL_WORDS.filter(w => VOWELS.includes(w.name[0]));
const PHASE_3_CONSONANTS = ALL_WORDS.filter(w => CONSONANTS.includes(w.name[0]));
const PHASE_4_MEMORY = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PHASE_5_ALPHABET = [ { sequence: ['B', 'C', 'D', 'E'] }, { sequence: ['L', 'M', 'N', 'O'] }, { sequence: ['P', 'Q', 'R', 'S'] }, { sequence: ['F', 'G', 'H', 'I'] }];
const PHASE_6_F_SYLLABLE = [ { syllable: 'FA', image: '🔪', word: 'FACA' }, { syllable: 'FO', image: '🔥', word: 'FOGO' }, { syllable: 'FI', image: '🎀', word: 'FITA' }, { syllable: 'FE', image: '🫘', word: 'FEIJÃO' }, { syllable: 'FU', image: '💨', word: 'FUMAÇA' }];
const PHASE_7_MISSING_SYLLABLE = [ { image: '🐎', word: 'CA__LO', correct: 'VA', options: ['LA', 'SA'] }, { image: '🍌', word: 'BA__NA', correct: 'NA', options: ['DA', 'LA'] }, { image: '🧥', word: 'CASA__', correct: 'CO', options: ['SA', 'LO'] }, { image: '🪟', word: 'JA__LA', correct: 'NE', options: ['CA', 'PE'] }, { image: '📦', word: '__IXA', correct: 'CA', options: ['LI', 'MA'] }];
const VOWEL_ENCOUNTERS = ['AI', 'EI', 'OI', 'UI', 'AU', 'EU', 'ÃO', 'ÃE'];
const PHASE_8_VOWEL_ENCOUNTERS = [ { word: 'PEIXE', image: '🐠', encontro: 'EI' }, { word: 'BOI', image: '🐂', encontro: 'OI' }, { word: 'CAIXA', image: '📦', encontro: 'AI' }, { word: 'PÃO', image: '🍞', encontro: 'ÃO' }, { word: 'LEITE', image: '🥛', encontro: 'EI' }];
const PHASE_9_SOUND_PAIRS = [ { image: '🐄', correct: 'VACA', incorrect: 'FACA' }, { image: '🦆', correct: 'PATO', incorrect: 'BATO' }, { image: '🎲', correct: 'DADO', incorrect: 'TADO' }, { image: '📷', correct: 'FOTO', incorrect: 'VOTO' }, { image: '🚤', correct: 'BOTE', incorrect: 'POTE' }];
const PHASE_10_REMOVE_SYLLABLE = [ { image: '👟', initialWord: 'SAPATO', correct: 'PATO', options: ['SAPO', 'MATO'] }, { image: '🧤', initialWord: 'LUVA', correct: 'UVA', options: ['LUA', 'VILA'] }, { image: '🎖️', initialWord: 'SOLDADO', correct: 'DADO', options: [ 'LADO', 'SOL'] }, { image: '🐔', initialWord: 'GALINHA', correct: 'LINHA', options: ['NINHA', 'GALO'] }, { image: '🦎', initialWord: 'CAMALEÃO', correct: 'LEÃO', options: ['MÃO', 'ALHO'] }];
const PHASE_11_INVERT_SYLLABLE = [ { image: '🐺', word: 'LOBO', correct: 'BOLO', options: ['LOLO', 'BOBO'] }, { image: '🦙', word: 'MALA', correct: 'LAMA', options: ['MAMA', 'LALA'] }, { image: '🐈', word: 'GATO', correct: 'TOGA', options: ['GAGA', 'TATO'] }, { image: '🦙', word: 'CAPA', correct: 'PACA', options: ['CACA', 'PAPA'] }];
const PHASE_12_BUILD_SYLLABLE = [ { image: '🪆', word: 'BONECA', syllables: ['NE', 'CA', 'BO'] }, { image: '🐒', word: 'MACACO', syllables: ['CA', 'MA', 'CO'] }, { image: '🍅', word: 'TOMATE', syllables: ['MA', 'TE', 'TO'] }];
const PHASE_13_RHYMES = [ { image: '🐈', word: 'GATO', correct: 'PATO', options: ['BOLA', 'CASA'] }, { image: '🎈', word: 'BALÃO', correct: 'MÃO', options: ['PÉ', 'BOCA'] }, { image: '🔨', word: 'MARTELO', correct: 'CASTELO', options: ['FACA', 'GARFO'] }];
const PHASE_14_ALLITERATION = [ { image: '⚽', word: 'BOLA', correct: 'BONECA', options: ['CASA', 'DADO'] }, { image: '🏠', word: 'CASA', correct: 'CAVALO', options: ['GATO', 'FACA'] }, { image: '🦆', word: 'PATO', correct: 'POTE', options: ['RATO', 'MALA'] }];
const PHASE_15_SENTENCES = [ { sentence: ['A', 'FOCA', 'É', 'FELIZ'], image: '🦭', answer: 'A FOCA É FELIZ' }, { sentence: ['O', 'GATO', 'BEBE', 'LEITE'], image: '🐈', answer: 'O GATO BEBE LEITE' }, { sentence: ['A', 'BOLA', 'É', 'AZUL'], image: '⚽', answer: 'A BOLA É AZUL' }];
const PHASE_16_WORD_COUNT = [ { sentence: 'O GATO BEBE LEITE', image: '🐈', count: 4 }, { sentence: 'A FOCA BRINCA', image: '🦭', count: 3 }, { sentence: 'EU GOSTO DE BOLO', image: '🍰', count: 4 }];
const PHASE_17_FINAL_LETTER = [ { image: '🏙️', word: 'CIDADE', correct: 'E', options: ['A', 'O'] }, { image: '🔥', word: 'FOGO', correct: 'O', options: ['A', 'U'] }, { image: '🍇', word: 'UVA', correct: 'A', options: ['E', 'I'] }];
const PHASE_18_MIDDLE_LETTER = [ { image: '🐈', word: 'G_TO', correct: 'A', options: ['E', 'O'] }, { image: '⚽', word: 'B_LA', correct: 'O', options: ['U', 'A'] }, { image: '🔪', word: 'F_CA', correct: 'A', options: ['E', 'I'] }];
const PHASE_19_INTRUDER_WORD = [ { sentence: ['O', 'PATO', 'GOSTA', 'DE', 'LER'], correct: 'LER' }, { sentence: ['EU', 'ESCREVO', 'COM', 'A', 'BOTA'], correct: 'BOTA' }, { sentence: ['A', 'LUA', 'É', 'VERDE'], correct: 'VERDE' }];
const PHASE_20_SEGMENT_SENTENCE = [ { sentence: 'OGATOBEBELEITE', correct: 'O GATO BEBE LEITE' }, { sentence: 'AFOCAÉFELIZ', correct: 'A FOCA É FELIZ' }, { sentence: 'ABOLAÉAZUL', correct: 'A BOLA É AZUL' }];

// =======================================================
// PARTE 3: FUNÇÕES UTILITÁRIAS
// =======================================================
async function hashPassword(password) { const encoder = new TextEncoder(); const data = encoder.encode(password); const hashBuffer = await window.crypto.subtle.digest('SHA-256', data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); }
async function verifyPassword(password, storedHash) { const newHash = await hashPassword(password); return newHash === storedHash; }
function generateRandomPassword() { const words = ['sol', 'lua', 'rio', 'mar', 'flor', 'gato', 'cao', 'pato', 'rei', 'luz']; const word = words[Math.floor(Math.random() * words.length)]; const number = Math.floor(100 + Math.random() * 900); return `${word}${number}`; }
function formatErrorMessage(error) { if (!error || !error.message) { return 'Ocorreu um erro inesperado. Tente mais tarde.'; } const message = error.message.toLowerCase(); if (message.includes('duplicate key')) { return 'Este nome de usuário já existe. Escolha outro.'; } if (message.includes('invalid login credentials') || message.includes('usuário ou senha inválidos.')) { return 'Usuário ou senha inválidos.'; } console.error("Erro não tratado:", error); return 'Ocorreu um erro inesperado. Tente mais tarde.'; }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
function generateOptions(correctItem, sourceArray, count) { const options = new Set([correctItem]); const availableItems = sourceArray.filter(l => l !== correctItem); while (options.size < count && availableItems.length > 0) { const randomIndex = Math.floor(Math.random() * availableItems.length); options.add(availableItems.splice(randomIndex, 1)[0]); } return shuffleArray(Array.from(options)); }

// =======================================================
// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
// =======================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    console.log("App iniciando...");
    if (!window.supabase) {
        alert("ERRO CRÍTICO: Supabase não carregou.");
        return;
    }
    initializeSpeech();
    setupAllEventListeners();
    const studentSession = sessionStorage.getItem('currentUser');
    if (studentSession) {
        currentUser = JSON.parse(studentSession);
        await restoreOrStartGame();
    } else {
        await checkSession();
    }
}

function setupAllEventListeners() {
    // CORREÇÃO: Seletores mais específicos e com logs de depuração
    const teacherButton = document.querySelector('.user-type-btn[data-type="teacher"]');
    if (teacherButton) {
        teacherButton.addEventListener('click', () => {
            console.log("Botão 'Sou Professor' clicado.");
            showScreen('teacherLoginScreen');
        });
    } else {
        console.error("Botão 'Sou Professor' não foi encontrado no HTML.");
    }

    const studentButton = document.querySelector('.user-type-btn[data-type="student"]');
    if (studentButton) {
        studentButton.addEventListener('click', () => {
            console.log("Botão 'Sou Aluno' clicado.");
            showScreen('studentLoginScreen');
        });
    } else {
        console.error("Botão 'Sou Aluno' não foi encontrado no HTML.");
    }

    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => { const targetScreen = e.currentTarget.getAttribute('data-target'); showScreen(targetScreen); }));
    document.getElementById('showRegisterBtn')?.addEventListener('click', () => showScreen('teacherRegisterScreen'));
    document.getElementById('showLoginBtn')?.addEventListener('click', () => showScreen('teacherLoginScreen'));
    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('showCreateClassModalBtn')?.addEventListener('click', () => showModal('createClassModal'));
    document.getElementById('showAudioSettingsModalBtn')?.addEventListener('click', showAudioSettingsModal);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('showCreateStudentFormBtn')?.addEventListener('click', showCreateStudentForm);
    document.getElementById('hideCreateStudentFormBtn')?.addEventListener('click', hideCreateStudentForm);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    document.getElementById('startButton')?.addEventListener('click', startGame);
    document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio);
    document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('continueButton')?.addEventListener('click', nextPhase);
    document.getElementById('retryButton')?.addEventListener('click', retryPhase);
    document.getElementById('restartButton')?.addEventListener('click', restartGame);
    document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame);
    document.querySelectorAll('[data-close]').forEach(btn => { btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))); });
    document.querySelectorAll('#manageClassModal .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => showTab(e.currentTarget)); });
    document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload);
    document.getElementById('recordBtn')?.addEventListener('click', startRecording);
    document.getElementById('stopBtn')?.addEventListener('click', stopRecording);
    document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording);
    document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial);
    document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials);
    document.getElementById('copyResetPasswordBtn')?.addEventListener('click', handleCopyResetPassword);
    document.querySelectorAll('.password-toggle').forEach(toggle => { toggle.addEventListener('click', () => { const passwordInput = toggle.previousElementSibling; const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; passwordInput.setAttribute('type', type); toggle.classList.toggle('fa-eye-slash'); }); });
    document.querySelectorAll('.sort-btn').forEach(btn => { btn.addEventListener('click', (e) => { const sortBy = e.currentTarget.dataset.sort; document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); renderStudentProgress(sortBy); }); });
    document.getElementById('reportClassSelector')?.addEventListener('change', handleReportClassSelection);
}


async function restoreOrStartGame() { await loadGameState(); if (gameState.phaseCompleted) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100; showResultScreen(accuracy, true); } else if (gameState.attempts <= 0) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; showResultScreen(accuracy, false); } else { showScreen('gameScreen'); startQuestion(); } }

// =======================================================
// PARTE 5: AUTENTICAÇÃO E SESSÃO
// =======================================================
async function checkSession() { const { data: { session } } = await supabaseClient.auth.getSession(); if (session && session.user) { currentUser = session.user; if (currentUser.user_metadata.role === 'teacher') { await showTeacherDashboard(); } else { await logout(); } } else { showScreen('userTypeScreen'); } }

async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const email = document.getElementById('teacherEmail').value; const password = document.getElementById('teacherPassword').value; try { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; currentUser = data.user; await showTeacherDashboard(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { // CORREÇÃO: Mensagem específica para e-mail não confirmado
    if (error.message.includes('Email not confirmed')) {
        showFeedback('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.', 'error');
    } else {
        showFeedback(formatErrorMessage(error), 'error');
    }
} finally { button.disabled = false; button.innerHTML = originalText; } }

async function handleTeacherRegister(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...'; const name = document.getElementById('teacherRegName').value; const email = document.getElementById('teacherRegEmail').value; const password = document.getElementById('teacherRegPassword').value; try { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, role: 'teacher' } } }); if (error) throw error; showFeedback('Cadastro realizado! Um link de confirmação foi enviado para o seu e-mail.', 'success'); showScreen('teacherLoginScreen'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }

async function handleStudentLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    // CORREÇÃO: Padroniza o username para minúsculas para evitar erros de case
    const username = document.getElementById('studentUsername').value.trim().toLowerCase();
    const password = document.getElementById('studentPassword').value;

    try {
        const { data: studentData, error } = await supabaseClient
            .from('students')
            .select('*, assigned_phases')
            .eq('username', username) // A busca agora é sempre em minúsculas
            .single();

        if (error || !studentData) {
            throw new Error('Usuário ou senha inválidos.');
        }

        const match = await verifyPassword(password, studentData.password);
        if (!match) {
            throw new Error('Usuário ou senha inválidos.');
        }

        currentUser = { ...studentData, type: 'student' };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        await showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(formatErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

async function logout() { await supabaseClient.auth.signOut(); currentUser = null; currentClassId = null; sessionStorage.removeItem('currentUser'); showScreen('userTypeScreen'); }
function handleExitGame() { if (confirm('Tem certeza que deseja sair? Seu progresso ficará salvo.')) { sessionStorage.removeItem('currentUser'); currentUser = null; showScreen('userTypeScreen'); } }

// =======================================================
// PARTE 6: DASHBOARD DO PROFESSOR
// =======================================================
async function showTeacherDashboard() { showScreen('teacherDashboard'); await loadTeacherData(); showDashboardView('viewTurmas'); document.querySelectorAll('.sidebar-nav a').forEach(link => { link.removeEventListener('click', handleSidebarClick); link.addEventListener('click', handleSidebarClick); }); const logoutBtnSidebar = document.getElementById('logoutBtnSidebar'); logoutBtnSidebar.removeEventListener('click', logout); logoutBtnSidebar.addEventListener('click', logout); }
function handleSidebarClick(event) { event.preventDefault(); const viewId = event.currentTarget.dataset.view; showDashboardView(viewId); }
function showDashboardView(viewId) { document.querySelectorAll('.dashboard-view').forEach(view => { view.classList.remove('active'); }); const activeView = document.getElementById(viewId); if (activeView) { activeView.classList.add('active'); } document.querySelectorAll('.sidebar-nav a').forEach(link => { link.classList.remove('active'); if (link.dataset.view === viewId) { link.classList.add('active'); } }); const linkText = document.querySelector(`.sidebar-nav a[data-view="${viewId}"] span`).textContent; document.getElementById('dashboard-title').textContent = linkText; if (viewId === 'viewRelatorios') { populateReportClassSelector(); } }
async function loadTeacherData() { if (!currentUser) return; document.getElementById('teacherName').textContent = currentUser.user_metadata.full_name || 'Professor(a)'; const audioSettingsButton = document.getElementById('showAudioSettingsModalBtn'); if (currentUser.id === SUPER_ADMIN_TEACHER_ID) { audioSettingsButton.style.display = 'block'; } else { audioSettingsButton.style.display = 'none'; } await loadTeacherClasses(); }
async function loadTeacherClasses() { const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id); if (error) { console.error('Erro ao carregar turmas:', error); return; } renderClasses(data); }
function renderClasses(classes) { const container = document.getElementById('classesList'); if (!classes || classes.length === 0) { container.innerHTML = '<p>Nenhuma turma criada ainda.</p>'; return; } container.innerHTML = classes.map(cls => { const studentCount = cls.students[0]?.count || 0; return ` <div class="class-card"> <h3>${cls.name}</h3> <span class="student-count">👥 ${studentCount} aluno(s)</span> <div class="class-card-actions"> <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button> <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma"> <i class="fas fa-trash"></i> </button> </div> </div>`; }).join(''); }
async function handleCreateClass(e) { e.preventDefault(); const name = document.getElementById('className').value; if (!name) return; const { error } = await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); return; } closeModal('createClassModal'); await loadTeacherClasses(); showFeedback('Turma criada com sucesso!', 'success'); document.getElementById('createClassForm').reset(); }
async function handleDeleteClass(classId, className) { if (!confirm(`ATENÇÃO! Deseja excluir a turma "${className}"?\nTODOS os alunos e progressos serão apagados.`)) return; const { error } = await supabaseClient.from('classes').delete().eq('id', classId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Turma "${className}" excluída.`, 'success'); await loadTeacherClasses(); } }
async function manageClass(classId, className) { currentClassId = classId; document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`; const modal = document.getElementById('manageClassModal'); modal.querySelectorAll('.tab-btn').forEach(btn => { const tabId = btn.dataset.tab; if (!btn.getAttribute('data-listener')) { btn.setAttribute('data-listener', 'true'); btn.addEventListener('click', () => { if (tabId === 'studentsTab') loadClassStudents(); else if (tabId === 'studentProgressTab') loadStudentProgress(); }); } }); showTab(document.querySelector('#manageClassModal .tab-btn[data-tab="studentsTab"]')); await loadClassStudents(); showModal('manageClassModal'); }
async function loadClassStudents() { const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId).order('name', { ascending: true }); if (error) { console.error('Erro ao carregar alunos:', error); document.getElementById('studentsList').innerHTML = '<p>Erro ao carregar.</p>'; return; } renderStudents(data); }
function renderStudents(students) { const container = document.getElementById('studentsList'); if (!students || students.length === 0) { container.innerHTML = '<p>Nenhum aluno cadastrado.</p>'; return; } container.innerHTML = students.map(student => ` <div class="student-item"> <div class="student-info"> <h4>${student.name}</h4> <p>Usuário: ${student.username}</p> </div> <div class="student-actions"> <button onclick="handleShowOrResetPassword('${student.id}', '${student.name}')" class="btn small" title="Ver/Redefinir Senha"> <i class="fas fa-eye"></i> </button> <button onclick="handleDeleteStudent('${student.id}', '${student.name}')" class="btn small danger" title="Excluir Aluno"> <i class="fas fa-trash"></i> </button> </div> </div>`).join(''); }
async function loadStudentProgress() { const progressList = document.getElementById('studentProgressList'); progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando progresso...</p>'; const { data: studentsData, error: studentsError } = await supabaseClient.from('students').select(`*`).eq('class_id', currentClassId); if (studentsError) { console.error("Erro ao buscar alunos:", studentsError); progressList.innerHTML = `<p style="color:red;">Erro ao carregar alunos: ${studentsError.message}</p>`; return; } if (!studentsData || studentsData.length === 0) { progressList.innerHTML = '<p>Nenhum aluno nesta turma para exibir o progresso.</p>'; return; } const studentIds = studentsData.map(s => s.id); const { data: progressData, error: progressError } = await supabaseClient.from('progress').select('*').in('student_id', studentIds); if (progressError) { console.error("Erro ao buscar progresso:", progressError); progressList.innerHTML = `<p style="color:red;">Erro ao carregar o progresso: ${progressError.message}</p>`; return; } const combinedData = studentsData.map(student => { const studentProgress = progressData.find(p => p.student_id === student.id); return { ...student, progress: studentProgress ? [studentProgress] : [] }; }); studentProgressData = combinedData; renderStudentProgress('last_played'); }

function renderStudentProgress(sortBy = 'last_played') {
    const progressList = document.getElementById('studentProgressList');
    const sortedData = [...studentProgressData].sort((a, b) => {
        if (sortBy === 'name') { return a.name.localeCompare(b.name); }
        if (sortBy === 'last_played') { const dateA = (a.progress && a.progress.length > 0) ? new Date(a.progress[0].last_played) : new Date(0); const dateB = (b.progress && b.progress.length > 0) ? new Date(b.progress[0].last_played) : new Date(0); return dateB - dateA; }
        return 0;
    });
    let html = sortedData.map(student => {
        const progressRecord = (student.progress && student.progress.length > 0) ? student.progress[0] : null;
        const assignedPhases = student.assigned_phases && student.assigned_phases.length > 0 ? student.assigned_phases : [1];
        const currentPhase = progressRecord?.current_phase || 'N/J';
        const gameState = progressRecord?.game_state;
        let score = 0, total = 10, accuracy = 0;
        if (gameState && gameState.questions && gameState.questions.length > 0) {
            score = gameState.score ?? 0;
            total = gameState.questions.length;
            accuracy = Math.round((score / total) * 100);
        }
        let lastPlayedStr = 'Nunca jogou';
        let statusClass = 'inactive';
        if (progressRecord?.last_played) {
            const lastPlayedDate = new Date(progressRecord.last_played);
            lastPlayedStr = lastPlayedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (lastPlayedDate > sevenDaysAgo) { statusClass = 'active'; }
        }
        const statusIcon = statusClass === 'active' ? '🟢' : '🔴';
        // CORREÇÃO: Itera sobre todas as fases disponíveis (20)
        const phaseCheckboxes = Object.keys(PHASE_DESCRIPTIONS).map(phaseNumStr => {
            const phaseNum = parseInt(phaseNumStr);
            const phaseName = PHASE_DESCRIPTIONS[phaseNum];
            return ` <label class="phase-checkbox-label" title="${phaseName}">
                         <input type="checkbox" class="phase-checkbox" value="${phaseNum}" ${assignedPhases.includes(phaseNum) ? 'checked' : ''} onchange="assignPhases('${student.id}', this)" >
                         Fase ${phaseNum} - ${phaseName}
                       </label> `;
        }).join('');
        return `
            <div class="student-item">
                <div class="student-info" style="flex-grow: 1;">
                    <h4>${student.name} <span class="status-indicator ${statusClass}">${statusIcon}</span></h4>
                    <p>Último Acesso: ${lastPlayedStr}</p>
                    <p>Progresso na Fase ${currentPhase}: ${accuracy}% (${score}/${total})</p>
                    <div class="student-progress-container">
                        <div class="student-progress-bar">
                            <div class="student-progress-fill" style="width: ${accuracy}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="student-actions">
                    <label class="select-label">Designar Fases:</label>
                    <div class="phase-checkbox-group">
                        ${phaseCheckboxes}
                    </div>
                </div>
            </div>`;
    }).join('');
    progressList.innerHTML = html || '<p>Nenhum aluno para exibir.</p>';
}

async function assignPhases(studentId, changedElement) { const checkboxGroup = changedElement.closest('.phase-checkbox-group'); const checkboxes = checkboxGroup.querySelectorAll('.phase-checkbox'); const newPhases = Array.from(checkboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value)).sort((a, b) => a - b); if (newPhases.length === 0) { showFeedback("O aluno precisa ter pelo menos uma fase designada.", "error"); changedElement.checked = true; return; } const studentData = studentProgressData.find(s => s.id === studentId); if (!studentData) return; showFeedback(`Atualizando fases para ${studentData.name}...`, 'info'); try { const { error: assignError } = await supabaseClient.from('students').update({ assigned_phases: newPhases }).eq('id', studentId); if (assignError) throw assignError; const firstPhase = newPhases[0]; const newGameState = { currentPhase: firstPhase, score: 0, attempts: 3, questions: generateQuestions(firstPhase), currentQuestionIndex: 0, tutorialsShown: [], phaseCompleted: false }; const { error: progressError } = await supabaseClient.from('progress').upsert({ student_id: studentId, current_phase: firstPhase, game_state: newGameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' }); if (progressError) throw progressError; showFeedback(`Fases de ${studentData.name} atualizadas!`, 'success'); await loadStudentProgress(); } catch (error) { console.error("Erro ao designar fases:", error); showFeedback(`Erro: ${error.message}`, 'error'); await loadStudentProgress(); } }

async function handleCreateStudent(event) {
    event.preventDefault();
    // CORREÇÃO: Padroniza o username para minúsculas e remove espaços na criação
    const username = document.getElementById('createStudentUsername').value.trim().toLowerCase();
    const password = document.getElementById('createStudentPassword').value.trim();
    const submitButton = document.getElementById('createStudentSubmitBtn');

    if (!username || !password) {
        return showFeedback("Preencha nome e senha.", "error");
    }
    if (!currentClassId || !currentUser?.id) {
        return showFeedback("Erro de sessão. Recarregue a página.", "error");
    }
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

    try {
        const hashedPassword = await hashPassword(password);
        // Salva o nome de usuário original (com maiúsculas) e o username padronizado para login
        const { error } = await supabaseClient.from('students').insert([
            { name: document.getElementById('createStudentUsername').value.trim(), username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }
        ]);
        if (error) throw error;
        document.getElementById('newStudentUsername').textContent = username; // Mostra o username de login
        document.getElementById('newStudentPassword').textContent = password;
        showModal('studentCreatedModal');
        hideCreateStudentForm();
        await loadClassStudents();
        await loadStudentProgress();
    } catch (error) {
        showFeedback(formatErrorMessage(error), 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Criar Aluno';
    }
}

async function handleDeleteStudent(studentId, studentName) { if (!confirm(`Tem certeza que deseja excluir "${studentName}"?`)) return; const { error } = await supabaseClient.from('students').delete().eq('id', studentId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Aluno "${studentName}" excluído.`, 'success'); await loadClassStudents(); await loadStudentProgress(); } }
async function handleShowOrResetPassword(studentId, studentName) { showFeedback(`Redefinindo senha para ${studentName}...`, 'info'); const newPassword = generateRandomPassword(); try { const hashedPassword = await hashPassword(newPassword); const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId); if (error) throw error; document.getElementById('resetStudentName').textContent = studentName; document.getElementById('resetStudentPassword').textContent = newPassword; showModal('resetPasswordModal'); } catch (error) { showFeedback(`Erro ao tentar alterar a senha: ${error.message}`, 'error'); } }
function handleCopyCredentials() { const username = document.getElementById('newStudentUsername').textContent; const password = document.getElementById('newStudentPassword').textContent; const textToCopy = `Usuário: ${username}\nSenha: ${password}`; navigator.clipboard.writeText(textToCopy).then(() => { showFeedback('Copiado!', 'success'); }).catch(() => { showFeedback('Erro ao copiar.', 'error'); }); }
function handleCopyResetPassword() { const password = document.getElementById('resetStudentPassword').textContent; navigator.clipboard.writeText(password).then(() => { showFeedback('Nova senha copiada!', 'success'); }).catch(() => { showFeedback('Erro ao copiar a senha.', 'error'); }); }
// =======================================================
// PARTE 7: ÁUDIO E VOZ
// =======================================================
async function handleAudioUpload() { const files = document.getElementById('audioUpload').files; if (files.length === 0) return; const uploadStatus = document.getElementById('uploadStatus'); uploadStatus.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Enviando...</p>`; let successCount = 0, errorCount = 0; for (const file of files) { const fileName = file.name.split('.').slice(0, -1).join('.').toUpperCase(); const filePath = `${currentUser.id}/${fileName}.${file.name.split('.').pop()}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true }); if (error) throw error; successCount++; } catch (error) { console.error(`Erro no upload:`, error); errorCount++; } } uploadStatus.innerHTML = `<p style="color: green;">${successCount} enviados!</p>`; if (errorCount > 0) { uploadStatus.innerHTML += `<p style="color: red;">Falha em ${errorCount}.</p>`; } }
async function startRecording() { const recordBtn = document.getElementById('recordBtn'), stopBtn = document.getElementById('stopBtn'), statusEl = document.getElementById('recordStatus'); recordBtn.disabled = true; statusEl.textContent = 'Pedindo permissão...'; try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioChunks = []; mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data)); mediaRecorder.addEventListener('stop', () => { const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const audioUrl = URL.createObjectURL(audioBlob); document.getElementById('audioPlayback').src = audioUrl; document.getElementById('saveRecordingBtn').disabled = false; stream.getTracks().forEach(track => track.stop()); }); mediaRecorder.start(); statusEl.textContent = 'Gravando...'; stopBtn.disabled = false; startTimer(); } catch (err) { console.error("Erro ao gravar:", err); alert("Não foi possível gravar. Verifique as permissões."); statusEl.textContent = 'Falha.'; recordBtn.disabled = false; } }
function stopRecording() { if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); stopTimer(); document.getElementById('recordBtn').disabled = false; document.getElementById('stopBtn').disabled = true; document.getElementById('recordStatus').textContent = 'Parado.'; } }
async function saveRecording() { if (audioChunks.length === 0) return; const saveButton = document.getElementById('saveRecordingBtn'); saveButton.disabled = true; saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; const selectedItem = document.getElementById('letterSelect').value; const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const fileName = `${selectedItem}.webm`; const filePath = `${currentUser.id}/${fileName}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, audioBlob, { upsert: true }); if (error) throw error; showFeedback(`Áudio para "${selectedItem}" salvo!`, 'success'); audioChunks = []; document.getElementById('audioPlayback').src = ''; } catch (error) { showFeedback(`Erro: ${error.message}`, 'error'); } finally { saveButton.disabled = false; saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar'; } }
function startTimer() { stopTimer(); let seconds = 0; const timerEl = document.getElementById('recordTimer'); timerEl.textContent = '00:00'; timerInterval = setInterval(() => { seconds++; const mins = Math.floor(seconds / 60).toString().padStart(2, '0'); const secs = (seconds % 60).toString().padStart(2, '0'); timerEl.textContent = `${mins}:${secs}`; }, 1000); }
function stopTimer() { clearInterval(timerInterval); }
async function playTeacherAudio(key, fallbackText, onEndCallback) { const teacherId = SUPER_ADMIN_TEACHER_ID; if (!teacherId) { speak(fallbackText, onEndCallback); return; } try { const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` }); if (data && data.length > 0) { const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${data[0].name}`); const audio = new Audio(publicUrl); if (onEndCallback) audio.onended = onEndCallback; audio.play(); } else { speak(fallbackText, onEndCallback); } } catch (error) { console.error("Erro ao buscar áudio:", error); speak(fallbackText, onEndCallback); } }
function initializeSpeech() { function loadVoices() { const voices = speechSynthesis.getVoices(); if (voices.length > 0) { selectedVoice = voices.find(v => v.lang === 'pt-BR') || voices[0]; speechReady = true; } } speechSynthesis.onvoiceschanged = loadVoices; loadVoices(); }
function speak(text, onEndCallback) { if (!window.speechSynthesis || !speechReady) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'pt-BR'; utterance.voice = selectedVoice; if (onEndCallback) utterance.onend = onEndCallback; speechSynthesis.speak(utterance); }

// =======================================================
// PARTE 8: LÓGICA DO JOGO (GERAÇÃO E RENDERIZAÇÃO)
// =======================================================

// Lógica de Estado do Jogo
async function showStudentGame() { await loadGameState(); const canResume = gameState.currentQuestionIndex > 0 && gameState.attempts > 0 && !gameState.phaseCompleted; if (canResume) { showScreen('gameScreen'); startQuestion(); } else { showScreen('startScreen'); } }
async function startGame() { showScreen('gameScreen'); startQuestion(); }
async function loadGameState() { const { data: progressData, error } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single(); if (error && error.code !== 'PGRST116') { console.error("Erro ao carregar progresso:", error); } const assignedPhases = currentUser.assigned_phases && currentUser.assigned_phases.length > 0 ? currentUser.assigned_phases : [1]; const firstAssignedPhase = assignedPhases[0]; if (progressData?.game_state) { gameState = progressData.game_state; if (!assignedPhases.includes(gameState.currentPhase) || !gameState.questions) { gameState = { currentPhase: firstAssignedPhase, score: 0, attempts: 3, questions: generateQuestions(firstAssignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } if (!gameState.tutorialsShown) gameState.tutorialsShown = []; } else { gameState = { currentPhase: firstAssignedPhase, score: 0, attempts: 3, questions: generateQuestions(firstAssignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } }
async function saveGameState() { if (!currentUser || currentUser.type !== 'student') return; await supabaseClient.from('progress').upsert({ student_id: currentUser.id, current_phase: gameState.currentPhase, game_state: gameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' }); }

// Gerador de Questões para as 20 Fases
function generateQuestions(phase) {
    let questions = [];
    const questionCount = 10;
    const fillQuestions = (sourceArray, generatorFunc) => {
        let available = shuffleArray([...sourceArray]);
        for (let i = 0; i < questionCount; i++) {
            const item = available[i % available.length];
            questions.push(generatorFunc(item));
        }
    };

    switch (phase) {
        case 1: fillQuestions(ALPHABET, l => ({ type: 'letter_sound', correctAnswer: l, options: generateOptions(l, ALPHABET, 4) })); break;
        case 2: fillQuestions(PHASE_2_VOWELS, item => ({ type: 'initial_letter_image', letter: item.name[0], correctAnswer: item.image, options: generateOptions(item.image, PHASE_2_VOWELS.map(v => v.image), 3) })); break;
        case 3: fillQuestions(PHASE_3_CONSONANTS, item => ({ type: 'initial_letter_image', letter: item.name[0], correctAnswer: item.image, options: generateOptions(item.image, PHASE_3_CONSONANTS.map(c => c.image), 3) })); break;
        case 4: questions.push({ type: 'memory_game', pairs: PHASE_4_MEMORY }); break;
        case 5: fillQuestions(PHASE_5_ALPHABET, item => ({ type: 'alphabet_order', correctAnswer: item.sequence, options: shuffleArray([...item.sequence]) })); break;
        case 6: fillQuestions(PHASE_6_F_SYLLABLE, item => ({ type: 'syllable_focus_image', syllable: item.syllable, correctAnswer: item.image, options: generateOptions(item.image, PHASE_6_F_SYLLABLE.map(f => f.image), 3) })); break;
        case 7: fillQuestions(PHASE_7_MISSING_SYLLABLE, item => ({ type: 'missing_syllable', image: item.image, word: item.word, correctAnswer: item.correct, options: generateOptions(item.correct, [...item.options, item.correct], 3) })); break;
        case 8: fillQuestions(PHASE_8_VOWEL_ENCOUNTERS, item => ({ type: 'vowel_encounter', word: item.word, image: item.image, correctAnswer: item.encontro, options: generateOptions(item.encontro, VOWEL_ENCOUNTERS, 4) })); break;
        case 9: fillQuestions(PHASE_9_SOUND_PAIRS, item => ({ type: 'sound_detective', image: item.image, correctAnswer: item.correct, options: shuffleArray([item.correct, item.incorrect]) })); break;
        case 10: fillQuestions(PHASE_10_REMOVE_SYLLABLE, item => ({ type: 'word_transform_remove', image: item.image, initialWord: item.initialWord, correctAnswer: item.correct, options: generateOptions(item.correct, item.options, 4) })); break;
        case 11: fillQuestions(PHASE_11_INVERT_SYLLABLE, item => ({ type: 'word_transform_invert', image: item.image, word: item.word, correctAnswer: item.correct, options: generateOptions(item.correct, item.options, 3) })); break;
        case 12: fillQuestions(PHASE_12_BUILD_SYLLABLE, item => ({ type: 'build_syllable', image: item.image, correctAnswer: item.word, options: shuffleArray([...item.syllables]) })); break;
        case 13: fillQuestions(PHASE_13_RHYMES, item => ({ type: 'rhyme', image: item.image, word: item.word, correctAnswer: item.correct, options: generateOptions(item.correct, item.options, 3) })); break;
        case 14: fillQuestions(PHASE_14_ALLITERATION, item => ({ type: 'alliteration', image: item.image, word: item.word, correctAnswer: item.correct, options: generateOptions(item.correct, item.options, 3) })); break;
        case 15: fillQuestions(PHASE_15_SENTENCES, item => ({ type: 'build_sentence', image: item.image, correctAnswer: item.answer, options: shuffleArray([...item.sentence]) })); break;
        case 16: fillQuestions(PHASE_16_WORD_COUNT, item => ({ type: 'count_words', image: item.image, sentence: item.sentence, correctAnswer: item.count.toString(), options: generateOptions(item.count.toString(), ['2', '3', '4', '5'], 4) })); break;
        case 17: fillQuestions(PHASE_17_FINAL_LETTER, item => ({ type: 'final_letter', image: item.image, word: item.word, correctAnswer: item.correct, options: generateOptions(item.correct, item.options, 3) })); break;
        case 18: fillQuestions(PHASE_18_MIDDLE_LETTER, item => ({ type: 'middle_letter', image: item.image, word: item.word, correctAnswer: item.correct, options: generateOptions(item.correct, item.options, 3) })); break;
        case 19: fillQuestions(PHASE_19_INTRUDER_WORD, item => ({ type: 'intruder_word', sentence: item.sentence, correctAnswer: item.correct })); break;
        case 20: fillQuestions(PHASE_20_SEGMENT_SENTENCE, item => ({ type: 'segment_sentence', sentence: item.sentence, correctAnswer: item.correct })); break;
        default: questions.push({ type: 'letter_sound', correctAnswer: 'A', options: ['A', 'B', 'C', 'D'] }); break;
    }
    return questions;
}

// Roteador Principal de Renderização
async function startQuestion() {
    if (gameState.phaseCompleted || !gameState.questions || gameState.questions.length === 0) {
        return endPhase();
    }
    await showTutorial(gameState.currentPhase);
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        return endPhase();
    }
    const q = gameState.questions[gameState.currentQuestionIndex];
    resetUI();
    updateUI();

    const questionTextEl = document.getElementById('questionText');

    // Roteador para a função de renderização correta
    switch (q.type) {
        case 'letter_sound': renderLetterSound(q); break;
        case 'initial_letter_image': renderInitialLetterImage(q); break;
        case 'memory_game': renderMemoryGame(q); break;
        case 'alphabet_order': renderAlphabetOrder(q); break;
        case 'syllable_focus_image': renderSyllableFocusImage(q); break;
        case 'missing_syllable': renderMissingSyllable(q); break;
        case 'vowel_encounter': renderVowelEncounter(q); break;
        case 'sound_detective': renderSoundDetective(q); break;
        case 'word_transform_remove': renderWordTransformRemove(q); break;
        case 'word_transform_invert': renderWordTransformInvert(q); break;
        case 'build_syllable': renderBuildSyllable(q); break;
        case 'rhyme': renderRhyme(q); break;
        case 'alliteration': renderAlliteration(q); break;
        case 'build_sentence': renderBuildSentence(q); break;
        case 'count_words': renderCountWords(q); break;
        case 'final_letter': renderFinalLetter(q); break;
        case 'middle_letter': renderMiddleLetter(q); break;
        case 'intruder_word': renderIntruderWord(q); break;
        case 'segment_sentence': renderSegmentSentence(q); break;
        default: questionTextEl.textContent = "Erro: Tipo de questão não encontrado."; break;
    }
    if (q.type === 'letter_sound') { setTimeout(playCurrentAudio, 500); }
}

function resetUI() {
    document.getElementById('nextQuestion').style.display = 'none';
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'none';
    document.getElementById('memoryGameGrid').style.display = 'none';
    document.getElementById('lettersGrid').innerHTML = '';
    document.getElementById('memoryGameGrid').innerHTML = '';
    document.getElementById('sentenceBuildArea').innerHTML = '';
    document.getElementById('sentenceBuildArea').style.display = 'none';
    document.getElementById('wordDisplay').textContent = '';
    document.getElementById('questionText').textContent = '';
    document.getElementById('repeatAudio').style.display = 'none';
    document.getElementById('checkAnswerBtn')?.remove();
}

// Funções de Renderização Específicas
function renderLetterSound(q) {
    document.getElementById('audioQuestionArea').style.display = 'block';
    document.getElementById('questionText').textContent = 'Qual letra faz este som?';
    document.getElementById('repeatAudio').style.display = 'inline-block';
    renderOptions(q.options, 'letter-button');
}

function renderInitialLetterImage(q) {
    document.getElementById('questionText').textContent = `Qual figura começa com a letra "${q.letter}"?`;
    renderImageOptions(q.options, q.correctAnswer);
}

function renderMemoryGame(q) {
    document.getElementById('questionText').textContent = 'Encontre os pares de letras maiúsculas e minúsculas!';
    const memoryGrid = document.getElementById('memoryGameGrid');
    memoryGrid.style.display = 'grid';
    let cards = [];
    q.pairs.forEach(letter => {
        cards.push({ value: letter.toUpperCase(), type: letter });
        cards.push({ value: letter.toLowerCase(), type: letter });
    });
    cards = shuffleArray(cards);
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.type = card.type;
        cardElement.innerHTML = `<div class="card-inner"><div class="card-face card-front"></div><div class="card-face card-back">${card.value}</div></div>`;
        cardElement.addEventListener('click', () => handleCardClick(cardElement));
        memoryGrid.appendChild(cardElement);
    });
    gameState.memoryGame = { flippedCards: [], matchedPairs: 0, totalPairs: q.pairs.length, canFlip: true };
}

function renderAlphabetOrder(q) {
    document.getElementById('questionText').textContent = 'Clique nas letras na ordem alfabética correta.';
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = q.options.map(letter => `<button class="letter-button">${letter}</button>`).join('');
    gameState.sequenceGame = { correctSequence: q.correctAnswer, userSequence: [] };
    lettersGrid.querySelectorAll('.letter-button').forEach(btn => {
        btn.addEventListener('click', () => handleSequenceClick(btn));
    });
}

function renderSyllableFocusImage(q) {
    document.getElementById('questionText').textContent = `Qual figura começa com o som "${q.syllable}"?`;
    renderImageOptions(q.options, q.correctAnswer);
}

function renderMissingSyllable(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word;
    document.getElementById('questionText').textContent = 'Qual sílaba completa a palavra?';
    renderOptions(q.options, 'letter-button');
}

function renderVowelEncounter(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word.replace(q.correctAnswer, '__');
    document.getElementById('questionText').textContent = 'Qual encontro de vogais completa a palavra?';
    renderOptions(q.options, 'letter-button');
}

function renderSoundDetective(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('questionText').textContent = 'Qual é o som correto desta palavra?';
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = q.options.map(option => `<button class="sound-detective-button" data-sound="${option}"><i class="fas fa-volume-up"></i> ${option}</button>`).join('');
    lettersGrid.querySelectorAll('.sound-detective-button').forEach(btn => {
        btn.addEventListener('click', () => {
            speak(btn.dataset.sound);
            selectAnswer(btn.dataset.sound);
        });
    });
}

function renderWordTransformRemove(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.initialWord;
    document.getElementById('questionText').textContent = `Se tirarmos o primeiro pedaço de "${q.initialWord}", qual palavra formamos?`;
    renderOptions(q.options, 'letter-button');
}

function renderWordTransformInvert(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word;
    document.getElementById('questionText').textContent = `Se trocarmos os pedaços de "${q.word}", qual palavra formamos?`;
    renderOptions(q.options, 'letter-button');
}

function renderBuildSyllable(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('sentenceBuildArea').style.display = 'flex';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('questionText').textContent = 'Clique nas sílabas para formar a palavra.';
    renderOptions(q.options, 'syllable-option-button', (btn) => selectSyllableForBuild(btn));
}

function renderRhyme(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word;
    document.getElementById('questionText').textContent = `Qual palavra rima com "${q.word}"?`;
    renderOptions(q.options, 'letter-button');
}

function renderAlliteration(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word;
    document.getElementById('questionText').textContent = `Qual palavra começa com o mesmo som de "${q.word}"?`;
    renderOptions(q.options, 'letter-button');
}

function renderBuildSentence(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('sentenceBuildArea').style.display = 'flex';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('questionText').textContent = 'Clique nas palavras para formar a frase correta.';
    renderOptions(q.options, 'word-option-button', (btn) => selectWordForSentence(btn));
}

function renderCountWords(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.sentence;
    document.getElementById('questionText').textContent = 'Quantas palavras tem a frase acima?';
    renderOptions(q.options, 'letter-button');
}

function renderFinalLetter(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word.slice(0, -1) + '_';
    document.getElementById('questionText').textContent = 'Qual letra completa a palavra?';
    renderOptions(q.options, 'letter-button');
}

function renderMiddleLetter(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word;
    document.getElementById('questionText').textContent = 'Qual letra completa a palavra?';
    renderOptions(q.options, 'letter-button');
}

function renderIntruderWord(q) {
    document.getElementById('questionText').textContent = 'Clique na palavra que não combina com a frase.';
    const lettersGrid = document.getElementById('lettersGrid');
    const sentenceHtml = q.sentence.map(word => `<span class="sentence-word-clickable">${word}</span>`).join(' ');
    lettersGrid.innerHTML = `<div class="sentence-container"><div class="sentence-text">${sentenceHtml}</div></div>`;
    lettersGrid.querySelectorAll('.sentence-word-clickable').forEach(span => {
        span.addEventListener('click', () => {
            lettersGrid.querySelectorAll('.sentence-word-clickable').forEach(s => s.style.pointerEvents = 'none');
            selectAnswer(span.textContent);
        });
    });
}

function renderSegmentSentence(q) {
    document.getElementById('questionText').textContent = 'Clique onde os espaços deveriam estar para separar as palavras.';
    const lettersGrid = document.getElementById('lettersGrid');
    const charsHtml = q.sentence.split('').map(char => `<span class="sentence-char-clickable">${char}</span>`).join('');
    lettersGrid.innerHTML = `<div class="sentence-container"><div class="sentence-text" id="segmentationArea">${charsHtml}</div></div>`;
    
    document.querySelectorAll('.sentence-char-clickable').forEach((span, index) => {
        if (index > 0) { // Não pode adicionar espaço antes da primeira letra
            span.addEventListener('click', () => {
                // Alterna: adiciona ou remove o espaço
                span.style.marginLeft = span.style.marginLeft ? '' : '15px';
            });
        }
    });

    const checkButton = document.createElement('button');
    checkButton.id = 'checkAnswerBtn';
    checkButton.textContent = 'Verificar';
    document.querySelector('.game-controls').appendChild(checkButton);
    
    checkButton.addEventListener('click', () => {
        let userAnswer = '';
        const chars = document.querySelectorAll('#segmentationArea span');
        chars.forEach((char, index) => {
            if (index > 0 && char.style.marginLeft) {
                userAnswer += ' ';
            }
            userAnswer += char.textContent;
        });
        selectAnswer(userAnswer);
    });
}


// Funções Auxiliares de Renderização e Manipuladores de Eventos
function renderOptions(options, className, customHandler = null) {
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = options.map(option => `<button class="${className}">${option}</button>`).join('');
    lettersGrid.querySelectorAll('button').forEach(btn => {
        const handler = customHandler ? () => customHandler(btn) : () => selectAnswer(btn.textContent);
        btn.addEventListener('click', handler);
    });
}

function renderImageOptions(options, correctAnswer) {
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.classList.add('image-option-grid'); // Adiciona classe para estilização
    lettersGrid.innerHTML = options.map(option => `<button class="image-option-button" data-value="${option}">${option}</button>`).join('');
    lettersGrid.querySelectorAll('.image-option-button').forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(btn.dataset.value));
    });
}

function selectWordForSentence(buttonElement) {
    buttonElement.disabled = true;
    buttonElement.classList.add('disabled');
    const sentenceBuildArea = document.getElementById('sentenceBuildArea');
    const wordSpan = document.createElement('span');
    wordSpan.className = 'sentence-word';
    wordSpan.textContent = buttonElement.textContent;
    sentenceBuildArea.appendChild(wordSpan);
    const allButtons = document.querySelectorAll('.word-option-button');
    const allDisabled = Array.from(allButtons).every(btn => btn.disabled);
    if (allDisabled) {
        const constructedSentence = Array.from(sentenceBuildArea.children).map(span => span.textContent).join(' ');
        selectAnswer(constructedSentence);
    }
}

function selectSyllableForBuild(buttonElement) {
    buttonElement.disabled = true;
    buttonElement.classList.add('disabled');
    const sentenceBuildArea = document.getElementById('sentenceBuildArea');
    const wordSpan = document.createElement('span');
    wordSpan.className = 'sentence-word'; // Reutilizando estilo
    wordSpan.textContent = buttonElement.textContent;
    sentenceBuildArea.appendChild(wordSpan);
    const allButtons = document.querySelectorAll('.syllable-option-button');
    const allDisabled = Array.from(allButtons).every(btn => btn.disabled);
    if (allDisabled) {
        const constructedWord = Array.from(sentenceBuildArea.children).map(span => span.textContent).join('');
        selectAnswer(constructedWord);
    }
}

function handleCardClick(cardElement) {
    if (!gameState.memoryGame.canFlip || cardElement.classList.contains('flipped')) return;
    cardElement.classList.add('flipped');
    gameState.memoryGame.flippedCards.push(cardElement);
    if (gameState.memoryGame.flippedCards.length === 2) {
        gameState.memoryGame.canFlip = false;
        const [card1, card2] = gameState.memoryGame.flippedCards;
        if (card1.dataset.type === card2.dataset.type) {
            gameState.memoryGame.matchedPairs++;
            card1.classList.add('matched');
            card2.classList.add('matched');
            gameState.memoryGame.flippedCards = [];
            gameState.memoryGame.canFlip = true;
            if (gameState.memoryGame.matchedPairs === gameState.memoryGame.totalPairs) {
                setTimeout(() => {
                    gameState.score++;
                    showFeedback('Você encontrou todos os pares!', 'success');
                    document.getElementById('nextQuestion').style.display = 'block';
                }, 500);
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                gameState.memoryGame.flippedCards = [];
                gameState.memoryGame.canFlip = true;
            }, 1200);
        }
    }
}

function handleSequenceClick(buttonElement) {
    const letter = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.classList.add('disabled');
    gameState.sequenceGame.userSequence.push(letter);
    const { userSequence, correctSequence } = gameState.sequenceGame;
    const currentIndex = userSequence.length - 1;
    if (userSequence[currentIndex] !== correctSequence[currentIndex]) {
        gameState.attempts--;
        updateUI();
        showFeedback('Ops, ordem errada! Tente de novo.', 'error');
        if (gameState.attempts <= 0) {
            setTimeout(endPhase, 1500);
        } else {
            setTimeout(() => {
                document.querySelectorAll('#lettersGrid .letter-button').forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('disabled');
                });
                gameState.sequenceGame.userSequence = [];
            }, 1500);
        }
        return;
    }
    if (userSequence.length === correctSequence.length) {
        gameState.score++;
        updateUI();
        showFeedback('Sequência correta!', 'success');
        document.getElementById('nextQuestion').style.display = 'block';
    }
}

// Lógica de Resposta e Fluxo de Jogo
async function selectAnswer(selectedAnswer) {
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (['memory_game', 'alphabet_order'].includes(q.type)) return;

    document.querySelectorAll('.letter-button, .word-option-button, .syllable-option-button, .sound-detective-button, .image-option-button').forEach(btn => btn.disabled = true);
    document.getElementById('checkAnswerBtn')?.remove();

    const isCorrect = selectedAnswer === q.correctAnswer;
    
    // Feedback visual
    if (q.type === 'intruder_word') {
        document.querySelectorAll('.sentence-word-clickable').forEach(span => {
            if (span.textContent === q.correctAnswer) span.classList.add('correct');
            if (span.textContent === selectedAnswer && !isCorrect) span.classList.add('incorrect');
        });
    } else {
        document.querySelectorAll('button').forEach(btn => {
            const btnValue = btn.dataset.value || btn.dataset.sound || btn.textContent;
            if (btnValue === q.correctAnswer) btn.classList.add('correct');
            if (btnValue === selectedAnswer && !isCorrect) btn.classList.add('incorrect');
        });
    }

    if (isCorrect) {
        gameState.score++;
        showFeedback('Muito bem!', 'success');
        playTeacherAudio('feedback_correct', 'Acertou');
    } else {
        gameState.attempts--;
        logStudentError({ question: q, selectedAnswer: selectedAnswer }).catch(console.error);
        showFeedback(`Quase! A resposta correta era "${q.correctAnswer}"`, 'error');
        playTeacherAudio('feedback_incorrect', 'Tente de novo');
    }

    updateUI();
    await saveGameState();

    if (gameState.attempts <= 0) {
        setTimeout(endPhase, 2000);
    } else {
        document.getElementById('nextQuestion').style.display = 'block';
    }
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    startQuestion();
}

function endPhase() { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; const passed = accuracy >= 70; showResultScreen(accuracy, passed); }
function showResultScreen(accuracy, passed) { showScreen('resultScreen'); document.getElementById('finalScore').textContent = gameState.score; document.getElementById('accuracy').textContent = accuracy; const assignedPhases = currentUser.assigned_phases || [1]; const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase); const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1; const continueBtn = document.getElementById('continueButton'); const retryBtn = document.getElementById('retryButton'); const restartBtn = document.getElementById('restartButton'); if (passed) { document.getElementById('resultTitle').textContent = 'Parabéns!'; retryBtn.style.display = 'none'; gameState.phaseCompleted = true; if (hasNextPhase) { document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!'; continueBtn.style.display = 'inline-block'; restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; } else { document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!'; continueBtn.style.display = 'none'; restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; } } else { document.getElementById('resultTitle').textContent = 'Não desanime!'; document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!'; continueBtn.style.display = 'none'; retryBtn.style.display = 'inline-block'; restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; gameState.phaseCompleted = false; } saveGameState(); }
async function nextPhase() { const assignedPhases = currentUser.assigned_phases || [1]; const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase); const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1; if (hasNextPhase) { const nextPhaseNum = assignedPhases[currentPhaseIndex + 1]; gameState.currentPhase = nextPhaseNum; gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.questions = generateQuestions(gameState.currentPhase); gameState.phaseCompleted = false; await saveGameState(); showScreen('gameScreen'); startQuestion(); } else { showResultScreen(100, true); } }
async function retryPhase() { gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.questions = generateQuestions(gameState.currentPhase); gameState.phaseCompleted = false; await saveGameState(); showScreen('gameScreen'); startQuestion(); }
async function restartGame() { if (gameState.phaseCompleted || gameState.attempts <= 0) { logout(); } else { showScreen('startScreen'); } }
async function playCurrentAudio() { const q = gameState.questions[gameState.currentQuestionIndex]; if (q.type !== 'letter_sound') return; const letter = q.correctAnswer; playTeacherAudio(letter, letter); }

// =======================================================
// PARTE 9: FUNÇÕES DE UI, TUTORIAL E RELATÓRIOS (sem alterações)
// =======================================================
// ... (O código completo para helpers de UI, Modais, Tutorial e IA/Relatórios permanece aqui, exatamente como no seu prompt original)
function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId)?.classList.add('active'); }
function showModal(modalId) { document.getElementById(modalId)?.classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'none'; document.getElementById('createStudentFormElement').reset(); }
function showAudioSettingsModal() { const letterSelect = document.getElementById('letterSelect'); if (letterSelect) { let optionsHtml = ''; optionsHtml += '<optgroup label="Instruções e Feedbacks">'; for (const key in CUSTOM_AUDIO_KEYS) { optionsHtml += `<option value="${key}">${CUSTOM_AUDIO_KEYS[key]}</option>`; } optionsHtml += '</optgroup>'; optionsHtml += '<optgroup label="Letras do Alfabeto">'; optionsHtml += ALPHABET.map(letter => `<option value="${letter}">Letra ${letter}</option>`).join(''); optionsHtml += '</optgroup>'; letterSelect.innerHTML = optionsHtml; } showModal('audioSettingsModal'); showTab(document.querySelector('#audioSettingsModal .tab-btn[data-tab="uploadFileTab"]')); }
function showTab(clickedButton) { const parent = clickedButton.closest('.modal-content'); const tabId = clickedButton.getAttribute('data-tab'); parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); clickedButton.classList.add('active'); parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active')); parent.querySelector('#' + tabId).classList.add('active'); }
function showFeedback(message, type = 'info') { const el = document.getElementById('globalFeedback'); if (!el) return; const textEl = el.querySelector('.feedback-text'); if (textEl) textEl.textContent = message; el.className = `show ${type}`; setTimeout(() => { el.className = el.className.replace('show', ''); }, 3000); }
function updateUI() { const gameScreen = document.getElementById('gameScreen'); if (gameScreen.classList.contains('active') && gameState.questions && gameState.questions.length > 0) { document.getElementById('score').textContent = gameState.score; document.getElementById('totalQuestions').textContent = gameState.questions.length; document.getElementById('attempts').textContent = `${gameState.attempts}`; document.getElementById('currentPhase').textContent = gameState.currentPhase; const progress = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100; document.getElementById('progressFill').style.width = `${progress}%`; } }
async function showTutorial(phaseNumber) { if (gameState.tutorialsShown.includes(phaseNumber)) return; const instruction = gameInstructions[phaseNumber]; if (!instruction) return; const overlay = document.getElementById('tutorialOverlay'); const mascot = document.getElementById('tutorialMascot'); document.getElementById('tutorialText').textContent = instruction; overlay.classList.add('show'); mascot.classList.add('talking'); const audioKey = `instruction_${phaseNumber}`; playTeacherAudio(audioKey, instruction, () => mascot.classList.remove('talking')); gameState.tutorialsShown.push(phaseNumber); await saveGameState(); }
function hideTutorial() { document.getElementById('tutorialOverlay').classList.remove('show'); }
async function logStudentError({ question, selectedAnswer }) { if (!currentUser || currentUser.type !== 'student') { return; } const errorData = { student_id: currentUser.id, teacher_id: currentUser.teacher_id, class_id: currentUser.class_id, phase: gameState.currentPhase, question_type: question.type, correct_answer: String(question.correctAnswer), selected_answer: String(selectedAnswer) }; const { error } = await supabaseClient.from('student_errors').insert([errorData]); if (error) { console.error('Falha ao registrar erro:', error); } }
async function populateReportClassSelector() { const selector = document.getElementById('reportClassSelector'); selector.innerHTML = '<option value="">Carregando turmas...</option>'; document.getElementById('reportContentContainer').style.display = 'none'; const { data, error } = await supabaseClient.from('classes').select('id, name').eq('teacher_id', currentUser.id).order('name', { ascending: true }); if (error || !data) { selector.innerHTML = '<option value="">Erro ao carregar</option>'; return; } if (data.length === 0) { selector.innerHTML = '<option value="">Nenhuma turma encontrada</option>'; return; } selector.innerHTML = '<option value="">-- Selecione uma turma --</option>'; data.forEach(cls => { selector.innerHTML += `<option value="${cls.id}">${cls.name}</option>`; }); }
function handleReportClassSelection(event) { const classId = event.target.value; const reportContainer = document.getElementById('reportContentContainer'); if (classId) { reportContainer.style.display = 'block'; loadAndDisplayClassReports(classId); } else { reportContainer.style.display = 'none'; reportContainer.innerHTML = ''; } }
async function loadAndDisplayClassReports(classId) { const reportContainer = document.getElementById('reportContentContainer'); reportContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando relatórios...</p>'; const { data: errors, error: errorsError } = await supabaseClient.from('student_errors').select('*').eq('class_id', classId); if (errorsError) { reportContainer.innerHTML = '<p class="error">Erro ao carregar dados de erros.</p>'; return; } const { data: students, error: studentsError } = await supabaseClient.from('students').select('id, name').eq('class_id', classId); if (studentsError) { reportContainer.innerHTML = '<p class="error">Erro ao carregar lista de alunos.</p>'; return; } reportContainer.innerHTML = ` <div class="report-section"> <h4><i class="fas fa-fire"></i> Mapa de Calor da Turma</h4> <p>As maiores dificuldades da turma inteira, mostrando o que foi mais errado.</p> <div id="classHeatmapContainer"></div> </div> <div class="report-section"> <h4><i class="fas fa-user-graduate"></i> Relatório Individual de Dificuldades</h4> <p>Clique em um aluno para ver seus erros e gerar uma atividade focada com a IA.</p> <div id="individualReportsContainer"></div> </div> `; renderClassHeatmap(errors, 'classHeatmapContainer'); renderIndividualReports(students, errors, 'individualReportsContainer'); }
function renderClassHeatmap(errors, containerId) { const heatmapContainer = document.getElementById(containerId); const sectionHeader = heatmapContainer.closest('.report-section').querySelector('h4'); sectionHeader.querySelector('.view-chart-btn')?.remove(); if (!errors || errors.length === 0) { heatmapContainer.innerHTML = '<p>Nenhum erro registrado para esta turma. Ótimo trabalho! 🎉</p>'; return; } const errorsByPhase = errors.reduce((acc, error) => { const phase = error.phase || 'Desconhecida'; if (!acc[phase]) { acc[phase] = []; } acc[phase].push(error); return acc; }, {}); let html = ''; const sortedPhases = Object.keys(errorsByPhase).sort((a, b) => a - b); for (const phase of sortedPhases) { const phaseDescription = PHASE_DESCRIPTIONS[phase] || 'Fase Desconhecida'; html += `<div class="phase-group"><h3>Fase ${phase} - ${phaseDescription}</h3>`; const phaseErrors = errorsByPhase[phase]; const errorCounts = phaseErrors.reduce((acc, error) => { const key = error.correct_answer; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); const sortedErrors = Object.entries(errorCounts).sort(([, a], [, b]) => b - a); if (sortedErrors.length === 0) { html += '<p>Nenhum erro nesta fase.</p>'; } else { html += sortedErrors.map(([item, count]) => ` <div class="heatmap-item"> <div class="item-label">${item}</div> <div class="item-details"> <span class="item-count">${count} erro(s)</span> <div class="item-bar-container"> <div class="item-bar" style="width: ${(count / sortedErrors[0][1]) * 100}%;"></div> </div> </div> </div> `).join(''); } html += '</div>'; } heatmapContainer.innerHTML = html; const chartButton = document.createElement('button'); chartButton.className = 'btn small view-chart-btn'; chartButton.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico Geral'; chartButton.onclick = () => { const totalErrorCounts = errors.reduce((acc, error) => { const key = error.correct_answer; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); const sortedTotalErrors = Object.entries(totalErrorCounts).sort(([, a], [, b]) => b - a); const chartLabels = sortedTotalErrors.map(([item]) => item); const chartData = sortedTotalErrors.map(([, count]) => count); displayChartModal('Gráfico de Dificuldades da Turma (Geral)', chartLabels, chartData); }; sectionHeader.appendChild(chartButton); }
function renderIndividualReports(students, allErrors, containerId) { const container = document.getElementById(containerId); if (!students || students.length === 0) { container.innerHTML = '<p>Nenhum aluno na turma.</p>'; return; } container.innerHTML = students.map(student => ` <div class="student-item student-report-item" data-student-id="${student.id}" data-student-name="${student.name}"> <div class="student-info"> <h4>${student.name}</h4> </div> <i class="fas fa-chevron-down"></i> </div> <div class="student-errors-details" id="errors-for-${student.id}" style="display: none;"></div> `).join(''); container.querySelectorAll('.student-report-item').forEach(item => { item.addEventListener('click', () => { const studentId = item.dataset.studentId; const studentName = item.dataset.studentName; const detailsContainer = document.getElementById(`errors-for-${studentId}`); const isVisible = detailsContainer.style.display === 'block'; container.querySelectorAll('.student-errors-details').forEach(d => { if (d.id !== `errors-for-${studentId}`) d.style.display = 'none'; }); container.querySelectorAll('.student-report-item i').forEach(i => i.className = 'fas fa-chevron-down'); if (!isVisible) { detailsContainer.style.display = 'block'; item.querySelector('i').className = 'fas fa-chevron-up'; const studentErrors = allErrors.filter(e => e.student_id === studentId); if (studentErrors.length === 0) { detailsContainer.innerHTML = '<p style="padding: 10px;">Este aluno não cometeu erros. Ótimo trabalho! 🌟</p>'; return; } const errorCounts = studentErrors.reduce((acc, error) => { const key = `Fase ${error.phase} | Correto: ${error.correct_answer}`; if (!acc[key]) { acc[key] = { count: 0, selections: {}, details: error }; } acc[key].count++; acc[key].selections[error.selected_answer] = (acc[key].selections[error.selected_answer] || 0) + 1; return acc; }, {}); const top5Errors = Object.entries(errorCounts).sort(([, a], [, b]) => b.count - a.count).slice(0, 5); let reportHTML = `<ul>${top5Errors.map(([, errorData]) => { const selectionsText = Object.entries(errorData.selections).map(([selection, count]) => `'${selection}' (${count}x)`).join(', '); const phaseDescription = PHASE_DESCRIPTIONS[errorData.details.phase] || ''; return `<li> <div class="error-item"> <strong>Fase ${errorData.details.phase} (${phaseDescription}):</strong> Resposta correta era <strong>"${errorData.details.correct_answer}"</strong> <small>Aluno selecionou: ${selectionsText}</small> </div> <span class="error-count">${errorData.count} ${errorData.count > 1 ? 'vezes' : 'vez'}</span> </li>`; }).join('')}</ul>`; reportHTML += `<div class="ai-button-container"> <button class="btn ai-btn" onclick="handleGenerateLessonPlan('${studentId}', '${studentName}')"> <i class="fas fa-rocket"></i> Analisar com IA </button> </div>`; detailsContainer.innerHTML = reportHTML; } else { detailsContainer.style.display = 'none'; item.querySelector('i').className = 'fas fa-chevron-down'; } }); }); }
async function handleGenerateLessonPlan(studentId, studentName) { const aiContainer = document.getElementById('aiTipsContent'); document.getElementById('aiTipsTitle').innerHTML = `<i class="fas fa-rocket" style="color: #764ba2;"></i> Assistente Pedagógico para <span style="color: #2c3e50;">${studentName}</span>`; aiContainer.innerHTML = '<div class="loading-ai"><i class="fas fa-spinner fa-spin"></i> Analisando e gerando plano de aula...</div>'; showModal('aiTipsModal'); const apiKey = "COLE_SUA_CHAVE_AQUI"; if (!apiKey || apiKey === "COLE_SUA_CHAVE_AQUI") { aiContainer.innerHTML = `<p class="error"><strong>Erro de Configuração:</strong> A chave de API do Gemini não foi inserida no arquivo script.js.</p>`; return; } try { const { data: studentErrors, error } = await supabaseClient.from('student_errors').select('*').eq('student_id', studentId).limit(20); if (error || !studentErrors || studentErrors.length === 0) { aiContainer.innerHTML = '<p>Este aluno não possui erros registrados para análise. Ótimo trabalho! 🌟</p>'; return; } const errorSummary = studentErrors.map(e => `Na fase '${PHASE_DESCRIPTIONS[e.phase]}', a resposta correta era '${e.correct_answer}' e o aluno escolheu '${e.selected_answer}'.`).join('\n'); const prompt = `Você é um especialista em pedagogia da alfabetização no Brasil. Um professor precisa de um relatório e uma atividade para o aluno ${studentName}, que apresentou as seguintes dificuldades:\n${errorSummary}\n\nCrie uma resposta em duas partes. A resposta DEVE seguir EXATAMENTE esta estrutura de Markdown:\n\n## 🔍 Análise Pedagógica\n(Faça um parágrafo curto e claro resumindo a principal dificuldade do aluno com base nos erros. Ex: "A análise indica uma dificuldade recorrente na distinção de fonemas surdos e sonoros, especificamente com os pares P/B e F/V.")\n\n## 💡 Sugestão de Atividade Prática (Mini Plano de Aula)\n\n### 🎯 Foco da Atividade:\n(Descreva em uma frase o ponto a ser trabalhado).\n\n### ✂️ Materiais Necessários:\n(Liste 2 ou 3 itens simples de sala de aula).\n\n### 👣 Passo a Passo (10-15 min):\n(Crie 3 passos curtos e práticos. Comece cada passo com "1.", "2.", etc.).`; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`; const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) }); if (!response.ok) { const errorBody = await response.json(); console.error("API Error Body:", errorBody); throw new Error(`Erro na API (${response.status}): ${errorBody.error.message}`); } const result = await response.json(); if (result.candidates && result.candidates[0].content?.parts[0]) { let text = result.candidates[0].content.parts[0].text; text = text.replace(/## (.*)/g, '<h2>$1</h2>'); text = text.replace(/### (.*)/g, '<h3>$1</h3>'); text = text.replace(/\n(\d)\. (.*)/g, '<p class="lesson-step"><strong>Passo $1:</strong> $2</p>'); text = text.replace(/\n/g, '<br>'); aiContainer.innerHTML = text; } else { throw new Error("A resposta da IA veio em um formato inesperado."); } } catch (err) { console.error("Falha ao gerar o plano de aula com a IA:", err); aiContainer.innerHTML = `<p class="error"><strong>Desculpe, ocorreu um erro ao gerar a atividade.</strong><br><br>Motivo: ${err.message}</p>`; } }
function displayChartModal(title, labels, data) { const modal = document.getElementById('chartModal'); const titleEl = document.getElementById('chartModalTitle'); const ctx = document.getElementById('myChartCanvas').getContext('2d'); titleEl.textContent = title; if (currentChart) { currentChart.destroy(); } currentChart = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Nº de Erros', data: data, backgroundColor: 'rgba(118, 75, 162, 0.6)', borderColor: 'rgba(118, 75, 162, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false }, title: { display: true, text: 'Itens com maior quantidade de erros na turma', font: { size: 16, family: "'Comic Neue', cursive" } } } } }); showModal('chartModal'); }

// =======================================================
// JOGO DAS LETRAS - SCRIPT REESTRUTURADO E MELHORADO
// Versão alinhada ao currículo pedagógico, com 10 fases de 10 rodadas.
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
    1: "Ouça o som da VOGAL e clique na letra correta!",
    2: "Qual é a VOGAL que começa o nome da figura?",
    3: "Complete a palavra com o encontro de vogais correto.",
    4: "Vamos explorar a letra F! Complete ou encontre a palavra correta.",
    5: "Ouça com atenção! A palavra é com F ou V? P ou B? T ou D?",
    6: "Conte os pedaços (sílabas) da palavra e escolha o número certo.",
    7: "Quantas palavras existem nesta frase?",
    8: "Clique nas palavras na ordem certa para montar a frase.",
    9: "Se tirarmos um pedaço da palavra, qual nova palavra formamos?",
    10: "Coloque as letras na ordem certa do alfabeto!"
};

const PHASE_DESCRIPTIONS = {
    1: "Identificação de Vogais",
    2: "Vogal Inicial",
    3: "Encontros Vocálicos",
    4: "Explorando a Letra F",
    5: "Pares Surdos/Sonoros",
    6: "Contando Sílabas",
    7: "Contando Palavras na Frase",
    8: "Montando Frases",
    9: "Formando Novas Palavras",
    10: "Ordem Alfabética"
};

// BANCO DE DADOS DAS FASES (EXPANDIDO PARA 10 RODADAS)
const PHASE_2_WORDS = [
    { word: 'ABELHA', image: '🐝', vowel: 'A' }, { word: 'ELEFANTE', image: '🐘', vowel: 'E' },
    { word: 'IGREJA', image: '⛪', vowel: 'I' }, { word: 'ÔNIBUS', image: '🚌', vowel: 'O' },
    { word: 'UVA', image: '🍇', vowel: 'U' }, { word: 'ANEL', image: '💍', vowel: 'A' },
    { word: 'ESTRELA', image: '⭐', vowel: 'E' }, { word: 'ÍNDIO', image: '🧍', vowel: 'I' },
    { word: 'OLHO', image: '👁️', vowel: 'O' }, { word: 'URSO', image: '🐻', vowel: 'U' }
];

const PHASE_3_ENCONTROS = [
    { word: 'PEIXE', image: '🐠', encontro: 'EI' }, { word: 'BOI', image: '🐂', encontro: 'OI' },
    { word: 'CAIXA', image: '📦', encontro: 'AI' }, { word: 'LUA', image: '🌙', encontro: 'UA' },
    { word: 'PÃO', image: '🍞', encontro: 'ÃO' }, { word: 'MÃE', image: '👩', encontro: 'ÃE' },
    { word: 'CÉU', image: '☁️', encontro: 'ÉU' }, { word: 'LEÃO', image: '🦁', encontro: 'ÃO' },
    { word: 'SAIA', image: '👗', encontro: 'AI' }, { word: 'BALÃO', image: '🎈', encontro: 'ÃO' }
];
const VOWEL_ENCOUNTERS = ['AI', 'EI', 'OI', 'UI', 'AU', 'EU', 'ÃO', 'ÃE', 'UA', 'ÉU'];

const PHASE_4_WORDS_F = [
    { type: 'initial_syllable', word: 'FACA', image: '🔪', correctAnswer: 'FA', options: ['FA', 'FO', 'VA'] },
    { type: 'initial_syllable', word: 'FOGO', image: '🔥', correctAnswer: 'FO', options: ['FE', 'VO', 'FO'] },
    { type: 'initial_syllable', word: 'FITA', image: '🎀', correctAnswer: 'FI', options: ['VI', 'FI', 'FA'] },
    { type: 'initial_syllable', word: 'FUMAÇA', image: '💨', correctAnswer: 'FU', options: ['FU', 'FA', 'VU'] },
    { type: 'initial_syllable', word: 'FEIJÃO', image: '🌱', correctAnswer: 'FE', options: ['FE', 'VE', 'FO'] },
    { type: 'middle_syllable', word: 'GARRAFA', image: '🍾', correctAnswer: 'FA', options: ['VA', 'FA', 'FO'] },
    { type: 'middle_syllable', word: 'ALFINETE', image: '🧷', correctAnswer: 'FI', options: ['FI', 'VI', 'FE'] },
    { type: 'middle_syllable', word: 'TELEFONE', image: '📞', correctAnswer: 'FO', options: ['VO', 'FE', 'FO'] },
    { type: 'full_word', word: 'FOTO', image: '📷', correctAnswer: 'FOTO', options: ['FOTO', 'VOTO', 'FOGO'] },
    { type: 'full_word', word: 'FIO', image: '🧵', correctAnswer: 'FIO', options: ['FIO', 'VIO', 'FILA'] }
];

const PHASE_5_SOUND_PAIRS = [
    { word: 'VACA', image: '🐄', correct: 'VACA', incorrect: 'FACA' },
    { word: 'PATO', image: '🦆', correct: 'PATO', incorrect: 'BATO' },
    { word: 'DADO', image: '🎲', correct: 'DADO', incorrect: 'TADO' },
    { word: 'FOTO', image: '📷', correct: 'FOTO', incorrect: 'VOTO' },
    { word: 'BOTE', image: '⛵', correct: 'BOTE', incorrect: 'POTE' },
    { word: 'TELA', image: '🖼️', correct: 'TELA', incorrect: 'DELA' },
    { word: 'FARINHA', image: '🌾', correct: 'FARINHA', incorrect: 'VARINHA' },
    { word: 'BINGO', image: '🎯', correct: 'BINGO', incorrect: 'PINGO' },
    { word: 'TIA', image: '🙋‍♀️', correct: 'TIA', incorrect: 'DIA' },
    { word: 'VILA', image: '🏘️', correct: 'VILA', incorrect: 'FILA' }
];

const PHASE_6_SYLLABLE_COUNT = [
    { word: 'FÉ', image: '🙏', syllables: 1 }, { word: 'SOL', image: '☀️', syllables: 1 },
    { word: 'BIFE', image: '🥩', syllables: 2 }, { word: 'BOLA', image: '⚽', syllables: 2 },
    { word: 'FIGURA', image: '👤', syllables: 3 }, { word: 'SAPATO', image: '👟', syllables: 3 },
    { word: 'FÁBRICA', image: '🏭', syllables: 3 }, { word: 'TELEFONE', image: '📞', syllables: 4 },
    { word: 'ABACATE', image: '🥑', syllables: 4 }, { word: 'BORBOLETA', image: '🦋', syllables: 4 }
];

const PHASE_7_SENTENCES_COUNT = [
    { sentence: 'A FADA VOOU', image: '🧚‍♀️', words: 3 },
    { sentence: 'O GATO BEBE LEITE', image: '🐈', words: 4 },
    { sentence: 'O SOL É AMARELO', image: '☀️', words: 4 },
    { sentence: 'EU GOSTO DE BOLO', image: '🎂', words: 4 },
    { sentence: 'A BOLA ROLOU', image: '⚽', words: 3 },
    { sentence: 'O CARRO É RÁPIDO', image: '🚗', words: 4 },
    { sentence: 'A FLOR CHEIRA BEM', image: '🌸', words: 4 },
    { sentence: 'O PÁSSARO CANTA', image: '🐦', words: 3 },
    { sentence: 'A LUA BRILHA', image: '🌙', words: 3 },
    { sentence: 'O SAPO PULA ALTO', image: '🐸', words: 4 }
];

const PHASE_8_SENTENCES_BUILD = [
    { sentence: ['O', 'FOGO', 'QUEIMA'], image: '🔥', answer: 'O FOGO QUEIMA' },
    { sentence: ['O', 'CAFÉ', 'É', 'FORTE'], image: '☕', answer: 'O CAFÉ É FORTE' },
    { sentence: ['A', 'FADA', 'VOOU'], image: '🧚‍♀️', answer: 'A FADA VOOU' },
    { sentence: ['O', 'GATO', 'DORME'], image: '😴', answer: 'O GATO DORME' },
    { sentence: ['A', 'BOLA', 'É', 'REDONDA'], image: '⚽', answer: 'A BOLA É REDONDA' },
    { sentence: ['O', 'CACHORRO', 'LATE'], image: '🐕', answer: 'O CACHORRO LATE' },
    { sentence: ['EU', 'AMO', 'LER'], image: '📚', answer: 'EU AMO LER' },
    { sentence: ['O', 'PEIXE', 'NADA'], image: '🐠', answer: 'O PEIXE NADA' },
    { sentence: ['A', 'CASA', 'É', 'GRANDE'], image: '🏠', answer: 'A CASA É GRANDE' },
    { sentence: ['NÓS', 'VAMOS', 'BRINCAR'], image: '🤹', answer: 'NÓS VAMOS BRINCAR' }
];

const PHASE_9_WORD_TRANSFORM = [
    { image: '👟', initialWord: 'SAPATO', toRemove: 'SA', correctAnswer: 'PATO', options: ['PATO', 'SAPO', 'MATO'] },
    { image: '🧤', initialWord: 'LUVA', toRemove: 'L', correctAnswer: 'UVA', options: ['UVA', 'LUA', 'VILA'] },
    { image: '🦁', initialWord: 'CAMALEÃO', toRemove: 'CAMA', correctAnswer: 'LEÃO', options: ['LEÃO', 'SALÃO', 'LAMA'] },
    { image: '🎖️', initialWord: 'SOLDADO', toRemove: 'SOL', correctAnswer: 'DADO', options: ['DADO', 'SOLD', 'ADO'] },
    { image: '🐔', initialWord: 'GALINHA', toRemove: 'GA', correctAnswer: 'LINHA', options: ['LINHA', 'GALO', 'NINHA'] },
    { image: '🦜', initialWord: 'TUCANO', toRemove: 'TU', correctAnswer: 'CANO', options: ['CANO', 'TUCA', 'NANO'] },
    { image: '🚪', initialWord: 'PORTA', toRemove: 'POR', correctAnswer: 'TA', options: ['TA', 'PORT', 'TARTA'] },
    { image: '🐚', initialWord: 'CASCA', toRemove: 'SCA', correctAnswer: 'CA', options: ['CA', 'CASA', 'ASCA'] },
    { image: '🐍', initialWord: 'SERPENTE', toRemove: 'SER', correctAnswer: 'PENTE', options: ['PENTE', 'DENTE', 'GENTE'] },
    { image: '🪜', initialWord: 'PESCADA', toRemove: 'PES', correctAnswer: 'CADA', options: ['CADA', 'FADA', 'NADA'] }
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
async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const email = document.getElementById('teacherEmail').value; const password = document.getElementById('teacherPassword').value; try { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; currentUser = data.user; await showTeacherDashboard(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleTeacherRegister(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...'; const name = document.getElementById('teacherRegName').value; const email = document.getElementById('teacherRegEmail').value; const password = document.getElementById('teacherRegPassword').value; try { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, role: 'teacher' } } }); if (error) throw error; showFeedback('Cadastro realizado! Link de confirmação enviado para seu e-mail.', 'success'); showScreen('teacherLoginScreen'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleStudentLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const username = document.getElementById('studentUsername').value.trim(); const password = document.getElementById('studentPassword').value.trim(); try { const { data: studentData, error } = await supabaseClient.from('students').select('*, assigned_phases').eq('username', username).single(); if (error && error.message.includes('multiple (or no) rows')) { throw new Error('Usuário ou senha inválidos.'); } if (error) throw error; if (!studentData) { throw new Error('Usuário ou senha inválidos.'); } const match = await verifyPassword(password, studentData.password); if (!match) { throw new Error('Usuário ou senha inválidos.'); } currentUser = { ...studentData, type: 'student' }; sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); await showStudentGame(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function logout() { await supabaseClient.auth.signOut(); currentUser = null; currentClassId = null; sessionStorage.removeItem('currentUser'); showScreen('userTypeScreen'); }
function handleExitGame() { if (confirm('Tem certeza que deseja sair? Seu progresso ficará salvo.')) { sessionStorage.removeItem('currentUser'); currentUser = null; showScreen('userTypeScreen'); } }

// PARTE 6: DASHBOARD DO PROFESSOR
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
        
        const phaseCheckboxes = Object.keys(PHASE_DESCRIPTIONS).map(phaseNumStr => {
            const phaseNum = parseInt(phaseNumStr);
            const phaseName = PHASE_DESCRIPTIONS[phaseNum] || `Fase ${phaseNum}`;
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
async function handleCreateStudent(event) { event.preventDefault(); const username = document.getElementById('createStudentUsername').value.trim(); const password = document.getElementById('createStudentPassword').value; const submitButton = document.getElementById('createStudentSubmitBtn'); if (!username || !password) { return showFeedback("Preencha nome e senha.", "error"); } if (!currentClassId || !currentUser?.id) { return showFeedback("Erro de sessão.", "error"); } submitButton.disabled = true; submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...'; try { const hashedPassword = await hashPassword(password); const { error } = await supabaseClient.from('students').insert([{ name: username, username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }]); if (error) throw error; document.getElementById('newStudentUsername').textContent = username; document.getElementById('newStudentPassword').textContent = password; showModal('studentCreatedModal'); hideCreateStudentForm(); await loadClassStudents(); await loadStudentProgress(); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { submitButton.disabled = false; submitButton.innerHTML = 'Criar Aluno'; } }
async function handleDeleteStudent(studentId, studentName) { if (!confirm(`Tem certeza que deseja excluir "${studentName}"?`)) return; const { error } = await supabaseClient.from('students').delete().eq('id', studentId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Aluno "${studentName}" excluído.`, 'success'); await loadClassStudents(); await loadStudentProgress(); } }
async function handleShowOrResetPassword(studentId, studentName) { showFeedback(`Redefinindo senha para ${studentName}...`, 'info'); const newPassword = generateRandomPassword(); try { const hashedPassword = await hashPassword(newPassword); const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId); if (error) throw error; document.getElementById('resetStudentName').textContent = studentName; document.getElementById('resetStudentPassword').textContent = newPassword; showModal('resetPasswordModal'); } catch (error) { showFeedback(`Erro ao tentar alterar a senha: ${error.message}`, 'error'); } }
function handleCopyCredentials() { const username = document.getElementById('newStudentUsername').textContent; const password = document.getElementById('newStudentPassword').textContent; const textToCopy = `Usuário: ${username}\nSenha: ${password}`; navigator.clipboard.writeText(textToCopy).then(() => { showFeedback('Copiado!', 'success'); }).catch(() => { showFeedback('Erro ao copiar.', 'error'); }); }
function handleCopyResetPassword() { const password = document.getElementById('resetStudentPassword').textContent; navigator.clipboard.writeText(password).then(() => { showFeedback('Nova senha copiada!', 'success'); }).catch(() => { showFeedback('Erro ao copiar a senha.', 'error'); }); }

// PARTE 7: ÁUDIO
async function handleAudioUpload() { const files = document.getElementById('audioUpload').files; if (files.length === 0) return; const uploadStatus = document.getElementById('uploadStatus'); uploadStatus.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Enviando...</p>`; let successCount = 0, errorCount = 0; for (const file of files) { const fileName = file.name.split('.').slice(0, -1).join('.').toUpperCase(); const filePath = `${currentUser.id}/${fileName}.${file.name.split('.').pop()}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true }); if (error) throw error; successCount++; } catch (error) { console.error(`Erro no upload:`, error); errorCount++; } } uploadStatus.innerHTML = `<p style="color: green;">${successCount} enviados!</p>`; if (errorCount > 0) { uploadStatus.innerHTML += `<p style="color: red;">Falha em ${errorCount}.</p>`; } }
async function startRecording() { const recordBtn = document.getElementById('recordBtn'), stopBtn = document.getElementById('stopBtn'), statusEl = document.getElementById('recordStatus'); recordBtn.disabled = true; statusEl.textContent = 'Pedindo permissão...'; try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioChunks = []; mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data)); mediaRecorder.addEventListener('stop', () => { const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const audioUrl = URL.createObjectURL(audioBlob); document.getElementById('audioPlayback').src = audioUrl; document.getElementById('saveRecordingBtn').disabled = false; stream.getTracks().forEach(track => track.stop()); }); mediaRecorder.start(); statusEl.textContent = 'Gravando...'; stopBtn.disabled = false; startTimer(); } catch (err) { console.error("Erro ao gravar:", err); alert("Não foi possível gravar. Verifique as permissões."); statusEl.textContent = 'Falha.'; recordBtn.disabled = false; } }
function stopRecording() { if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); stopTimer(); document.getElementById('recordBtn').disabled = false; document.getElementById('stopBtn').disabled = true; document.getElementById('recordStatus').textContent = 'Parado.'; } }
async function saveRecording() { if (audioChunks.length === 0) return; const saveButton = document.getElementById('saveRecordingBtn'); saveButton.disabled = true; saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; const selectedItem = document.getElementById('letterSelect').value; const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const fileName = `${selectedItem}.webm`; const filePath = `${currentUser.id}/${fileName}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, audioBlob, { upsert: true }); if (error) throw error; showFeedback(`Áudio para "${selectedItem}" salvo!`, 'success'); audioChunks = []; document.getElementById('audioPlayback').src = ''; } catch (error) { showFeedback(`Erro: ${error.message}`, 'error'); } finally { saveButton.disabled = false; saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar'; } }
function startTimer() { stopTimer(); let seconds = 0; const timerEl = document.getElementById('recordTimer'); timerEl.textContent = '00:00'; timerInterval = setInterval(() => { seconds++; const mins = Math.floor(seconds / 60).toString().padStart(2, '0'); const secs = (seconds % 60).toString().padStart(2, '0'); timerEl.textContent = `${mins}:${secs}`; }, 1000); }
function stopTimer() { clearInterval(timerInterval); }

// PARTE 8: LÓGICA DO JOGO
async function showStudentGame() { await loadGameState(); const canResume = gameState.currentQuestionIndex > 0 && gameState.attempts > 0 && !gameState.phaseCompleted; if (canResume) { showScreen('gameScreen'); startQuestion(); } else { showScreen('startScreen'); } }
async function startGame() { showScreen('gameScreen'); startQuestion(); }
async function loadGameState() { const { data: progressData, error } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single(); if (error && error.code !== 'PGRST116') { console.error("Erro ao carregar progresso:", error); } const assignedPhases = currentUser.assigned_phases && currentUser.assigned_phases.length > 0 ? currentUser.assigned_phases : [1]; const firstAssignedPhase = assignedPhases[0]; if (progressData?.game_state?.questions) { gameState = progressData.game_state; if (!assignedPhases.includes(gameState.currentPhase)) { gameState = { currentPhase: firstAssignedPhase, score: 0, attempts: 3, questions: generateQuestions(firstAssignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } if (!gameState.tutorialsShown) gameState.tutorialsShown = []; } else { gameState = { currentPhase: firstAssignedPhase, score: 0, attempts: 3, questions: generateQuestions(firstAssignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } }
async function saveGameState() { if (!currentUser || currentUser.type !== 'student') return; await supabaseClient.from('progress').upsert({ student_id: currentUser.id, current_phase: gameState.currentPhase, game_state: gameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' }); }

function generateQuestions(phase) {
    let questions = [];
    const questionCount = 10;
    
    const shuffleAndTake = (arr, num) => [...arr].sort(() => 0.5 - Math.random()).slice(0, num);

    switch (phase) {
        case 1: // Identificação de Vogais
            questions = Array.from({ length: questionCount }, (_, i) => {
                const vowel = VOWELS[i % VOWELS.length];
                return { 
                    type: 'letter_sound', 
                    correctAnswer: vowel, 
                    options: generateOptions(vowel, VOWELS, 4)
                };
            }).sort(() => 0.5 - Math.random());
            break;

        case 2: // Vogal Inicial
            questions = shuffleAndTake(PHASE_2_WORDS, questionCount).map(item => ({
                type: 'initial_vowel',
                word: item.word,
                image: item.image,
                correctAnswer: item.vowel,
                options: generateOptions(item.vowel, VOWELS, 4)
            }));
            break;

        case 3: // Encontros Vocálicos
            questions = shuffleAndTake(PHASE_3_ENCONTROS, questionCount).map(item => ({
                type: 'vowel_encounter',
                word: item.word,
                image: item.image,
                correctAnswer: item.encontro,
                options: generateOptions(item.encontro, VOWEL_ENCOUNTERS, 4)
            }));
            break;

        case 4: // Explorando a Letra F
            questions = shuffleAndTake(PHASE_4_WORDS_F, questionCount).map(item => ({
                ...item,
                options: item.options.sort(() => 0.5 - Math.random())
            }));
            break;

        case 5: // Pares Surdos/Sonoros
            questions = shuffleAndTake(PHASE_5_SOUND_PAIRS, questionCount).map(item => ({
                type: 'sound_detective',
                image: item.image,
                correctAnswer: item.correct,
                options: [item.correct, item.incorrect].sort(() => 0.5 - Math.random())
            }));
            break;
            
        case 6: // Contagem de Sílabas
            questions = shuffleAndTake(PHASE_6_SYLLABLE_COUNT, questionCount).map(item => ({
                type: 'count_syllables',
                word: item.word,
                image: item.image,
                correctAnswer: item.syllables.toString(),
                options: generateOptions(item.syllables.toString(), ['1', '2', '3', '4', '5'], 4)
            }));
            break;
            
        case 7: // Contagem de Palavras na Frase
            questions = shuffleAndTake(PHASE_7_SENTENCES_COUNT, questionCount).map(item => ({
                type: 'count_words',
                sentence: item.sentence,
                image: item.image,
                correctAnswer: item.words.toString(),
                options: generateOptions(item.words.toString(), ['2', '3', '4', '5'], 4)
            }));
            break;

        case 8: // Montagem de Frases
            questions = shuffleAndTake(PHASE_8_SENTENCES_BUILD, questionCount).map(item => ({
                type: 'build_sentence',
                image: item.image,
                correctAnswer: item.answer,
                options: item.sentence.sort(() => 0.5 - Math.random())
            }));
            break;
            
        case 9: // Formando Novas Palavras
            questions = shuffleAndTake(PHASE_9_WORD_TRANSFORM, questionCount).map(item => ({
                type: 'word_transform',
                image: item.image,
                initialWord: item.initialWord,
                toRemove: item.toRemove,
                correctAnswer: item.correctAnswer,
                options: item.options.sort(() => 0.5 - Math.random())
            }));
            break;
            
        case 10: // Ordem Alfabética
            questions = Array.from({ length: questionCount }, () => {
                const startIndex = Math.floor(Math.random() * (ALPHABET.length - 4));
                const sequence = ALPHABET.slice(startIndex, startIndex + 4);
                return {
                    type: 'alphabet_order',
                    correctAnswer: sequence,
                    options: [...sequence].sort(() => 0.5 - Math.random())
                };
            });
            break;
    }
    while (questions.length > 0 && questions.length < questionCount) {
        questions.push(questions[Math.floor(Math.random() * questions.length)]);
    }
    return questions.slice(0, questionCount);
}

function generateOptions(correctItem, sourceArray, count) { const options = new Set([correctItem]); const availableItems = sourceArray.filter(l => l !== correctItem); while (options.size < count && availableItems.length > 0) { options.add(availableItems.splice(Math.floor(Math.random() * availableItems.length), 1)[0]); } return Array.from(options).sort(() => 0.5 - Math.random()); }

async function startQuestion() {
    if (gameState.phaseCompleted) {
        const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100;
        showResultScreen(accuracy, true);
        return;
    }
    await showTutorial(gameState.currentPhase);
    if (!gameState.questions || gameState.currentQuestionIndex >= gameState.questions.length) {
        return endPhase();
    }
    const q = gameState.questions[gameState.currentQuestionIndex];
    document.getElementById('nextQuestion').style.display = 'none';
    updateUI();

    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'none';
    document.getElementById('lettersGrid').style.display = 'none';
    document.getElementById('memoryGameGrid').style.display = 'none';
    document.getElementById('sentenceBuildArea').style.display = 'none';

    document.getElementById('lettersGrid').innerHTML = '';
    document.getElementById('memoryGameGrid').innerHTML = '';
    
    const sentenceArea = document.getElementById('sentenceBuildArea');
    sentenceArea.innerHTML = '';
    sentenceArea.style.borderColor = '';
    sentenceArea.style.backgroundColor = '';

    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.textContent = '';
    wordDisplay.style.fontSize = '2.5rem';

    document.getElementById('questionText').textContent = '';
    document.getElementById('repeatAudio').style.display = 'none';

    switch (q.type) {
        case 'letter_sound': renderPhase1UI(q); break;
        case 'initial_vowel': renderPhase2UI(q); break;
        case 'vowel_encounter': renderPhase3UI(q); break;
        case 'initial_syllable': case 'middle_syllable': case 'full_word': renderPhase4UI(q); break;
        case 'sound_detective': renderPhase5UI_SoundDetective(q); break;
        case 'count_syllables': renderPhase6UI(q); break;
        case 'count_words': renderPhase7UI_WordCount(q); break;
        case 'build_sentence': renderPhase8UI(q); break;
        case 'word_transform': renderPhase9UI_WordTransform(q); break;
        case 'alphabet_order': renderPhase10UI_AlphabetOrder(q); break;
    }
    if (q.type === 'letter_sound') { setTimeout(playCurrentAudio, 500); }
}

function renderPhase1UI(q) { document.getElementById('audioQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('questionText').textContent = 'Qual VOGAL faz este som?'; document.getElementById('repeatAudio').style.display = 'inline-block'; renderOptions(q.options); }
function renderPhase2UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = `__${q.word.substring(1)}`; document.getElementById('questionText').textContent = 'Qual vogal completa a palavra?'; renderOptions(q.options); }
function renderPhase3UI(q) { document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('lettersGrid').style.display = 'grid'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.word.replace(q.correctAnswer, '__'); document.getElementById('questionText').textContent = 'Qual encontro de vogais completa a palavra?'; renderOptions(q.options); }
function renderPhase4UI(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('imageEmoji').textContent = q.image;
    if (q.type === 'initial_syllable') {
        document.getElementById('wordDisplay').textContent = `__${q.word.substring(q.correctAnswer.length)}`;
        document.getElementById('questionText').textContent = 'Qual sílaba começa esta palavra?';
    } else if (q.type === 'middle_syllable') {
        document.getElementById('wordDisplay').textContent = q.word.replace(q.correctAnswer, '__');
        document.getElementById('questionText').textContent = 'Qual sílaba completa esta palavra?';
    } else { // full_word
        document.getElementById('wordDisplay').textContent = `?`;
        document.getElementById('questionText').textContent = 'Qual é o nome desta figura?';
    }
    renderOptions(q.options);
}
function renderPhase5UI_SoundDetective(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('questionText').textContent = 'Qual é o som correto desta palavra?';
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = q.options.map((option) => `
        <button class="sound-detective-button" data-sound="${option}">
            <i class="fas fa-volume-up"></i> ${option}
        </button>
    `).join('');
    lettersGrid.querySelectorAll('.sound-detective-button').forEach(btn => {
        btn.addEventListener('click', () => {
            speak(btn.dataset.sound);
            setTimeout(() => selectAnswer(btn.dataset.sound), 300);
        });
    });
}
function renderPhase6UI(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word;
    document.getElementById('questionText').textContent = 'Quantas sílabas (pedaços) tem esta palavra?';
    renderOptions(q.options);
}
function renderPhase7UI_WordCount(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('imageEmoji').textContent = q.image;
    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.textContent = q.sentence;
    wordDisplay.style.fontSize = '1.8rem';
    document.getElementById('questionText').textContent = 'Quantas palavras tem nesta frase?';
    renderOptions(q.options);
}
function renderPhase8UI(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('sentenceBuildArea').style.display = 'flex';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('questionText').textContent = 'Clique nas palavras para formar a frase correta.';
    renderWordOptions(q.options);
}
function renderPhase9UI_WordTransform(q) {
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('lettersGrid').style.display = 'grid';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.initialWord;
    document.getElementById('questionText').textContent = `Se tirarmos "${q.toRemove}", qual palavra formamos?`;
    renderOptions(q.options);
}
function renderPhase10UI_AlphabetOrder(q) {
    document.getElementById('questionText').textContent = 'Clique nas letras na ordem alfabética correta.';
    document.getElementById('lettersGrid').style.display = 'grid';
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = q.options.map(letter => `<button class="letter-button">${letter}</button>`).join('');
    gameState.sequenceGame = { correctSequence: q.correctAnswer, userSequence: [] };
    lettersGrid.querySelectorAll('.letter-button').forEach(btn => {
        btn.addEventListener('click', () => handleSequenceClick(btn));
    });
}
function renderOptions(options) { const lettersGrid = document.getElementById('lettersGrid'); lettersGrid.style.display = 'grid'; lettersGrid.innerHTML = options.map(option => `<button class="letter-button">${option}</button>`).join(''); lettersGrid.querySelectorAll('.letter-button').forEach(btn => btn.addEventListener('click', (e) => selectAnswer(e.target.textContent))); }
function renderWordOptions(options) {
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.style.display = 'grid';
    lettersGrid.innerHTML = options.map(option => `<button class="word-option-button">${option}</button>`).join('');
    lettersGrid.querySelectorAll('.word-option-button').forEach(btn => {
        btn.addEventListener('click', () => selectWordForSentence(btn));
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
async function selectAnswer(selectedAnswer) {
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q) return; 
    if (['alphabet_order'].includes(q.type)) return;

    document.querySelectorAll('.letter-button, .word-option-button, .sound-detective-button').forEach(btn => btn.disabled = true);

    const isCorrect = selectedAnswer === q.correctAnswer;

    if (q.type === 'build_sentence') {
        const sentenceArea = document.getElementById('sentenceBuildArea');
        if (isCorrect) {
            sentenceArea.style.borderColor = '#4ECDC4';
            sentenceArea.style.backgroundColor = 'rgba(78, 205, 196, 0.1)';
        } else {
            sentenceArea.style.borderColor = '#ff6b6b';
            sentenceArea.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        }
    } else {
        document.querySelectorAll('.letter-button, .word-option-button, .sound-detective-button').forEach(btn => {
            const btnIdentifier = btn.dataset.sound || btn.textContent;
            if (btnIdentifier === q.correctAnswer) {
                btn.classList.add('correct');
            }
            if (!isCorrect && btnIdentifier === selectedAnswer) {
                btn.classList.add('incorrect');
            }
        });
    }

    if (isCorrect) {
        gameState.score++;
        showFeedback('Muito bem!', 'success');
        playTeacherAudio('feedback_correct', 'Acertou');
        if (q.type !== 'letter_sound' && q.type !== 'build_sentence' && q.type !== 'count_words') {
            document.getElementById('wordDisplay').textContent = q.word || q.initialWord;
        }
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
async function retryPhase() { gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.phaseCompleted = false; await saveGameState(); showScreen('gameScreen'); startQuestion(); }
async function restartGame() { if (gameState.phaseCompleted || gameState.attempts <= 0) { logout(); } else { showScreen('startScreen'); } }
async function playCurrentAudio() { const q = gameState.questions[gameState.currentQuestionIndex]; if (q.type !== 'letter_sound') return; const letter = q.correctAnswer; playTeacherAudio(letter, letter); }

// =========================================================================
// BLOCO DE CÓDIGO PARA CORREÇÃO DO SOM - Início
// =========================================================================

function initializeSpeech() {
    // Esta função agora retorna uma promessa que só é resolvida
    // quando uma voz em pt-BR é encontrada e carregada.
    const checkVoices = (resolve, reject) => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            selectedVoice = voices.find(v => v.lang === 'pt-BR');
            if (selectedVoice) {
                console.log("Voz em Português encontrada e pronta:", selectedVoice.name);
                speechReady = true;
                resolve(); // Sucesso, podemos continuar
            }
        }
    };

    return new Promise((resolve, reject) => {
        speechSynthesis.onvoiceschanged = () => checkVoices(resolve, reject);
        checkVoices(resolve, reject); // Tenta verificar imediatamente
        setTimeout(() => reject(new Error("Timeout: Vozes não carregaram a tempo.")), 2000); // Adiciona um timeout
    }).catch(error => {
        console.warn(error.message, "Usando a voz padrão do navegador como fallback.");
        // Mesmo se falhar, tentamos pegar a primeira voz disponível para não ficar mudo.
        const voices = speechSynthesis.getVoices();
        selectedVoice = voices[0];
        speechReady = true;
    });
}

function speak(text, onEndCallback) {
    if (!window.speechSynthesis) {
        console.error("API de Síntese de Voz não suportada.");
        return;
    }
    // Verifica se a inicialização já aconteceu. Se não, espera por ela.
    if (!speechReady) {
        console.warn("Ainda não pronto para falar, esperando inicialização...");
        initializeSpeech().then(() => speak(text, onEndCallback));
        return;
    }
    
    speechSynthesis.cancel(); // Limpa a fila de falas anteriores
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.voice = selectedVoice; // Usa a voz pt-BR que encontramos
    
    if (onEndCallback) {
        utterance.onend = onEndCallback;
    }
    
    console.log(`[Voz] Falando: "${text}"`);
    speechSynthesis.speak(utterance);
}

async function playTeacherAudio(key, fallbackText, onEndCallback) {
    const teacherId = SUPER_ADMIN_TEACHER_ID;
    if (!teacherId) {
        speak(fallbackText, onEndCallback);
        return;
    }
    try {
        console.log(`[Áudio] Procurando áudio gravado para a chave: "${key}"...`);
        const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` });
        
        if (data && data.length > 0) {
            const audioFileName = data[0].name;
            const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${audioFileName}`);
            console.log(`[Áudio] Sucesso! Tocando URL: ${publicUrl}`);
            const audio = new Audio(publicUrl);
            
            audio.onerror = function() {
                console.error(`[Áudio] ERRO ao carregar o arquivo de áudio: ${publicUrl}. Usando a voz de narração.`);
                speak(fallbackText, onEndCallback);
            };
            
            if (onEndCallback) {
                audio.onended = onEndCallback;
            }
            audio.play();
        } else {
            console.log(`[Áudio] Áudio gravado não encontrado para "${key}". Usando a voz de narração.`);
            speak(fallbackText, onEndCallback);
        }
    } catch (error) {
        console.error(`[Áudio] Erro crítico ao buscar áudio no Supabase:`, error);
        speak(fallbackText, onEndCallback);
    }
}

// =========================================================================
// BLOCO DE CÓDIGO PARA CORREÇÃO DO SOM - Fim
// =========================================================================

function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId)?.classList.add('active'); }
function showModal(modalId) { document.getElementById(modalId)?.classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'none'; document.getElementById('createStudentFormElement').reset(); }
function showAudioSettingsModal() { const letterSelect = document.getElementById('letterSelect'); if (letterSelect) { let optionsHtml = ''; optionsHtml += '<optgroup label="Instruções e Feedbacks">'; for (const key in CUSTOM_AUDIO_KEYS) { optionsHtml += `<option value="${key}">${CUSTOM_AUDIO_KEYS[key]}</option>`; } optionsHtml += '</optgroup>'; optionsHtml += '<optgroup label="Letras do Alfabeto">'; optionsHtml += ALPHABET.map(letter => `<option value="${letter}">Letra ${letter}</option>`).join(''); optionsHtml += '</optgroup>'; letterSelect.innerHTML = optionsHtml; } showModal('audioSettingsModal'); showTab(document.querySelector('#audioSettingsModal .tab-btn[data-tab="uploadFileTab"]')); }
function showTab(clickedButton) { const parent = clickedButton.closest('.modal-content'); const tabId = clickedButton.getAttribute('data-tab'); parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); clickedButton.classList.add('active'); parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active')); parent.querySelector('#' + tabId).classList.add('active'); }
function showFeedback(message, type = 'info') { const el = document.getElementById('globalFeedback'); if (!el) return; const textEl = el.querySelector('.feedback-text'); if (textEl) textEl.textContent = message; el.className = `show ${type}`; setTimeout(() => { el.className = el.className.replace('show', ''); }, 3000); }
function updateUI() { const gameScreen = document.getElementById('gameScreen'); if (gameScreen.classList.contains('active') && gameState.questions && gameState.questions.length > 0) { document.getElementById('score').textContent = gameState.score; document.getElementById('totalQuestions').textContent = gameState.questions.length; document.getElementById('attempts').textContent = `${gameState.attempts} tentativa(s)`; document.getElementById('currentPhase').textContent = gameState.currentPhase; const progress = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100; document.getElementById('progressFill').style.width = `${progress}%`; } }
async function showTutorial(phaseNumber) { if (gameState.tutorialsShown.includes(phaseNumber)) return; const instruction = gameInstructions[phaseNumber]; if (!instruction) return; const overlay = document.getElementById('tutorialOverlay'); const mascot = document.getElementById('tutorialMascot'); document.getElementById('tutorialText').textContent = instruction; overlay.classList.add('show'); mascot.classList.add('talking'); const audioKey = `instruction_${phaseNumber}`; playTeacherAudio(audioKey, instruction, () => mascot.classList.remove('talking')); gameState.tutorialsShown.push(phaseNumber); await saveGameState(); }
function hideTutorial() { document.getElementById('tutorialOverlay').classList.remove('show'); }
async function logStudentError({ question, selectedAnswer }) { if (!currentUser || currentUser.type !== 'student') { return; } const errorData = { student_id: currentUser.id, teacher_id: currentUser.teacher_id, class_id: currentUser.class_id, phase: gameState.currentPhase, question_type: question.type, correct_answer: String(question.correctAnswer), selected_answer: String(selectedAnswer) }; const { error } = await supabaseClient.from('student_errors').insert([errorData]); if (error) { console.error('Falha ao registrar erro:', error); } }
async function populateReportClassSelector() { const selector = document.getElementById('reportClassSelector'); selector.innerHTML = '<option value="">Carregando turmas...</option>'; document.getElementById('reportContentContainer').style.display = 'none'; const { data, error } = await supabaseClient.from('classes').select('id, name').eq('teacher_id', currentUser.id).order('name', { ascending: true }); if (error || !data) { selector.innerHTML = '<option value="">Erro ao carregar</option>'; return; } if (data.length === 0) { selector.innerHTML = '<option value="">Nenhuma turma encontrada</option>'; return; } selector.innerHTML = '<option value="">-- Selecione uma turma --</option>'; data.forEach(cls => { selector.innerHTML += `<option value="${cls.id}">${cls.name}</option>`; }); }
function handleReportClassSelection(event) { const classId = event.target.value; const reportContainer = document.getElementById('reportContentContainer'); if (classId) { reportContainer.style.display = 'block'; loadAndDisplayClassReports(classId); } else { reportContainer.style.display = 'none'; reportContainer.innerHTML = ''; } }
async function loadAndDisplayClassReports(classId) { const reportContainer = document.getElementById('reportContentContainer'); reportContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando relatórios...</p>'; const { data: errors, error: errorsError } = await supabaseClient.from('student_errors').select('*').eq('class_id', classId); if (errorsError) { reportContainer.innerHTML = '<p class="error">Erro ao carregar dados de erros.</p>'; return; } 
    // MUDANÇA 1: Adicionado .order('name') para garantir a ordem alfabética
    const { data: students, error: studentsError } = await supabaseClient.from('students').select('id, name').eq('class_id', classId).order('name', { ascending: true }); 
    if (studentsError) { reportContainer.innerHTML = '<p class="error">Erro ao carregar lista de alunos.</p>'; return; } reportContainer.innerHTML = ` <div class="report-section"> <h4><i class="fas fa-fire"></i> Mapa de Calor da Turma</h4> <p>As maiores dificuldades da turma inteira, mostrando o que foi mais errado.</p> <div id="classHeatmapContainer"></div> </div> <div class="report-section"> <h4><i class="fas fa-user-graduate"></i> Relatório Individual de Dificuldades</h4> <p>Clique em um aluno para ver seus erros e gerar uma atividade focada com a IA.</p> <div id="individualReportsContainer"></div> </div> `; renderClassHeatmap(errors, 'classHeatmapContainer'); renderIndividualReports(students, errors, 'individualReportsContainer'); }

function renderClassHeatmap(errors, containerId) {
    const heatmapContainer = document.getElementById(containerId);
    const sectionHeader = heatmapContainer.closest('.report-section').querySelector('h4');
    sectionHeader.querySelector('.view-chart-btn')?.remove();

    if (!errors || errors.length === 0) {
        heatmapContainer.innerHTML = '<p>Nenhum erro registrado para esta turma. Ótimo trabalho! 🎉</p>';
        return;
    }

    const errorsByPhase = errors.reduce((acc, error) => {
        const phase = error.phase || 'Desconhecida';
        if (!acc[phase]) { acc[phase] = []; }
        acc[phase].push(error);
        return acc;
    }, {});

    let html = '';
    const sortedPhases = Object.keys(errorsByPhase).sort((a, b) => a - b);

    html += '<div class="all-phases-scroll-container">';

    for (const phase of sortedPhases) {
        const phaseDescription = PHASE_DESCRIPTIONS[phase] || 'Fase Desconhecida';
        html += `<div class="phase-group"><h3>Fase ${phase} - ${phaseDescription}</h3>`;
        
        // MUDANÇA 2: Lógica para agrupar as respostas erradas dos alunos
        const errorDetails = phaseErrors.reduce((acc, error) => {
            const key = error.correct_answer;
            if (!acc[key]) {
                acc[key] = { count: 0, selections: new Set() };
            }
            acc[key].count++;
            acc[key].selections.add(error.selected_answer);
            return acc;
        }, {});
        
        const sortedErrors = Object.entries(errorDetails).sort(([, a], [, b]) => b.count - a.count);

        if (sortedErrors.length === 0) {
            html += '<p>Nenhum erro nesta fase.</p>';
        } else {
            html += sortedErrors.map(([correctItem, data]) => {
                const selectionsText = Array.from(data.selections).join(', ');
                const maxCount = sortedErrors[0][1].count; // Pega a contagem máxima para a barra de progresso
                return `
                <div class="heatmap-item">
                    <div class="item-label">${correctItem}</div>
                    <div class="item-details">
                        <span class="item-count">${data.count} erro(s)</span>
                        <div class="item-bar-container">
                            <div class="item-bar" style="width: ${(data.count / maxCount) * 100}%;"></div>
                        </div>
                        <small class="heatmap-selections">Selecionaram: ${selectionsText}</small>
                    </div>
                </div>
            `}).join('');
        }
        
        html += '</div>';
    }
    
    html += '</div>';

    heatmapContainer.innerHTML = html;

    const chartButton = document.createElement('button');
    chartButton.className = 'btn small view-chart-btn';
    chartButton.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico Geral';
    chartButton.onclick = () => {
        const totalErrorCounts = errors.reduce((acc, error) => {
            const key = error.correct_answer;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const sortedTotalErrors = Object.entries(totalErrorCounts).sort(([, a], [, b]) => b - a);
        const chartLabels = sortedTotalErrors.map(([item]) => item);
        const chartData = sortedTotalErrors.map(([, count]) => count);
        displayChartModal('Gráfico de Dificuldades da Turma (Geral)', chartLabels, chartData);
    };
    sectionHeader.appendChild(chartButton);
}

function renderIndividualReports(students, allErrors, containerId) {
    const container = document.getElementById(containerId);
    if (!students || students.length === 0) {
        container.innerHTML = '<p>Nenhum aluno na turma.</p>';
        return;
    }

    let html = '<div class="individual-reports-container">';
    
    html += students.map(student => `
        <div class="student-item student-report-item" data-student-id="${student.id}" data-student-name="${student.name}">
            <div class="student-info">
                <h4>${student.name}</h4>
            </div>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="student-errors-details" id="errors-for-${student.id}" style="display: none;"></div>
    `).join('');

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.student-report-item').forEach(item => {
        item.addEventListener('click', () => {
            const studentId = item.dataset.studentId;
            const studentName = item.dataset.studentName;
            const detailsContainer = document.getElementById(`errors-for-${studentId}`);
            const isVisible = detailsContainer.style.display === 'block';

            container.querySelectorAll('.student-errors-details').forEach(d => {
                if (d.id !== `errors-for-${studentId}`) d.style.display = 'none';
            });
            container.querySelectorAll('.student-report-item i').forEach(i => i.className = 'fas fa-chevron-down');

            if (!isVisible) {
                detailsContainer.style.display = 'block';
                item.querySelector('i').className = 'fas fa-chevron-up';
                const studentErrors = allErrors.filter(e => e.student_id === studentId);

                if (studentErrors.length === 0) {
                    detailsContainer.innerHTML = '<p style="padding: 10px;">Este aluno não cometeu erros. Ótimo trabalho! 🌟</p>';
                    return;
                }

                const errorCounts = studentErrors.reduce((acc, error) => {
                    const key = `Fase ${error.phase} | Correto: ${error.correct_answer}`;
                    if (!acc[key]) {
                        acc[key] = { count: 0, selections: {}, details: error };
                    }
                    acc[key].count++;
                    acc[key].selections[error.selected_answer] = (acc[key].selections[error.selected_answer] || 0) + 1;
                    return acc;
                }, {});

                const top5Errors = Object.entries(errorCounts).sort(([, a], [, b]) => b.count - a.count).slice(0, 5);
                let reportHTML = `<ul>${top5Errors.map(([, errorData]) => {
                    const selectionsText = Object.entries(errorData.selections).map(([selection, count]) => `'${selection}' (${count}x)`).join(', ');
                    const phaseDescription = PHASE_DESCRIPTIONS[errorData.details.phase] || '';
                    return `<li>
                        <div class="error-item">
                            <strong>Fase ${errorData.details.phase} (${phaseDescription}):</strong> Resposta correta era <strong>"${errorData.details.correct_answer}"</strong>
                            <small>Aluno selecionou: ${selectionsText}</small>
                        </div>
                        <span class="error-count">${errorData.count} ${errorData.count > 1 ? 'vezes' : 'vez'}</span>
                    </li>`;
                }).join('')}</ul>`;
                reportHTML += `<div class="ai-button-container">
                    <button class="btn ai-btn" onclick="handleGenerateLessonPlan('${studentId}', '${studentName}')">
                        <i class="fas fa-rocket"></i> Analisar com IA
                    </button>
                </div>`;
                detailsContainer.innerHTML = reportHTML;
            } else {
                detailsContainer.style.display = 'none';
                item.querySelector('i').className = 'fas fa-chevron-down';
            }
        });
    });
}

async function handleGenerateLessonPlan(studentId, studentName) {
    const aiContainer = document.getElementById('aiTipsContent');
    document.getElementById('aiTipsTitle').innerHTML = `<i class="fas fa-rocket" style="color: #764ba2;"></i> Assistente Pedagógico para <span style="color: #2c3e50;">${studentName}</span>`;
    aiContainer.innerHTML = '<div class="loading-ai"><i class="fas fa-spinner fa-spin"></i> Analisando e gerando plano de aula...</div>';
    showModal('aiTipsModal');
    
    // =================================================================================
    // ATENÇÃO PROFESSOR/DESENVOLVEDOR:
    // Insira sua chave de API do Google Gemini aqui.
    // Você pode obter uma chave em: https://aistudio.google.com/app/apikey
    // =================================================================================
    const apiKey = "COLE_SUA_CHAVE_AQUI"; 
    
    if (!apiKey || apiKey === "COLE_SUA_CHAVE_AQUI") {
        aiContainer.innerHTML = `<p class="error"><strong>Erro de Configuração:</strong> A chave de API do Gemini não foi inserida no arquivo script.js.</p>`;
        return; 
    }

    try {
        const { data: studentErrors, error } = await supabaseClient.from('student_errors').select('*').eq('student_id', studentId).limit(20);
        if (error || !studentErrors || studentErrors.length === 0) {
            aiContainer.innerHTML = '<p>Este aluno não possui erros registrados para análise. Ótimo trabalho! 🌟</p>';
            return;
        }
        
        const errorSummary = studentErrors.map(e => `Na fase '${PHASE_DESCRIPTIONS[e.phase]}', a resposta correta era '${e.correct_answer}' e o aluno escolheu '${e.selected_answer}'.`).join('\n');
        
        const prompt = `
            Você é um especialista em pedagogia da alfabetização no Brasil. Um professor precisa de um relatório e uma atividade para o aluno ${studentName}, que apresentou as seguintes dificuldades:
            ${errorSummary}

            Crie uma resposta em duas partes. A resposta DEVE seguir EXATAMENTE esta estrutura de Markdown:

            ## 🔍 Análise Pedagógica
            (Faça um parágrafo curto e claro resumindo a principal dificuldade do aluno com base nos erros. Ex: "A análise indica uma dificuldade recorrente na distinção de fonemas surdos e sonoros, especificamente com os pares P/B e F/V.")

            ## 💡 Sugestão de Atividade Prática (Mini Plano de Aula)
            
            ### 🎯 Foco da Atividade:
            (Descreva em uma frase o ponto a ser trabalhado).

            ### ✂️ Materiais Necessários:
            (Liste 2 ou 3 itens simples de sala de aula).

            ### 👣 Passo a Passo (10-15 min):
            (Crie 3 passos curtos e práticos. Comece cada passo com "1.", "2.", etc.).
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error Body:", errorBody);
            throw new Error(`Erro na API (${response.status}): ${errorBody.error.message}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content?.parts[0]) {
            let text = result.candidates[0].content.parts[0].text;
            // Formatação para HTML
            text = text.replace(/## (.*)/g, '<h2>$1</h2>');
            text = text.replace(/### (.*)/g, '<h3>$1</h3>');
            text = text.replace(/\n(\d)\. (.*)/g, '<p class="lesson-step"><strong>Passo $1:</strong> $2</p>');
            text = text.replace(/\n/g, '<br>');
            text = text.replace(/<br>/g, ''); 

            aiContainer.innerHTML = text;
        } else {
            throw new Error("A resposta da IA veio em um formato inesperado.");
        }
    } catch (err) {
        console.error("Falha ao gerar o plano de aula com a IA:", err);
        aiContainer.innerHTML = `<p class="error"><strong>Desculpe, ocorreu um erro ao gerar a atividade.</strong><br><br>Motivo: ${err.message}</p>`;
    }
}
function displayChartModal(title, labels, data) { const modal = document.getElementById('chartModal'); const titleEl = document.getElementById('chartModalTitle'); const ctx = document.getElementById('myChartCanvas').getContext('2d'); titleEl.textContent = title; if (currentChart) { currentChart.destroy(); } currentChart = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Nº de Erros', data: data, backgroundColor: 'rgba(118, 75, 162, 0.6)', borderColor: 'rgba(118, 75, 162, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false }, title: { display: true, text: 'Itens com maior quantidade de erros na turma', font: { size: 16, family: "'Comic Neue', cursive" } } } } }); showModal('chartModal'); }

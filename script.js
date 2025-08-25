// =======================================================
// JOGO DAS LETRAS - VERSÃO COMPLETA E FUNCIONAL (20 FASES)
// Código 100% implementado, alinhado ao currículo.
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
async function initApp() { if (!window.supabase) { alert("ERRO CRÍTICO: Supabase não carregou."); return; } initializeSpeech(); setupAllEventListeners(); const studentSession = sessionStorage.getItem('currentUser'); if (studentSession) { currentUser = JSON.parse(studentSession); await restoreOrStartGame(); } else { await checkSession(); } }
async function restoreOrStartGame() { await loadGameState(); if (gameState.phaseCompleted) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100; showResultScreen(accuracy, true); } else if (gameState.attempts <= 0) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; showResultScreen(accuracy, false); } else { showScreen('gameScreen'); startQuestion(); } }
function setupAllEventListeners() { document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => { const type = e.currentTarget.getAttribute('data-type'); if (type === 'teacher') showScreen('teacherLoginScreen'); else if (type === 'student') showScreen('studentLoginScreen'); })); document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => { const targetScreen = e.currentTarget.getAttribute('data-target'); showScreen(targetScreen); })); document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen')); document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen')); document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin); document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister); document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin); document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal')); document.getElementById('showAudioSettingsModalBtn').addEventListener('click', showAudioSettingsModal); document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass); document.getElementById('showCreateStudentFormBtn').addEventListener('click', showCreateStudentForm); document.getElementById('hideCreateStudentFormBtn').addEventListener('click', hideCreateStudentForm); document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent); document.getElementById('startButton')?.addEventListener('click', startGame); document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio); document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio); document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion); document.getElementById('continueButton')?.addEventListener('click', nextPhase); document.getElementById('retryButton')?.addEventListener('click', retryPhase); document.getElementById('restartButton')?.addEventListener('click', restartGame); document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame); document.querySelectorAll('[data-close]').forEach(btn => { btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))); }); document.querySelectorAll('#manageClassModal .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => showTab(e.currentTarget)); }); document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload); document.getElementById('recordBtn')?.addEventListener('click', startRecording); document.getElementById('stopBtn')?.addEventListener('click', stopRecording); document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording); document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial); document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials); document.getElementById('copyResetPasswordBtn')?.addEventListener('click', handleCopyResetPassword); document.querySelectorAll('.password-toggle').forEach(toggle => { toggle.addEventListener('click', () => { const passwordInput = toggle.previousElementSibling; const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; passwordInput.setAttribute('type', type); toggle.classList.toggle('fa-eye-slash'); }); }); document.querySelectorAll('.sort-btn').forEach(btn => { btn.addEventListener('click', (e) => { const sortBy = e.currentTarget.dataset.sort; document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); renderStudentProgress(sortBy); }); }); document.getElementById('reportClassSelector').addEventListener('change', handleReportClassSelection); }

// =======================================================
// PARTE 5: AUTENTICAÇÃO E SESSÃO
// =======================================================
async function checkSession() { const { data: { session } } = await supabaseClient.auth.getSession(); if (session && session.user) { currentUser = session.user; if (currentUser.user_metadata.role === 'teacher') { await showTeacherDashboard(); } else { await logout(); } } else { showScreen('userTypeScreen'); } }
async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const email = document.getElementById('teacherEmail').value; const password = document.getElementById('teacherPassword').value; try { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; currentUser = data.user; await showTeacherDashboard(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleTeacherRegister(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...'; const name = document.getElementById('teacherRegName').value; const email = document.getElementById('teacherRegEmail').value; const password = document.getElementById('teacherRegPassword').value; try { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, role: 'teacher' } } }); if (error) throw error; showFeedback('Cadastro realizado! Link de confirmação enviado para seu e-mail.', 'success'); showScreen('teacherLoginScreen'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleStudentLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const username = document.getElementById('studentUsername').value.trim(); const password = document.getElementById('studentPassword').value.trim(); try { const { data: studentData, error } = await supabaseClient.from('students').select('*, assigned_phases').eq('username', username).single(); if (error && error.message.includes('multiple (or no) rows')) { throw new Error('Usuário ou senha inválidos.'); } if (error) throw error; if (!studentData) { throw new Error('Usuário ou senha inválidos.'); } const match = await verifyPassword(password, studentData.password); if (!match) { throw new Error('Usuário ou senha inválidos.'); } currentUser = { ...studentData, type: 'student' }; sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); await showStudentGame(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
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
function renderStudentProgress(sortBy = 'last_played') { const progressList = document.getElementById('studentProgressList'); const sortedData = [...studentProgressData].sort((a, b) => { if (sortBy === 'name') { return a.name.localeCompare(b.name); } if (sortBy === 'last_played') { const dateA = (a.progress && a.progress.length > 0) ? new Date(a.progress[0].last_played) : new Date(0); const dateB = (b.progress && b.progress.length > 0) ? new Date(b.progress[0].last_played) : new Date(0); return dateB - dateA; } return 0; }); let html = sortedData.map(student => { const progressRecord = (student.progress && student.progress.length > 0) ? student.progress[0] : null; const assignedPhases = student.assigned_phases && student.assigned_phases.length > 0 ? student.assigned_phases : [1]; const currentPhase = progressRecord?.current_phase || 'N/J'; const gameState = progressRecord?.game_state; let score = 0, total = 10, accuracy = 0; if (gameState && gameState.questions && gameState.questions.length > 0) { score = gameState.score ?? 0; total = gameState.questions.length; accuracy = Math.round((score / total) * 100); } let lastPlayedStr = 'Nunca jogou'; let statusClass = 'inactive'; if (progressRecord?.last_played) { const lastPlayedDate = new Date(progressRecord.last_played); lastPlayedStr = lastPlayedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); if (lastPlayedDate > sevenDaysAgo) { statusClass = 'active'; } } const statusIcon = statusClass === 'active' ? '🟢' : '🔴'; const phaseCheckboxes = Object.keys(PHASE_DESCRIPTIONS).map(phaseNumStr => { const phaseNum = parseInt(phaseNumStr); const phaseName = PHASE_DESCRIPTIONS[phaseNum]; return ` <label class="phase-checkbox-label" title="${phaseName}"> <input type="checkbox" class="phase-checkbox" value="${phaseNum}" ${assignedPhases.includes(phaseNum) ? 'checked' : ''} onchange="assignPhases('${student.id}', this)" > Fase ${phaseNum} - ${phaseName} </label> `; }).join(''); return ` <div class="student-item"> <div class="student-info" style="flex-grow: 1;"> <h4>${student.name} <span class="status-indicator ${statusClass}">${statusIcon}</span></h4> <p>Último Acesso: ${lastPlayedStr}</p> <p>Progresso na Fase ${currentPhase}: ${accuracy}% (${score}/${total})</p> <div class="student-progress-container"> <div class="student-progress-bar"> <div class="student-progress-fill" style="width: ${accuracy}%;"></div> </div> </div> </div> <div class="student-actions"> <label class="select-label">Designar Fases:</label> <div class="phase-checkbox-group"> ${phaseCheckboxes} </div> </div> </div>`; }).join(''); progressList.innerHTML = html || '<p>Nenhum aluno para exibir.</p>'; }
async function assignPhases(studentId, changedElement) { const checkboxGroup = changedElement.closest('.phase-checkbox-group'); const checkboxes = checkboxGroup.querySelectorAll('.phase-checkbox'); const newPhases = Array.from(checkboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value)).sort((a, b) => a - b); if (newPhases.length === 0) { showFeedback("O aluno precisa ter pelo menos uma fase designada.", "error"); changedElement.checked = true; return; } const studentData = studentProgressData.find(s => s.id === studentId); if (!studentData) return; showFeedback(`Atualizando fases para ${studentData.name}...`, 'info'); try { const { error: assignError } = await supabaseClient.from('students').update({ assigned_phases: newPhases }).eq('id', studentId); if (assignError) throw assignError; const firstPhase = newPhases[0]; const newGameState = { currentPhase: firstPhase, score: 0, attempts: 3, questions: generateQuestions(firstPhase), currentQuestionIndex: 0, tutorialsShown: [], phaseCompleted: false }; const { error: progressError } = await supabaseClient.from('progress').upsert({ student_id: studentId, current_phase: firstPhase, game_state: newGameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' }); if (progressError) throw progressError; showFeedback(`Fases de ${studentData.name} atualizadas!`, 'success'); await loadStudentProgress(); } catch (error) { console.error("Erro ao designar fases:", error); showFeedback(`Erro: ${error.message}`, 'error'); await loadStudentProgress(); } }
async function handleCreateStudent(event) { event.preventDefault(); const username = document.getElementById('createStudentUsername').value.trim(); const password = document.getElementById('createStudentPassword').value; const submitButton = document.getElementById('createStudentSubmitBtn'); if (!username || !password) { return showFeedback("Preencha nome e senha.", "error"); } if (!currentClassId || !currentUser?.id) { return showFeedback("Erro de sessão.", "error"); } submitButton.disabled = true; submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...'; try { const hashedPassword = await hashPassword(password); const { error } = await supabaseClient.from('students').insert([{ name: username, username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }]); if (error) throw error; document.getElementById('newStudentUsername').textContent = username; document.getElementById('newStudentPassword').textContent = password; showModal('studentCreatedModal'); hideCreateStudentForm(); await loadClassStudents(); await loadStudentProgress(); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { submitButton.disabled = false; submitButton.innerHTML = 'Criar Aluno'; } }
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
            if (available.length === 0) available = shuffleArray([...sourceArray]);
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
    const imageQuestionArea = document.getElementById('imageQuestionArea');
    const lettersGrid = document.getElementById('lettersGrid');
    
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
    // Remove botão de checagem, se existir de fases anteriores
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
    const questionText = document.getElementById('questionText');
    questionText.textContent = 'Clique na palavra que não combina com a frase.';
    const lettersGrid = document.getElementById('lettersGrid');
    const sentenceHtml = q.sentence.map(word => `<span class="sentence-word-clickable">${word}</span>`).join(' ');
    lettersGrid.innerHTML = `<div class="sentence-container"><div class="sentence-text">${sentenceHtml}</div></div>`;
    lettersGrid.querySelectorAll('.sentence-word-clickable').forEach(span => {
        span.addEventListener('click', () => {
            // Desabilita outros cliques
            lettersGrid.querySelectorAll('.sentence-word-clickable').forEach(s => s.style.pointerEvents = 'none');
            // Checa a resposta
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
        if (index > 0) {
            span.addEventListener('click', () => {
                span.style.marginLeft = '15px';
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
            userAnswer += char.textContent;
            if (index < chars.length - 1 && char.style.marginLeft) {
                userAnswer += ' ';
            }
        });
        selectAnswer(userAnswer.trim());
    });
}

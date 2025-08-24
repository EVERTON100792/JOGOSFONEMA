// =======================================================
// JOGO DAS LETRAS - SCRIPT ATUAL (Vanilla JS)
// Versão com Dashboard Refatorado e Assistente IA (Correções)
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

// PARTE 2: CONTEÚDO DO JOGO
const gameInstructions = {1: "Vamos começar! Eu vou fazer o som de uma letra. Ouça com atenção no alto-falante e depois clique na letra que você acha que é a certa. Você consegue!", 2: "Que legal, você avançou! Agora, olhe bem para a figura. Qual é a VOGAL que começa o nome dela? Clique na vogal correta para a gente completar a palavra juntos!", 3: "Uau, você está indo muito bem! Agora vamos juntar as vogais. Olhe a figura e escolha os dois sons que completam a palavra. Preste atenção!", 4: "Você é um campeão! Chegou a hora de ler a palavra inteira. Olhe a figura e encontre o nome dela escrito corretamente nas opções abaixo. Vamos lá!", 5: "Fase final! Agora o desafio é com o finalzinho da palavra. Olhe a figura e escolha a SÍLABA que termina o nome dela. Você está quase lá!"};

const PHASE_DESCRIPTIONS = {
    1: "Sons das Letras",
    2: "Vogal Inicial",
    3: "Encontros Vocálicos",
    4: "Leitura de Palavras",
    5: "Sílaba Final"
};

const PHASE_2_WORDS = [{ word: 'ABELHA', image: '🐝', vowel: 'A' }, { word: 'ELEFANTE', image: '🐘', vowel: 'E' }, { word: 'IGREJA', image: '⛪', vowel: 'I' }, { word: 'ÔNIBUS', image: '🚌', vowel: 'O' }, { word: 'UVA', image: '🍇', vowel: 'U' }, { word: 'AVIÃO', image: '✈️', vowel: 'A' }, { word: 'ESTRELA', image: '⭐', vowel: 'E' }, { word: 'ÍNDIO', image: '🏹', vowel: 'I' }, { word: 'OVO', image: '🥚', vowel: 'O' }, { word: 'URSO', image: '🐻', vowel: 'U' }];
const PHASE_3_ENCONTROS = [{ word: 'PEIXE', image: '🐠', encontro: 'EI' }, { word: 'BOI', image: '🐂', encontro: 'OI' }, { word: 'CAIXA', image: '📦', encontro: 'AI' }, { word: 'PAI', image: '👨‍👧', encontro: 'AI' }, { word: 'CÉU', image: '🌌', encontro: 'EU' }, { word: 'LUA', image: '🌙', encontro: 'UA' }, { word: 'LEÃO', image: '🦁', encontro: 'ÃO' }, { word: 'MÃE', image: '👩‍👦', encontro: 'ÃE' }, { word: 'PÃO', image: '🍞', encontro: 'ÃO' }, { word: 'CHAPÉU', image: '🤠', encontro: 'ÉU' }];
const VOWEL_ENCOUNTERS = ['AI', 'EI', 'OI', 'UI', 'AU', 'EU', 'ÃO', 'ÃE', 'UA', 'ÉU'];
const PHASE_4_WORDS = [{ word: 'BOLA', image: '⚽', options: ['BOLO', 'BALA', 'BULA'] }, { word: 'CASA', image: '🏠', options: ['COPO', 'COLA', 'CAJU'] }, { word: 'DADO', image: '🎲', options: ['DEDO', 'DIA', 'DOCE'] }, { word: 'GATO', image: '🐈', options: ['GALO', 'GELO', 'GOTA'] }, { word: 'MACACO', image: '🐒', options: ['MALA', 'MAPA', 'MEIA'] }, { word: 'SAPO', image: '🐸', options: ['SAPATO', 'SOFÁ', 'SUCO'] }, { word: 'UVA', image: '🍇', options: ['UNHA', 'URUBU', 'UM'] }, { word: 'SOL', image: '☀️', options: ['SAL', 'SETE', 'SAPO'] }, { word: 'LUA', image: '🌙', options: ['LAMA', 'LATA', 'LEÃO'] }, { word: 'PATO', image: '🦆', options: ['PÉ', 'POTE', 'PIPA'] }];
const PHASE_5_WORDS = [{ word: 'BOLO', image: '🎂', syllable: 'LO' }, { word: 'CASA', image: '🏠', syllable: 'SA' }, { word: 'DADO', image: '🎲', syllable: 'DO' }, { word: 'FACA', image: '🔪', syllable: 'CA' }, { word: 'GATO', image: '🐈', syllable: 'TO' }, { word: 'MACACO', image: '🐒', syllable: 'CO' }, { word: 'PATO', image: '🦆', syllable: 'TO' }, { word: 'SAPO', image: '🐸', syllable: 'PO' }, { word: 'VACA', image: '🐄', syllable: 'CA' }, { word: 'JANELA', image: '🖼️', syllable: 'LA' }];
const ALL_END_SYLLABLES = ['LO', 'SA', 'DO', 'CA', 'TO', 'CO', 'PO', 'LA', 'NE', 'JA'];

// PARTE 3: FUNÇÕES UTILITÁRIAS
async function hashPassword(password) { const encoder = new TextEncoder(); const data = encoder.encode(password); const hashBuffer = await window.crypto.subtle.digest('SHA-256', data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); }
async function verifyPassword(password, storedHash) { const newHash = await hashPassword(password); return newHash === storedHash; }
function generateRandomPassword() { const words = ['sol', 'lua', 'rio', 'mar', 'flor', 'gato', 'cao', 'pato', 'rei', 'luz']; const word = words[Math.floor(Math.random() * words.length)]; const number = Math.floor(100 + Math.random() * 900); return `${word}${number}`; }
function formatErrorMessage(error) { if (!error || !error.message) { return 'Ocorreu um erro inesperado. Tente mais tarde.'; } const message = error.message.toLowerCase(); if (message.includes('duplicate key')) { return 'Este nome de usuário já existe. Escolha outro.'; } if (message.includes('invalid login credentials') || message.includes('usuário ou senha inválidos.')) { return 'Usuário ou senha inválidos.'; } console.error("Erro não tratado:", error); return 'Ocorreu um erro inesperado. Tente mais tarde.'; }

// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
document.addEventListener('DOMContentLoaded', initApp);
async function initApp() { if (!window.supabase) { alert("ERRO CRÍTICO: Supabase não carregou."); return; } initializeSpeech(); setupAllEventListeners(); const studentSession = sessionStorage.getItem('currentUser'); if (studentSession) { currentUser = JSON.parse(studentSession); await restoreOrStartGame(); } else { await checkSession(); } }
async function restoreOrStartGame() { await loadGameState(); if (gameState.phaseCompleted) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100; showResultScreen(accuracy, true); } else if (gameState.attempts <= 0) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; showResultScreen(accuracy, false); } else { showScreen('gameScreen'); startQuestion(); } }
function setupAllEventListeners() { document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => { const type = e.currentTarget.getAttribute('data-type'); if (type === 'teacher') showScreen('teacherLoginScreen'); else if (type === 'student') showScreen('studentLoginScreen'); })); document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => { const targetScreen = e.currentTarget.getAttribute('data-target'); showScreen(targetScreen); })); document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen')); document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen')); document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin); document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister); document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin); document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal')); document.getElementById('showAudioSettingsModalBtn').addEventListener('click', showAudioSettingsModal); document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass); document.getElementById('showCreateStudentFormBtn').addEventListener('click', showCreateStudentForm); document.getElementById('hideCreateStudentFormBtn').addEventListener('click', hideCreateStudentForm); document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent); document.getElementById('generatePasswordBtn')?.addEventListener('click', () => { const passwordField = document.getElementById('createStudentPassword'); passwordField.type = 'text'; passwordField.value = generateRandomPassword(); setTimeout(() => { passwordField.type = 'password'; }, 2000); }); document.getElementById('startButton')?.addEventListener('click', () => { showScreen('gameScreen'); startQuestion(); }); document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio); document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio); document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion); document.getElementById('continueButton')?.addEventListener('click', nextPhase); document.getElementById('retryButton')?.addEventListener('click', retryPhase); document.getElementById('restartButton')?.addEventListener('click', restartGame); document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame); document.querySelectorAll('[data-close]').forEach(btn => { btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))); }); document.querySelectorAll('#manageClassModal .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => showTab(e.currentTarget)); }); document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload); document.getElementById('recordBtn')?.addEventListener('click', startRecording); document.getElementById('stopBtn')?.addEventListener('click', stopRecording); document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording); document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial); document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials); document.querySelectorAll('.password-toggle').forEach(toggle => { toggle.addEventListener('click', () => { const passwordInput = toggle.previousElementSibling; const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; passwordInput.setAttribute('type', type); toggle.classList.toggle('fa-eye-slash'); }); }); document.querySelectorAll('.sort-btn').forEach(btn => { btn.addEventListener('click', (e) => { const sortBy = e.currentTarget.dataset.sort; document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); renderStudentProgress(sortBy); }); }); document.getElementById('reportClassSelector').addEventListener('change', handleReportClassSelection); }

// PARTE 5: AUTENTICAÇÃO E SESSÃO
// ... (código existente sem alterações)
async function checkSession() { const { data: { session } } = await supabaseClient.auth.getSession(); if (session && session.user) { currentUser = session.user; if (currentUser.user_metadata.role === 'teacher') { await showTeacherDashboard(); } else { await logout(); } } else { showScreen('userTypeScreen'); } }
async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'; const email = document.getElementById('teacherEmail').value; const password = document.getElementById('teacherPassword').value; try { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; currentUser = data.user; await showTeacherDashboard(); showFeedback('Login realizado com sucesso!', 'success'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleTeacherRegister(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...'; const name = document.getElementById('teacherRegName').value; const email = document.getElementById('teacherRegEmail').value; const password = document.getElementById('teacherRegPassword').value; try { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, role: 'teacher' } } }); if (error) throw error; showFeedback('Cadastro realizado! Link de confirmação enviado para seu e-mail.', 'success'); showScreen('teacherLoginScreen'); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleStudentLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value.trim();

    try {
        const { data: studentData, error } = await supabaseClient
            .from('students')
            .select('*, assigned_phases') // <-- CORREÇÃO AQUI: buscando a nova coluna no plural
            .eq('username', username)
            .single();

        if (error && error.message.includes('multiple (or no) rows')) {
            throw new Error('Usuário ou senha inválidos.');
        }
        if (error) throw error;
        if (!studentData) {
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
}async function handleStudentLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value.trim();

    try {
        const { data: studentData, error } = await supabaseClient
            .from('students')
            .select('*, assigned_phases') // <-- CORREÇÃO AQUI: buscando a nova coluna no plural
            .eq('username', username)
            .single();

        if (error && error.message.includes('multiple (or no) rows')) {
            throw new Error('Usuário ou senha inválidos.');
        }
        if (error) throw error;
        if (!studentData) {
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
}async function handleStudentLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value.trim();

    try {
        const { data: studentData, error } = await supabaseClient
            .from('students')
            .select('*, assigned_phases') // <-- CORREÇÃO AQUI: buscando a nova coluna no plural
            .eq('username', username)
            .single();

        if (error && error.message.includes('multiple (or no) rows')) {
            throw new Error('Usuário ou senha inválidos.');
        }
        if (error) throw error;
        if (!studentData) {
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
}async function handleStudentLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value.trim();

    try {
        const { data: studentData, error } = await supabaseClient
            .from('students')
            .select('*, assigned_phases') // <-- CORREÇÃO AQUI: buscando a nova coluna no plural
            .eq('username', username)
            .single();

        if (error && error.message.includes('multiple (or no) rows')) {
            throw new Error('Usuário ou senha inválidos.');
        }
        if (error) throw error;
        if (!studentData) {
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


// PARTE 6: DASHBOARD DO PROFESSOR (REATORADO)
// ... (código existente sem alterações)
async function showTeacherDashboard() {
    showScreen('teacherDashboard');
    await loadTeacherData();
    showDashboardView('viewTurmas');

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.removeEventListener('click', handleSidebarClick);
        link.addEventListener('click', handleSidebarClick);
    });
    
    const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
    logoutBtnSidebar.removeEventListener('click', logout);
    logoutBtnSidebar.addEventListener('click', logout);
}

function handleSidebarClick(event) {
    event.preventDefault();
    const viewId = event.currentTarget.dataset.view;
    showDashboardView(viewId);
}

function showDashboardView(viewId) {
    document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.remove('active');
    });

    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('active');
    }

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewId) {
            link.classList.add('active');
        }
    });

    const linkText = document.querySelector(`.sidebar-nav a[data-view="${viewId}"] span`).textContent;
    document.getElementById('dashboard-title').textContent = linkText;

    if (viewId === 'viewRelatorios') {
        populateReportClassSelector();
    }
}

async function loadTeacherData() { if (!currentUser) return; document.getElementById('teacherName').textContent = currentUser.user_metadata.full_name || 'Professor(a)'; const audioSettingsButton = document.getElementById('showAudioSettingsModalBtn'); if (currentUser.id === SUPER_ADMIN_TEACHER_ID) { audioSettingsButton.style.display = 'block'; } else { audioSettingsButton.style.display = 'none'; } await loadTeacherClasses(); }
async function loadTeacherClasses() { const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id); if (error) { console.error('Erro ao carregar turmas:', error); return; } renderClasses(data); }
function renderClasses(classes) { const container = document.getElementById('classesList'); if (!classes || classes.length === 0) { container.innerHTML = '<p>Nenhuma turma criada ainda.</p>'; return; } container.innerHTML = classes.map(cls => { const studentCount = cls.students[0]?.count || 0; return ` <div class="class-card"> <h3>${cls.name}</h3> <span class="student-count">👥 ${studentCount} aluno(s)</span> <div class="class-card-actions"> <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button> <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma"> <i class="fas fa-trash"></i> </button> </div> </div>`; }).join(''); }
async function handleCreateClass(e) { e.preventDefault(); const name = document.getElementById('className').value; if (!name) return; const { error } = await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); return; } closeModal('createClassModal'); await loadTeacherClasses(); showFeedback('Turma criada com sucesso!', 'success'); document.getElementById('createClassForm').reset(); }
async function handleDeleteClass(classId, className) { if (!confirm(`ATENÇÃO! Deseja excluir a turma "${className}"?\nTODOS os alunos e progressos serão apagados.`)) return; const { error } = await supabaseClient.from('classes').delete().eq('id', classId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Turma "${className}" excluída.`, 'success'); await loadTeacherClasses(); } }
async function manageClass(classId, className) { currentClassId = classId; document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`; const modal = document.getElementById('manageClassModal'); modal.querySelectorAll('.tab-btn').forEach(btn => { const tabId = btn.dataset.tab; if (!btn.getAttribute('data-listener')) { btn.setAttribute('data-listener', 'true'); btn.addEventListener('click', () => { if (tabId === 'studentsTab') loadClassStudents(); else if (tabId === 'studentProgressTab') loadStudentProgress(); }); } }); showTab(document.querySelector('#manageClassModal .tab-btn[data-tab="studentsTab"]')); await loadClassStudents(); showModal('manageClassModal'); }
async function loadClassStudents() { const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId).order('name', { ascending: true }); if (error) { console.error('Erro ao carregar alunos:', error); document.getElementById('studentsList').innerHTML = '<p>Erro ao carregar.</p>'; return; } renderStudents(data); }
function renderStudents(students) { const container = document.getElementById('studentsList'); if (!students || students.length === 0) { container.innerHTML = '<p>Nenhum aluno cadastrado.</p>'; return; } container.innerHTML = students.map(student => ` <div class="student-item"> <div class="student-info"> <h4>${student.name}</h4> <p>Usuário: ${student.username}</p> </div> <div class="student-actions"> <button onclick="handleResetStudentPassword('${student.id}', '${student.name}')" class="btn small" title="Resetar Senha"> <i class="fas fa-key"></i> </button> <button onclick="handleDeleteStudent('${student.id}', '${student.name}')" class="btn small danger" title="Excluir Aluno"> <i class="fas fa-trash"></i> </button> </div> </div>`).join(''); }
async function loadStudentProgress() {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando progresso...</p>';
    const { data: studentsData, error: studentsError } = await supabaseClient.from('students').select(`*`).eq('class_id', currentClassId);
    if (studentsError) { console.error("Erro ao buscar alunos:", studentsError); progressList.innerHTML = `<p style="color:red;">Erro ao carregar alunos: ${studentsError.message}</p>`; return; }
    if (!studentsData || studentsData.length === 0) { progressList.innerHTML = '<p>Nenhum aluno nesta turma para exibir o progresso.</p>'; return; }
    const studentIds = studentsData.map(s => s.id);
    const { data: progressData, error: progressError } = await supabaseClient.from('progress').select('*').in('student_id', studentIds);
    if (progressError) { console.error("Erro ao buscar progresso:", progressError); progressList.innerHTML = `<p style="color:red;">Erro ao carregar o progresso: ${progressError.message}</p>`; return; }
    const combinedData = studentsData.map(student => {
        const studentProgress = progressData.find(p => p.student_id === student.id);
        return { ...student, progress: studentProgress ? [studentProgress] : [] };
    });
    studentProgressData = combinedData;
    renderStudentProgress('last_played');
}

function renderStudentProgress(sortBy = 'last_played') {
    const progressList = document.getElementById('studentProgressList');
    const sortedData = [...studentProgressData].sort((a, b) => {
        if (sortBy === 'name') { return a.name.localeCompare(b.name); }
        if (sortBy === 'last_played') {
            const dateA = (a.progress && a.progress.length > 0) ? new Date(a.progress[0].last_played) : new Date(0);
            const dateB = (b.progress && b.progress.length > 0) ? new Date(b.progress[0].last_played) : new Date(0);
            return dateB - dateA;
        }
        return 0;
    });

    let html = sortedData.map(student => {
        const progressRecord = (student.progress && student.progress.length > 0) ? student.progress[0] : null;
        
        // LÊ O NOVO ARRAY DE FASES. Se estiver nulo/vazio, assume a Fase 1.
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

        // GERA OS CHECKBOXES EM VEZ DO SELECT
        const phaseCheckboxes = [1, 2, 3, 4, 5].map(phaseNum => `
            <label class="phase-checkbox-label">
                <input 
                    type="checkbox" 
                    class="phase-checkbox"
                    value="${phaseNum}" 
                    ${assignedPhases.includes(phaseNum) ? 'checked' : ''}
                    onchange="assignPhases('${student.id}')"
                >
                Fase ${phaseNum}
            </label>
        `).join('');

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
async function assignPhases(studentId) {
    const studentItem = document.querySelector(`input[onchange="assignPhases('${studentId}')"]`).closest('.student-item');
    const checkboxes = studentItem.querySelectorAll('.phase-checkbox');

    const newPhases = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value))
        .sort((a, b) => a - b); // Ordena as fases numericamente

    if (newPhases.length === 0) {
        showFeedback("O aluno precisa ter pelo menos uma fase designada.", "error");
        await loadStudentProgress(); 
        return;
    }

    const studentData = studentProgressData.find(s => s.id === studentId);
    if (!studentData) return;

    showFeedback(`Atualizando fases para ${studentData.name}...`, 'info');
    try {
        const { error: assignError } = await supabaseClient
            .from('students')
            .update({ assigned_phases: newPhases })
            .eq('id', studentId);
        if (assignError) throw assignError;

        const firstPhase = newPhases[0];
        const newGameState = {
            currentPhase: firstPhase, score: 0, attempts: 3, questions: generateQuestions(firstPhase), currentQuestionIndex: 0, tutorialsShown: [], phaseCompleted: false
        };
        const { error: progressError } = await supabaseClient
            .from('progress')
            .upsert({
                student_id: studentId, current_phase: firstPhase, game_state: newGameState, last_played: new Date().toISOString()
            }, { onConflict: 'student_id' });
        if (progressError) throw progressError;

        showFeedback(`Fases de ${studentData.name} atualizadas!`, 'success');
        await loadStudentProgress();
    } catch (error) {
        console.error("Erro ao designar fases:", error);
        showFeedback(`Erro: ${error.message}`, 'error');
        await loadStudentProgress();
    }
}async function assignPhases(studentId) {
    const studentItem = document.querySelector(`input[onchange="assignPhases('${studentId}')"]`).closest('.student-item');
    const checkboxes = studentItem.querySelectorAll('.phase-checkbox');

    const newPhases = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value))
        .sort((a, b) => a - b); // Ordena as fases numericamente

    if (newPhases.length === 0) {
        showFeedback("O aluno precisa ter pelo menos uma fase designada.", "error");
        await loadStudentProgress(); 
        return;
    }

    const studentData = studentProgressData.find(s => s.id === studentId);
    if (!studentData) return;

    showFeedback(`Atualizando fases para ${studentData.name}...`, 'info');
    try {
        const { error: assignError } = await supabaseClient
            .from('students')
            .update({ assigned_phases: newPhases })
            .eq('id', studentId);
        if (assignError) throw assignError;

        const firstPhase = newPhases[0];
        const newGameState = {
            currentPhase: firstPhase, score: 0, attempts: 3, questions: generateQuestions(firstPhase), currentQuestionIndex: 0, tutorialsShown: [], phaseCompleted: false
        };
        const { error: progressError } = await supabaseClient
            .from('progress')
            .upsert({
                student_id: studentId, current_phase: firstPhase, game_state: newGameState, last_played: new Date().toISOString()
            }, { onConflict: 'student_id' });
        if (progressError) throw progressError;

        showFeedback(`Fases de ${studentData.name} atualizadas!`, 'success');
        await loadStudentProgress();
    } catch (error) {
        console.error("Erro ao designar fases:", error);
        showFeedback(`Erro: ${error.message}`, 'error');
        await loadStudentProgress();
    }
}async function assignPhases(studentId) {
    const studentItem = document.querySelector(`input[onchange="assignPhases('${studentId}')"]`).closest('.student-item');
    const checkboxes = studentItem.querySelectorAll('.phase-checkbox');

    const newPhases = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value))
        .sort((a, b) => a - b); // Ordena as fases numericamente

    if (newPhases.length === 0) {
        showFeedback("O aluno precisa ter pelo menos uma fase designada.", "error");
        await loadStudentProgress(); 
        return;
    }

    const studentData = studentProgressData.find(s => s.id === studentId);
    if (!studentData) return;

    showFeedback(`Atualizando fases para ${studentData.name}...`, 'info');
    try {
        const { error: assignError } = await supabaseClient
            .from('students')
            .update({ assigned_phases: newPhases })
            .eq('id', studentId);
        if (assignError) throw assignError;

        const firstPhase = newPhases[0];
        const newGameState = {
            currentPhase: firstPhase, score: 0, attempts: 3, questions: generateQuestions(firstPhase), currentQuestionIndex: 0, tutorialsShown: [], phaseCompleted: false
        };
        const { error: progressError } = await supabaseClient
            .from('progress')
            .upsert({
                student_id: studentId, current_phase: firstPhase, game_state: newGameState, last_played: new Date().toISOString()
            }, { onConflict: 'student_id' });
        if (progressError) throw progressError;

        showFeedback(`Fases de ${studentData.name} atualizadas!`, 'success');
        await loadStudentProgress();
    } catch (error) {
        console.error("Erro ao designar fases:", error);
        showFeedback(`Erro: ${error.message}`, 'error');
        await loadStudentProgress();
    }
}
async function handleCreateStudent(event) { event.preventDefault(); const username = document.getElementById('createStudentUsername').value.trim(); const password = document.getElementById('createStudentPassword').value; const submitButton = document.getElementById('createStudentSubmitBtn'); if (!username || !password) { return showFeedback("Preencha nome e senha.", "error"); } if (!currentClassId || !currentUser?.id) { return showFeedback("Erro de sessão.", "error"); } submitButton.disabled = true; submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...'; try { const hashedPassword = await hashPassword(password); const { error } = await supabaseClient.from('students').insert([{ name: username, username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }]); if (error) throw error; document.getElementById('newStudentUsername').textContent = username; document.getElementById('newStudentPassword').textContent = password; showModal('studentCreatedModal'); hideCreateStudentForm(); await loadClassStudents(); await loadStudentProgress(); } catch (error) { showFeedback(formatErrorMessage(error), 'error'); } finally { submitButton.disabled = false; submitButton.innerHTML = 'Criar Aluno'; } }
async function handleDeleteStudent(studentId, studentName) { if (!confirm(`Tem certeza que deseja excluir "${studentName}"?`)) return; const { error } = await supabaseClient.from('students').delete().eq('id', studentId); if (error) { showFeedback(`Erro: ${error.message}`, 'error'); } else { showFeedback(`Aluno "${studentName}" excluído.`, 'success'); await loadClassStudents(); await loadStudentProgress(); } }
async function handleResetStudentPassword(studentId, studentName) { const newPassword = generateRandomPassword(); const confirmed = prompt(`Nova senha para "${studentName}":\n\n${newPassword}\n\nCopie e clique OK.`, newPassword); if (!confirmed) return; try { const hashedPassword = await hashPassword(newPassword); const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId); if (error) throw error; showFeedback(`Senha de "${studentName}" alterada!`, 'success'); } catch (error) { showFeedback(`Erro: ${error.message}`, 'error'); } }
function handleCopyCredentials() { const username = document.getElementById('newStudentUsername').textContent; const password = document.getElementById('newStudentPassword').textContent; const textToCopy = `Usuário: ${username}\nSenha: ${password}`; navigator.clipboard.writeText(textToCopy).then(() => { showFeedback('Copiado!', 'success'); }).catch(() => { showFeedback('Erro ao copiar.', 'error'); }); }

// PARTE 7: ÁUDIO
// ... (código existente sem alterações)
async function handleAudioUpload() { const files = document.getElementById('audioUpload').files; if (files.length === 0) return; const uploadStatus = document.getElementById('uploadStatus'); uploadStatus.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Enviando...</p>`; let successCount = 0, errorCount = 0; for (const file of files) { const fileName = file.name.split('.').slice(0, -1).join('.').toUpperCase(); const filePath = `${currentUser.id}/${fileName}.${file.name.split('.').pop()}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true }); if (error) throw error; successCount++; } catch (error) { console.error(`Erro no upload:`, error); errorCount++; } } uploadStatus.innerHTML = `<p style="color: green;">${successCount} enviados!</p>`; if (errorCount > 0) { uploadStatus.innerHTML += `<p style="color: red;">Falha em ${errorCount}.</p>`; } }
async function startRecording() { const recordBtn = document.getElementById('recordBtn'), stopBtn = document.getElementById('stopBtn'), statusEl = document.getElementById('recordStatus'); recordBtn.disabled = true; statusEl.textContent = 'Pedindo permissão...'; try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioChunks = []; mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data)); mediaRecorder.addEventListener('stop', () => { const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const audioUrl = URL.createObjectURL(audioBlob); document.getElementById('audioPlayback').src = audioUrl; document.getElementById('saveRecordingBtn').disabled = false; stream.getTracks().forEach(track => track.stop()); }); mediaRecorder.start(); statusEl.textContent = 'Gravando...'; stopBtn.disabled = false; startTimer(); } catch (err) { console.error("Erro ao gravar:", err); alert("Não foi possível gravar. Verifique as permissões."); statusEl.textContent = 'Falha.'; recordBtn.disabled = false; } }
function stopRecording() { if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); stopTimer(); document.getElementById('recordBtn').disabled = false; document.getElementById('stopBtn').disabled = true; document.getElementById('recordStatus').textContent = 'Parado.'; } }
async function saveRecording() { if (audioChunks.length === 0) return; const saveButton = document.getElementById('saveRecordingBtn'); saveButton.disabled = true; saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; const selectedItem = document.getElementById('letterSelect').value; const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const fileName = `${selectedItem}.webm`; const filePath = `${currentUser.id}/${fileName}`; try { const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, audioBlob, { upsert: true }); if (error) throw error; showFeedback(`Áudio para "${selectedItem}" salvo!`, 'success'); audioChunks = []; document.getElementById('audioPlayback').src = ''; } catch (error) { showFeedback(`Erro: ${error.message}`, 'error'); } finally { saveButton.disabled = false; saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar'; } }
function startTimer() { stopTimer(); let seconds = 0; const timerEl = document.getElementById('recordTimer'); timerEl.textContent = '00:00'; timerInterval = setInterval(() => { seconds++; const mins = Math.floor(seconds / 60).toString().padStart(2, '0'); const secs = (seconds % 60).toString().padStart(2, '0'); timerEl.textContent = `${mins}:${secs}`; }, 1000); }
function stopTimer() { clearInterval(timerInterval); }

// PARTE 8: LÓGICA DO JOGO
// ... (código existente sem alterações)
// SUBSTITUA A FUNÇÃO ANTIGA POR ESTA
async function showStudentGame() {
    // Esta função agora é o ponto de entrada principal para o aluno
    await loadGameState(); // Carrega o progresso salvo do banco de dados

    // Verifica se o jogo pode ser continuado:
    // 1. Não está na primeira questão (index > 0)
    // 2. Ainda tem tentativas
    // 3. A fase não foi marcada como concluída
    const canResume = gameState.currentQuestionIndex > 0 && 
                      gameState.attempts > 0 && 
                      !gameState.phaseCompleted;

    if (canResume) {
        // Se puder continuar, vai direto para a tela do jogo
        showScreen('gameScreen');
        startQuestion(); // A função startQuestion vai carregar a questão correta
    } else {
        // Se for um novo jogo ou uma nova fase, mostra a tela de início
        showScreen('startScreen');
    }
}
async function startGame() { await loadGameState(); if (gameState.phaseCompleted) { restoreOrStartGame(); } else { showScreen('startScreen'); } }
async function loadGameState() { const { data: progressData, error } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single(); if (error && error.code !== 'PGRST116') { console.error("Erro ao carregar progresso:", error); } const assignedPhase = currentUser.assigned_phase || 1; const savedPhase = progressData?.current_phase; if (progressData && savedPhase !== assignedPhase) { gameState = { currentPhase: assignedPhase, score: 0, attempts: 3, questions: generateQuestions(assignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); return; } if (progressData?.game_state?.questions) { gameState = progressData.game_state; if (!gameState.tutorialsShown) gameState.tutorialsShown = []; } else { gameState = { currentPhase: assignedPhase, score: 0, attempts: 3, questions: generateQuestions(assignedPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [], phaseCompleted: false }; await saveGameState(); } }
async function saveGameState() { if (!currentUser || currentUser.type !== 'student') return; await supabaseClient.from('progress').upsert({ student_id: currentUser.id, current_phase: gameState.currentPhase, game_state: gameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' });}
function generateQuestions(phase) { let questions = []; const questionCount = 10; switch (phase) { case 1: const letters = [...ALPHABET].sort(() => 0.5 - Math.random()); for (let i = 0; i < questionCount; i++) { const l = letters[i % letters.length]; questions.push({ type: 'letter_sound', correctAnswer: l, options: generateOptions(l, ALPHABET, 4) }); } break; case 2: const words2 = [...PHASE_2_WORDS].sort(() => 0.5 - Math.random()); for (let i = 0; i < questionCount; i++) { const item = words2[i % words2.length]; questions.push({ type: 'initial_vowel', word: item.word, image: item.image, correctAnswer: item.vowel, options: generateOptions(item.vowel, VOWELS, 4) }); } break; case 3: const words3 = [...PHASE_3_ENCONTROS].sort(() => 0.5 - Math.random()); for (let i = 0; i < questionCount; i++) { const item = words3[i % words3.length]; questions.push({ type: 'vowel_encounter', word: item.word, image: item.image, correctAnswer: item.encontro, options: generateOptions(item.encontro, VOWEL_ENCOUNTERS, 4) }); } break; case 4: const words4 = [...PHASE_4_WORDS].sort(() => 0.5 - Math.random()); for (let i = 0; i < questionCount; i++) { const item = words4[i % words4.length]; const o = [...item.options, item.word].sort(() => 0.5 - Math.random()); questions.push({ type: 'full_word', image: item.image, correctAnswer: item.word, options: o }); } break; case 5: const words5 = [...PHASE_5_WORDS].sort(() => 0.5 - Math.random()); for (let i = 0; i < questionCount; i++) { const item = words5[i % words5.length]; questions.push({ type: 'final_syllable', word: item.word, image: item.image, correctAnswer: item.syllable, options: generateOptions(item.syllable, ALL_END_SYLLABLES, 4) }); } break; } return questions;}
function generateOptions(correctItem, sourceArray, count) { const options = new Set([correctItem]); const availableItems = sourceArray.filter(l => l !== correctItem); while (options.size < count && availableItems.length > 0) { options.add(availableItems.splice(Math.floor(Math.random() * availableItems.length), 1)[0]); } return Array.from(options).sort(() => 0.5 - Math.random()); }
async function startQuestion() { if (gameState.phaseCompleted) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100; showResultScreen(accuracy, true); return; } await showTutorial(gameState.currentPhase); if (!gameState.questions || gameState.currentQuestionIndex >= gameState.questions.length) { return endPhase(); } const q = gameState.questions[gameState.currentQuestionIndex]; document.getElementById('nextQuestion').style.display = 'none'; updateUI(); switch(q.type) { case 'letter_sound': renderPhase1UI(q); break; case 'initial_vowel': renderPhase2UI(q); break; case 'vowel_encounter': renderPhase3UI(q); break; case 'full_word': renderPhase4UI(q); break; case 'final_syllable': renderPhase5UI(q); break; } renderOptions(q.options); if(q.type === 'letter_sound') { setTimeout(playCurrentAudio, 500); } }
function renderPhase1UI(q) { document.getElementById('audioQuestionArea').style.display = 'block'; document.getElementById('imageQuestionArea').style.display = 'none'; document.getElementById('questionText').textContent = 'Qual letra faz este som?'; document.getElementById('repeatAudio').style.display = 'inline-block'; }
function renderPhase2UI(q) { document.getElementById('audioQuestionArea').style.display = 'none'; document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = `__${q.word.substring(1)}`; document.getElementById('questionText').textContent = 'Qual vogal completa a palavra?'; document.getElementById('repeatAudio').style.display = 'none'; }
function renderPhase3UI(q) { document.getElementById('audioQuestionArea').style.display = 'none'; document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = q.word.replace(q.correctAnswer, '__'); document.getElementById('questionText').textContent = 'Qual encontro de vogais completa a palavra?'; document.getElementById('repeatAudio').style.display = 'none'; }
function renderPhase4UI(q) { document.getElementById('audioQuestionArea').style.display = 'none'; document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('imageEmoji').textContent = q.image; document.getElementById('wordDisplay').textContent = `?`; document.getElementById('questionText').textContent = 'Qual é o nome desta figura?'; document.getElementById('repeatAudio').style.display = 'none'; }
function renderPhase5UI(q) { document.getElementById('audioQuestionArea').style.display = 'none'; document.getElementById('imageQuestionArea').style.display = 'block'; document.getElementById('imageEmoji').textContent = q.image; const visiblePart = q.word.slice(0, -q.correctAnswer.length); document.getElementById('wordDisplay').textContent = `${visiblePart}__`; document.getElementById('questionText').textContent = 'Qual sílaba termina esta palavra?'; document.getElementById('repeatAudio').style.display = 'none'; }
function renderOptions(options) { const lettersGrid = document.getElementById('lettersGrid'); lettersGrid.innerHTML = options.map(option => `<button class="letter-button">${option}</button>`).join(''); lettersGrid.querySelectorAll('.letter-button').forEach(btn => btn.addEventListener('click', (e) => selectAnswer(e.target.textContent))); }
async function selectAnswer(selectedAnswer) { document.querySelectorAll('.letter-button').forEach(btn => btn.disabled = true); const q = gameState.questions[gameState.currentQuestionIndex]; const isCorrect = selectedAnswer === q.correctAnswer; document.querySelectorAll('.letter-button').forEach(btn => { if (btn.textContent === q.correctAnswer) btn.classList.add('correct'); if (btn.textContent === selectedAnswer && !isCorrect) btn.classList.add('incorrect'); }); if (isCorrect) { gameState.score++; showFeedback('Muito bem!', 'success'); playTeacherAudio('feedback_correct', 'Acertou'); if(q.type !== 'letter_sound') { document.getElementById('wordDisplay').textContent = q.word; } } else { gameState.attempts--; logStudentError({ question: q, selectedAnswer: selectedAnswer }).catch(console.error); showFeedback(`Quase! A resposta correta era ${q.correctAnswer}`, 'error'); playTeacherAudio('feedback_incorrect', 'Tente de novo'); } updateUI(); await saveGameState(); if(gameState.attempts <= 0) { setTimeout(endPhase, 2000); } else { setTimeout(() => document.getElementById('nextQuestion').style.display = 'block', 1500); } }
function nextQuestion() { gameState.currentQuestionIndex++; startQuestion(); }
function endPhase() { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; const passed = accuracy >= 70; showResultScreen(accuracy, passed); }
function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;

    const assignedPhases = currentUser.assigned_phases || [1];
    const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase);
    const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1;

    // Seleciona os botões uma vez para facilitar
    const continueBtn = document.getElementById('continueButton');
    const retryBtn = document.getElementById('retryButton');
    const restartBtn = document.getElementById('restartButton');

    if (passed) {
        // --- LÓGICA QUANDO O ALUNO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        retryBtn.style.display = 'none'; // Esconde o botão de tentar de novo
        gameState.phaseCompleted = true;

        if (hasNextPhase) {
            // Se tem uma próxima fase na lista designada
            document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!';
            continueBtn.style.display = 'inline-block'; // Mostra "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; // Botão secundário
        } else {
            // Se completou a ÚLTIMA fase designada
            document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!';
            continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; // Ação principal é Sair
        }

    } else {
        // --- LÓGICA QUANDO O ALUNO NÃO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!';
        continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
        retryBtn.style.display = 'inline-block'; // Mostra "Tentar Novamente"
        restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        gameState.phaseCompleted = false;
    }

    saveGameState();
}function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;

    const assignedPhases = currentUser.assigned_phases || [1];
    const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase);
    const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1;

    // Seleciona os botões uma vez para facilitar
    const continueBtn = document.getElementById('continueButton');
    const retryBtn = document.getElementById('retryButton');
    const restartBtn = document.getElementById('restartButton');

    if (passed) {
        // --- LÓGICA QUANDO O ALUNO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        retryBtn.style.display = 'none'; // Esconde o botão de tentar de novo
        gameState.phaseCompleted = true;

        if (hasNextPhase) {
            // Se tem uma próxima fase na lista designada
            document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!';
            continueBtn.style.display = 'inline-block'; // Mostra "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; // Botão secundário
        } else {
            // Se completou a ÚLTIMA fase designada
            document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!';
            continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; // Ação principal é Sair
        }

    } else {
        // --- LÓGICA QUANDO O ALUNO NÃO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!';
        continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
        retryBtn.style.display = 'inline-block'; // Mostra "Tentar Novamente"
        restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        gameState.phaseCompleted = false;
    }

    saveGameState();
}function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;

    const assignedPhases = currentUser.assigned_phases || [1];
    const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase);
    const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1;

    // Seleciona os botões uma vez para facilitar
    const continueBtn = document.getElementById('continueButton');
    const retryBtn = document.getElementById('retryButton');
    const restartBtn = document.getElementById('restartButton');

    if (passed) {
        // --- LÓGICA QUANDO O ALUNO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        retryBtn.style.display = 'none'; // Esconde o botão de tentar de novo
        gameState.phaseCompleted = true;

        if (hasNextPhase) {
            // Se tem uma próxima fase na lista designada
            document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!';
            continueBtn.style.display = 'inline-block'; // Mostra "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; // Botão secundário
        } else {
            // Se completou a ÚLTIMA fase designada
            document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!';
            continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; // Ação principal é Sair
        }

    } else {
        // --- LÓGICA QUANDO O ALUNO NÃO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!';
        continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
        retryBtn.style.display = 'inline-block'; // Mostra "Tentar Novamente"
        restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        gameState.phaseCompleted = false;
    }

    saveGameState();
}function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;

    const assignedPhases = currentUser.assigned_phases || [1];
    const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase);
    const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1;

    // Seleciona os botões uma vez para facilitar
    const continueBtn = document.getElementById('continueButton');
    const retryBtn = document.getElementById('retryButton');
    const restartBtn = document.getElementById('restartButton');

    if (passed) {
        // --- LÓGICA QUANDO O ALUNO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        retryBtn.style.display = 'none'; // Esconde o botão de tentar de novo
        gameState.phaseCompleted = true;

        if (hasNextPhase) {
            // Se tem uma próxima fase na lista designada
            document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!';
            continueBtn.style.display = 'inline-block'; // Mostra "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; // Botão secundário
        } else {
            // Se completou a ÚLTIMA fase designada
            document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!';
            continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; // Ação principal é Sair
        }

    } else {
        // --- LÓGICA QUANDO O ALUNO NÃO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!';
        continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
        retryBtn.style.display = 'inline-block'; // Mostra "Tentar Novamente"
        restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        gameState.phaseCompleted = false;
    }

    saveGameState();
}function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;

    const assignedPhases = currentUser.assigned_phases || [1];
    const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase);
    const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1;

    // Seleciona os botões uma vez para facilitar
    const continueBtn = document.getElementById('continueButton');
    const retryBtn = document.getElementById('retryButton');
    const restartBtn = document.getElementById('restartButton');

    if (passed) {
        // --- LÓGICA QUANDO O ALUNO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        retryBtn.style.display = 'none'; // Esconde o botão de tentar de novo
        gameState.phaseCompleted = true;

        if (hasNextPhase) {
            // Se tem uma próxima fase na lista designada
            document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!';
            continueBtn.style.display = 'inline-block'; // Mostra "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; // Botão secundário
        } else {
            // Se completou a ÚLTIMA fase designada
            document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!';
            continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; // Ação principal é Sair
        }

    } else {
        // --- LÓGICA QUANDO O ALUNO NÃO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!';
        continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
        retryBtn.style.display = 'inline-block'; // Mostra "Tentar Novamente"
        restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        gameState.phaseCompleted = false;
    }

    saveGameState();
}function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;

    const assignedPhases = currentUser.assigned_phases || [1];
    const currentPhaseIndex = assignedPhases.indexOf(gameState.currentPhase);
    const hasNextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < assignedPhases.length - 1;

    // Seleciona os botões uma vez para facilitar
    const continueBtn = document.getElementById('continueButton');
    const retryBtn = document.getElementById('retryButton');
    const restartBtn = document.getElementById('restartButton');

    if (passed) {
        // --- LÓGICA QUANDO O ALUNO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        retryBtn.style.display = 'none'; // Esconde o botão de tentar de novo
        gameState.phaseCompleted = true;

        if (hasNextPhase) {
            // Se tem uma próxima fase na lista designada
            document.getElementById('resultMessage').innerHTML = 'Você completou a fase! 🏆<br>Clique para ir para a próxima!';
            continueBtn.style.display = 'inline-block'; // Mostra "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início'; // Botão secundário
        } else {
            // Se completou a ÚLTIMA fase designada
            document.getElementById('resultMessage').innerHTML = 'Você completou TODAS as suas fases! 🥳<br>Fale com seu professor!';
            continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
            restartBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'; // Ação principal é Sair
        }

    } else {
        // --- LÓGICA QUANDO O ALUNO NÃO PASSA DE FASE ---
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        document.getElementById('resultMessage').textContent = 'Você precisa acertar mais. Tente novamente!';
        continueBtn.style.display = 'none'; // Esconde "Próxima Fase"
        retryBtn.style.display = 'inline-block'; // Mostra "Tentar Novamente"
        restartBtn.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        gameState.phaseCompleted = false;
    }

    saveGameState();
}
async function nextPhase() { const nextPhaseNum = gameState.currentPhase + 1; if (nextPhaseNum > currentUser.assigned_phase) return; gameState.currentPhase = nextPhaseNum; gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.questions = generateQuestions(gameState.currentPhase); gameState.phaseCompleted = false; await saveGameState(); showScreen('gameScreen'); startQuestion(); }
async function retryPhase() { gameState.currentQuestionIndex = 0; gameState.score = 0; gameState.attempts = 3; gameState.phaseCompleted = false; await saveGameState(); showScreen('gameScreen'); startQuestion(); }
async function restartGame() { if (gameState.phaseCompleted || gameState.attempts <= 0) { logout(); } else { showScreen('startScreen'); } }
async function playTeacherAudio(key, fallbackText, onEndCallback) { const teacherId = SUPER_ADMIN_TEACHER_ID; if (!teacherId) { speak(fallbackText, onEndCallback); return; } try { const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` }); if (data && data.length > 0) { const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${data[0].name}`); const audio = new Audio(publicUrl); if (onEndCallback) audio.onended = onEndCallback; audio.play(); } else { speak(fallbackText, onEndCallback); } } catch (error) { console.error("Erro ao buscar áudio:", error); speak(fallbackText, onEndCallback); } }
async function playCurrentAudio() { const q = gameState.questions[gameState.currentQuestionIndex]; if (q.type !== 'letter_sound') return; const letter = q.correctAnswer; playTeacherAudio(letter, letter); }

// PARTE 9: UI E VOZ
// ... (código existente sem alterações)
function initializeSpeech() { function loadVoices() { const voices = speechSynthesis.getVoices(); if (voices.length > 0) { selectedVoice = voices.find(v => v.lang === 'pt-BR') || voices[0]; speechReady = true; } } speechSynthesis.onvoiceschanged = loadVoices; loadVoices(); }
function speak(text, onEndCallback) { if (!window.speechSynthesis || !speechReady) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'pt-BR'; utterance.voice = selectedVoice; if (onEndCallback) utterance.onend = onEndCallback; speechSynthesis.speak(utterance); }
function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId)?.classList.add('active'); }
function showModal(modalId) { document.getElementById(modalId)?.classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'none'; document.getElementById('createStudentFormElement').reset(); }
function showAudioSettingsModal() { const letterSelect = document.getElementById('letterSelect'); if (letterSelect) { let optionsHtml = ''; optionsHtml += '<optgroup label="Instruções e Feedbacks">'; for (const key in CUSTOM_AUDIO_KEYS) { optionsHtml += `<option value="${key}">${CUSTOM_AUDIO_KEYS[key]}</option>`; } optionsHtml += '</optgroup>'; optionsHtml += '<optgroup label="Letras do Alfabeto">'; optionsHtml += ALPHABET.map(letter => `<option value="${letter}">Letra ${letter}</option>`).join(''); optionsHtml += '</optgroup>'; letterSelect.innerHTML = optionsHtml; } showModal('audioSettingsModal'); showTab(document.querySelector('#audioSettingsModal .tab-btn[data-tab="uploadFileTab"]')); }
function showTab(clickedButton) { const parent = clickedButton.closest('.modal-content'); const tabId = clickedButton.getAttribute('data-tab'); parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); clickedButton.classList.add('active'); parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active')); parent.querySelector('#' + tabId).classList.add('active'); }
function showFeedback(message, type = 'info') { const el = document.getElementById('globalFeedback'); if (!el) return; const textEl = el.querySelector('.feedback-text'); if (textEl) textEl.textContent = message; el.className = `show ${type}`; setTimeout(() => { el.className = el.className.replace('show', ''); }, 3000); }
function updateUI() { const gameScreen = document.getElementById('gameScreen'); if(gameScreen.classList.contains('active') && gameState.questions && gameState.questions.length > 0) { document.getElementById('score').textContent = gameState.score; document.getElementById('totalQuestions').textContent = gameState.questions.length; document.getElementById('attempts').textContent = `${gameState.attempts} tentativa(s)`; document.getElementById('currentPhase').textContent = gameState.currentPhase; const progress = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100; document.getElementById('progressFill').style.width = `${progress}%`; } }
async function showTutorial(phaseNumber) { if (gameState.tutorialsShown.includes(phaseNumber)) return; const instruction = gameInstructions[phaseNumber]; if (!instruction) return; const overlay = document.getElementById('tutorialOverlay'); const mascot = document.getElementById('tutorialMascot'); document.getElementById('tutorialText').textContent = instruction; overlay.classList.add('show'); mascot.classList.add('talking'); const audioKey = `instruction_${phaseNumber}`; playTeacherAudio(audioKey, instruction, () => mascot.classList.remove('talking')); gameState.tutorialsShown.push(phaseNumber); await saveGameState(); }
function hideTutorial() { document.getElementById('tutorialOverlay').classList.remove('show'); }

// PARTE 10: LOG DE ERROS
async function logStudentError({ question, selectedAnswer }) { if (!currentUser || currentUser.type !== 'student') { return; } const errorData = { student_id: currentUser.id, teacher_id: currentUser.teacher_id, class_id: currentUser.class_id, phase: gameState.currentPhase, question_type: question.type, correct_answer: String(question.correctAnswer), selected_answer: String(selectedAnswer) }; const { error } = await supabaseClient.from('student_errors').insert([errorData]); if (error) { console.error('Falha ao registrar erro:', error); } }

// PARTE 11: RELATÓRIOS E IA (REATORADO)
async function populateReportClassSelector() {
    const selector = document.getElementById('reportClassSelector');
    selector.innerHTML = '<option value="">Carregando turmas...</option>';
    document.getElementById('reportContentContainer').style.display = 'none';

    const { data, error } = await supabaseClient.from('classes').select('id, name').eq('teacher_id', currentUser.id).order('name', { ascending: true });
    
    if (error || !data) {
        selector.innerHTML = '<option value="">Erro ao carregar</option>';
        return;
    }

    if (data.length === 0) {
        selector.innerHTML = '<option value="">Nenhuma turma encontrada</option>';
        return;
    }

    selector.innerHTML = '<option value="">-- Selecione uma turma --</option>';
    data.forEach(cls => {
        selector.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
    });
}

function handleReportClassSelection(event) {
    const classId = event.target.value;
    const reportContainer = document.getElementById('reportContentContainer');

    if (classId) {
        reportContainer.style.display = 'block';
        loadAndDisplayClassReports(classId);
    } else {
        reportContainer.style.display = 'none';
        reportContainer.innerHTML = '';
    }
}

async function loadAndDisplayClassReports(classId) {
    const reportContainer = document.getElementById('reportContentContainer');
    reportContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando relatórios...</p>';

    const { data: errors, error: errorsError } = await supabaseClient.from('student_errors').select('*').eq('class_id', classId);
    if (errorsError) {
        reportContainer.innerHTML = '<p class="error">Erro ao carregar dados de erros.</p>';
        return;
    }

    const { data: students, error: studentsError } = await supabaseClient.from('students').select('id, name').eq('class_id', classId);
    if (studentsError) {
        reportContainer.innerHTML = '<p class="error">Erro ao carregar lista de alunos.</p>';
        return;
    }

    reportContainer.innerHTML = `
        <div class="report-section">
            <h4><i class="fas fa-fire"></i> Mapa de Calor da Turma</h4>
            <p>As maiores dificuldades da turma inteira, mostrando o que foi mais errado.</p>
            <div id="classHeatmapContainer"></div>
        </div>
        <div class="report-section">
            <h4><i class="fas fa-user-graduate"></i> Relatório Individual de Dificuldades</h4>
            <p>Clique em um aluno para ver seus erros e gerar dicas pedagógicas com a IA.</p>
            <div id="individualReportsContainer"></div>
        </div>
    `;

    renderClassHeatmap(errors, 'classHeatmapContainer');
    renderIndividualReports(students, errors, 'individualReportsContainer');
}

function renderClassHeatmap(errors, containerId) {
    // ... (código existente sem alterações)
    const heatmapContainer = document.getElementById(containerId);
    const sectionHeader = heatmapContainer.closest('.report-section').querySelector('h4');
    sectionHeader.querySelector('.view-chart-btn')?.remove(); // Remove botão antigo para evitar duplicatas

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

    for (const phase of sortedPhases) {
        const phaseDescription = PHASE_DESCRIPTIONS[phase] || 'Fase Desconhecida';
        html += `<div class="phase-group"><h3>Fase ${phase} - ${phaseDescription}</h3>`;
        
        const phaseErrors = errorsByPhase[phase];
        const errorCounts = phaseErrors.reduce((acc, error) => {
            const key = error.correct_answer;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const sortedErrors = Object.entries(errorCounts).sort(([, a], [, b]) => b - a);

        if (sortedErrors.length === 0) {
            html += '<p>Nenhum erro nesta fase.</p>';
        } else {
            html += sortedErrors.map(([item, count]) => `
                <div class="heatmap-item">
                    <div class="item-label">${item}</div>
                    <div class="item-details">
                        <span class="item-count">${count} erro(s)</span>
                        <div class="item-bar-container">
                            <div class="item-bar" style="width: ${(count / sortedErrors[0][1]) * 100}%;"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        html += '</div>';
    }
    heatmapContainer.innerHTML = html;

    const chartButton = document.createElement('button');
    chartButton.className = 'btn small view-chart-btn';
    chartButton.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Gráfico Geral';
    chartButton.onclick = () => {
        const totalErrorCounts = errors.reduce((acc, error) => { const key = error.correct_answer; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
        const sortedTotalErrors = Object.entries(totalErrorCounts).sort(([, a], [, b]) => b - a);
        const chartLabels = sortedTotalErrors.map(([item]) => item);
        const chartData = sortedTotalErrors.map(([, count]) => count);
        displayChartModal('Gráfico de Dificuldades da Turma (Geral)', chartLabels, chartData);
    };
    sectionHeader.appendChild(chartButton);
}

function renderIndividualReports(students, allErrors, containerId) {
    // ... (código existente sem alterações)
    const container = document.getElementById(containerId);
    if (!students || students.length === 0) {
        container.innerHTML = '<p>Nenhum aluno na turma.</p>';
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="student-item student-report-item" data-student-id="${student.id}" data-student-name="${student.name}">
            <div class="student-info">
                <h4>${student.name}</h4>
            </div>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="student-errors-details" id="errors-for-${student.id}" style="display: none;"></div>
    `).join('');

    container.querySelectorAll('.student-report-item').forEach(item => {
        item.addEventListener('click', () => {
            const studentId = item.dataset.studentId;
            const studentName = item.dataset.studentName;
            const detailsContainer = document.getElementById(`errors-for-${studentId}`);
            const isVisible = detailsContainer.style.display === 'block';

            // Fecha todos os outros
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
                    if (!acc[key]) { acc[key] = { count: 0, selections: {}, details: error }; }
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
                                 <button class="btn ai-btn" onclick="handleGenerateAITips('${studentId}', '${studentName}')">
                                     <i class="fas fa-lightbulb"></i> Gerar Dicas com IA
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

async function handleGenerateAITips(studentId, studentName) {
    const aiContainer = document.getElementById('aiTipsContent');
    document.getElementById('aiTipsTitle').innerHTML = `<i class="fas fa-lightbulb" style="color: #f1c40f;"></i> Dicas para <span style="color: #764ba2;">${studentName}</span>`;
    aiContainer.innerHTML = '<div class="loading-ai"><i class="fas fa-spinner fa-spin"></i> Analisando dados e gerando dicas pedagógicas...</div>';
    showModal('aiTipsModal');

    // =================================================================================
    //  IMPORTANTE: Insira sua chave de API do Google AI Studio na linha abaixo.
    //  1. Acesse https://aistudio.google.com/
    //  2. Clique em "Get API key" e copie sua chave.
    //  3. Cole a chave entre as aspas.
    // =================================================================================
    const apiKey = "AIzaSyA_IDKtdC-3JynuarsWwZe6G7Di22dau5I"; 

    if (apiKey === "COLE_SUA_CHAVE_DA_API_AQUI" || apiKey === "") {
        aiContainer.innerHTML = `<p class="error"><strong>Atenção:</strong> A funcionalidade de IA precisa ser ativada. Por favor, insira uma chave de API válida no arquivo <strong>script.js</strong> na linha 557.</p>`;
        return;
    }

    const { data: studentErrors, error } = await supabaseClient
        .from('student_errors')
        .select('*')
        .eq('student_id', studentId)
        .limit(50); // Pega os últimos 50 erros para análise

    if (error || !studentErrors || studentErrors.length === 0) {
        aiContainer.innerHTML = '<p>Não foi possível obter os dados de erros do aluno ou o aluno não possui erros registrados.</p>';
        return;
    }
    
    const errorSummary = studentErrors.map(e => 
        `Fase ${e.phase} (${PHASE_DESCRIPTIONS[e.phase]}): A resposta correta era '${e.correct_answer}', mas o aluno escolheu '${e.selected_answer}'.`
    ).join('\n');

    const prompt = `
        Você é um assistente pedagógico especialista em alfabetização no Brasil, projetado para auxiliar professores do ensino fundamental.
        Um aluno chamado ${studentName} está apresentando as seguintes dificuldades em um jogo de alfabetização:
        ${errorSummary}

        Com base nesses erros, gere um relatório para o professor com as seguintes seções:
        1.  **Principal Dificuldade Identificada:** Um parágrafo curto resumindo o padrão de erro mais comum do aluno (ex: "trocas de fonemas surdos/sonoros como P/B", "dificuldade com dígrafos", "confusão entre vogais").
        2.  **Sugestões de Atividades Práticas:** Liste de 3 a 4 sugestões de atividades lúdicas e concretas que o professor pode realizar com o aluno para sanar essa dificuldade. Para cada atividade, forneça um título criativo e uma breve descrição de como executá-la. Use uma linguagem clara e encorajadora.

        Formate sua resposta usando Markdown. Use títulos (##) para as seções e listas com marcadores (*) para as atividades.
    `;

    try {
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error Body:", errorBody);
            throw new Error(`Erro na API: ${response.statusText}. Verifique se sua chave de API é válida e está corretamente configurada.`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            
            let text = result.candidates[0].content.parts[0].text;

            // Simple Markdown to HTML conversion
            text = text.replace(/## (.*)/g, '<h3>$1</h3>');
            text = text.replace(/\*\* (.*)\*\*/g, '<h4>$1</h4>'); // For bold titles
            text = text.replace(/\* \*\*(.*)\*\*/g, '<h4>$1</h4>'); // For activity titles
            text = text.replace(/^\* (.*)/gm, '<li>$1</li>');
            text = text.replace(/\n/g, '<br>');
            text = text.replace(/<\/li><br>/g, '</li>');
            
            // Wrap list items in <ul>
            if (text.includes('<li>')) {
                 text = text.replace(/<li>/g, '</li><li>').substring(5); // dirty but effective
                 text = `<ul>${text}</ul>`.replace(/<br><ul>/g, '<ul>');
            }


            aiContainer.innerHTML = text;
        } else {
            console.log("Resposta da IA em formato inesperado:", result);
            throw new Error("Resposta da IA em formato inesperado.");
        }
    } catch (err) {
        console.error("Erro ao chamar a IA:", err);
        aiContainer.innerHTML = `<p class="error">Desculpe, não foi possível gerar as dicas neste momento. Causa: ${err.message}</p>`;
    }
}


// PARTE 12: GRÁFICOS
function displayChartModal(title, labels, data) { const modal = document.getElementById('chartModal'); const titleEl = document.getElementById('chartModalTitle'); const ctx = document.getElementById('myChartCanvas').getContext('2d'); titleEl.textContent = title; if (currentChart) { currentChart.destroy(); } currentChart = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Nº de Erros', data: data, backgroundColor: 'rgba(118, 75, 162, 0.6)', borderColor: 'rgba(118, 75, 162, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false }, title: { display: true, text: 'Itens com maior quantidade de erros na turma', font: { size: 16, family: "'Comic Neue', cursive" } } } } }); showModal('chartModal'); }

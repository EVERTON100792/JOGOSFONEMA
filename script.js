// =======================================================
// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
// =======================================================
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6'; 

let currentUser = null;
let currentClassId = null;
let currentStudentData = []; // Armazenar dados dos alunos para ordenação
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = 'AEIOU'.split('');

const CUSTOM_AUDIO_KEYS = {
    'instruction_1': 'Instrução - Fase 1',
    'instruction_2': 'Instrução - Fase 2',
    'instruction_3': 'Instrução - Fase 3',
    'instruction_4': 'Instrução - Fase 4',
    'instruction_5': 'Instrução - Fase 5',
    'feedback_correct': 'Feedback - Acerto',
    'feedback_incorrect': 'Feedback - Erro'
};

let gameState = {};
let mediaRecorder;
let audioChunks = [];
let timerInterval;
let speechReady = false;
let selectedVoice = null;

// =======================================================
// PARTE 2: CONTEÚDO DO JOGO (FASES)
// =======================================================

const gameInstructions = {
    1: "Vamos começar! Eu vou fazer o som de uma letra. Ouça com atenção no alto-falante e depois clique na letra que você acha que é a certa. Você consegue!",
    2: "Que legal, você avançou! Agora, olhe bem para a figura. Qual é a VOGAL que começa o nome dela? Clique na vogal correta para a gente completar a palavra juntos!",
    3: "Uau, você está indo muito bem! Agora vamos juntar as vogais. Olhe a figura e escolha os dois sons que completam a palavra. Preste atenção!",
    4: "Você é um campeão! Chegou a hora de ler a palavra inteira. Olhe a figura e encontre o nome dela escrito corretamente nas opções abaixo. Vamos lá!",
    5: "Fase final! Agora o desafio é com o finalzinho da palavra. Olhe a figura e escolha a SÍLABA que termina o nome dela. Você está quase lá!"
};

const PHASE_2_WORDS = [
    { word: 'ABELHA', image: '🐝', vowel: 'A' }, { word: 'ELEFANTE', image: '🐘', vowel: 'E' }, { word: 'IGREJA', image: '⛪', vowel: 'I' },
    { word: 'ÔNIBUS', image: '🚌', vowel: 'O' }, { word: 'UVA', image: '🍇', vowel: 'U' }, { word: 'AVIÃO', image: '✈️', vowel: 'A' },
    { word: 'ESTRELA', image: '⭐', vowel: 'E' }, { word: 'ÍNDIO', image: '🏹', vowel: 'I' }, { word: 'OVO', image: '🥚', vowel: 'O' }, { word: 'URSO', image: '🐻', vowel: 'U' }
];

const PHASE_3_ENCONTROS = [
    { word: 'PEIXE', image: '🐠', encontro: 'EI' }, { word: 'BOI', image: '🐂', encontro: 'OI' }, { word: 'CAIXA', image: '📦', encontro: 'AI' },
    { word: 'PAI', image: '👨‍👧', encontro: 'AI' }, { word: 'CÉU', image: '🌌', encontro: 'EU' }, { word: 'LUA', image: '🌙', encontro: 'UA' },
    { word: 'LEÃO', image: '🦁', encontro: 'ÃO' }, { word: 'MÃE', image: '👩‍👦', encontro: 'ÃE' }, { word: 'PÃO', image: '🍞', encontro: 'ÃO' }, { word: 'CHAPÉU', image: '🤠', encontro: 'ÉU' }
];
const VOWEL_ENCOUNTERS = ['AI', 'EI', 'OI', 'UI', 'AU', 'EU', 'ÃO', 'ÃE', 'UA', 'ÉU'];

const PHASE_4_WORDS = [
    { word: 'BOLA', image: '⚽', options: ['BOLO', 'BALA', 'BULA'] }, { word: 'CASA', image: '🏠', options: ['COPO', 'COLA', 'CAJU'] },
    { word: 'DADO', image: '🎲', options: ['DEDO', 'DIA', 'DOCE'] }, { word: 'GATO', image: '🐈', options: ['GALO', 'GELO', 'GOTA'] },
    { word: 'MACACO', image: '🐒', options: ['MALA', 'MAPA', 'MEIA'] }, { word: 'SAPO', image: '🐸', options: ['SAPATO', 'SOFÁ', 'SUCO'] },
    { word: 'UVA', image: '🍇', options: ['UNHA', 'URUBU', 'UM'] }, { word: 'SOL', image: '☀️', options: ['SAL', 'SETE', 'SAPO'] },
    { word: 'LUA', image: '🌙', options: ['LAMA', 'LATA', 'LEÃO'] }, { word: 'PATO', image: '🦆', options: ['PÉ', 'POTE', 'PIPA'] }
];

const PHASE_5_WORDS = [
    { word: 'BOLO', image: '🎂', syllable: 'LO' }, { word: 'CASA', image: '🏠', syllable: 'SA' }, { word: 'DADO', image: '🎲', syllable: 'DO' },
    { word: 'FACA', image: '🔪', syllable: 'CA' }, { word: 'GATO', image: '🐈', syllable: 'TO' }, { word: 'MACACO', image: '🐒', syllable: 'CO' },
    { word: 'PATO', image: '🦆', syllable: 'TO' }, { word: 'SAPO', image: '🐸', syllable: 'PO' }, { word: 'VACA', image: '🐄', syllable: 'CA' }, { word: 'JANELA', image: '🖼️', syllable: 'LA' }
];
const ALL_END_SYLLABLES = ['LO', 'SA', 'DO', 'CA', 'TO', 'CO', 'PO', 'LA', 'NE', 'JA'];

// =======================================================
// PARTE 3: FUNÇÕES UTILITÁRIAS
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

function formatErrorMessage(error) {
    if (!error || !error.message) return 'Ocorreu um erro inesperado. Tente mais tarde.';
    const message = error.message.toLowerCase();
    if (message.includes('duplicate key') && message.includes('username')) return 'Este nome de usuário já existe. Por favor, escolha outro.';
    if (message.includes('invalid login credentials')) return 'Usuário ou senha inválidos. Verifique os dados e tente novamente.';
    if (message.includes('to be a valid email')) return 'Por favor, insira um e-mail válido.';
    if (message.includes('password should be at least 6 characters')) return 'A senha precisa ter no mínimo 6 caracteres.';
    console.error("Erro não tratado:", error);
    return 'Ocorreu um erro inesperado. Tente mais tarde.';
}

// =======================================================
// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
// =======================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    if (!window.supabase) {
        alert("ERRO CRÍTICO: O sistema de banco de dados não carregou. Verifique sua conexão.");
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

async function restoreOrStartGame() {
    await loadGameState(); 
    if (gameState.phaseCompleted) {
        const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100;
        showResultScreen(accuracy, true);
    } else {
        showScreen('gameScreen');
        startQuestion();
    }
}

function setupAllEventListeners() {
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        if (type === 'teacher') showScreen('teacherLoginScreen');
        else if (type === 'student') showScreen('studentLoginScreen');
    }));
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => showScreen(e.currentTarget.dataset.target)));
    document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen'));
    document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen'));
    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal'));
    document.getElementById('showAudioSettingsModalBtn').addEventListener('click', showAudioSettingsModal);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('showCreateStudentFormBtn').addEventListener('click', showCreateStudentForm);
    document.getElementById('hideCreateStudentFormBtn').addEventListener('click', hideCreateStudentForm);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    document.getElementById('generatePasswordBtn')?.addEventListener('click', () => {
        const pwField = document.getElementById('createStudentPassword');
        pwField.type = 'text';
        pwField.value = generateRandomPassword();
        setTimeout(() => { pwField.type = 'password'; }, 2000);
    });
    document.getElementById('startButton')?.addEventListener('click', () => { showScreen('gameScreen'); startQuestion(); });
    document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio);
    document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('continueButton')?.addEventListener('click', nextPhase);
    document.getElementById('retryButton')?.addEventListener('click', retryPhase);
    document.getElementById('restartButton')?.addEventListener('click', restartGame);
    document.getElementById('exitGameButton')?.addEventListener('click', handleExitGame);
    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => showTab(e.currentTarget)));
    document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload);
    document.getElementById('recordBtn')?.addEventListener('click', startRecording);
    document.getElementById('stopBtn')?.addEventListener('click', stopRecording);
    document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording);
    document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial);
    document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials);
    document.querySelectorAll('.password-toggle').forEach(toggle => toggle.addEventListener('click', () => {
        const pwInput = toggle.previousElementSibling;
        pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
        toggle.classList.toggle('fa-eye-slash');
    }));
    document.querySelectorAll('.sort-btn').forEach(btn => btn.addEventListener('click', handleSortStudents));
}

// =======================================================
// PARTE 5: AUTENTICAÇÃO E SESSÃO
// =======================================================
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        if (currentUser.user_metadata.role === 'teacher') await showTeacherDashboard();
        else await logout();
    } else {
        showScreen('userTypeScreen');
    }
}

async function handleAuthAction(button, action) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        await action();
    } catch (error) {
        showFeedback(formatErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

async function handleTeacherLogin(e) {
    e.preventDefault();
    await handleAuthAction(e.target.querySelector('button[type="submit"]'), async () => {
        const email = document.getElementById('teacherEmail').value;
        const password = document.getElementById('teacherPassword').value;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        await showTeacherDashboard();
        showFeedback('Login realizado com sucesso!', 'success');
    });
}

async function handleTeacherRegister(e) {
    e.preventDefault();
    await handleAuthAction(e.target.querySelector('button[type="submit"]'), async () => {
        const name = document.getElementById('teacherRegName').value;
        const email = document.getElementById('teacherRegEmail').value;
        const password = document.getElementById('teacherRegPassword').value;
        const { error } = await supabaseClient.auth.signUp({
            email, password, options: { data: { full_name: name, role: 'teacher' } }
        });
        if (error) throw error;
        showFeedback('Cadastro realizado! Link de confirmação enviado para seu e-mail.', 'success');
        showScreen('teacherLoginScreen');
    });
}

async function handleStudentLogin(e) {
    e.preventDefault();
    await handleAuthAction(e.target.querySelector('button[type="submit"]'), async () => {
        const username = document.getElementById('studentUsername').value.trim();
        const password = document.getElementById('studentPassword').value.trim();
        const { data: studentData, error } = await supabaseClient
            .from('students').select('*, assigned_phase').eq('username', username).single();
        if (error || !studentData) throw new Error('Usuário ou senha inválidos.');
        
        const match = await verifyPassword(password, studentData.password);
        if (!match) throw new Error('Usuário ou senha inválidos.');

        currentUser = { ...studentData, type: 'student' };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        await showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');
    });
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentClassId = null;
    sessionStorage.removeItem('currentUser');
    showScreen('userTypeScreen');
}

function handleExitGame() {
    if (confirm('Tem certeza que deseja sair do jogo? Seu progresso ficará salvo.')) {
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
}

async function loadTeacherData() {
    if (!currentUser) return;
    document.getElementById('teacherName').textContent = currentUser.user_metadata.full_name || 'Professor(a)';
    document.getElementById('showAudioSettingsModalBtn').style.display = currentUser.id === SUPER_ADMIN_TEACHER_ID ? 'block' : 'none';
    await loadTeacherClasses();
}

async function loadTeacherClasses() {
    const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id);
    if (error) return showFeedback('Não foi possível carregar as turmas.', 'error');
    renderClasses(data);
}

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    if (!classes || classes.length === 0) {
        container.innerHTML = '<p>Nenhuma turma criada. Clique em "Criar Nova Turma".</p>';
        return;
    }
    container.innerHTML = classes.map(cls => {
        const studentCount = cls.students[0]?.count || 0;
        return `<div class="class-card">
                <h3>${cls.name}</h3>
                <span class="student-count">👥 ${studentCount} aluno(s)</span>
                <div class="class-card-actions">
                    <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button>
                    <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');
}

async function handleCreateClass(e) {
    e.preventDefault();
    const name = document.getElementById('className').value;
    if (!name) return;
    const { error } = await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]);
    if (error) return showFeedback(`Erro: ${error.message}`, 'error');
    closeModal('createClassModal');
    await loadTeacherClasses();
    showFeedback('Turma criada com sucesso!', 'success');
    e.target.reset();
}

async function handleDeleteClass(classId, className) {
    if (!confirm(`ATENÇÃO!\nExcluir a turma "${className}" apagará TODOS os alunos e seus progressos permanentemente. Deseja continuar?`)) return;
    showFeedback('Excluindo turma...', 'info');
    const { error } = await supabaseClient.from('classes').delete().eq('id', classId);
    if (error) return showFeedback(`Erro: ${error.message}`, 'error');
    showFeedback(`Turma "${className}" excluída!`, 'success');
    await loadTeacherClasses();
}

async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    showTab(document.querySelector('#manageClassModal .tab-btn[data-tab="studentsTab"]'));
    await loadClassStudents();
    await loadStudentProgress();
    showModal('manageClassModal');
}

async function loadClassStudents() {
    const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId).order('name');
    if (error) {
        document.getElementById('studentsList').innerHTML = '<p>Erro ao carregar alunos.</p>';
        return;
    }
    renderStudents(data);
}

function renderStudents(students) {
    const container = document.getElementById('studentsList');
    container.innerHTML = !students || students.length === 0
        ? '<p>Nenhum aluno cadastrado nesta turma.</p>'
        : students.map(s => `
            <div class="student-item">
                <span></span>                 <div class="student-info">
                    <h4>${s.name}</h4>
                    <p>Usuário: ${s.username}</p>
                </div>
                <div class="student-actions">
                    <button onclick="handleResetStudentPassword('${s.id}', '${s.name}')" class="btn small" title="Resetar Senha"><i class="fas fa-key"></i></button>
                    <button onclick="handleDeleteStudent('${s.id}', '${s.name}')" class="btn small danger" title="Excluir Aluno"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
}

async function loadStudentProgress() {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';

    const { data: students, error: studentsError } = await supabaseClient.from('students')
        .select('id, name, assigned_phase').eq('class_id', currentClassId);
    if (studentsError) return progressList.innerHTML = `<p class="error">Erro: ${studentsError.message}</p>`;

    const studentIds = students.map(s => s.id);
    const { data: progresses, error: progressError } = await supabaseClient.from('progress')
        .select('*').in('student_id', studentIds);
    if (progressError) return progressList.innerHTML = `<p class="error">Erro: ${progressError.message}</p>`;

    currentStudentData = students.map(student => {
        const progress = progresses.find(p => p.student_id === student.id) || {};
        const score = progress.game_state?.score ?? 0;
        const total = progress.game_state?.questions?.length || 10;
        return {
            ...student,
            progressData: progress,
            accuracy: total > 0 ? Math.round((score / total) * 100) : 0
        };
    });

    // Ordenação inicial por último acesso
    handleSortStudents({ currentTarget: document.querySelector('.sort-btn[data-sort="last_played"]') });
}

function renderStudentProgress(studentData) {
    const progressList = document.getElementById('studentProgressList');
    if (studentData.length === 0) {
        progressList.innerHTML = '<p>Nenhum aluno para exibir o progresso.</p>';
        return;
    }
    progressList.innerHTML = studentData.map(student => {
        const { progressData, accuracy } = student;
        const assignedPhase = student.assigned_phase || 1;
        const currentPhase = progressData.current_phase || 'N/A';
        const score = progressData.game_state?.score ?? 0;
        const total = progressData.game_state?.questions?.length || 10;
        
        const lastPlayed = progressData.last_played ? new Date(progressData.last_played) : null;
        const now = new Date();
        const diffDays = lastPlayed ? (now - lastPlayed) / (1000 * 60 * 60 * 24) : Infinity;
        
        let statusClass = 'inactive';
        if (diffDays <= 7) statusClass = 'active';
        let lastPlayedText = lastPlayed ? lastPlayed.toLocaleDateString('pt-BR') : 'Nunca jogou';

        const phaseOptions = [1, 2, 3, 4, 5].map(p => `<option value="${p}" ${assignedPhase === p ? 'selected' : ''}>Fase ${p}</option>`).join('');
        return `
            <div class="student-item">
                <i class="fas fa-circle student-status-icon ${statusClass}" title="${statusClass === 'active' ? 'Ativo na última semana' : 'Inativo há mais de uma semana'}"></i>
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p>Progresso Fase ${currentPhase}: ${accuracy}% (${score}/${total}) &bull; Último acesso: ${lastPlayedText}</p>
                    <div class="student-progress-container"><div class="student-progress-bar"><div class="student-progress-fill" style="width: ${accuracy}%;"></div></div></div>
                </div>
                <div class="student-actions">
                    <label class="select-label">Designar Fase:</label>
                    <select class="phase-select" onchange="assignPhase('${student.id}', this)">${phaseOptions}</select>
                </div>
            </div>`;
    }).join('');
}

function handleSortStudents(event) {
    const sortBy = event.currentTarget.dataset.sort;
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    currentStudentData.sort((a, b) => {
        switch(sortBy) {
            case 'name': return a.name.localeCompare(b.name);
            case 'progress': return b.accuracy - a.accuracy;
            case 'last_played':
            default:
                const dateA = a.progressData.last_played ? new Date(a.progressData.last_played) : new Date(0);
                const dateB = b.progressData.last_played ? new Date(b.progressData.last_played) : new Date(0);
                return dateB - dateA;
        }
    });
    renderStudentProgress(currentStudentData);
}

async function assignPhase(studentId, selectElement) {
    const newPhase = parseInt(selectElement.value);
    if (!confirm(`Designar a Fase ${newPhase} para este aluno?\nO progresso na fase atual será reiniciado.`)) {
        await loadStudentProgress(); // Recarrega para resetar o select
        return;
    }
    try {
        const { error: assignError } = await supabaseClient.from('students')
            .update({ assigned_phase: newPhase }).eq('id', studentId);
        if (assignError) throw assignError;

        const newGameState = {
            currentPhase: newPhase, score: 0, attempts: 2,
            questions: generateQuestions(newPhase), currentQuestionIndex: 0, tutorialsShown: []
        };
        const { error: progressError } = await supabaseClient.from('progress')
            .upsert({ student_id: studentId, current_phase: newPhase, game_state: newGameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' });
        if (progressError) throw progressError;

        showFeedback(`Nova fase designada com sucesso!`, 'success');
        await loadStudentProgress();
    } catch (error) {
        showFeedback(`Erro: ${error.message}`, 'error');
    }
}

async function handleCreateStudent(event) {
    event.preventDefault();
    await handleAuthAction(document.getElementById('createStudentSubmitBtn'), async () => {
        const username = document.getElementById('createStudentUsername').value.trim();
        const password = document.getElementById('createStudentPassword').value;
        if (!username || !password) throw new Error("Preencha o nome e a senha.");
        
        const hashedPassword = await hashPassword(password);
        const { error } = await supabaseClient.from('students').insert([
            { name: username, username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }
        ]);
        if (error) throw error;

        document.getElementById('newStudentUsername').textContent = username;
        document.getElementById('newStudentPassword').textContent = password;
        showModal('studentCreatedModal');
        hideCreateStudentForm();
        await loadClassStudents();
        await loadStudentProgress();
    });
}

async function handleDeleteStudent(studentId, studentName) {
    if (!confirm(`Excluir o aluno "${studentName}"? Todo o progresso será perdido.`)) return;
    const { error } = await supabaseClient.from('students').delete().eq('id', studentId);
    if (error) return showFeedback(`Erro: ${error.message}`, 'error');
    showFeedback(`Aluno "${studentName}" excluído.`, 'success');
    await loadClassStudents();
    await loadStudentProgress();
}

async function handleResetStudentPassword(studentId, studentName) {
    const newPassword = generateRandomPassword();
    if (!prompt(`A nova senha para "${studentName}" é:\n\n${newPassword}\n\nAnote e copie a senha, depois clique em OK para confirmar.`, newPassword)) return;
    try {
        const hashedPassword = await hashPassword(newPassword);
        const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId);
        if (error) throw error;
        showFeedback(`Senha de "${studentName}" alterada!`, 'success');
    } catch (error) {
        showFeedback(`Erro: ${error.message}`, 'error');
    }
}

function handleCopyCredentials() {
    const username = document.getElementById('newStudentUsername').textContent;
    const password = document.getElementById('newStudentPassword').textContent;
    const textToCopy = `Acesso ao Jogo das Letras:\nUsuário: ${username}\nSenha: ${password}`;
    navigator.clipboard.writeText(textToCopy)
        .then(() => showFeedback('Dados copiados!', 'success'))
        .catch(() => showFeedback('Erro ao copiar.', 'error'));
}

// =======================================================
// SEÇÃO DE ÁUDIO
// =======================================================
async function handleAudioUpload() {
    const files = document.getElementById('audioUpload').files;
    if (files.length === 0) return showFeedback('Nenhum arquivo selecionado.', 'error');
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Enviando...</p>`;
    
    const uploadPromises = Array.from(files).map(file => {
        const fileName = file.name.split('.').slice(0, -1).join('.').toUpperCase();
        const filePath = `${currentUser.id}/${fileName}.${file.name.split('.').pop()}`;
        return supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true });
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.length - successCount;

    uploadStatus.innerHTML = `<p style="color: green;">${successCount} áudios enviados!</p>`;
    if (errorCount > 0) uploadStatus.innerHTML += `<p style="color: red;">${errorCount} falharam.</p>`;
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm' };
        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];
        mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data));
        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: options.mimeType });
            document.getElementById('audioPlayback').src = URL.createObjectURL(audioBlob);
            document.getElementById('saveRecordingBtn').disabled = false;
            stream.getTracks().forEach(track => track.stop());
        });
        mediaRecorder.start();
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('recordStatus').textContent = 'Gravando...';
        startTimer();
    } catch (err) {
        alert("Permissão para microfone negada ou não encontrado.");
    }
}

function stopRecording() {
    if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
        stopTimer();
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('recordStatus').textContent = 'Gravação parada.';
    }
}

async function saveRecording() {
    if (audioChunks.length === 0) return showFeedback("Nenhum áudio para salvar.", "error");
    const saveButton = document.getElementById('saveRecordingBtn');
    await handleAuthAction(saveButton, async () => {
        const selectedItem = document.getElementById('letterSelect').value;
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const filePath = `${currentUser.id}/${selectedItem}.webm`;
        const { error } = await supabaseClient.storage.from('audio_uploads')
            .upload(filePath, audioBlob, { upsert: true });
        if (error) throw error;
        showFeedback(`Áudio para "${selectedItem}" salvo!`, 'success');
        audioChunks = [];
        document.getElementById('audioPlayback').src = '';
    });
}

function startTimer() {
    stopTimer();
    let seconds = 0;
    const timerEl = document.getElementById('recordTimer');
    timerEl.textContent = '00:00';
    timerInterval = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() { clearInterval(timerInterval); }

// =======================================================
// PARTE 7: LÓGICA DO JOGO
// =======================================================
async function showStudentGame() {
    await startGame();
}

async function startGame() {
    await loadGameState();
    showScreen('startScreen');
}

async function loadGameState() {
    const { data } = await supabaseClient.from('progress')
        .select('game_state, current_phase').eq('student_id', currentUser.id).single();

    const assignedPhase = currentUser.assigned_phase || 1;
    if (data && data.current_phase !== assignedPhase) {
        gameState = createNewGameState(assignedPhase);
    } else if (data?.game_state?.questions) {
        gameState = data.game_state;
    } else {
        gameState = createNewGameState(assignedPhase);
    }
    if (!gameState.tutorialsShown) gameState.tutorialsShown = [];
    await saveGameState();
}

function createNewGameState(phase) {
    return {
        currentPhase: phase, score: 0, attempts: 2,
        questions: generateQuestions(phase), currentQuestionIndex: 0,
        teacherId: currentUser.teacher_id, tutorialsShown: []
    };
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
    const count = 10;
    switch (phase) {
        case 1:
            const letters = [...ALPHABET].sort(() => 0.5 - Math.random());
            for (let i = 0; i < count; i++) {
                const correct = letters[i % letters.length];
                questions.push({ type: 'letter_sound', correctAnswer: correct, options: generateOptions(correct, ALPHABET, 4) });
            } break;
        case 2:
            const words2 = [...PHASE_2_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < count; i++) {
                const item = words2[i % words2.length];
                questions.push({ type: 'initial_vowel', ...item, correctAnswer: item.vowel, options: generateOptions(item.vowel, VOWELS, 4) });
            } break;
        case 3:
            const words3 = [...PHASE_3_ENCONTROS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < count; i++) {
                const item = words3[i % words3.length];
                questions.push({ type: 'vowel_encounter', ...item, correctAnswer: item.encontro, options: generateOptions(item.encontro, VOWEL_ENCOUNTERS, 4) });
            } break;
        case 4:
            const words4 = [...PHASE_4_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < count; i++) {
                const item = words4[i % words4.length];
                const options = [...item.options, item.word].sort(() => 0.5 - Math.random());
                questions.push({ type: 'full_word', ...item, correctAnswer: item.word, options });
            } break;
        case 5:
            const words5 = [...PHASE_5_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < count; i++) {
                const item = words5[i % words5.length];
                questions.push({ type: 'final_syllable', ...item, correctAnswer: item.syllable, options: generateOptions(item.syllable, ALL_END_SYLLABLES, 4) });
            } break;
        default: questions = generateQuestions(5); break;
    }
    return questions;
}

function generateOptions(correct, source, count) {
    const options = new Set([correct]);
    const available = source.filter(i => i !== correct);
    while (options.size < count && available.length > 0) {
        options.add(available.splice(Math.floor(Math.random() * available.length), 1)[0]);
    }
    return Array.from(options).sort(() => 0.5 - Math.random());
}

async function startQuestion() {
    if (gameState.phaseCompleted) {
        const accuracy = gameState.score / gameState.questions.length * 100;
        return showResultScreen(accuracy, true);
    }
    await showTutorial(gameState.currentPhase);
    if (gameState.currentQuestionIndex >= gameState.questions.length) return endPhase();
    const q = gameState.questions[gameState.currentQuestionIndex];
    document.getElementById('nextQuestion').style.display = 'none';
    updateUI();
    const renderers = {
        'letter_sound': renderPhase1UI, 'initial_vowel': renderPhase2UI,
        'vowel_encounter': renderPhase3UI, 'full_word': renderPhase4UI, 'final_syllable': renderPhase5UI
    };
    renderers[q.type](q);
    renderOptions(q.options);
    if (q.type === 'letter_sound') setTimeout(playCurrentAudio, 500);
}

function renderPhase1UI(q) {
    document.getElementById('audioQuestionArea').style.display = 'block';
    document.getElementById('imageQuestionArea').style.display = 'none';
    document.getElementById('questionText').textContent = 'Qual letra faz este som?';
    document.getElementById('repeatAudio').style.display = 'inline-block';
}

function renderPhase2UI(q) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = `__${q.word.substring(1)}`;
    document.getElementById('questionText').textContent = 'Qual vogal completa a palavra?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderPhase3UI(q) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = q.word.replace(q.correctAnswer, '__');
    document.getElementById('questionText').textContent = 'Qual encontro de vogais completa a palavra?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderPhase4UI(q) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    document.getElementById('wordDisplay').textContent = `?`;
    document.getElementById('questionText').textContent = 'Qual é o nome desta figura?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderPhase5UI(q) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = q.image;
    const visiblePart = q.word.slice(0, -q.correctAnswer.length);
    document.getElementById('wordDisplay').textContent = `${visiblePart}__`;
    document.getElementById('questionText').textContent = 'Qual sílaba termina esta palavra?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderOptions(options) {
    const grid = document.getElementById('lettersGrid');
    grid.innerHTML = options.map(opt => `<button class="letter-button">${opt}</button>`).join('');
    grid.querySelectorAll('.letter-button').forEach(btn => btn.addEventListener('click', (e) => selectAnswer(e.target.textContent)));
}

async function selectAnswer(selected) {
    const buttons = document.querySelectorAll('.letter-button');
    buttons.forEach(btn => btn.disabled = true);
    const q = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = selected === q.correctAnswer;

    buttons.forEach(btn => {
        if (btn.textContent === q.correctAnswer) btn.classList.add('correct');
        if (btn.textContent === selected && !isCorrect) btn.classList.add('incorrect');
    });

    if (isCorrect) {
        gameState.score++;
        showFeedback('Muito bem! Você acertou!', 'success');
        playTeacherAudio('feedback_correct', 'Acertou');
        if(q.type !== 'letter_sound') document.getElementById('wordDisplay').textContent = q.word;
    } else {
        gameState.attempts--;
        showFeedback(`Quase! A resposta certa era ${q.correctAnswer}`, 'error');
        playTeacherAudio('feedback_incorrect', 'Tente de novo');
    }

    await saveGameState();
    updateUI();
    
    if (gameState.attempts <= 0) setTimeout(endPhase, 1500);
    else setTimeout(() => document.getElementById('nextQuestion').style.display = 'block', 1500);
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    startQuestion();
}

function endPhase() {
    const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0;
    showResultScreen(accuracy, accuracy >= 70);
}

function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;
    
    document.getElementById('resultTitle').textContent = passed ? 'Parabéns!' : 'Não desanime!';
    document.getElementById('resultMessage').innerHTML = passed
        ? 'Você completou a atividade! 🏆<br>Fale com seu professor(a) para uma nova tarefa!'
        : 'Você precisa acertar mais para passar. Tente novamente!';
    document.getElementById('continueButton').style.display = 'none';
    document.getElementById('retryButton').style.display = passed ? 'none' : 'inline-block';
    document.getElementById('restartButton').innerHTML = `<i class="fas fa-${passed ? 'sign-out-alt' : 'home'}"></i> ${passed ? 'Sair' : 'Voltar ao Início'}`;
    
    gameState.phaseCompleted = passed; 
    saveGameState(); 
}

async function nextPhase() {
    // Esta função pode ser descontinuada ou alterada, pois o professor agora designa as fases
}

async function retryPhase() {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.attempts = 2;
    gameState.phaseCompleted = false; 
    await saveGameState();
    showScreen('gameScreen');
    startQuestion();
}

async function restartGame() {
    if (gameState.phaseCompleted) logout();
    else showScreen('startScreen');
}

async function playTeacherAudio(key, fallbackText, onEndCallback) {
    const teacherId = SUPER_ADMIN_TEACHER_ID; 
    try {
        const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` });
        if (data?.length > 0) {
            const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${data[0].name}`);
            const audio = new Audio(publicUrl);
            if (onEndCallback) audio.onended = onEndCallback;
            audio.play();
        } else speak(fallbackText, onEndCallback);
    } catch (error) {
        speak(fallbackText, onEndCallback);
    }
}

async function playCurrentAudio() {
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (q.type === 'letter_sound') playTeacherAudio(q.correctAnswer, q.correctAnswer);
}

// =======================================================
// PARTE 8: UI E VOZ
// =======================================================
function initializeSpeech() {
    function loadVoices() {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            selectedVoice = voices.find(v => v.lang === 'pt-BR');
            speechReady = true;
        }
    }
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
}

function speak(text, onEndCallback) {
    if (!window.speechSynthesis || !speechReady) {
        if (onEndCallback) setTimeout(onEndCallback, 1000);
        return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    if (selectedVoice) utterance.voice = selectedVoice;
    if (onEndCallback) utterance.onend = onEndCallback;
    speechSynthesis.speak(utterance);
}

function showScreen(screenId) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    document.getElementById(screenId)?.classList.add('active'); 
}

function showModal(modalId) { document.getElementById(modalId)?.classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() { 
    document.getElementById('createStudentForm').style.display = 'none'; 
    document.getElementById('createStudentFormElement').reset(); 
}

function showAudioSettingsModal() {
    const select = document.getElementById('letterSelect');
    let options = '<optgroup label="Instruções e Feedbacks">';
    for (const key in CUSTOM_AUDIO_KEYS) {
        options += `<option value="${key}">${CUSTOM_AUDIO_KEYS[key]}</option>`;
    }
    options += '</optgroup><optgroup label="Letras do Alfabeto">';
    options += ALPHABET.map(l => `<option value="${l}">Letra ${l}</option>`).join('');
    options += '</optgroup>';
    select.innerHTML = options;
    showModal('audioSettingsModal');
}

function showTab(clickedButton) {
    const parent = clickedButton.closest('.modal-content');
    parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    parent.querySelector('#' + clickedButton.dataset.tab).classList.add('active');
}

function showFeedback(message, type = 'info') {
    const el = document.getElementById('globalFeedback');
    el.querySelector('.feedback-text').textContent = message;
    el.className = `show ${type}`;
    setTimeout(() => el.className = el.className.replace('show', ''), 3000);
}

function updateUI() {
    if(document.getElementById('gameScreen').classList.contains('active') && gameState.questions?.length > 0) {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('totalQuestions').textContent = gameState.questions.length;
        document.getElementById('attempts').textContent = `${gameState.attempts} tentativa(s)`;
        document.getElementById('currentPhase').textContent = gameState.currentPhase;
        const progress = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }
}

async function showTutorial(phase) {
    if (gameState.tutorialsShown.includes(phase)) return;
    const instruction = gameInstructions[phase];
    if (!instruction) return;
    document.getElementById('tutorialText').textContent = instruction;
    document.getElementById('tutorialOverlay').classList.add('show');
    playTeacherAudio(`instruction_${phase}`, instruction);
    gameState.tutorialsShown.push(phase);
    await saveGameState();
}

function hideTutorial() {
    document.getElementById('tutorialOverlay').classList.remove('show');
}

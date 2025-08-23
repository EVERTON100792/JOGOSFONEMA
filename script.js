// =======================================================
// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
// =======================================================
const { createClient } = supabase;
// Substitua pelas suas chaves do Supabase
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Chave do professor que tem permissão para gerenciar os áudios do jogo
const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6';

let currentUser = null;
let currentClassId = null;
let studentProgressData = [];
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
    { word: 'ABELHA', image: '🐝', vowel: 'A' },
    { word: 'ELEFANTE', image: '🐘', vowel: 'E' },
    { word: 'IGREJA', image: '⛪', vowel: 'I' },
    { word: 'ÔNIBUS', image: '🚌', vowel: 'O' },
    { word: 'UVA', image: '🍇', vowel: 'U' },
    { word: 'AVIÃO', image: '✈️', vowel: 'A' },
    { word: 'ESTRELA', image: '⭐', vowel: 'E' },
    { word: 'ÍNDIO', image: '🏹', vowel: 'I' },
    { word: 'OVO', image: '🥚', vowel: 'O' },
    { word: 'URSO', image: '🐻', vowel: 'U' }
];

const PHASE_3_ENCONTROS = [
    { word: 'PEIXE', image: '🐠', encontro: 'EI' },
    { word: 'BOI', image: '🐂', encontro: 'OI' },
    { word: 'CAIXA', image: '📦', encontro: 'AI' },
    { word: 'PAI', image: '👨‍👧', encontro: 'AI' },
    { word: 'CÉU', image: '🌌', encontro: 'EU' },
    { word: 'LUA', image: '🌙', encontro: 'UA' },
    { word: 'LEÃO', image: '🦁', encontro: 'ÃO' },
    { word: 'MÃE', image: '👩‍👦', encontro: 'ÃE' },
    { word: 'PÃO', image: '🍞', encontro: 'ÃO' },
    { word: 'CHAPÉU', image: '🤠', encontro: 'ÉU' }
];
const VOWEL_ENCOUNTERS = ['AI', 'EI', 'OI', 'UI', 'AU', 'EU', 'ÃO', 'ÃE', 'UA', 'ÉU'];

const PHASE_4_WORDS = [
    { word: 'BOLA', image: '⚽', options: ['BOLO', 'BALA', 'BULA'] },
    { word: 'CASA', image: '🏠', options: ['COPO', 'COLA', 'CAJU'] },
    { word: 'DADO', image: '🎲', options: ['DEDO', 'DIA', 'DOCE'] },
    { word: 'GATO', image: '🐈', options: ['GALO', 'GELO', 'GOTA'] },
    { word: 'MACACO', image: '🐒', options: ['MALA', 'MAPA', 'MEIA'] },
    { word: 'SAPO', image: '🐸', options: ['SAPATO', 'SOFÁ', 'SUCO'] },
    { word: 'UVA', image: '🍇', options: ['UNHA', 'URUBU', 'UM'] },
    { word: 'SOL', image: '☀️', options: ['SAL', 'SETE', 'SAPO'] },
    { word: 'LUA', image: '🌙', options: ['LAMA', 'LATA', 'LEÃO'] },
    { word: 'PATO', image: '🦆', options: ['PÉ', 'POTE', 'PIPA'] }
];

const PHASE_5_WORDS = [
    { word: 'BOLO', image: '🎂', syllable: 'LO' },
    { word: 'CASA', image: '🏠', syllable: 'SA' },
    { word: 'DADO', image: '🎲', syllable: 'DO' },
    { word: 'FACA', image: '🔪', syllable: 'CA' },
    { word: 'GATO', image: '🐈', syllable: 'TO' },
    { word: 'MACACO', image: '🐒', syllable: 'CO' },
    { word: 'PATO', image: '🦆', syllable: 'TO' },
    { word: 'SAPO', image: '🐸', syllable: 'PO' },
    { word: 'VACA', image: '🐄', syllable: 'CA' },
    { word: 'JANELA', image: '🖼️', syllable: 'LA' }
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
    if (!error || !error.message) {
        return 'Ocorreu um erro inesperado. Por favor, tente mais tarde.';
    }
    const message = error.message.toLowerCase();
    if (message.includes('duplicate key') && (message.includes('username') || message.includes('name'))) {
        return 'Este nome de usuário já existe. Por favor, escolha outro.';
    }
    if (message.includes('invalid login credentials')) {
        return 'Usuário ou senha inválidos. Verifique os dados e tente novamente.';
    }
    if (message.includes('to be a valid email')) {
        return 'Por favor, insira um e-mail válido.';
    }
    if (message.includes('password should be at least 6 characters')) {
        return 'A senha precisa ter no mínimo 6 caracteres.';
    }
    console.error("Erro não tratado:", error);
    return `Ocorreu um erro inesperado: ${error.message}`;
}


// =======================================================
// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
// =======================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    if (!window.supabase) {
        alert("ERRO CRÍTICO: O sistema de banco de dados (Supabase) não carregou. Verifique sua conexão com a internet.");
        return;
    }
    
    initializeSpeech();
    setupAllEventListeners();

    const studentSession = sessionStorage.getItem('currentUser');
    if (studentSession) {
        console.log("Sessão de aluno encontrada. Restaurando jogo...");
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
    } else if (gameState.currentQuestionIndex > 0) {
        // Se o aluno parou no meio da fase, ele vai direto para o jogo
        showScreen('gameScreen');
        startQuestion();
    } else {
        // Se ele está no começo da fase, vai para a tela de start
        showScreen('startScreen');
    }
}


function setupAllEventListeners() {
    // Navegação entre telas
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        if (type === 'teacher') showScreen('teacherLoginScreen');
        else if (type === 'student') showScreen('studentLoginScreen');
    }));

    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const targetScreen = e.currentTarget.getAttribute('data-target');
        showScreen(targetScreen);
    }));

    document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen'));
    document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen'));
    
    // Formulários de Autenticação
    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // Dashboard do Professor
    document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal'));
    document.getElementById('showAudioSettingsModalBtn').addEventListener('click', showAudioSettingsModal);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('showCreateStudentFormBtn').addEventListener('click', showCreateStudentForm);
    document.getElementById('hideCreateStudentFormBtn').addEventListener('click', hideCreateStudentForm);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    document.getElementById('generatePasswordBtn')?.addEventListener('click', () => {
        const passwordField = document.getElementById('createStudentPassword');
        passwordField.type = 'text';
        passwordField.value = generateRandomPassword();
        setTimeout(() => { passwordField.type = 'password'; }, 2000);
    });

    // Jogo do Aluno
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
    
    // Modais e Abas
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')));
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showTab(e.currentTarget));
    });

    // Configurações de Áudio
    document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload);
    document.getElementById('recordBtn')?.addEventListener('click', startRecording);
    document.getElementById('stopBtn')?.addEventListener('click', stopRecording);
    document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording);
    
    // Tutorial
    document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial);
    document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials);
    
    // Toggle de Senha
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggle.classList.toggle('fa-eye-slash');
        });
    });

    // Botões de ordenação
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sortBy = e.currentTarget.dataset.sort;
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderStudentProgress(sortBy);
        });
    });
}


// =======================================================
// PARTE 5: AUTENTICAÇÃO E SESSÃO
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
        showScreen('userTypeScreen');
    }
}

async function handleTeacherLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

    const email = document.getElementById('teacherEmail').value;
    const password = document.getElementById('teacherPassword').value;
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        await showTeacherDashboard();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(formatErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

async function handleTeacherRegister(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

    const name = document.getElementById('teacherRegName').value;
    const email = document.getElementById('teacherRegEmail').value;
    const password = document.getElementById('teacherRegPassword').value;
    try {
        const { error } = await supabaseClient.auth.signUp({
            email, password, options: { data: { full_name: name, role: 'teacher' } }
        });
        if (error) throw error;
        showFeedback('Cadastro realizado! Um link de confirmação foi enviado para o seu e-mail.', 'success');
        showScreen('teacherLoginScreen');
    } catch (error) {
        showFeedback(formatErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

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
            .select('*, assigned_phase')
            .eq('username', username)
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

        showFeedback('Login realizado com sucesso!', 'success');
        await restoreOrStartGame();
        
    } catch (error) {
        showFeedback(formatErrorMessage(new Error('Usuário ou senha inválidos.')), 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentClassId = null;
    sessionStorage.removeItem('currentUser');
    // Recarrega a página para limpar qualquer estado do jogo
    window.location.reload();
}

function handleExitGame() {
    if (confirm('Tem certeza que deseja sair do jogo? Seu progresso ficará salvo.')) {
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        window.location.reload();
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
    
    const audioSettingsButton = document.getElementById('showAudioSettingsModalBtn');
    
    if (currentUser.id === SUPER_ADMIN_TEACHER_ID) {
        audioSettingsButton.style.display = 'block';
    } else {
        audioSettingsButton.style.display = 'none';
    }

    await loadTeacherClasses();
}

async function loadTeacherClasses() {
    const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id);
    if (error) {
        console.error('Erro ao carregar turmas:', error);
        showFeedback('Não foi possível carregar as turmas.', 'error');
        return;
    }
    renderClasses(data);
}

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    if (!classes || classes.length === 0) {
        container.innerHTML = '<p>Nenhuma turma criada ainda. Clique em "Criar Nova Turma" para começar.</p>';
        return;
    }
    container.innerHTML = classes.map(cls => {
        const studentCount = cls.students[0]?.count || 0;
        return `
            <div class="class-card">
                <h3>${cls.name}</h3>
                <span class="student-count">👥 ${studentCount} aluno(s)</span>
                <div class="class-card-actions">
                    <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button>
                    <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma" aria-label="Excluir Turma ${cls.name}">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>`;
    }).join('');
}

async function handleCreateClass(e) {
    e.preventDefault();
    const name = document.getElementById('className').value;
    if (!name) return;
    const { error } = await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]);
    if (error) {
        showFeedback(`Erro ao criar turma: ${error.message}`, 'error');
        return;
    }
    closeModal('createClassModal');
    await loadTeacherClasses();
    showFeedback('Turma criada com sucesso!', 'success');
    document.getElementById('createClassForm').reset();
}

async function handleDeleteClass(classId, className) {
    if (!confirm(`ATENÇÃO!\n\nTem certeza que deseja excluir a turma "${className}"?\n\nTODOS os alunos e seus progressos serão apagados permanentemente. Esta ação não pode ser desfeita.`)) return;
    showFeedback('Excluindo turma, por favor aguarde...', 'info');
    const { error } = await supabaseClient.from('classes').delete().eq('id', classId);
    if (error) {
        showFeedback(`Erro ao excluir turma: ${error.message}`, 'error');
    } else {
        showFeedback(`Turma "${className}" excluída com sucesso!`, 'success');
        await loadTeacherClasses();
    }
}

async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    showTab(document.querySelector('#manageClassModal .tab-btn[data-tab="studentsTab"]'));
    await loadClassStudents();
    await loadStudentProgress();
    await loadErrorReports(); // Carrega os relatórios de erros
    showModal('manageClassModal');
}

async function loadClassStudents() {
    const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId).order('name', { ascending: true });
    if (error) {
        console.error('Erro ao carregar alunos:', error);
        document.getElementById('studentsList').innerHTML = '<p>Erro ao carregar alunos.</p>';
        return;
    }
    renderStudents(data);
}

function renderStudents(students) {
    const container = document.getElementById('studentsList');
    if (!students || students.length === 0) {
        container.innerHTML = '<p>Nenhum aluno cadastrado nesta turma.</p>';
        return;
    }
    container.innerHTML = students.map(student => `
        <div class="student-item">
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Usuário: ${student.username}</p>
            </div>
            <div class="student-actions">
                <button onclick="handleResetStudentPassword('${student.id}', '${student.name}')" class="btn small" title="Resetar Senha" aria-label="Resetar senha do aluno ${student.name}">
                    <i class="fas fa-key" aria-hidden="true"></i>
                </button>
                <button onclick="handleDeleteStudent('${student.id}', '${student.name}')" class="btn small danger" title="Excluir Aluno" aria-label="Excluir aluno ${student.name}">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        </div>`).join('');
}

async function loadStudentProgress() {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando progresso...</p>';

    const { data, error } = await supabaseClient
        .from('students')
        .select(`
            id,
            name,
            assigned_phase,
            progress (
                current_phase,
                game_state,
                last_played
            )
        `)
        .eq('class_id', currentClassId);

    if (error) {
        progressList.innerHTML = `<p style="color:red;">Erro ao carregar progresso: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        progressList.innerHTML = '<p>Nenhum aluno nesta turma para exibir o progresso.</p>';
        return;
    }
    
    studentProgressData = data;
    renderStudentProgress('last_played');
    document.querySelector('.sort-btn[data-sort="last_played"]').classList.add('active');
    document.querySelector('.sort-btn[data-sort="name"]').classList.remove('active');
}

function renderStudentProgress(sortBy = 'last_played') {
    const progressList = document.getElementById('studentProgressList');

    const sortedData = [...studentProgressData].sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        }
        if (sortBy === 'last_played') {
            const dateA = a.progress[0]?.last_played ? new Date(a.progress[0].last_played) : new Date(0);
            const dateB = b.progress[0]?.last_played ? new Date(b.progress[0].last_played) : new Date(0);
            return dateB - dateA;
        }
        return 0;
    });

    let html = sortedData.map(student => {
        const progress = student.progress[0] || {};
        const assignedPhase = student.assigned_phase || 1;
        
        // Se o aluno nunca jogou, a fase atual é a designada, senão é a que está no progresso
        const currentPhase = progress.current_phase || assignedPhase;
        
        const score = progress.game_state?.score ?? 0;
        const total = progress.game_state?.questions?.length || 10;
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        const phaseCompleted = progress.game_state?.phaseCompleted || false;

        let lastPlayedStr = 'Nunca jogou';
        let statusClass = 'inactive';
        if (progress.last_played) {
            const lastPlayedDate = new Date(progress.last_played);
            lastPlayedStr = lastPlayedDate.toLocaleDateString('pt-BR');
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (lastPlayedDate > sevenDaysAgo) {
                statusClass = 'active';
            }
        }
        const statusIcon = statusClass === 'active' ? '🟢' : '🔴';

        const phaseOptions = [1, 2, 3, 4, 5].map(phaseNum =>
            `<option value="${phaseNum}" ${assignedPhase === phaseNum ? 'selected' : ''}>
                Fase ${phaseNum}
            </option>`
        ).join('');

        return `
            <div class="student-item">
                <div class="student-info" style="flex-grow: 1;">
                    <h4>${student.name} <span class="status-indicator ${statusClass}" title="${statusClass === 'active' ? 'Ativo nos últimos 7 dias' : 'Inativo'}">${statusIcon}</span></h4>
                    <p>Último Acesso: ${lastPlayedStr}</p>
                    <p>Progresso na Fase ${currentPhase}: <strong>${phaseCompleted ? '🏆 Concluída' : `${accuracy}% (${score}/${total})`}</strong></p>
                    <div class="student-progress-container">
                        <div class="student-progress-bar">
                            <div class="student-progress-fill" style="width: ${accuracy}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="student-actions">
                    <label for="phase-select-${student.id}" class="select-label">Designar Fase:</label>
                    <select id="phase-select-${student.id}" class="phase-select" onchange="assignPhase('${student.id}', this)">
                        ${phaseOptions}
                    </select>
                </div>
            </div>`;
    }).join('');

    progressList.innerHTML = html || '<p>Nenhum aluno para exibir.</p>';
}


async function assignPhase(studentId, selectElement) {
    const newPhase = parseInt(selectElement.value);
    const studentName = selectElement.closest('.student-item').querySelector('h4').textContent.split(' ')[0];

    if (!confirm(`Deseja designar a Fase ${newPhase} para o aluno ${studentName}?\n\nAtenção: O progresso na fase atual será reiniciado para que ele comece a nova atividade do zero.`)) {
        await loadStudentProgress(); // Recarrega para reverter a mudança no select
        return;
    }

    try {
        const { error: assignError } = await supabaseClient
            .from('students')
            .update({ assigned_phase: newPhase })
            .eq('id', studentId);
        if (assignError) throw assignError;

        // Cria um novo estado de jogo limpo para a nova fase
        const newGameState = {
            currentPhase: newPhase,
            score: 0,
            attempts: 2,
            questions: generateQuestions(newPhase),
            currentQuestionIndex: 0,
            tutorialsShown: [],
            phaseCompleted: false, // Garante que a nova fase não comece como completa
            teacherId: currentUser.id
        };

        const { error: progressError } = await supabaseClient
            .from('progress')
            .upsert({ 
                student_id: studentId,
                current_phase: newPhase,
                game_state: newGameState,
                last_played: new Date().toISOString()
            }, { onConflict: 'student_id' });
        if (progressError) throw progressError;

        showFeedback(`Fase ${newPhase} designada para ${studentName} com sucesso!`, 'success');
        await loadStudentProgress();
    } catch (error) {
        showFeedback(`Erro ao designar fase: ${error.message}`, 'error');
    }
}


async function handleCreateStudent(event) {
    event.preventDefault();
    const username = document.getElementById('createStudentUsername').value.trim();
    const password = document.getElementById('createStudentPassword').value;
    const submitButton = document.getElementById('createStudentSubmitBtn');

    if (!username || !password) {
        return showFeedback("Por favor, preencha o nome e a senha do aluno.", "error");
    }
    if (!currentClassId || !currentUser?.id) {
        return showFeedback("Erro de sessão. Por favor, feche e abra o gerenciador de turmas.", "error");
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

    try {
        const hashedPassword = await hashPassword(password);
        const { error } = await supabaseClient.from('students').insert([
            { name: username, username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }
        ]);

        if (error) throw error;

        document.getElementById('newStudentUsername').textContent = username;
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


async function handleDeleteStudent(studentId, studentName) {
    if (!confirm(`Tem certeza que deseja excluir o aluno "${studentName}"?\n\nTodo o progresso dele será apagado permanentemente.`)) return;
    
    const { error } = await supabaseClient.from('students').delete().eq('id', studentId);
    
    if (error) {
        showFeedback(`Erro ao excluir aluno: ${error.message}`, 'error');
    } else {
        showFeedback(`Aluno "${studentName}" excluído com sucesso.`, 'success');
        await loadClassStudents();
        await loadStudentProgress();
    }
}

async function handleResetStudentPassword(studentId, studentName) {
    const newPassword = generateRandomPassword();
    const confirmed = prompt(`A nova senha para "${studentName}" é:\n\n${newPassword}\n\nAnote-a e entregue ao aluno. Copie a senha e clique em OK para confirmar a alteração.`, newPassword);

    if (!confirmed) return;

    try {
        const hashedPassword = await hashPassword(newPassword);
        const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId);
        if (error) throw error;
        showFeedback(`Senha de "${studentName}" alterada com sucesso!`, 'success');
    } catch (error) {
        showFeedback(`Erro ao resetar senha: ${error.message}`, 'error');
    }
}

function handleCopyCredentials() {
    const username = document.getElementById('newStudentUsername').textContent;
    const password = document.getElementById('newStudentPassword').textContent;
    const textToCopy = `Dados de acesso ao Jogo das Letras:\nUsuário: ${username}\nSenha: ${password}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showFeedback('Dados copiados para a área de transferência!', 'success');
    }).catch(() => {
        showFeedback('Erro ao copiar. Por favor, anote manually.', 'error');
    });
}


// =======================================================
// SEÇÃO DE GRAVAÇÃO DE ÁUDIO
// =======================================================
async function handleAudioUpload() {
    const files = document.getElementById('audioUpload').files;
    if (files.length === 0) return showFeedback('Nenhum arquivo selecionado.', 'error');
    
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Enviando ${files.length} arquivo(s)...</p>`;
    
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
        // Usa o ID do super admin para centralizar os áudios
        const teacherId = SUPER_ADMIN_TEACHER_ID;
        const fileName = file.name.split('.').slice(0, -1).join('.'); // Mantém a chave como está (ex: 'A' ou 'instruction_1')
        const filePath = `${teacherId}/${fileName}.${file.name.split('.').pop()}`;
        
        try {
            const { error } = await supabaseClient.storage
                .from('audio_uploads')
                .upload(filePath, file, { upsert: true });
            if (error) throw error;
            successCount++;
        } catch (error) {
            console.error(`Erro ao enviar ${file.name}:`, error);
            errorCount++;
        }
    }
    
    uploadStatus.innerHTML = `<p style="color: green;">${successCount} áudios enviados com sucesso!</p>`;
    if (errorCount > 0) {
        uploadStatus.innerHTML += `<p style="color: red;">Falha ao enviar ${errorCount} áudios.</p>`;
    }
}

async function startRecording() {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusEl = document.getElementById('recordStatus');

    recordBtn.disabled = true;
    statusEl.textContent = 'Pedindo permissão para o microfone...';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const options = { mimeType: 'audio/webm; codecs=opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                alert("Seu navegador não suporta a gravação de áudio. Tente usar Chrome ou Firefox.");
                statusEl.textContent = 'Gravação não suportada.';
                recordBtn.disabled = false;
                return;
            }
        }

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: options.mimeType });
            const audioUrl = URL.createObjectURL(audioBlob);
            document.getElementById('audioPlayback').src = audioUrl;
            document.getElementById('saveRecordingBtn').disabled = false;
            
            stream.getTracks().forEach(track => track.stop());
        });

        mediaRecorder.start();
        statusEl.textContent = 'Gravando...';
        stopBtn.disabled = false;
        startTimer();

    } catch (err) {
        console.error("Erro ao iniciar gravação:", err);
        alert("Não foi possível iniciar a gravação. Por favor, verifique se você permitiu o acesso ao microfone no seu navegador.");
        statusEl.textContent = 'Falha ao iniciar. Verifique as permissões.';
        recordBtn.disabled = false;
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        stopTimer();
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('recordStatus').textContent = 'Gravação parada. Ouça e salve.';
    }
}

async function saveRecording() {
    if (audioChunks.length === 0) {
        return showFeedback("Nenhum áudio gravado para salvar.", "error");
    }
    const saveButton = document.getElementById('saveRecordingBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    const selectedItem = document.getElementById('letterSelect').value;
    const mimeType = mediaRecorder.mimeType || 'audio/webm';
    const fileExtension = mimeType.split('/')[1].split(';')[0];

    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const fileName = `${selectedItem}.${fileExtension}`;
    const teacherId = SUPER_ADMIN_TEACHER_ID;
    const filePath = `${teacherId}/${fileName}`;

    try {
        const { error } = await supabaseClient.storage
            .from('audio_uploads')
            .upload(filePath, audioBlob, {
                cacheControl: '3600',
                upsert: true,
            });
        if (error) throw error;
        
        showFeedback(`Áudio para "${selectedItem}" salvo com sucesso!`, 'success');
        
        audioChunks = [];
        document.getElementById('audioPlayback').src = '';
        document.getElementById('recordStatus').textContent = 'Pronto para gravar outro item.';

    } catch (error) {
        showFeedback(`Erro ao salvar gravação: ${error.message}`, 'error');
        console.error("Erro no upload para o Supabase:", error);
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar Gravação';
    }
}

function startTimer() {
    stopTimer();
    let seconds = 0;
    const timerEl = document.getElementById('recordTimer');
    timerEl.textContent = '00:00';
    
    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}


// =======================================================
// PARTE 7: LÓGICA DO JOGO
// =======================================================
async function loadGameState() {
    const { data: progressData, error } = await supabaseClient
        .from('progress')
        .select('game_state, current_phase')
        .eq('student_id', currentUser.id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // Ignora erro "no rows found"
        console.error("Erro ao carregar progresso:", error);
    }

    const assignedPhase = currentUser.assigned_phase || 1;
    const savedPhaseState = progressData?.game_state;

    // Se a fase designada pelo professor for diferente da salva, reinicia para a nova fase
    if (savedPhaseState && savedPhaseState.currentPhase !== assignedPhase) {
        console.log(`Nova fase designada (${assignedPhase}). Reiniciando progresso.`);
        gameState = createNewGameState(assignedPhase);
        await saveGameState();
        return;
    }

    // Se existe um estado de jogo salvo, usa ele
    if (savedPhaseState && savedPhaseState.questions) {
        console.log("Restaurando estado do jogo salvo.");
        gameState = savedPhaseState;
    } else {
        // Senão, cria um novo estado para a fase designada
        console.log("Nenhum estado de jogo salvo. Criando um novo.");
        gameState = createNewGameState(assignedPhase);
        await saveGameState();
    }
}

function createNewGameState(phase) {
    return {
        currentPhase: phase,
        score: 0,
        attempts: 2,
        questions: generateQuestions(phase),
        currentQuestionIndex: 0,
        tutorialsShown: [],
        phaseCompleted: false,
        teacherId: currentUser.teacher_id
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
            const words_p3 = [...PHASE_3_ENCONTROS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < questionCount; i++) {
                const item = words_p3[i % words_p3.length];
                questions.push({ type: 'vowel_encounter', word: item.word, image: item.image, correctAnswer: item.encontro, options: generateOptions(item.encontro, VOWEL_ENCOUNTERS, 4) });
            }
            break;
        case 4:
            const words_p4 = [...PHASE_4_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < questionCount; i++) {
                const item = words_p4[i % words_p4.length];
                const options = [...item.options, item.word].sort(() => 0.5 - Math.random());
                questions.push({ type: 'full_word', image: item.image, correctAnswer: item.word, options: options });
            }
            break;
        case 5:
            const words_p5 = [...PHASE_5_WORDS].sort(() => 0.5 - Math.random());
            for (let i = 0; i < questionCount; i++) {
                const item = words_p5[i % words_p5.length];
                questions.push({ type: 'final_syllable', word: item.word, image: item.image, correctAnswer: item.syllable, options: generateOptions(item.syllable, ALL_END_SYLLABLES, 4) });
            }
            break;
        default:
            questions = generateQuestions(1);
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
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    document.getElementById('nextQuestion').style.display = 'none';
    updateUI();

    switch(currentQuestion.type) {
        case 'letter_sound': renderPhase1UI(currentQuestion); break;
        case 'initial_vowel': renderPhase2UI(currentQuestion); break;
        case 'vowel_encounter': renderPhase3UI(currentQuestion); break;
        case 'full_word': renderPhase4UI(currentQuestion); break;
        case 'final_syllable': renderPhase5UI(currentQuestion); break;
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
    document.getElementById('wordDisplay').textContent = question.word.replace(question.correctAnswer, '__');
    document.getElementById('questionText').textContent = 'Qual encontro de vogais completa a palavra?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderPhase4UI(question) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = question.image;
    document.getElementById('wordDisplay').textContent = `?`;
    document.getElementById('questionText').textContent = 'Qual é o nome desta figura?';
    document.getElementById('repeatAudio').style.display = 'none';
}

function renderPhase5UI(question) {
    document.getElementById('audioQuestionArea').style.display = 'none';
    document.getElementById('imageQuestionArea').style.display = 'block';
    document.getElementById('imageEmoji').textContent = question.image;
    const visiblePart = question.word.slice(0, -question.correctAnswer.length);
    document.getElementById('wordDisplay').textContent = `${visiblePart}__`;
    document.getElementById('questionText').textContent = 'Qual sílaba termina esta palavra?';
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
        playTeacherAudio('feedback_correct', 'Acertou');
        if(currentQuestion.type !== 'letter_sound') {
            document.getElementById('wordDisplay').textContent = currentQuestion.word;
        }
    } else {
        gameState.attempts--;
        
        logStudentError({
            question: currentQuestion,
            selectedAnswer: selectedAnswer
        }).catch(console.error);

        showFeedback(`Quase! A resposta correta era ${currentQuestion.correctAnswer}`, 'error');
        playTeacherAudio('feedback_incorrect', 'Tente de novo');
    }

    await saveGameState();
    updateUI();
    
    if(gameState.attempts <= 0) {
        setTimeout(endPhase, 2000);
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

    // Se o aluno não passou e ficou sem tentativas, a fase não é marcada como completa
    if (gameState.attempts <= 0 && !passed) {
        gameState.phaseCompleted = false;
    } else if (passed) {
        gameState.phaseCompleted = true;
    }
    
    saveGameState();
    showResultScreen(accuracy, passed);
}

function showResultScreen(accuracy, passed) {
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;
    
    const continueButton = document.getElementById('continueButton');
    const retryButton = document.getElementById('retryButton');
    const resultMessage = document.getElementById('resultMessage');
    const restartButton = document.getElementById('restartButton');
    
    if (passed) {
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        resultMessage.innerHTML = 'Você completou a atividade designada! 🏆<br>Fale com seu professor(a) para receber uma nova tarefa!';
        continueButton.style.display = 'none';
        retryButton.style.display = 'none';
        restartButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
        
        gameState.phaseCompleted = true;
        saveGameState();

    } else {
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        resultMessage.textContent = 'Você precisa acertar mais para passar. Tente novamente!';
        continueButton.style.display = 'none';
        retryButton.style.display = 'inline-block';
        restartButton.innerHTML = '<i class="fas fa-home"></i> Voltar ao Início';
        
        gameState.phaseCompleted = false;
        saveGameState();
    }
}


async function nextPhase() {
    // Esta função não é mais usada para avançar automaticamente.
    // O professor deve designar a próxima fase.
    // Mantida por segurança, mas o botão está oculto.
    showFeedback("Fale com seu professor para ir para a próxima fase!", "info");
}

async function retryPhase() {
    // Reseta o estado do jogo para a mesma fase
    gameState = createNewGameState(gameState.currentPhase);
    await saveGameState();
    showScreen('gameScreen');
    startQuestion();
}

async function restartGame() {
    if (gameState.phaseCompleted) {
        logout(); // Se completou, o botão vira "Sair"
    } else {
        // Se não completou, volta para a tela inicial da fase
        showScreen('startScreen');
    }
}

async function playTeacherAudio(key, fallbackText, onEndCallback) {
    const teacherId = SUPER_ADMIN_TEACHER_ID;

    try {
        const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` });

        if (data && data.length > 0) {
            const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${data[0].name}`);
            const audio = new Audio(publicUrl);
            if (onEndCallback) audio.onended = onEndCallback;
            audio.play().catch(e => {
                console.warn("Reprodução automática de áudio bloqueada, usando fallback.", e);
                speak(fallbackText, onEndCallback);
            });
        } else {
            speak(fallbackText, onEndCallback);
        }
    } catch (error) {
        console.error("Erro ao buscar áudio personalizado:", error);
        speak(fallbackText, onEndCallback);
    }
}


async function playCurrentAudio() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (currentQuestion.type !== 'letter_sound') return;
    const letter = currentQuestion.correctAnswer;
    playTeacherAudio(letter, letter);
}

// =======================================================
// PARTE 8: SISTEMA DE VOZ E UI (INTERFACE DO USUÁRIO)
// =======================================================

function initializeSpeech() {
    function loadVoices() {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            selectedVoice = voices.find(voice => voice.lang === 'pt-BR' && voice.name.includes('Google')) || 
                                voices.find(voice => voice.lang === 'pt-BR');
            speechReady = true;
            speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        }
    }
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();
}

function speak(text, onEndCallback) {
    if (!window.speechSynthesis) return;
    
    if (!speechReady) {
        setTimeout(() => speak(text, onEndCallback), 100);
        return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    if (onEndCallback) utterance.onend = onEndCallback;
    speechSynthesis.speak(utterance);
}

function showScreen(screenId) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    document.getElementById(screenId)?.classList.add('active'); 
}

function showModal(modalId) { 
    document.getElementById(modalId)?.classList.add('show'); 
}

function closeModal(modalId) { 
    document.getElementById(modalId)?.classList.remove('show'); 
}

function showCreateStudentForm() { 
    document.getElementById('createStudentForm').style.display = 'block'; 
}
function hideCreateStudentForm() { 
    document.getElementById('createStudentForm').style.display = 'none'; 
    document.getElementById('createStudentFormElement').reset(); 
}

function showAudioSettingsModal() {
    const letterSelect = document.getElementById('letterSelect');
    if (letterSelect) {
        let optionsHtml = '';
        optionsHtml += '<optgroup label="Instruções e Feedbacks">';
        for (const key in CUSTOM_AUDIO_KEYS) {
            optionsHtml += `<option value="${key}">${CUSTOM_AUDIO_KEYS[key]}</option>`;
        }
        optionsHtml += '</optgroup>';
        
        optionsHtml += '<optgroup label="Letras do Alfabeto">';
        optionsHtml += ALPHABET.map(letter => `<option value="${letter}">Letra ${letter}</option>`).join('');
        optionsHtml += '</optgroup>';

        letterSelect.innerHTML = optionsHtml;
    }
    showModal('audioSettingsModal');
    showTab(document.querySelector('#audioSettingsModal .tab-btn[data-tab="uploadFileTab"]'));
}

function showTab(clickedButton) {
    const parent = clickedButton.closest('.modal-content');
    const tabId = clickedButton.getAttribute('data-tab');

    parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    parent.querySelector('#' + tabId).classList.add('active');
}

function showFeedback(message, type = 'info') {
    const el = document.getElementById('globalFeedback');
    if (!el) return;
    const textEl = el.querySelector('.feedback-text');
    if (textEl) textEl.textContent = message;
    el.className = `feedback-content ${type}`; // Use a class for styling
    
    const container = document.getElementById('globalFeedback');
    container.classList.add('show', type);
    
    setTimeout(() => {
        container.className = container.className.replace('show', '');
    }, 3000);
}


function updateUI() {
    const gameScreen = document.getElementById('gameScreen');
    if(gameScreen.classList.contains('active') && gameState.questions && gameState.questions.length > 0) {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('totalQuestions').textContent = gameState.questions.length;
        document.getElementById('attempts').textContent = `${gameState.attempts}`;
        document.getElementById('currentPhase').textContent = gameState.currentPhase;
        const progress = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }
}

async function showTutorial(phaseNumber) {
    if (gameState.tutorialsShown.includes(phaseNumber)) return;

    const instruction = gameInstructions[phaseNumber];
    if (!instruction) return;

    const overlay = document.getElementById('tutorialOverlay');
    const mascot = document.getElementById('tutorialMascot');
    document.getElementById('tutorialText').textContent = instruction;
    
    overlay.classList.add('show');
    mascot.classList.add('talking');
    
    const audioKey = `instruction_${phaseNumber}`;
    playTeacherAudio(audioKey, instruction, () => mascot.classList.remove('talking'));

    gameState.tutorialsShown.push(phaseNumber);
    await saveGameState();
}

function hideTutorial() {
    document.getElementById('tutorialOverlay').classList.remove('show');
}

// =======================================================
// PARTE 9: LOG DE ERROS
// =======================================================
async function logStudentError({ question, selectedAnswer }) {
    if (!currentUser || currentUser.type !== 'student') {
        console.warn('Tentativa de log de erro sem um aluno logado.');
        return;
    }

    const errorData = {
        student_id: currentUser.id,
        teacher_id: currentUser.teacher_id,
        class_id: currentUser.class_id,
        phase: gameState.currentPhase,
        question_type: question.type,
        correct_answer: String(question.correctAnswer),
        selected_answer: String(selectedAnswer),
        error_timestamp: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from('studant_errors') // Nome da tabela como "studant_errors"
        .insert([errorData]);

    if (error) {
        console.error('Falha ao registrar o erro do aluno:', error);
    } else {
        console.log('Erro do aluno registrado com sucesso:', errorData);
    }
}

// =======================================================
// PARTE 10: RELATÓRIOS DO PROFESSOR (NOVA SEÇÃO)
// =======================================================
async function loadErrorReports() {
    if (!currentClassId) return;

    const heatmapContainer = document.getElementById('classHeatmap');
    const individualContainer = document.getElementById('individualReports');
    heatmapContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando mapa de calor...</p>';
    individualContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando relatórios individuais...</p>';
    
    // 1. Buscar todos os erros da turma
    const { data: errors, error } = await supabaseClient
        .from('studant_errors')
        .select(`
            *,
            students ( name )
        `)
        .eq('class_id', currentClassId);

    if (error) {
        heatmapContainer.innerHTML = '<p class="error">Erro ao carregar dados do mapa de calor.</p>';
        individualContainer.innerHTML = '<p class="error">Erro ao carregar relatórios individuais.</p>';
        console.error("Erro ao buscar erros:", error);
        return;
    }

    renderClassHeatmap(errors, heatmapContainer);
    renderIndividualReports(errors, individualContainer);
}

function renderClassHeatmap(errors, container) {
    if (errors.length === 0) {
        container.innerHTML = '<p>Nenhum erro registrado para esta turma ainda.</p>';
        return;
    }
    
    const errorCounts = errors.reduce((acc, err) => {
        // Agrupa erros pela resposta correta que o aluno errou
        const key = err.correct_answer;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const sortedErrors = Object.entries(errorCounts).sort(([,a], [,b]) => b - a);
    const maxErrors = sortedErrors[0] ? sortedErrors[0][1] : 1;

    const heatmapHtml = sortedErrors.map(([answer, count]) => {
        const intensity = Math.max(0.2, count / maxErrors); // De 20% a 100% de opacidade
        return `<div class="heatmap-item" style="background-color: rgba(255, 107, 107, ${intensity});" title="${count} erros">
            ${answer}
        </div>`;
    }).join('');

    container.innerHTML = heatmapHtml;
}

function renderIndividualReports(errors, container) {
    const students = studentProgressData; // Usamos os dados já carregados
    if (students.length === 0) {
        container.innerHTML = '<p>Nenhum aluno nesta turma.</p>';
        return;
    }

    const reportsHtml = students.map(student => {
        const studentErrors = errors.filter(e => e.student_id === student.id);
        const errorCounts = studentErrors.reduce((acc, err) => {
            const key = `${err.correct_answer}|${err.selected_answer}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const sortedErrors = Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Pega os 5 maiores erros

        let errorsHtml = '<p>Nenhum erro registrado para este aluno.</p>';
        if (sortedErrors.length > 0) {
            errorsHtml = sortedErrors.map(([key, count]) => {
                const [correct, incorrect] = key.split('|');
                return `<div class="error-detail-item">
                    (${count}x) O aluno trocou <strong class="correct">${correct}</strong> por <strong class="incorrect">${incorrect}</strong>
                </div>`;
            }).join('');
        }
        
        return `
            <div class="student-item student-report-item" onclick="toggleErrorDetails('${student.id}')">
                <div class="student-info"><h4>${student.name}</h4></div>
                <div class="student-actions"><i class="fas fa-chevron-down"></i></div>
            </div>
            <div id="errors-${student.id}" class="student-errors-details">
                ${errorsHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = reportsHtml;
}

function toggleErrorDetails(studentId) {
    const detailsDiv = document.getElementById(`errors-${studentId}`);
    if (detailsDiv) {
        detailsDiv.style.display = detailsDiv.style.display === 'block' ? 'none' : 'block';
    }
}

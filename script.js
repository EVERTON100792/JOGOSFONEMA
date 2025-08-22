// =======================================================
// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
// =======================================================
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Chave do professor que tem permissão para gerenciar os áudios do jogo
const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6'; 

let currentUser = null;
let currentClassId = null;
let currentClassStudents = []; // Armazena alunos da turma atual
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
    { word: 'ABELHA', image: '🐝', vowel: 'A' }, { word: 'ELEFANTE', image: '🐘', vowel: 'E' },
    { word: 'IGREJA', image: '⛪', vowel: 'I' }, { word: 'ÔNIBUS', image: '🚌', vowel: 'O' },
    { word: 'UVA', image: '🍇', vowel: 'U' }, { word: 'AVIÃO', image: '✈️', vowel: 'A' },
    { word: 'ESTRELA', image: '⭐', vowel: 'E' }, { word: 'ÍNDIO', image: '🏹', vowel: 'I' },
    { word: 'OVO', image: '🥚', vowel: 'O' }, { word: 'URSO', image: '🐻', vowel: 'U' }
];

const PHASE_3_ENCONTROS = [
    { word: 'PEIXE', image: '🐠', encontro: 'EI' }, { word: 'BOI', image: '🐂', encontro: 'OI' },
    { word: 'CAIXA', image: '📦', encontro: 'AI' }, { word: 'PAI', image: '👨‍👧', encontro: 'AI' },
    { word: 'CÉU', image: '🌌', encontro: 'EU' }, { word: 'LUA', image: '🌙', encontro: 'UA' },
    { word: 'LEÃO', image: '🦁', encontro: 'ÃO' }, { word: 'MÃE', image: '👩‍👦', encontro: 'ÃE' },
    { word: 'PÃO', image: '🍞', encontro: 'ÃO' }, { word: 'CHAPÉU', image: '🤠', encontro: 'ÉU' }
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
    { word: 'BOLO', image: '🎂', syllable: 'LO' }, { word: 'CASA', image: '🏠', syllable: 'SA' },
    { word: 'DADO', image: '🎲', syllable: 'DO' }, { word: 'FACA', image: '🔪', syllable: 'CA' },
    { word: 'GATO', image: '🐈', syllable: 'TO' }, { word: 'MACACO', image: '🐒', syllable: 'CO' },
    { word: 'PATO', image: '🦆', syllable: 'TO' }, { word: 'SAPO', image: '🐸', syllable: 'PO' },
    { word: 'VACA', image: '🐄', syllable: 'CA' }, { word: 'JANELA', image: '🖼️', syllable: 'LA' }
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
    if (message.includes('duplicate key') && message.includes('username')) {
        return 'Este nome de usuário já existe. Por favor, escolha outro.';
    }
    if (message.includes('invalid login credentials')) {
        return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.';
    }
    if (message.includes('email not confirmed')) {
        return 'E-mail não confirmado. Verifique sua caixa de entrada e spam.';
    }
    if (message.includes('to be a valid email')) {
        return 'Por favor, insira um e-mail válido.';
    }
    if (message.includes('password should be at least 6 characters')) {
        return 'A senha precisa ter no mínimo 6 caracteres.';
    }
    if(message.includes('esta conta não é de um professor')) {
        return 'Login falhou: Esta conta não tem permissão de professor.';
    }
    console.error("Erro não tratado:", error);
    return 'Ocorreu um erro inesperado. Tente novamente.';
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
    } else {
        showScreen('gameScreen');
        startQuestion();
    }
}

function setupAllEventListeners() {
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
        const passwordField = document.getElementById('createStudentPassword');
        passwordField.type = 'text';
        passwordField.value = generateRandomPassword();
        setTimeout(() => { passwordField.type = 'password'; }, 2000);
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
    
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')));
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showTab(e.currentTarget));
    });

    document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload);
    document.getElementById('recordBtn')?.addEventListener('click', startRecording);
    document.getElementById('stopBtn')?.addEventListener('click', stopRecording);
    document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording);
    
    document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial);
    document.getElementById('copyCredentialsBtn')?.addEventListener('click', handleCopyCredentials);
    
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggle.classList.toggle('fa-eye-slash');
        });
    });

    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const sortBy = e.currentTarget.dataset.sort;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadStudentProgress(sortBy);
        });
    });
    document.getElementById('reportStudentSelect')?.addEventListener('change', (e) => {
        loadIndividualReport(e.target.value);
    });
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportReportsToPDF);
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
    console.log("Tentando login para o professor com o e-mail:", email);

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            console.error("Erro retornado diretamente pelo Supabase:", error.message);
            throw error;
        }

        if (!data.user) {
            throw new Error("Login parece ter funcionado, mas nenhum dado de usuário foi retornado.");
        }
        
        console.log("1. Autenticação no Supabase foi bem-sucedida. Usuário:", data.user.id);
        
        if (data.user.user_metadata?.role !== 'teacher') {
            console.warn("ALERTA: Login bem-sucedido, mas a conta não tem o perfil de 'teacher'.", data.user.user_metadata);
            await supabaseClient.auth.signOut(); 
            throw new Error("As credenciais estão corretas, mas esta conta não é de um professor.");
        }

        console.log("2. Verificação de perfil 'teacher' passou. Carregando o dashboard...");
        
        currentUser = data.user;
        await showTeacherDashboard();

        console.log("3. Dashboard do professor carregado com sucesso.");
        showFeedback('Login realizado com sucesso!', 'success');

    } catch (error) {
        console.error("Falha final no processo de login:", error);
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

        if (error && error.message !== 'JSON object requested, multiple (or no) rows returned') {
            throw error;
        }

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
            <div class="class-card" data-class-id="${cls.id}" data-class-name="${cls.name.replace(/"/g, "&quot;").replace(/'/g, "&#39;")}
">
                <h3>${cls.name}</h3>
                <span class="student-count">👥 ${studentCount} aluno(s)</span>
                <div class="class-card-actions">
                    <button class="btn primary manage-btn">Gerenciar</button>
                    <button class="btn danger delete-btn" title="Excluir Turma">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>`;
    }).join('');

    addEventListenersToClassCards();
}

function addEventListenersToClassCards() {
    document.querySelectorAll('.class-card').forEach(card => {
        const classId = card.dataset.classId;
        const className = card.dataset.className;

        card.querySelector('.manage-btn')?.addEventListener('click', () => {
            manageClass(classId, className);
        });

        card.querySelector('.delete-btn')?.addEventListener('click', () => {
            handleDeleteClass(classId, className);
        });
    });
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
    console.log(`Gerenciando turma: ${className} (${classId})`);
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    showTab(document.querySelector('#manageClassModal .tab-btn[data-tab="studentsTab"]'));
    
    showModal('manageClassModal');

    await loadClassStudents();
    await loadStudentProgress();
    await loadDifficultyReports();
}

async function loadClassStudents() {
    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('class_id', currentClassId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Erro ao carregar alunos:', error);
        document.getElementById('studentsList').innerHTML = '<p>Erro ao carregar alunos.</p>';
        currentClassStudents = [];
        return;
    }
    currentClassStudents = data;
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
                <button class="btn small reset-password-btn" data-student-id="${student.id}" data-student-name="${student.name.replace(/"/g, "&quot;")}" title="Resetar Senha">
                    <i class="fas fa-key" aria-hidden="true"></i>
                </button>
                <button class="btn small danger delete-student-btn" data-student-id="${student.id}" data-student-name="${student.name.replace(/"/g, "&quot;")}" title="Excluir Aluno">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        </div>`).join('');

    addEventListenersToStudentItems();
}

function addEventListenersToStudentItems() {
    document.querySelectorAll('.reset-password-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.currentTarget.dataset.studentId;
            const studentName = e.currentTarget.dataset.studentName;
            handleResetStudentPassword(studentId, studentName);
        });
    });

    document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.currentTarget.dataset.studentId;
            const studentName = e.currentTarget.dataset.studentName;
            handleDeleteStudent(studentId, studentName);
        });
    });
}


async function loadStudentProgress(sortBy = 'last_played') {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando progresso...</p>';

    const { data: students, error } = await supabaseClient
        .from('students')
        .select('id, name, assigned_phase, progress(*)')
        .eq('class_id', currentClassId);

    if (error) {
        progressList.innerHTML = `<p style="color:red;">Erro ao carregar alunos: ${error.message}</p>`;
        return;
    }

    if (students.length === 0) {
        progressList.innerHTML = '<p>Nenhum aluno nesta turma para exibir o progresso.</p>';
        return;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let processedData = students.map(student => {
        const progress = student.progress[0] || {};
        const score = progress.game_state?.score ?? 0;
        const total = progress.game_state?.questions?.length || 10;
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        const lastPlayed = progress.last_played ? new Date(progress.last_played) : null;
        
        return {
            id: student.id, name: student.name, assigned_phase: student.assigned_phase || 1,
            current_phase: progress.current_phase || 'N/A', accuracy: accuracy,
            score: score, total: total, last_played: lastPlayed,
            isActive: lastPlayed && lastPlayed > sevenDaysAgo
        };
    });

    processedData.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'progress') return b.accuracy - a.accuracy;
        if (sortBy === 'last_played') {
            if (!a.last_played) return 1; if (!b.last_played) return -1;
            return b.last_played - a.last_played;
        }
        return 0;
    });

    renderStudentProgress(processedData);
}

function renderStudentProgress(data) {
    const progressList = document.getElementById('studentProgressList');
    if (!data || data.length === 0) {
        progressList.innerHTML = '<p>Nenhum progresso para exibir.</p>';
        return;
    }
    
    let html = data.map(student => {
        const lastPlayedStr = student.last_played ? student.last_played.toLocaleDateString('pt-BR') : 'Nunca';
        const statusClass = student.isActive ? 'active' : 'inactive';
        const statusTitle = student.isActive ? 'Ativo (jogou nos últimos 7 dias)' : 'Inativo';
        
        const phaseOptions = [1, 2, 3, 4, 5].map(phaseNum =>
            `<option value="${phaseNum}" ${student.assigned_phase === phaseNum ? 'selected' : ''}>Fase ${phaseNum}</option>`
        ).join('');

        return `
            <div class="student-item">
                <div class="student-info">
                    <h4>
                        <span class="status-icon ${statusClass}" title="${statusTitle}"></span>
                        ${student.name}
                    </h4>
                    <p>Último Acesso: ${lastPlayedStr} | Progresso na Fase ${student.current_phase}: ${student.accuracy}%</p>
                    <div class="student-progress-container">
                         <div class="student-progress-bar">
                             <div class="student-progress-fill" style="width: ${student.accuracy}%;"></div>
                         </div>
                    </div>
                </div>
                <div class="student-actions">
                    <label for="phase-select-${student.id}" class="select-label">Designar Fase:</label>
                    <select id="phase-select-${student.id}" class="phase-select" data-student-id="${student.id}">
                        ${phaseOptions}
                    </select>
                </div>
            </div>`;
    }).join('');

    progressList.innerHTML = html;
    
    document.querySelectorAll('.phase-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const studentId = e.currentTarget.dataset.studentId;
            assignPhase(studentId, e.currentTarget);
        });
    });
}

async function assignPhase(studentId, selectElement) {
    const newPhase = parseInt(selectElement.value);
    const studentName = selectElement.closest('.student-item').querySelector('h4').textContent.trim();

    if (!confirm(`Deseja designar a Fase ${newPhase} para o aluno ${studentName}?\n\nAtenção: O progresso na fase atual será reiniciado.`)) {
        await loadStudentProgress(); return;
    }

    try {
        await supabaseClient.from('students').update({ assigned_phase: newPhase }).eq('id', studentId);
        const newGameState = {
            currentPhase: newPhase, score: 0, attempts: 2,
            questions: generateQuestions(newPhase), currentQuestionIndex: 0, tutorialsShown: []
        };
        await supabaseClient.from('progress').upsert({ 
            student_id: studentId, current_phase: newPhase,
            game_state: newGameState, last_played: new Date().toISOString()
        }, { onConflict: 'student_id' });
        
        showFeedback(`Fase ${newPhase} designada para ${studentName} com sucesso!`, 'success');
        await loadStudentProgress();
    } catch (error) {
        showFeedback(`Erro ao designar fase: ${error.message}`, 'error');
    }
}

async function loadDifficultyReports() {
    const select = document.getElementById('reportStudentSelect');
    select.innerHTML = '<option value="">Selecione um aluno...</option>';
    currentClassStudents.forEach(student => {
        select.innerHTML += `<option value="${student.id}">${student.name}</option>`;
    });

    document.getElementById('individualReportContent').style.display = 'none';
    await loadClassHeatmap();
}

async function loadClassHeatmap() {
    const heatmapContainer = document.getElementById('classHeatmap');
    heatmapContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando mapa de calor...';

    const { data, error } = await supabaseClient.from('student_errors')
        .select('question_data').eq('class_id', currentClassId);

    if (error) { heatmapContainer.textContent = 'Erro ao carregar dados.'; return; }
    if (data.length === 0) { heatmapContainer.textContent = 'Nenhum erro registrado para esta turma ainda.'; return; }
    
    const errorCounts = data.reduce((acc, { question_data }) => {
        const key = question_data?.correctAnswer || 'desconhecido';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    
    const maxErrors = Math.max(...Object.values(errorCounts));
    const sortedErrors = Object.entries(errorCounts).sort(([,a],[,b]) => b-a);

    heatmapContainer.innerHTML = sortedErrors.map(([item, count]) => {
        const intensity = count / maxErrors;
        const color = `rgba(255, 107, 107, ${Math.max(0.2, intensity)})`;
        return `<div class="heatmap-item" style="background-color: ${color};" title="${item} - ${count} erros">
                    ${item}
                    <span class="tooltip">${item}<br>${count} erros</span>
                </div>`;
    }).join('');
}

async function loadIndividualReport(studentId) {
    const reportContent = document.getElementById('individualReportContent');
    if (!studentId) {
        reportContent.style.display = 'none';
        return;
    }
    reportContent.style.display = 'block';

    const { data, error } = await supabaseClient.from('student_errors')
        .select('*')
        .eq('student_id', studentId);
    
    if (error) {
        showFeedback('Erro ao carregar dados do aluno.', 'error');
        return;
    }
    
    const performanceByPhase = data.reduce((acc, err) => {
        acc[err.phase] = (acc[err.phase] || 0) + 1;
        return acc;
    }, {});

    renderPerformanceChart(performanceByPhase);

    const errorCounts = data.reduce((acc, { question_data }) => {
        const key = question_data?.correctAnswer || 'desconhecido';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const top5 = Object.entries(errorCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
    renderTop5Errors(top5);

    generateIntelligentSuggestion(top5);
}

function renderPerformanceChart(performanceData) {
    const container = document.getElementById('performanceChart');
    const totalPhases = 5;
    let html = '';
    const totalQuestionsPerPhase = 10;

    for(let i = 1; i <= totalPhases; i++){
        const errors = performanceData[i] || 0;
        const accuracy = Math.round(((totalQuestionsPerPhase - errors) / totalQuestionsPerPhase) * 100);
        html += `
            <div class="chart-bar">
                <div class="bar-label">Fase ${i}</div>
                <div class="bar-wrapper">
                    <div class="bar-fill" style="width: ${accuracy}%; background-color: ${accuracy < 50 ? '#ff6b6b' : '#4ecdc4'};">
                       ${accuracy}%
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderTop5Errors(top5) {
    const list = document.getElementById('top5Errors');
    if (top5.length === 0) {
        list.innerHTML = '<li>Nenhum erro registrado para este aluno.</li>';
        return;
    }
    list.innerHTML = top5.map(([item, count]) => `
        <li>
            Dificuldade com: <span class="error-item">'${item}'</span>
            <span class="error-count">${count}x</span>
        </li>
    `).join('');
}

function generateIntelligentSuggestion(top5) {
    const suggestionEl = document.getElementById('intelligentSuggestion');
    if (top5.length === 0) {
        suggestionEl.textContent = 'O aluno está indo muito bem! Continue incentivando.';
        return;
    }
    const mostCommonError = top5[0][0];
    const errorCount = top5[0][1];
    if (errorCount > 3) {
        suggestionEl.textContent = `O aluno apresenta dificuldade recorrente com '${mostCommonError}'. Sugerimos uma atividade de reforço focada neste item, revisando seu som e forma.`;
    } else {
        suggestionEl.textContent = `A maior dificuldade do aluno é com '${mostCommonError}'. Continue monitorando o progresso e oferecendo suporte.`;
    }
}

async function exportReportsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const studentId = document.getElementById('reportStudentSelect').value;
    const studentName = document.getElementById('reportStudentSelect').selectedOptions[0].text;
    const className = document.getElementById('manageClassTitle').textContent.replace('Gerenciar: ', '');

    doc.setFontSize(18);
    doc.text(`Relatório de Dificuldades - ${className}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    doc.setFontSize(14);
    doc.text('Mapa de Calor da Turma', 14, 40);
    const heatmapItems = Array.from(document.querySelectorAll('#classHeatmap .heatmap-item')).map(item => [item.textContent.trim(), item.title.split(' - ')[1]]);
    if (heatmapItems.length > 0) {
        doc.autoTable({
            head: [['Item com Dificuldade', 'Nº de Erros']],
            body: heatmapItems,
            startY: 45,
            theme: 'striped'
        });
    } else {
        doc.text('Nenhum erro registrado para a turma.', 14, 45);
    }
    
    if (studentId) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text(`Relatório Individual: ${studentName}`, 14, 22);

        doc.setFontSize(14);
        doc.text('Top 5 Maiores Dificuldades', 14, 40);
        const top5Errors = Array.from(document.querySelectorAll('#top5Errors li')).map(li => {
            const item = li.querySelector('.error-item')?.textContent || '';
            const count = li.querySelector('.error-count')?.textContent || '';
            return [item, count];
        });
        if (top5Errors.length > 0) {
            doc.autoTable({
                head: [['Item', 'Contagem']],
                body: top5Errors,
                startY: 45
            });
        } else {
            doc.text('Nenhum erro registrado.', 14, 45);
        }

        doc.setFontSize(14);
        const suggestionY = doc.autoTable.previous.finalY + 15;
        doc.text('Sugestão', 14, suggestionY);
        const suggestionText = document.getElementById('intelligentSuggestion').textContent;
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(suggestionText, 180);
        doc.text(splitText, 14, suggestionY + 5);
    }

    doc.save(`relatorio_${className.replace(/\s/g, '_')}.pdf`);
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
        showFeedback('Erro ao copiar. Por favor, anote manualmente.', 'error');
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
        const fileName = file.name.split('.').slice(0, -1).join('.').toUpperCase();
        const filePath = `${currentUser.id}/${fileName}.${file.name.split('.').pop()}`;
        
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
    const filePath = `${currentUser.id}/${fileName}`;

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
        document.getElementById('recordStatus').textContent = 'Pronto para gravar outra letra.';

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
async function showStudentGame() {
    await startGame();
}

async function startGame() {
    await loadGameState();
    showScreen('startScreen');
}

async function loadGameState() {
    const { data: progressData } = await supabaseClient
        .from('progress')
        .select('game_state, current_phase')
        .eq('student_id', currentUser.id)
        .single();

    const assignedPhase = currentUser.assigned_phase || 1;
    const savedPhase = progressData?.current_phase;

    if (progressData && savedPhase !== assignedPhase) {
        gameState = {
            currentPhase: assignedPhase, score: 0, attempts: 2,
            questions: generateQuestions(assignedPhase), currentQuestionIndex: 0,
            teacherId: currentUser.teacher_id, tutorialsShown: []
        };
        await saveGameState();
        return;
    }

    if (progressData && progressData.game_state && progressData.game_state.questions) {
        gameState = progressData.game_state;
        if (!gameState.tutorialsShown) gameState.tutorialsShown = [];
    } else {
        gameState = {
            currentPhase: assignedPhase, score: 0, attempts: 2,
            questions: generateQuestions(assignedPhase), currentQuestionIndex: 0,
            teacherId: currentUser.teacher_id, tutorialsShown: []
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

async function logError(question, incorrectAnswer) {
    if (!currentUser || currentUser.type !== 'student') return;
    const errorLog = {
        student_id: currentUser.id,
        class_id: currentUser.class_id,
        phase: gameState.currentPhase,
        question_data: question,
        incorrect_answer: incorrectAnswer
    };
    const { error } = await supabaseClient.from('student_errors').insert([errorLog]);
    if(error){
        console.error("Falha ao registrar erro:", error);
    }
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
            questions = generateQuestions(5);
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
        showFeedback(`Quase! A resposta correta era ${currentQuestion.correctAnswer}`, 'error');
        playTeacherAudio('feedback_incorrect', 'Tente de novo');
        await logError(currentQuestion, selectedAnswer);
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
    const nextPhaseNum = gameState.currentPhase + 1;
    if (nextPhaseNum > currentUser.assigned_phase) return;

    gameState.currentPhase = nextPhaseNum;
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.attempts = 2;
    gameState.questions = generateQuestions(gameState.currentPhase);
    await saveGameState();
    showScreen('gameScreen');
    startQuestion();
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
    if (gameState.phaseCompleted) {
        logout();
    } else {
        showScreen('startScreen');
    }
}

async function playTeacherAudio(key, fallbackText, onEndCallback) {
    const teacherId = SUPER_ADMIN_TEACHER_ID; 

    if (!teacherId) {
        console.warn("ID do Super Admin não foi definido, usando voz padrão.");
        speak(fallbackText, onEndCallback);
        return;
    }

    try {
        const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${key}.` });

        if (data && data.length > 0) {
            const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${data[0].name}`);
            const audio = new Audio(publicUrl);
            if (onEndCallback) audio.onended = onEndCallback;
            audio.play();
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
    el.className = `show ${type}`;
    setTimeout(() => {
        el.className = el.className.replace('show', '');
    }, 4000);
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

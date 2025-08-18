// =======================================================
// INÍCIO DO CÓDIGO DE AUTENTICAÇÃO E SUPABASE
// =======================================================

// Acessa o cliente Supabase que foi carregado no HTML
const { createClient } = supabase;

// Suas credenciais do Supabase
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';

// Cria o cliente Supabase que será usado em todo o código
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// === GERENCIAMENTO DE USUÁRIOS ===
let currentUser = null;
let currentClassId = null;

// === FUNÇÕES DE AUTENTICAÇÃO ===

/**
 * Registra um novo professor no Supabase Auth.
 */
async function handleTeacherRegister(e) {
    e.preventDefault();
    const name = document.getElementById('teacherRegName').value;
    const email = document.getElementById('teacherRegEmail').value;
    const password = document.getElementById('teacherRegPassword').value;

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    role: 'teacher'
                }
            }
        });

        if (error) throw error;

        showFeedback('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.', 'success');

    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        showFeedback(`Erro no cadastro: ${error.message}`, 'error');
    }
}

/**
 * Realiza o login do professor.
 */
async function handleTeacherLogin(e) {
    e.preventDefault();
    const loginEmail = document.getElementById('teacherEmail').value;
    const loginPassword = document.getElementById('teacherPassword').value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) throw error;

        currentUser = data.user;
        await showTeacherDashboard();
        showFeedback('Login realizado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro no login:', error.message);
        showFeedback(`Erro no login: ${error.message}`, 'error');
    }
}

/**
 * Realiza o login do aluno (usando a tabela 'students').
 */
async function handleStudentLogin(e) {
    e.preventDefault();
    const username = document.getElementById('studentUsername').value;
    const password = document.getElementById('studentPassword').value;

    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('password')
            .eq('username', username)
            .single();

        if (error || !data) {
            throw new Error('Usuário ou senha inválidos.');
        }

        const passwordMatch = window.bcrypt.compareSync(password, data.password);

        if (!passwordMatch) {
            throw new Error('Usuário ou senha inválidos.');
        }

        const { data: studentData, error: studentError } = await supabaseClient
            .from('students')
            .select('*')
            .eq('username', username)
            .single();

        if (studentError || !studentData) {
            throw new Error('Erro ao carregar dados do aluno.');
        }

        currentUser = { ...studentData, type: 'student' };
        localStorage.setItem('studentSession', JSON.stringify({ id: currentUser.id, type: currentUser.type }));
        await showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro no login do aluno:', error.message);
        showFeedback(error.message, 'error');
    }
}

/**
 * Realiza o logout do usuário.
 */
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        localStorage.removeItem('studentSession');
        currentUser = null;
        currentClassId = null;
        showUserTypeScreen();
        showFeedback('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no logout:', error.message);
        showFeedback('Erro ao fazer logout.', 'error');
    }
}

// === FUNÇÕES DO DASHBOARD (TURMAS E ALUNOS) ===

async function loadTeacherData() {
    if (!currentUser) return;
    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) {
        teacherNameEl.textContent = currentUser.user_metadata.full_name || 'Professor(a)';
    }
    await loadTeacherClasses();
}

async function loadTeacherClasses() {
    try {
        const { data, error } = await supabaseClient
            .from('classes')
            .select('*, students(count)')
            .eq('teacher_id', currentUser.id);

        if (error) throw error;

        renderClasses(data);
    } catch (error) {
        console.error('Erro ao carregar turmas:', error.message);
    }
}

async function handleCreateClass(e) {
    e.preventDefault();
    const name = document.getElementById('className').value;

    try {
        await supabaseClient
            .from('classes')
            .insert([{ name: name, teacher_id: currentUser.id }]);
        
        closeModal('createClassModal');
        await loadTeacherClasses();
        showFeedback('Turma criada com sucesso!', 'success');
        document.getElementById('createClassForm').reset();

    } catch (error) {
        console.error('Erro ao criar turma:', error.message);
        showFeedback('Erro ao criar turma.', 'error');
    }
}

async function loadClassStudents() {
    if (!currentClassId) return;
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('class_id', currentClassId);

        if (error) throw error;
        renderStudents(data);
    } catch (error) {
        console.error('Erro ao carregar alunos:', error.message);
    }
}

async function handleCreateStudent(e) {
    e.preventDefault();
    const name = document.getElementById('createStudentName').value;
    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;

    try {
        const hashedPassword = window.bcrypt.hashSync(password, 10);
        const { error } = await supabaseClient
            .from('students')
            .insert([{
                name,
                username,
                password: hashedPassword,
                class_id: currentClassId,
                teacher_id: currentUser.id
            }]);

        if (error) throw error;

        hideCreateStudentForm();
        await loadClassStudents();
        showFeedback('Aluno criado com sucesso!', 'success');
        document.getElementById('createStudentFormElement').reset();

    } catch (error) {
        console.error('Erro ao criar aluno:', error.message);
        if (error.message.includes('duplicate key')) {
            showFeedback('Este nome de usuário já existe.', 'error');
        } else {
            showFeedback(`Erro: ${error.message}`, 'error');
        }
    }
}

// === VERIFICAÇÃO INICIAL DA SESSÃO ===
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        if (currentUser.user_metadata.role === 'teacher') {
            await showTeacherDashboard();
        } else {
            showUserTypeScreen();
        }
    } else {
        const studentSession = localStorage.getItem('studentSession');
        if (studentSession) {
            try {
                const { id } = JSON.parse(studentSession);
                const { data: studentData, error } = await supabaseClient
                    .from('students')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (!error && studentData) {
                    currentUser = { ...studentData, type: 'student' };
                    await showStudentGame();
                    return;
                } else {
                    localStorage.removeItem('studentSession');
                }
            } catch (e) {
                localStorage.removeItem('studentSession');
            }
        }
        showUserTypeScreen();
    }
}


// =======================================================
// INÍCIO DO CÓDIGO DO JOGO E DA INTERFACE
// =======================================================

const GAME_CONFIG = {
    minAccuracy: 95,
    maxAttempts: 2,
    questionsPerPhase: 10,
    currentPhase: 1,
    maxPhases: 3,
    phases: {
        1: { name: 'Reconhecer Letras', type: 'audio-to-letter' },
        2: { name: 'Vogais e Figuras', type: 'image-to-vowel' },
        3: { name: 'Palavras Completas', type: 'word-formation' }
    }
};

let gameState = {
    currentPhase: 1,
    score: 0,
    attempts: 2,
    questions: [],
    currentQuestionIndex: 0,
    uploadedAudios: {}
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

const elements = {
    userTypeScreen: document.getElementById('userTypeScreen'),
    teacherLoginScreen: document.getElementById('teacherLoginScreen'),
    teacherRegisterScreen: document.getElementById('teacherRegisterScreen'),
    studentLoginScreen: document.getElementById('studentLoginScreen'),
    teacherDashboard: document.getElementById('teacherDashboard'),
    startScreen: document.getElementById('startScreen'),
    gameScreen: document.getElementById('gameScreen'),
    resultScreen: document.getElementById('resultScreen'),
};

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    await checkSession();
    setupAllEventListeners();
}

function setupAllEventListeners() {
    setupGameEventListeners();
    setupAuthEventListeners();
}

function setupAuthEventListeners() {
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            if (type === 'teacher') showTeacherLogin();
            else if (type === 'student') showStudentLogin();
        });
    });

    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('createStudentFormElement')?.addEventListener('submit', handleCreateStudent);
}

function setupGameEventListeners() {
    document.getElementById('startButton')?.addEventListener('click', startGame);
    document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio);
    document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('continueButton')?.addEventListener('click', nextPhase);
    document.getElementById('retryButton')?.addEventListener('click', retryPhase);
    document.getElementById('restartButton')?.addEventListener('click', restartGame);
    document.getElementById('audioUpload')?.addEventListener('change', handleAudioUpload);
    document.getElementById('testAudioButton')?.addEventListener('click', testUploadedAudios);
}

function startGame() {
    // Implementação da lógica de início do jogo...
    console.log("Jogo iniciado!");
    showScreen('gameScreen');
}

// ... (O restante das suas funções de jogo como generateQuestions, playCurrentAudio, etc. continuam aqui)
// Adicionei as funções de UI que estavam faltando no arquivo cortado.

// === FUNÇÕES DE NAVEGAÇÃO DE TELA E UI ===

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.classList.add('active');
    }
}

function showUserTypeScreen() { showScreen('userTypeScreen'); }
function showTeacherLogin() { showScreen('teacherLoginScreen'); }
function showTeacherRegister() { showScreen('teacherRegisterScreen'); }
function showStudentLogin() { showScreen('studentLoginScreen'); }

async function showTeacherDashboard() {
    showScreen('teacherDashboard');
    await loadTeacherData();
}

async function showStudentGame() {
    showScreen('startScreen');
    // Adicionar aqui a lógica para carregar o progresso do aluno, se necessário
}

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    container.innerHTML = '';
    if (classes.length === 0) {
        container.innerHTML = '<p>Nenhuma turma criada ainda. Crie sua primeira turma!</p>';
        return;
    }
    classes.forEach(cls => {
        const studentCount = cls.students[0]?.count || 0;
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        classCard.innerHTML = `
            <h3>${cls.name}</h3>
            <div class="class-info">
                <span class="student-count">👥 ${studentCount} aluno(s)</span>
                <small>Criada em ${new Date(cls.created_at).toLocaleDateString()}</small>
            </div>
            <div class="class-actions">
                <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name}')">
                    <i class="fas fa-cog"></i> Gerenciar
                </button>
            </div>
        `;
        container.appendChild(classCard);
    });
}

function renderStudents(students) {
    const container = document.getElementById('studentsList');
    container.innerHTML = '';
    if (students.length === 0) {
        container.innerHTML = '<p>Nenhum aluno cadastrado nesta turma.</p>';
        return;
    }
    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.innerHTML = `
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Usuário: ${student.username}</p>
            </div>
        `;
        container.appendChild(studentItem);
    });
}

// === FUNÇÕES DE MODAL E TABS ===

function showCreateClassModal() {
    document.getElementById('createClassModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    document.getElementById('manageClassModal').classList.add('show');
    showTab('students'); // Garante que a aba de alunos é a primeira a ser exibida
    await loadClassStudents();
}

function showCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'block';
}

function hideCreateStudentForm() {
    const form = document.getElementById('createStudentForm');
    form.style.display = 'none';
    document.getElementById('createStudentFormElement').reset();
}

function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // O event.target pode ser nulo se chamado de outra função, então é preciso verificar
    const clickedButton = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
    if(clickedButton) {
        clickedButton.classList.add('active');
    }
}


// === FUNÇÃO DE FEEDBACK GLOBAL (VERSÃO ÚNICA E CORRIGIDA) ===

function showFeedback(message, type = 'info') {
    const feedback = document.getElementById('globalFeedback');
    if (!feedback) return;
    
    const icon = feedback.querySelector('.feedback-icon');
    const text = feedback.querySelector('.feedback-text');
    
    icon.innerHTML = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    text.textContent = message;
    
    feedback.className = `feedback ${type} show`;
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 3000);
}


// O resto das suas funções de lógica de jogo (startGame, generateQuestions, etc.)
// devem estar aqui. Se estiverem faltando, copie-as do seu arquivo original e cole aqui.
// Por exemplo:
function nextQuestion() { /* ... */ }
function nextPhase() { /* ... */ }
function retryPhase() { /* ... */ }
function restartGame() { showScreen('startScreen'); }
function handleAudioUpload(event) { /* ... */ }
function testUploadedAudios() { /* ... */ }
function playCurrentAudio() { /* ... */ }

// ... e todas as outras

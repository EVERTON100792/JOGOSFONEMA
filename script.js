// =======================================================
// INÍCIO DO CÓDIGO DE AUTENTICAÇÃO E SUPABASE
// =======================================================

const { createClient } = supabase;

const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';

const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentClassId = null;

// === FUNÇÕES DE AUTENTICAÇÃO ===

async function handleTeacherRegister(e) {
    e.preventDefault();
    const name = document.getElementById('teacherRegName').value;
    const email = document.getElementById('teacherRegEmail').value;
    const password = document.getElementById('teacherRegPassword').value;

    try {
        const { error } = await supabaseClient.auth.signUp({
            email, password, options: { data: { full_name: name, role: 'teacher' } }
        });
        if (error) throw error;
        showFeedback('Cadastro realizado com sucesso! Verifique seu e-mail.', 'success');
    } catch (error) {
        showFeedback(`Erro no cadastro: ${error.message}`, 'error');
    }
}

async function handleTeacherLogin(e) {
    e.preventDefault();
    const email = document.getElementById('teacherEmail').value;
    const password = document.getElementById('teacherPassword').value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        await showTeacherDashboard();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(`Erro no login: ${error.message}`, 'error');
    }
}

async function handleStudentLogin(e) {
    e.preventDefault();
    const username = document.getElementById('studentUsername').value;
    const password = document.getElementById('studentPassword').value;

    try {
        const { data, error } = await supabaseClient.from('students').select('password').eq('username', username).single();
        if (error || !data) throw new Error('Usuário ou senha inválidos.');
        
        if (!window.bcrypt.compareSync(password, data.password)) throw new Error('Usuário ou senha inválidos.');

        const { data: studentData, error: studentError } = await supabaseClient.from('students').select('*').eq('username', username).single();
        if (studentError || !studentData) throw new Error('Erro ao carregar dados do aluno.');

        currentUser = { ...studentData, type: 'student' };
        localStorage.setItem('studentSession', JSON.stringify({ id: currentUser.id, type: currentUser.type }));
        await showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('studentSession');
        currentUser = null;
        currentClassId = null;
        showUserTypeScreen();
        showFeedback('Logout realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback('Erro ao fazer logout.', 'error');
    }
}

// === FUNÇÕES DO DASHBOARD ===

async function loadTeacherData() {
    if (!currentUser) return;
    document.getElementById('teacherName').textContent = currentUser.user_metadata.full_name || 'Professor(a)';
    await loadTeacherClasses();
}

async function loadTeacherClasses() {
    try {
        const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id);
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
        await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]);
        closeModal('createClassModal');
        await loadTeacherClasses();
        showFeedback('Turma criada com sucesso!', 'success');
        document.getElementById('createClassForm').reset();
    } catch (error) {
        showFeedback('Erro ao criar turma.', 'error');
    }
}

async function loadClassStudents() {
    if (!currentClassId) return;
    try {
        const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId);
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

    if (!currentClassId || !currentUser?.id) {
        showFeedback("Erro: Não foi possível identificar a turma ou o professor.", "error");
        return;
    }

    try {
        const hashedPassword = window.bcrypt.hashSync(password, 10);
        const { error } = await supabaseClient.from('students').insert([{
            name, username, password: hashedPassword,
            class_id: currentClassId, teacher_id: currentUser.id
        }]);

        if (error) throw error;

        hideCreateStudentForm();
        await loadClassStudents();
        showFeedback('Aluno criado com sucesso!', 'success');
    } catch (error) {
        const message = error.message.includes('duplicate key')
            ? 'Este nome de usuário já existe.'
            : `Erro ao criar aluno: ${error.message}`;
        showFeedback(message, 'error');
    }
}

// === VERIFICAÇÃO DE SESSÃO ===
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        if (currentUser.user_metadata.role === 'teacher') await showTeacherDashboard();
        else showUserTypeScreen();
    } else {
        const studentSession = localStorage.getItem('studentSession');
        if (studentSession) {
            try {
                const { id } = JSON.parse(studentSession);
                const { data: studentData } = await supabaseClient.from('students').select('*').eq('id', id).single();
                if (studentData) {
                    currentUser = { ...studentData, type: 'student' };
                    await showStudentGame();
                    return;
                }
            } catch (e) {
                localStorage.removeItem('studentSession');
            }
        }
        showUserTypeScreen();
    }
}

// =======================================================
// INÍCIO DO CÓDIGO DA INTERFACE E DO JOGO
// =======================================================

const GAME_CONFIG = {
    questionsPerPhase: 10,
};

let gameState = {
    uploadedAudios: {}
};

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    await checkSession();
    setupEventListeners();
}

function setupEventListeners() {
    // Eventos de Autenticação
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        if (type === 'teacher') showTeacherLogin();
        else if (type === 'student') showStudentLogin();
    }));

    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);

    // Eventos do Jogo
    document.getElementById('startButton')?.addEventListener('click', () => showScreen('gameScreen')); // Apenas um exemplo
    document.getElementById('audioUpload')?.addEventListener('change', handleAudioUpload);
}

// === FUNÇÕES DE NAVEGAÇÃO E UI ===

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
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
}

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    container.innerHTML = classes.length === 0
        ? '<p>Nenhuma turma criada ainda.</p>'
        : classes.map(cls => {
            const studentCount = cls.students[0]?.count || 0;
            return `
                <div class="class-card">
                    <h3>${cls.name}</h3>
                    <span class="student-count">👥 ${studentCount} aluno(s)</span>
                    <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name}')">Gerenciar</button>
                </div>`;
        }).join('');
}

function renderStudents(students) {
    const container = document.getElementById('studentsList');
    container.innerHTML = students.length === 0
        ? '<p>Nenhum aluno cadastrado nesta turma.</p>'
        : students.map(student => `
            <div class="student-item">
                <h4>${student.name}</h4>
                <p>Usuário: ${student.username}</p>
            </div>`).join('');
}

// === FUNÇÕES DE MODAL E TABS ===

function showCreateClassModal() { document.getElementById('createClassModal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }

async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    document.getElementById('manageClassModal').classList.add('show');
    showTab('students');
    await loadClassStudents();
}

function showCreateStudentForm() {
    const formContainer = document.getElementById('createStudentForm');
    const formElement = document.getElementById('createStudentFormElement');
    
    formContainer.style.display = 'block';
    
    // Adiciona o listener de evento, mas remove qualquer um que já exista para evitar duplicatas
    formElement.removeEventListener('submit', handleCreateStudent);
    formElement.addEventListener('submit', handleCreateStudent);
}

function hideCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'none';
    document.getElementById('createStudentFormElement').reset();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    const clickedButton = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
    if(clickedButton) clickedButton.classList.add('active');
}

// === LÓGICA DO JOGO (UPLOAD DE ÁUDIO, ETC.) ===

function handleAudioUpload(event) {
    const files = Array.from(event.target.files);
    const uploadStatus = document.getElementById('uploadStatus');
    let uploadCount = 0;

    if (files.length === 0) return;

    uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';

    files.forEach(file => {
        if (file.type.startsWith('audio/')) {
            const letter = file.name.charAt(0).toLowerCase();
            // Simples lógica para pegar a letra, pode ser melhorada
            if (letter >= 'a' && letter <= 'z') {
                const url = URL.createObjectURL(file);
                gameState.uploadedAudios[letter] = {
                    type: 'file',
                    url: url,
                    audio: new Audio(url),
                    fileName: file.name
                };
                uploadCount++;
            }
        }
    });

    if (uploadCount > 0) {
        uploadStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${uploadCount} áudio(s) carregado(s) com sucesso!`;
        const testButton = document.getElementById('testAudioButton');
        if(testButton) testButton.style.display = 'inline-block';
    } else {
        uploadStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Nenhum áudio válido encontrado.`;
    }
}

// Adicione aqui as outras funções do jogo que estavam faltando, como
// testUploadedAudios, startGame, generateQuestions, playCurrentAudio, etc.
// Se você não as tiver mais, podemos recriá-las.

// === FUNÇÃO DE FEEDBACK GLOBAL ===
function showFeedback(message, type = 'info') {
    const feedback = document.getElementById('globalFeedback');
    if (!feedback) return;
    const icon = feedback.querySelector('.feedback-icon');
    const text = feedback.querySelector('.feedback-text');
    icon.innerHTML = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    text.textContent = message;
    feedback.className = `feedback ${type} show`;
    setTimeout(() => { feedback.classList.remove('show'); }, 3000);
}

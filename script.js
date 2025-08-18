console.log("AVISO: Jogo das Letras - script.js foi carregado. Se você não vir mais nenhuma mensagem, verifique o HTML.");

// =======================================================
// PARTE 1: AUTENTICAÇÃO E GERENCIAMENTO (SUPABASE)
// =======================================================

const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentClassId = null;

// =======================================================
// PARTE 2: LÓGICA PRINCIPAL E EVENTOS
// =======================================================

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    console.log("AVISO: Aplicação iniciada (DOMContentLoaded). Anexando eventos...");
    if (!window.bcrypt) {
        console.error("ERRO CRÍTICO: A biblioteca bcrypt não foi carregada. Verifique a conexão com a internet ou o link no HTML.");
        alert("ERRO CRÍTICO: A biblioteca de criptografia não carregou. A criação de alunos não funcionará.");
        return;
    }
    setupAllEventListeners();
    await checkSession();
}

function setupAllEventListeners() {
    // Eventos de Navegação e Autenticação
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        if (type === 'teacher') showTeacherLogin();
        else if (type === 'student') showStudentLogin();
    }));

    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    
    // Eventos do Dashboard
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);

    // MUDANÇA IMPORTANTE: Evento de clique direto no botão
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    
    console.log("AVISO: Todos os eventos foram anexados com sucesso.");
}

// === Funções de Autenticação e Sessão ===

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        if (currentUser.user_metadata.role === 'teacher') await showTeacherDashboard();
        else showUserTypeScreen();
    } else {
        showUserTypeScreen();
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
// ... (outras funções de login/register permanecem iguais)
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

async function handleStudentLogin(e) {
    e.preventDefault();
    // Lógica de login do aluno
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentClassId = null;
    showUserTypeScreen();
}

// === Funções do Dashboard do Professor ===

async function showTeacherDashboard() {
    showScreen('teacherDashboard');
    await loadTeacherData();
}

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

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    container.innerHTML = classes.length === 0 ? '<p>Nenhuma turma criada ainda.</p>' : classes.map(cls => {
        const studentCount = cls.students[0]?.count || 0;
        return `
            <div class="class-card">
                <h3>${cls.name}</h3>
                <span class="student-count">👥 ${studentCount} aluno(s)</span>
                <div class="class-card-actions">
                    <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name}')">Gerenciar</button>
                    <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Excluir</button>
                </div>
            </div>`;
    }).join('');
}

async function handleCreateClass(e) {
    e.preventDefault();
    const name = document.getElementById('className').value;
    await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]);
    closeModal('createClassModal');
    await loadTeacherClasses();
    showFeedback('Turma criada com sucesso!', 'success');
    document.getElementById('createClassForm').reset();
}

async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    document.getElementById('manageClassModal').classList.add('show');
    showTab('students');
    await loadClassStudents();
}

async function loadClassStudents() {
    const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId);
    if (error) {
        console.error('Erro ao carregar alunos:', error.message);
        return;
    }
    renderStudents(data);
}

function renderStudents(students) {
    document.getElementById('studentsList').innerHTML = students.length === 0 ? '<p>Nenhum aluno cadastrado.</p>' : students.map(student => `
        <div class="student-item">
            <h4>${student.name}</h4>
            <p>Usuário: ${student.username}</p>
        </div>`).join('');
}


// A FUNÇÃO MAIS IMPORTANTE E CORRIGIDA
async function handleCreateStudent(event) {
    event.preventDefault(); // Previne qualquer comportamento padrão do botão
    console.log("FUNÇÃO 'handleCreateStudent' ACIONADA PELO CLIQUE!");

    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;
    const submitButton = document.getElementById('createStudentSubmitBtn');

    if (!username || !password) {
        showFeedback("Por favor, preencha o nome de usuário e a senha.", "error");
        return;
    }
    
    if (!currentClassId || !currentUser?.id) {
        showFeedback("Erro: Sessão do professor ou da turma não encontrada. Tente recarregar a página.", "error");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Criando...';

    try {
        const hashedPassword = await new Promise((resolve, reject) => {
            window.bcrypt.hash(password, 10, (err, hash) => {
                if (err) reject(err);
                else resolve(hash);
            });
        });

        const { error } = await supabaseClient.from('students').insert([{
            name: username,
            username,
            password: hashedPassword,
            class_id: currentClassId,
            teacher_id: currentUser.id
        }]);

        if (error) throw error;

        hideCreateStudentForm();
        await loadClassStudents();
        showFeedback('Aluno criado com sucesso!', 'success');
    } catch (error) {
        const message = error.message.includes('duplicate key') ? 'Este nome de usuário já existe.' : `Erro ao criar aluno: ${error.message}`;
        showFeedback(message, 'error');
        console.error("ERRO DETALHADO AO CRIAR ALUNO:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Aluno';
    }
}

// --- Funções de UI (Telas, Modais, etc.) ---

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}
function showUserTypeScreen() { showScreen('userTypeScreen'); }
function showTeacherLogin() { showScreen('teacherLoginScreen'); }
function showTeacherRegister() { showScreen('teacherRegisterScreen'); }
function showStudentLogin() { showScreen('studentLoginScreen'); }
function showCreateClassModal() { document.getElementById('createClassModal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'none';
    document.getElementById('createStudentFormElement').reset();
}
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`)?.classList.add('active');
}
function showFeedback(message, type = 'info') {
    const feedback = document.getElementById('globalFeedback');
    const icon = feedback.querySelector('.feedback-icon');
    const text = feedback.querySelector('.feedback-text');
    icon.innerHTML = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    text.textContent = message;
    feedback.className = `feedback ${type} show`;
    setTimeout(() => { feedback.classList.remove('show'); }, 4000);
}
// ... (outras funções auxiliares e de jogo)

// =======================================================
// PARTE 1: INICIALIZAÇÃO E CONFIGURAÇÃO
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

// A execução começa aqui, após o HTML ser totalmente carregado.
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    // Verifica se as bibliotecas externas carregaram
    if (!window.supabase || !window.bcrypt) {
        const errorMsg = "ERRO CRÍTICO: Bibliotecas essenciais (Supabase ou Bcrypt) não carregaram. Verifique a conexão com a internet.";
        console.error(errorMsg);
        alert(errorMsg);
        return;
    }
    
    setupAllEventListeners();
    await checkSession();
}

function setupAllEventListeners() {
    // Navegação inicial
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        if (type === 'teacher') showTeacherLogin();
        else if (type === 'student') showStudentLogin();
    }));

    // Formulários de Autenticação
    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    
    // Dashboard do Professor
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
}

// =======================================================
// PARTE 3: AUTENTICAÇÃO E SESSÃO
// =======================================================

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        if (currentUser.user_metadata.role === 'teacher') {
            await showTeacherDashboard();
        } else {
            showUserTypeScreen(); // Se um usuário não professor tem sessão, deslogue ou trate.
        }
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
    const username = document.getElementById('studentUsername').value;
    const password = document.getElementById('studentPassword').value;
    try {
        const { data, error } = await supabaseClient.from('students').select('password, id').eq('username', username).single();
        if (error || !data) throw new Error('Usuário ou senha inválidos.');
        
        const match = await bcrypt.compare(password, data.password);
        if (!match) throw new Error('Usuário ou senha inválidos.');

        // Se a senha bate, busca o resto dos dados do aluno
        const { data: studentData, error: studentError } = await supabaseClient.from('students').select('*').eq('id', data.id).single();
        if (studentError) throw studentError;

        currentUser = { ...studentData, type: 'student' };
        showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentClassId = null;
    showUserTypeScreen();
    showFeedback('Logout realizado.', 'success');
}

// =======================================================
// PARTE 4: DASHBOARD DO PROFESSOR
// =======================================================

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
        console.error('Erro ao carregar turmas:', error);
    }
}

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    container.innerHTML = !classes || classes.length === 0 ? '<p>Nenhuma turma criada ainda.</p>' : classes.map(cls => {
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
    if (!name) return;
    await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]);
    closeModal('createClassModal');
    await loadTeacherClasses();
    showFeedback('Turma criada com sucesso!', 'success');
    document.getElementById('createClassForm').reset();
}

async function handleDeleteClass(classId, className) {
    if (!confirm(`Tem certeza que deseja excluir a turma "${className}"? Todos os alunos serão removidos.`)) return;
    await supabaseClient.from('students').delete().eq('class_id', classId);
    await supabaseClient.from('classes').delete().eq('id', classId);
    await loadTeacherClasses();
    showFeedback('Turma excluída com sucesso!', 'success');
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
    if (error) return console.error('Erro ao carregar alunos:', error);
    renderStudents(data);
}

function renderStudents(students) {
    document.getElementById('studentsList').innerHTML = !students || students.length === 0 ? '<p>Nenhum aluno cadastrado.</p>' : students.map(student => `
        <div class="student-item">
            <h4>${student.name}</h4>
            <p>Usuário: ${student.username}</p>
        </div>`).join('');
}

async function handleCreateStudent(event) {
    event.preventDefault();
    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;
    const submitButton = document.getElementById('createStudentSubmitBtn');

    if (!username || !password) {
        return showFeedback("Por favor, preencha o nome de usuário e a senha.", "error");
    }
    if (!currentClassId || !currentUser?.id) {
        return showFeedback("Erro de sessão. Tente recarregar a página.", "error");
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Criando...';

    try {
        const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
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
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Aluno';
    }
}

// =======================================================
// PARTE 5: UI HELPERS E LÓGICA DO JOGO
// =======================================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

function showUserTypeScreen() { showScreen('userTypeScreen'); }
function showTeacherLogin() { showScreen('teacherLoginScreen'); }
function showTeacherRegister() { showScreen('teacherRegisterScreen'); }
function showStudentLogin() { showScreen('studentLoginScreen'); }
function showStudentGame() { showScreen('startScreen'); /* Lógica do jogo aqui */ }
function showCreateClassModal() { document.getElementById('createClassModal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'none';
    document.getElementById('createStudentFormElement').reset();
}
function showTab(tabName) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`)?.classList.add('active');
}
function showFeedback(message, type = 'info') {
    const feedback = document.getElementById('globalFeedback');
    if (!feedback) return;
    feedback.querySelector('.feedback-text').textContent = message;
    feedback.className = `feedback ${type} show`;
    setTimeout(() => feedback.classList.remove('show'), 4000);
}

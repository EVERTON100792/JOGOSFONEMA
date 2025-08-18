// Acessa o cliente Supabase que foi carregado no HTML
const { createClient } = supabase;

// Suas credenciais do Supabase
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';

// Cria o cliente Supabase que será usado em todo o código
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// === GERENCIAMENTO DE USUÁRIOS ===
let currentUser = null;
let currentClassId = null; // Adicionado para gerenciar a turma selecionada

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

        showFeedback('Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar sua conta e fazer login.', 'success');

    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        showFeedback(`Erro no cadastro: ${error.message}`, 'error');
    }
}

/**
 * Realiza o login do professor.
 */
async function handleTeacherLogin(e, email = null, password = null) {
    e.preventDefault();
    const loginEmail = email || document.getElementById('teacherEmail').value;
    const loginPassword = password || document.getElementById('teacherPassword').value;

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
            .select('*')
            .eq('username', username)
            .eq('password', password) // ATENÇÃO: Senha em texto plano!
            .single();

        if (error || !data) {
            throw new Error('Usuário ou senha inválidos.');
        }

        currentUser = { ...data, type: 'student' };
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

/**
 * Carrega os dados do professor (nome e turmas).
 */
async function loadTeacherData() {
    if (!currentUser) return;

    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) {
        teacherNameEl.textContent = currentUser.user_metadata.full_name || 'Professor(a)';
    }

    await loadTeacherClasses();
}

/**
 * Carrega as turmas do professor logado.
 */
async function loadTeacherClasses() {
    try {
        const { data, error } = await supabaseClient
            .from('classes')
            .select('*, students(*)') // Carrega as turmas e a contagem de alunos
            .eq('teacher_id', currentUser.id);

        if (error) throw error;

        renderClasses(data);
    } catch (error) {
        console.error('Erro ao carregar turmas:', error.message);
    }
}

/**
 * Cria uma nova turma.
 */
async function handleCreateClass(e) {
    e.preventDefault();
    const name = document.getElementById('className').value;

    try {
        const { data, error } = await supabaseClient
            .from('classes')
            .insert([{ name: name, teacher_id: currentUser.id }]);

        if (error) throw error;

        closeModal('createClassModal');
        await loadTeacherClasses();
        showFeedback('Turma criada com sucesso!', 'success');
        document.getElementById('createClassForm').reset();

    } catch (error) {
        console.error('Erro ao criar turma:', error.message);
        showFeedback('Erro ao criar turma.', 'error');
    }
}

/**
 * Carrega os alunos de uma turma específica.
 */
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

/**
 * Cria um novo aluno em uma turma.
 */
async function handleCreateStudent(e) {
    e.preventDefault();
    const name = document.getElementById('createStudentName').value;
    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;

    try {
        const { data, error } = await supabaseClient
            .from('students')
            .insert([{
                name,
                username,
                password, // ATENÇÃO: Senha em texto plano!
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
            // Se houver uma sessão ativa que não seja de professor,
            // redireciona para a tela inicial para evitar ficar preso.
            showUserTypeScreen();
        }
    } else {
        showUserTypeScreen();
    }
}

// Listener para mudanças no estado de autenticação
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        checkSession(); // Re-verifica a sessão sempre que o estado de autenticação muda
    }
});
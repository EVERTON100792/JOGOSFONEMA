// =======================================================
// PARTE 1: AUTENTICAÇÃO E GERENCIAMENTO (SUPABASE)
// =======================================================

const { createClient } = supabase;

const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';

const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentClassId = null;

// === Funções de Autenticação ===

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
        const { data, error } = await supabaseClient.from('students').select('password, id').eq('username', username).single();
        if (error || !data) throw new Error('Usuário ou senha inválidos.');
        
        if (!window.bcrypt.compareSync(password, data.password)) throw new Error('Usuário ou senha inválidos.');

        const { data: studentData, error: studentError } = await supabaseClient.from('students').select('*').eq('id', data.id).single();
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

// === Funções do Dashboard do Professor ===

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

// CORRIGIDO: Função para criar aluno usando bcrypt assíncrono
async function handleCreateStudent(e) {
    e.preventDefault();
    console.log("Iniciando a criação do aluno..."); // Para depuração

    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;

    if (!currentClassId || !currentUser?.id) {
        showFeedback("Erro: Não foi possível identificar a turma ou o professor.", "error");
        console.error("currentClassId ou currentUser.id está nulo.", { currentClassId, currentUser });
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Criando...';

    try {
        console.log("Criptografando a senha...");
        const hashedPassword = await new Promise((resolve, reject) => {
            window.bcrypt.hash(password, 10, (err, hash) => {
                if (err) reject(err);
                else resolve(hash);
            });
        });
        console.log("Senha criptografada. Inserindo no banco de dados...");

        const { error } = await supabaseClient.from('students').insert([{
            name: username,
            username, 
            password: hashedPassword,
            class_id: currentClassId, 
            teacher_id: currentUser.id
        }]);

        if (error) throw error;

        console.log("Aluno inserido com sucesso!");
        hideCreateStudentForm();
        await loadClassStudents();
        showFeedback('Aluno criado com sucesso!', 'success');
    } catch (error) {
        console.error("Erro explícito ao criar aluno:", error);
        const message = error.message.includes('duplicate key')
            ? 'Este nome de usuário já existe.'
            : `Erro ao criar aluno: ${error.message}`;
        showFeedback(message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Aluno';
        console.log("Processo de criação finalizado.");
    }
}

async function handleDeleteClass(classId, className) {
    const confirmation = confirm(`Tem certeza que deseja excluir a turma "${className}"? Todos os alunos associados também serão removidos.`);
    if (!confirmation) return;

    try {
        await supabaseClient.from('students').delete().eq('class_id', classId);
        await supabaseClient.from('classes').delete().eq('id', classId);
        await loadTeacherClasses();
        showFeedback('Turma excluída com sucesso!', 'success');
    } catch (error) {
        showFeedback(`Erro ao excluir turma: ${error.message}`, 'error');
    }
}

// =======================================================
// PARTE 2: LÓGICA DO JOGO E INTERFACE
// =======================================================

// --- Configurações e Estado do Jogo ---
const GAME_CONFIG = {
    minAccuracy: 95,
    maxAttempts: 2,
    questionsPerPhase: 10,
    maxPhases: 3,
};

let gameState = {
    currentPhase: 1,
    score: 0,
    attempts: GAME_CONFIG.maxAttempts,
    questions: [],
    currentQuestionIndex: 0,
    playerProgress: {},
    uploadedAudios: {}
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// --- Elementos do DOM ---
const elements = {
    progressFill: document.getElementById('progressFill'),
    scoreSpan: document.getElementById('score'),
    totalQuestionsSpan: document.getElementById('totalQuestions'),
    attemptsSpan: document.getElementById('attempts'),
    lettersGrid: document.getElementById('lettersGrid'),
    finalScore: document.getElementById('finalScore'),
    accuracy: document.getElementById('accuracy'),
    resultMessage: document.getElementById('resultMessage'),
    continueButton: document.getElementById('continueButton'),
    retryButton: document.getElementById('retryButton'),
};

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    setupAllEventListeners();
    
    // Verificação de sessão movida para cá para garantir que tudo esteja pronto
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
                const { data: studentData } = await supabaseClient.from('students').select('*').eq('id', id).single();
                if (studentData) {
                    currentUser = { ...studentData, type: 'student' };
                    await showStudentGame();
                } else {
                    localStorage.removeItem('studentSession');
                    showUserTypeScreen();
                }
            } catch {
                localStorage.removeItem('studentSession');
                showUserTypeScreen();
            }
        } else {
            showUserTypeScreen();
        }
    }
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

    // NOVO E CORRIGIDO: Evento de criar aluno registrado uma única vez aqui!
    document.getElementById('createStudentFormElement')?.addEventListener('submit', handleCreateStudent);

    // Eventos do Jogo
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

// --- Funções de Navegação de Tela e UI ---
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
    await loadPlayerProgress();
    initializeGame();
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
                    <div class="class-card-actions">
                        <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name}')">Gerenciar</button>
                        <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Excluir</button>
                    </div>
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

// --- Funções de Modal e Tabs ---
function showCreateClassModal() { document.getElementById('createClassModal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }

async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    document.getElementById('manageClassModal').classList.add('show');
    showTab('students');
    await loadClassStudents();
}

// CORRIGIDO: Esta função agora apenas mostra o formulário. O evento já foi registrado.
function showCreateStudentForm() {
    document.getElementById('createStudentForm').style.display = 'block';
}

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

// --- Lógica Principal do Jogo ---

function initializeGame() {
    gameState.currentPhase = gameState.playerProgress.current_phase || 1;
    updateUI();
    // createPlaceholderAudios(); // Função para áudios padrão, se necessário
}

function startGame() {
    gameState.attempts = GAME_CONFIG.maxAttempts;
    generateQuestions();
    showScreen('gameScreen');
    updateUI();
    startQuestion();
}

function generateQuestions() {
    gameState.questions = [];
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    const letters = [...ALPHABET].sort(() => 0.5 - Math.random());
    for (let i = 0; i < GAME_CONFIG.questionsPerPhase; i++) {
        const correctLetter = letters[i % letters.length];
        const options = generateLetterOptions(correctLetter);
        gameState.questions.push({ correctLetter, options });
    }
}

function generateLetterOptions(correctLetter) {
    const options = new Set([correctLetter]);
    const availableLetters = ALPHABET.filter(l => l !== correctLetter);
    while (options.size < 4) {
        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        options.add(availableLetters.splice(randomIndex, 1)[0]);
    }
    return Array.from(options).sort(() => 0.5 - Math.random());
}

function startQuestion() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) {
        endPhase();
        return;
    }
    document.getElementById('nextQuestion').style.display = 'none';
    updateProgress();
    document.getElementById('questionText').textContent = 'Qual letra faz este som?';
    renderLetterOptions(currentQuestion.options);
    setTimeout(playCurrentAudio, 1000);
}

function renderLetterOptions(options) {
    elements.lettersGrid.innerHTML = options.map(letter => 
        `<button class="letter-button">${letter}</button>`
    ).join('');
    
    document.querySelectorAll('.letter-button').forEach(btn => {
        btn.addEventListener('click', (e) => selectAnswer(e.target.textContent));
    });
}

function selectAnswer(selectedLetter) {
    const buttons = document.querySelectorAll('.letter-button');
    buttons.forEach(btn => btn.disabled = true);

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = selectedLetter === currentQuestion.correctLetter;

    buttons.forEach(btn => {
        if (btn.textContent === currentQuestion.correctLetter) btn.classList.add('correct');
        if (btn.textContent === selectedLetter && !isCorrect) btn.classList.add('incorrect');
    });

    if (isCorrect) {
        gameState.score++;
        showFeedback('Muito bem! Você acertou!', 'success');
    } else {
        showFeedback(`Quase! A resposta era ${currentQuestion.correctLetter}`, 'error');
    }

    updateUI();
    setTimeout(() => {
        document.getElementById('nextQuestion').style.display = 'block';
    }, 1500);
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        endPhase();
    } else {
        startQuestion();
    }
}

function endPhase() {
    const accuracy = Math.round((gameState.score / gameState.questions.length) * 100);
    const passed = accuracy >= GAME_CONFIG.minAccuracy;
    savePlayerProgress(passed);
    showResultScreen(accuracy, passed);
}

function showResultScreen(accuracy, passed) {
    elements.finalScore.textContent = gameState.score;
    elements.accuracy.textContent = accuracy;
    
    if (passed) {
        elements.resultMessage.textContent = 'Você passou de fase!';
        elements.continueButton.style.display = gameState.currentPhase < GAME_CONFIG.maxPhases ? 'inline-block' : 'none';
        elements.retryButton.style.display = 'none';
    } else {
        elements.resultMessage.textContent = `Você precisa de ${GAME_CONFIG.minAccuracy}% para passar. Tente novamente!`;
        elements.continueButton.style.display = 'none';
        elements.retryButton.style.display = 'inline-block';
    }
    showScreen('resultScreen');
}

function nextPhase() {
    if (gameState.currentPhase < GAME_CONFIG.maxPhases) {
        gameState.currentPhase++;
        startGame();
    }
}

function retryPhase() {
    gameState.attempts--;
    startGame();
}

function restartGame() {
    gameState.currentPhase = 1;
    showStudentGame();
}

// --- Funções Auxiliares (Áudio, UI, Progresso) ---

function updateUI() {
    document.getElementById('currentPhase').textContent = gameState.currentPhase;
    elements.scoreSpan.textContent = gameState.score;
    elements.totalQuestionsSpan.textContent = gameState.questions.length;
    elements.attemptsSpan.textContent = gameState.attempts;
}

function updateProgress() {
    const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;
    elements.progressFill.style.width = `${progress}%`;
}

function playCurrentAudio() {
    const letter = gameState.questions[gameState.currentQuestionIndex].correctLetter.toLowerCase();
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.lang = 'pt-BR';
    speechSynthesis.speak(utterance);
}

// Funções de upload de áudio (placeholders)
function handleAudioUpload(event) { showFeedback('Função de upload ainda não implementada.', 'info'); }
function testUploadedAudios() { showFeedback('Função de teste de áudio ainda não implementada.', 'info'); }

async function loadPlayerProgress() {
    if (!currentUser || currentUser.type !== 'student') return;
    try {
        const { data } = await supabaseClient.from('progress').select('*').eq('student_id', currentUser.id).single();
        if (data) gameState.playerProgress = data;
    } catch (error) {
        console.log("Nenhum progresso encontrado, começando do zero.");
        gameState.playerProgress = {};
    }
}

async function savePlayerProgress(passed) {
    if (!currentUser || currentUser.type !== 'student') return;
    const newPhase = passed ? Math.min(gameState.currentPhase + 1, GAME_CONFIG.maxPhases) : gameState.currentPhase;
    const progress = {
        student_id: currentUser.id,
        current_phase: newPhase,
        last_played: new Date().toISOString()
    };
    try {
        await supabaseClient.from('progress').upsert(progress, { onConflict: 'student_id' });
    } catch (error) {
        console.error("Erro ao salvar progresso:", error);
    }
}

// --- Função de Feedback Global ---
function showFeedback(message, type = 'info') {
    const feedback = document.getElementById('globalFeedback');
    if (!feedback) return;
    const icon = feedback.querySelector('.feedback-icon');
    const text = feedback.querySelector('.feedback-text');
    icon.innerHTML = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    text.textContent = message;
    feedback.className = `feedback ${type} show`;
    setTimeout(() => { feedback.classList.remove('show'); }, 4000);
}
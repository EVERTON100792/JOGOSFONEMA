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

async function handleCreateStudent(e) {
    e.preventDefault();
    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;

    if (!currentClassId || !currentUser?.id) {
        showFeedback("Erro: Não foi possível identificar a turma ou o professor.", "error");
        return;
    }

    try {
        const hashedPassword = window.bcrypt.hashSync(password, 10);
        // O nome de usuário é usado também como o nome do aluno.
        const { error } = await supabaseClient.from('students').insert([{
            name: username, // Usando username para o nome
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
        const message = error.message.includes('duplicate key')
            ? 'Este nome de usuário já existe.'
            : `Erro ao criar aluno: ${error.message}`;
        showFeedback(message, 'error');
    }
}

async function handleDeleteClass(classId, className) {
    const confirmation = confirm(`Tem certeza que deseja excluir a turma "${className}"? Todos os alunos associados também serão removidos.`);
    if (!confirmation) return;

    try {
        // Primeiro, excluir os alunos da turma
        const { error: studentError } = await supabaseClient.from('students').delete().eq('class_id', classId);
        if (studentError) throw studentError;

        // Depois, excluir a turma
        const { error: classError } = await supabaseClient.from('classes').delete().eq('id', classId);
        if (classError) throw classError;

        await loadTeacherClasses();
        showFeedback('Turma excluída com sucesso!', 'success');
    } catch (error) {
        showFeedback(`Erro ao excluir turma: ${error.message}`, 'error');
    }
}

// === Verificação de Sessão ===
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
    userTypeScreen: document.getElementById('userTypeScreen'),
    teacherLoginScreen: document.getElementById('teacherLoginScreen'),
    teacherRegisterScreen: document.getElementById('teacherRegisterScreen'),
    studentLoginScreen: document.getElementById('studentLoginScreen'),
    teacherDashboard: document.getElementById('teacherDashboard'),
    startScreen: document.getElementById('startScreen'),
    gameScreen: document.getElementById('gameScreen'),
    resultScreen: document.getElementById('resultScreen'),
    
    currentPhaseSpan: document.getElementById('currentPhase'),
    progressFill: document.getElementById('progressFill'),
    scoreSpan: document.getElementById('score'),
    totalQuestionsSpan: document.getElementById('totalQuestions'),
    attemptsSpan: document.getElementById('attempts'),
    lettersGrid: document.getElementById('lettersGrid'),
    questionText: document.getElementById('questionText'),
    helperText: document.getElementById('helperText'),
    
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
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

    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user ?? null;

    // Decide a tela inicial com base na sessão
    if (currentUser && currentUser.user_metadata.role === 'teacher') {
        await showTeacherDashboard();
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
                    showUserTypeScreen();
                }
            } catch {
                showUserTypeScreen();
            }
        } else {
            showUserTypeScreen();
        }
    }

    // Configura o listener para futuras mudanças de autenticação (logout, refresh de token)
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user ?? null;
        if (_event === 'SIGNED_OUT') {
            // Se a sessão for nula (logout), volta para a tela de seleção de usuário
            showUserTypeScreen();
        }
    });
}

function setupAllEventListeners() {
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
                        <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "'")}')">Excluir</button>
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

function showCreateStudentForm() {
    const formContainer = document.getElementById('createStudentForm');
    const formElement = document.getElementById('createStudentFormElement');
    
    formContainer.style.display = 'block';
    
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


// --- Lógica Principal do Jogo ---

function initializeGame() {
    gameState.currentPhase = gameState.playerProgress.current_phase || 1;
    updateUI();
    createPlaceholderAudios();
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
    
    const letters = [...ALPHABET];
    letters.sort(() => 0.5 - Math.random()); // Embaralhar

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
    elements.questionText.textContent = 'Qual letra faz este som?';
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
    buttons.forEach(btn => btn.disabled = true); // Desabilita botões

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = selectedLetter === currentQuestion.correctLetter;

    buttons.forEach(btn => {
        if (btn.textContent === currentQuestion.correctLetter) {
            btn.classList.add('correct');
        }
        if (btn.textContent === selectedLetter && !isCorrect) {
            btn.classList.add('incorrect');
        }
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
        elements.resultTitle.textContent = 'Parabéns!';
        elements.resultMessage.textContent = 'Você passou de fase!';
        elements.continueButton.style.display = gameState.currentPhase < GAME_CONFIG.maxPhases ? 'inline-block' : 'none';
        elements.retryButton.style.display = 'none';
    } else {
        elements.resultTitle.textContent = 'Quase lá!';
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
    generateQuestions();
    showScreen('gameScreen');
    updateUI();
    startQuestion();
}

function restartGame() {
    gameState.currentPhase = 1;
    showStudentGame();
}


// --- Funções Auxiliares do Jogo (Áudio, UI, Progresso) ---

function updateUI() {
    elements.currentPhaseSpan.textContent = gameState.currentPhase;
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
    const audioData = gameState.uploadedAudios[letter];
    
    if (audioData?.type === 'file') {
        audioData.audio.play();
    } else {
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
    }
}

function createPlaceholderAudios() {
    if ('speechSynthesis' in window) return; // Se o navegador suporta, não precisa criar nada.
    // Lógica para carregar áudios padrão se síntese de voz não for suportada
}

function handleAudioUpload(event) { /* ... Lógica completa de upload ... */ }
function testUploadedAudios() { /* ... Lógica de teste de áudio ... */ }

async function loadPlayerProgress() {
    if (!currentUser || currentUser.type !== 'student') return;
    try {
        const { data } = await supabaseClient.from('progress').select('*').eq('student_id', currentUser.id).single();
        if (data) gameState.playerProgress = data;
    } catch (error) {
        console.error("Nenhum progresso encontrado, começando do zero.");
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
    setTimeout(() => { feedback.classList.remove('show'); }, 3000);
}
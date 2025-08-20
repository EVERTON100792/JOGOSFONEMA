// =======================================================
// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
// =======================================================
const { createClient } = supabase;
// ATENÇÃO: Substitua pelas suas chaves do Supabase se forem diferentes
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentClassId = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = 'AEIOU'.split('');

// --- MODIFICADO: Adicionadas chaves para áudios customizáveis ---
const CUSTOM_AUDIO_KEYS = {
    'instruction_1': 'Instrução - Fase 1',
    'instruction_2': 'Instrução - Fase 2',
    'instruction_3': 'Instrução - Fase 3',
    'feedback_correct': 'Feedback - Acerto',
    'feedback_incorrect': 'Feedback - Erro'
};


let gameState = {};
let mediaRecorder;
let audioChunks = [];
let timerInterval;

// Variáveis globais para o sistema de voz
let speechReady = false;
let selectedVoice = null;


// =======================================================
// PARTE 2: CONTEÚDO DO JOGO (NOVAS FASES)
// =======================================================

const gameInstructions = {
    1: "Vamos começar! Eu vou fazer o som de uma letra. Ouça com atenção no alto-falante e depois clique na letra que você acha que é a certa. Você consegue!",
    2: "Que legal, você avançou! Agora, olhe bem para a figura. Qual é a VOGAL que começa o nome dela? Clique na vogal correta para a gente completar a palavra juntos!",
    3: "Você está indo super bem! O desafio agora é com SÍLABAS. Olhe a figura e escolha a sílaba que começa o nome dela. Vamos lá, você já é quase um expert!"
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

const PHASE_3_WORDS = [
    { word: 'BOLA', image: '⚽', syllable: 'BO' },
    { word: 'CASA', image: '🏠', syllable: 'CA' },
    { word: 'DADO', image: '🎲', syllable: 'DA' },
    { word: 'FACA', image: '🔪', syllable: 'FA' },
    { word: 'GATO', image: '🐈', syllable: 'GA' },
    { word: 'MACACO', image: '🐒', syllable: 'MA' },
    { word: 'PATO', image: '🦆', syllable: 'PA' },
    { word: 'SAPO', image: '🐸', syllable: 'SA' },
    { word: 'VACA', image: '🐄', syllable: 'VA' },
    { word: 'JANELA', image: '🖼️', syllable: 'JA' }
];

// =======================================================
// PARTE 3: CRIPTOGRAFIA E FUNÇÕES UTILITÁRIAS
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

    // --- CORRIGIDO: Lógica de persistência da sessão do aluno ---
    // Verifica se há dados de um aluno na sessionStorage.
    // A sessionStorage persiste enquanto a aba do navegador estiver aberta,
    // o que significa que, se o aluno recarregar a página, ele continuará logado.
    const studentSession = sessionStorage.getItem('currentUser');
    if (studentSession) {
        console.log("Sessão de aluno encontrada. Restaurando jogo...");
        currentUser = JSON.parse(studentSession);
        await startGame(); // Inicia o jogo diretamente para o aluno
    } else {
        await checkSession(); // Se não houver aluno, verifica a sessão do professor
    }
}

function setupAllEventListeners() {
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        if (type === 'teacher') showTeacherLogin();
        else if (type === 'student') showStudentLogin();
    }));

    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin);
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister);
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('createStudentSubmitBtn')?.addEventListener('click', handleCreateStudent);
    document.getElementById('uploadAudioBtn')?.addEventListener('click', handleAudioUpload);

    document.getElementById('generatePasswordBtn')?.addEventListener('click', () => {
        const passwordField = document.getElementById('createStudentPassword');
        passwordField.type = 'text';
        passwordField.value = generateRandomPassword();
        setTimeout(() => { passwordField.type = 'password'; }, 2000);
    });

    document.getElementById('recordBtn')?.addEventListener('click', startRecording);
    document.getElementById('stopBtn')?.addEventListener('click', stopRecording);
    document.getElementById('saveRecordingBtn')?.addEventListener('click', saveRecording);
    document.getElementById('closeTutorialBtn')?.addEventListener('click', hideTutorial);

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
            await logout(); // Se for um usuário não professor, desloga
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
        showFeedback('Cadastro realizado! Um link de confirmação foi enviado para o seu e-mail.', 'success');
        showTeacherLogin();
    } catch (error) {
        showFeedback(`Erro no cadastro: ${error.message}`, 'error');
    }
}

async function handleStudentLogin(e) {
    e.preventDefault();
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value.trim();
    
    if (!username || !password) {
        return showFeedback('Por favor, preencha o usuário e a senha.', 'error');
    }

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
        
        // --- CORRIGIDO: Salva os dados do aluno na sessionStorage ---
        // Isso garante que os dados persistam ao recarregar a página.
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

        await showStudentGame();
        showFeedback('Login realizado com sucesso!', 'success');
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentClassId = null;
    // --- CORRIGIDO: Limpa a sessionStorage ao sair ---
    sessionStorage.removeItem('currentUser');
    showUserTypeScreen();
}

function handleExitGame() {
    if (confirm('Tem certeza que deseja sair do jogo? Seu progresso ficará salvo.')) {
        // Apenas o professor usa a função logout() completa. Para o aluno, basta limpar a sessionStorage.
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        showUserTypeScreen();
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
                    <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma">
                        <i class="fas fa-trash"></i>
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
    showTab('studentsTab', document.querySelector('#manageClassModal .tab-btn'));
    await loadClassStudents();
    await loadStudentProgress();
    document.getElementById('manageClassModal').classList.add('show');
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
                <button onclick="handleResetStudentPassword('${student.id}', '${student.name}')" class="btn small" title="Resetar Senha">
                    <i class="fas fa-key"></i>
                </button>
                <button onclick="handleDeleteStudent('${student.id}', '${student.name}')" class="btn small danger" title="Excluir Aluno">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`).join('');
}

async function loadStudentProgress() {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando progresso...</p>';

    const { data: students, error: studentsError } = await supabaseClient
        .from('students')
        .select('id, name, assigned_phase')
        .eq('class_id', currentClassId);

    if (studentsError) {
        progressList.innerHTML = '<p class="error-text">Erro ao carregar lista de alunos.</p>';
        return;
    }
    if (students.length === 0) {
        progressList.innerHTML = '<p>Nenhum aluno nesta turma para exibir o progresso.</p>';
        return;
    }

    const studentIds = students.map(s => s.id);
    const { data: progresses, error: progressError } = await supabaseClient
        .from('progress')
        .select('*')
        .in('student_id', studentIds);

    if (progressError) {
        progressList.innerHTML = '<p class="error-text">Erro ao carregar o progresso dos alunos.</p>';
        return;
    }

    let html = students.map(student => {
        const progress = progresses.find(p => p.student_id === student.id);
        const assignedPhase = student.assigned_phase || 1;
        const currentPhase = progress?.current_phase || 'N/A';
        const score = progress?.game_state?.score ?? 0;
        const total = progress?.game_state?.questions?.length || 10;
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

        const phaseOptions = [1, 2, 3].map(phaseNum =>
            `<option value="${phaseNum}" ${assignedPhase === phaseNum ? 'selected' : ''}>
                Fase ${phaseNum}
            </option>`
        ).join('');

        return `
            <div class="student-item">
                <div class="student-info" style="width:100%;">
                    <h4>${student.name}</h4>
                    <p>Progresso na Fase ${currentPhase}: ${accuracy}% (${score}/${total})</p>
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

    progressList.innerHTML = html;
}

async function assignPhase(studentId, selectElement) {
    const newPhase = parseInt(selectElement.value);
    const studentName = selectElement.closest('.student-item').querySelector('h4').textContent;

    if (!confirm(`Deseja designar a Fase ${newPhase} para o aluno ${studentName}?\n\nAtenção: O progresso na fase atual será reiniciado para que ele comece a nova atividade do zero.`)) {
        await loadStudentProgress(); // Recarrega para reverter a seleção visualmente
        return;
    }

    try {
        const { error: assignError } = await supabaseClient
            .from('students')
            .update({ assigned_phase: newPhase })
            .eq('id', studentId);
        if (assignError) throw assignError;

        const newGameState = {
            currentPhase: newPhase, score: 0, attempts: 2,
            questions: generateQuestions(newPhase), currentQuestionIndex: 0, tutorialsShown: []
        };

        const { error: progressError } = await supabaseClient
            .from('progress')
            .upsert({ 
                student_id: studentId, current_phase: newPhase,
                game_state: newGameState, last_played: new Date().toISOString()
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
    submitButton.textContent = 'Criando...';

    try {
        const hashedPassword = await hashPassword(password);
        const { error } = await supabaseClient.from('students').insert([
            { name: username, username: username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }
        ]);

        if (error) throw error;

        document.getElementById('newStudentUsername').textContent = username;
        document.getElementById('newStudentPassword').textContent = password;
        
        const copyBtn = document.getElementById('copyCredentialsBtn');
        copyBtn.onclick = () => {
            const textToCopy = `Usuário: ${username}\nSenha: ${password}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showFeedback('Dados copiados!', 'success');
            }).catch(() => {
                showFeedback('Erro ao copiar.', 'error');
            });
        };

        document.getElementById('studentCreatedModal').classList.add('show');

        hideCreateStudentForm();
        await loadClassStudents();
        await loadStudentProgress();

    } catch (error) {
        console.error("Erro ao criar aluno:", error);
        const message = error.message.includes('duplicate key') 
            ? 'Este nome de usuário já existe.' 
            : `Erro ao criar aluno: ${error.message}`;
        showFeedback(message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Aluno';
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

async function handleAudioUpload() {
    //... (código sem alterações)
}
async function startRecording() {
    //... (código sem alterações)
}
function stopRecording() {
    //... (código sem alterações)
}

// --- MODIFICADO: Função de salvar gravação para aceitar chaves customizadas ---
async function saveRecording() {
    if (audioChunks.length === 0) return;
    const saveButton = document.getElementById('saveRecordingBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    const selectedItem = document.getElementById('letterSelect').value; // Pode ser 'A', 'instruction_1', etc.
    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' }); // Salvar como mp3
    const fileName = `${selectedItem}.mp3`;
    const filePath = `${currentUser.id}/${fileName}`;

    try {
        const { error } = await supabaseClient.storage
            .from('audio_uploads')
            .upload(filePath, audioBlob, {
                cacheControl: '3600',
                upsert: true, // Sobrescreve se já existir
            });
        if (error) throw error;
        showFeedback(`Áudio para "${selectedItem}" salvo com sucesso!`, 'success');
        
        // Limpa para a próxima gravação
        audioChunks = [];
        document.getElementById('audioPlayback').src = '';
    } catch (error) {
        showFeedback(`Erro ao salvar gravação: ${error.message}`, 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar Gravação';
    }
}
function startTimer() {
    //... (código sem alterações)
}
function stopTimer() {
    //... (código sem alterações)
}


// =======================================================
// PARTE 7: LÓGICA DO JOGO
// =======================================================
async function showStudentGame() {
    // Ao logar, o jogo carrega e vai para a tela inicial
    await startGame();
}

async function startGame() {
    await loadGameState();
    showScreen('startScreen'); // Sempre mostra a tela inicial antes de ir para o jogo
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
             const words_p3 = [...PHASE_3_WORDS].sort(() => 0.5 - Math.random());
             for (let i = 0; i < questionCount; i++) {
                 const item = words_p3[i % words_p3.length];
                 const allSyllables = PHASE_3_WORDS.map(w => w.syllable);
                 questions.push({ type: 'initial_syllable', word: item.word, image: item.image, correctAnswer: item.syllable, options: generateOptions(item.syllable, allSyllables, 4) });
             }
             break;
        default: 
             questions = generateQuestions(3);
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
        case 'initial_syllable': renderPhase3UI(currentQuestion); break;
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
    document.getElementById('wordDisplay').textContent = `__${question.word.substring(question.correctAnswer.length)}`;
    document.getElementById('questionText').textContent = 'Qual sílaba começa esta palavra?';
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
        // --- MODIFICADO: Usa áudio da professora para feedback ---
        playTeacherAudio('feedback_correct', 'Acertou');
        if(currentQuestion.type !== 'letter_sound') {
            document.getElementById('wordDisplay').textContent = currentQuestion.word;
        }
    } else {
        gameState.attempts--;
        showFeedback(`Quase! A resposta correta era ${currentQuestion.correctAnswer}`, 'error');
        // --- MODIFICADO: Usa áudio da professora para feedback ---
        playTeacherAudio('feedback_incorrect', 'Tente de novo');
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
    
    if (passed) {
        document.getElementById('resultTitle').textContent = 'Parabéns!';
        resultMessage.innerHTML = 'Você completou a atividade designada! 🏆<br>Fale com seu professor(a) para receber uma nova tarefa!';
        continueButton.style.display = 'none';
        retryButton.style.display = 'none';
    } else {
        document.getElementById('resultTitle').textContent = 'Não desanime!';
        resultMessage.textContent = 'Você precisa acertar mais para passar. Tente novamente!';
        continueButton.style.display = 'none';
        retryButton.style.display = 'inline-block';
    }
}

async function nextPhase() {
    // Esta função não é mais usada para progressão automática, mas pode ser mantida para futuras lógicas
    // Por segurança, vamos garantir que ela só funcione se a fase estiver liberada
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
    await saveGameState();
    showScreen('gameScreen');
    startQuestion();
}

async function restartGame() {
    showScreen('startScreen');
}

// --- MODIFICADO: Função genérica para tocar áudios da professora ---
async function playTeacherAudio(key, fallbackText, onEndCallback) {
    const teacherId = gameState.teacherId;
    if (!teacherId) {
        console.warn("ID do professor não encontrado, usando voz padrão.");
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
            // Se o áudio gravado não for encontrado, usa a voz padrão
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
    // --- MODIFICADO: Usa a nova função genérica ---
    playTeacherAudio(letter, letter); // O fallback é falar a própria letra
}

// =======================================================
// PARTE 8: SISTEMA DE VOZ E UI
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

function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId)?.classList.add('active'); }
function showUserTypeScreen() { showScreen('userTypeScreen'); }
function showTeacherLogin() { showScreen('teacherLoginScreen'); }
function showTeacherRegister() { showScreen('teacherRegisterScreen'); }
function showStudentLogin() { showScreen('studentLoginScreen'); }
function showCreateClassModal() { document.getElementById('createClassModal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'none'; document.getElementById('createStudentFormElement').reset(); }

// --- MODIFICADO: Preenche o seletor com as letras E os áudios customizáveis ---
function showAudioSettingsModal() {
    const letterSelect = document.getElementById('letterSelect');
    if (letterSelect) {
        let optionsHtml = '';

        // Adiciona as opções de áudios customizáveis
        optionsHtml += '<optgroup label="Instruções e Feedbacks">';
        for (const key in CUSTOM_AUDIO_KEYS) {
            optionsHtml += `<option value="${key}">${CUSTOM_AUDIO_KEYS[key]}</option>`;
        }
        optionsHtml += '</optgroup>';
        
        // Adiciona as letras do alfabeto
        optionsHtml += '<optgroup label="Letras do Alfabeto">';
        optionsHtml += ALPHABET.map(letter => `<option value="${letter}">Letra ${letter}</option>`).join('');
        optionsHtml += '</optgroup>';

        letterSelect.innerHTML = optionsHtml;
    }
    document.getElementById('audioSettingsModal').classList.add('show');
    showTab('uploadFileTab', document.querySelector('#audioSettingsModal .tab-btn'));
}

function showTab(tabId, clickedButton) {
    const parent = clickedButton.closest('.modal-content');
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
    }, 3000);
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
    
    overlay.style.display = 'flex';
    mascot.classList.add('talking');
    
    // --- MODIFICADO: Usa a voz da professora para a instrução ---
    const audioKey = `instruction_${phaseNumber}`;
    playTeacherAudio(audioKey, instruction, () => mascot.classList.remove('talking'));

    gameState.tutorialsShown.push(phaseNumber);
    await saveGameState();
}

function hideTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'none';
}

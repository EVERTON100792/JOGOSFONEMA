// =======================================================
// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
// =======================================================
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentClassId = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let gameState = {};
let mediaRecorder;
let audioChunks = [];
let timerInterval;

const gameInstructions = {
    1: "Olá! Nesta fase, ouça o som com atenção e clique na letra correspondente. Boa sorte!",
    2: "Parabéns! Na fase 2, vamos formar sílabas. Ouça o som e escolha a sílaba correta.",
};

// =======================================================
// PARTE 2: CRIPTOGRAFIA E FUNÇÕES UTILITÁRIAS
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
// PARTE 3: LÓGICA PRINCIPAL E EVENTOS
// =======================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    if (!window.supabase) {
        alert("ERRO CRÍTICO: O sistema de banco de dados (Supabase) não carregou. Verifique sua conexão com a internet.");
        return;
    }
    setupAllEventListeners();
    await checkSession();
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

    document.getElementById('startButton')?.addEventListener('click', startGame);
    document.getElementById('playAudioButton')?.addEventListener('click', playCurrentAudio);
    document.getElementById('repeatAudio')?.addEventListener('click', playCurrentAudio);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('continueButton')?.addEventListener('click', nextPhase);
    document.getElementById('retryButton')?.addEventListener('click', retryPhase);
    document.getElementById('restartButton')?.addEventListener('click', restartGame);
}

// =======================================================
// PARTE 4: AUTENTICAÇÃO E SESSÃO
// =======================================================
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
    } catch (error) {
        showFeedback(`Erro no cadastro: ${error.message}`, 'error');
    }
}

async function handleStudentLogin(e) {
    e.preventDefault();
    const username = document.getElementById('studentUsername').value;
    const password = document.getElementById('studentPassword').value;
    try {
        const { data: studentData, error } = await supabaseClient.from('students').select('*').eq('username', username).single();
        if (error || !studentData) throw new Error('Usuário ou senha inválidos.');
        
        const match = await verifyPassword(password, studentData.password);
        if (!match) throw new Error('Usuário ou senha inválidos.');

        currentUser = { ...studentData, type: 'student' };
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
    showUserTypeScreen();
}

// =======================================================
// PARTE 5: DASHBOARD DO PROFESSOR
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
    if (error) return console.error('Erro ao carregar turmas:', error);
    renderClasses(data);
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
    await supabaseClient.from('classes').insert([{ name, teacher_id: currentUser.id }]);
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
    showTab('students', document.querySelector('#manageClassModal .tab-btn'));
    await loadClassStudents();
    await loadStudentProgress();
    document.getElementById('manageClassModal').classList.add('show');
}

async function loadClassStudents() {
    const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId);
    if (error) return console.error('Erro ao carregar alunos:', error);
    renderStudents(data);
}

function renderStudents(students) {
    document.getElementById('studentsList').innerHTML = !students || students.length === 0 ? '<p>Nenhum aluno cadastrado.</p>' : students.map(student => `
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
    progressList.innerHTML = '<p>Carregando...</p>';
    const { data: students, error: studentsError } = await supabaseClient.from('students').select('id, name').eq('class_id', currentClassId);
    if (studentsError) return progressList.innerHTML = '<p>Erro ao carregar alunos.</p>';
    if (students.length === 0) return progressList.innerHTML = '<p>Nenhum aluno nesta turma.</p>';
    const { data: progresses, error: progressError } = await supabaseClient.from('progress').select('*').in('student_id', students.map(s => s.id));
    if (progressError) return progressList.innerHTML = '<p>Erro ao carregar progresso.</p>';
    let html = students.map(student => {
        const progress = progresses.find(p => p.student_id === student.id);
        const phase = progress?.current_phase || 1;
        const score = progress?.game_state?.score ?? 0;
        const total = progress?.game_state?.questions?.length || 10;
        return `<div class="student-item"><h4>${student.name}</h4><p>Fase Atual: ${phase}</p><p>Pontuação na Fase: ${score} / ${total}</p></div>`;
    }).join('');
    progressList.innerHTML = html;
}

async function handleCreateStudent(event) {
    event.preventDefault();
    const username = document.getElementById('createStudentUsername').value;
    const password = document.getElementById('createStudentPassword').value;
    const submitButton = document.getElementById('createStudentSubmitBtn');
    if (!username || !password) return showFeedback("Por favor, preencha todos os campos.", "error");
    if (!currentClassId || !currentUser?.id) return showFeedback("Erro de sessão. Recarregue a página.", "error");
    submitButton.disabled = true;
    submitButton.textContent = 'Criando...';
    try {
        const hashedPassword = await hashPassword(password);
        const { error } = await supabaseClient.from('students').insert([{ name: username, username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }]);
        if (error) throw error;
        hideCreateStudentForm();
        await loadClassStudents();
        await loadStudentProgress();
        showFeedback('Aluno criado com sucesso!', 'success');
    } catch (error) {
        const message = error.message.includes('duplicate key') ? 'Este nome de usuário já existe.' : `Erro ao criar aluno: ${error.message}`;
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
    if (!prompt(`A nova senha para "${studentName}" é:\n\n${newPassword}\n\nAnote-a e entregue ao aluno. Copie a senha abaixo e clique em OK para confirmar a alteração.`, newPassword)) return;
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
    const files = document.getElementById('audioUpload').files;
    if (files.length === 0) return showFeedback('Nenhum arquivo selecionado.', 'error');
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = 'Enviando...';
    for (const file of files) {
        const letter = file.name.split('.')[0].toUpperCase();
        if (!ALPHABET.includes(letter)) {
            showFeedback(`Arquivo "${file.name}" ignorado. Nome inválido.`, 'error');
            continue;
        }
        const filePath = `${currentUser.id}/${letter}.${file.name.split('.').pop()}`;
        const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true });
        if (error) showFeedback(`Erro ao enviar ${file.name}: ${error.message}`, 'error');
        else showFeedback(`Áudio da letra ${letter} enviado com sucesso!`, 'success');
    }
    statusDiv.innerHTML = 'Envio concluído.';
}

async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('Seu navegador não suporta a gravação de áudio.');
    const statusDiv = document.getElementById('recordStatus');
    statusDiv.textContent = 'Pedindo permissão para o microfone...';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        statusDiv.textContent = 'Gravando...';
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            document.getElementById('audioPlayback').src = URL.createObjectURL(audioBlob);
            document.getElementById('saveRecordingBtn').disabled = false;
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        startTimer();
    } catch (err) {
        statusDiv.textContent = 'Permissão para microfone negada ou não encontrado.';
        document.getElementById('recordBtn').disabled = false;
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('recordStatus').textContent = 'Gravação parada. Ouça e salve.';
        stopTimer();
    }
}

async function saveRecording() {
    const letter = document.getElementById('letterSelect').value;
    if (audioChunks.length === 0) return showFeedback('Nenhuma gravação para salvar.', 'error');
    const statusDiv = document.getElementById('recordStatus');
    statusDiv.textContent = `Salvando áudio para a letra ${letter}...`;
    document.getElementById('saveRecordingBtn').disabled = true;
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const file = new File([audioBlob], `${letter}.webm`, { type: 'audio/webm' });
    const filePath = `${currentUser.id}/${file.name}`;
    const { error } = await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true });
    if (error) {
        showFeedback(`Erro ao salvar gravação: ${error.message}`, 'error');
        statusDiv.textContent = 'Erro ao salvar.';
    } else {
        showFeedback(`Áudio da letra ${letter} salvo com sucesso!`, 'success');
        statusDiv.textContent = 'Salvo com sucesso!';
    }
    document.getElementById('saveRecordingBtn').disabled = false;
}

function startTimer() {
    let seconds = 0;
    const timerEl = document.getElementById('recordTimer');
    timerEl.textContent = '00:00';
    timerInterval = setInterval(() => {
        seconds++;
        const min = Math.floor(seconds / 60).toString().padStart(2, '0');
        const sec = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${min}:${sec}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// =======================================================
// PARTE 6: LÓGICA DO JOGO
// =======================================================
async function showStudentGame() {
    showScreen('startScreen');
}

async function startGame() {
    await loadGameState();
    await showTutorial(gameState.currentPhase);
    showScreen('gameScreen');
    startQuestion();
}

async function loadGameState() {
    const { data } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single();
    if (data && data.game_state && data.game_state.questions && data.game_state.currentQuestionIndex < data.game_state.questions.length) {
        gameState = data.game_state;
        if (!gameState.tutorialsShown) gameState.tutorialsShown = [];
    } else {
        gameState = {
            currentPhase: data?.current_phase || 1,
            score: 0,
            attempts: 2,
            questions: generateQuestions(),
            currentQuestionIndex: 0,
            teacherId: currentUser.teacher_id,
            tutorialsShown: []
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

function generateQuestions() {
    const letters = [...ALPHABET].sort(() => 0.5 - Math.random());
    const questions = [];
    for (let i = 0; i < 10; i++) {
        const correctLetter = letters[i % letters.length];
        const options = generateLetterOptions(correctLetter);
        questions.push({ correctLetter, options });
    }
    return questions;
}

function generateLetterOptions(correctLetter) {
    const options = new Set([correctLetter]);
    const availableLetters = ALPHABET.filter(l => l !== correctLetter);
    while (options.size < 4) {
        options.add(availableLetters.splice(Math.floor(Math.random() * availableLetters.length), 1)[0]);
    }
    return Array.from(options).sort(() => 0.5 - Math.random());
}

function startQuestion() {
    if (!gameState.questions || gameState.currentQuestionIndex >= gameState.questions.length) {
        return endPhase();
    }
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    document.getElementById('nextQuestion').style.display = 'none';
    updateUI();
    document.getElementById('questionText').textContent = 'Qual letra faz este som?';
    renderLetterOptions(currentQuestion.options);
    setTimeout(playCurrentAudio, 500);
}

function renderLetterOptions(options) {
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = options.map(letter => `<button class="letter-button">${letter}</button>`).join('');
    lettersGrid.querySelectorAll('.letter-button').forEach(btn => btn.addEventListener('click', (e) => selectAnswer(e.target.textContent)));
}

async function selectAnswer(selectedLetter) {
    document.querySelectorAll('.letter-button').forEach(btn => btn.disabled = true);
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = selectedLetter === currentQuestion.correctLetter;
    document.querySelectorAll('.letter-button').forEach(btn => {
        if (btn.textContent === currentQuestion.correctLetter) btn.classList.add('correct');
        if (btn.textContent === selectedLetter && !isCorrect) btn.classList.add('incorrect');
    });
    if (isCorrect) {
        gameState.score++;
        showFeedback('Muito bem! Você acertou!', 'success');
        speak('Acertou');
    } else {
        showFeedback(`Quase! A resposta correta era ${currentQuestion.correctLetter}`, 'error');
        speak('Errado');
    }
    await saveGameState();
    updateUI();
    setTimeout(() => document.getElementById('nextQuestion').style.display = 'block', 1500);
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    startQuestion();
}

function endPhase() {
    const accuracy = Math.round((gameState.score / gameState.questions.length) * 100);
    showResultScreen(accuracy, accuracy >= 70);
}

function showResultScreen(accuracy, passed) {
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = accuracy;
    if (passed) {
        document.getElementById('resultMessage').textContent = 'Você passou de fase! Ótimo trabalho!';
        document.getElementById('continueButton').style.display = 'inline-block';
        document.getElementById('retryButton').style.display = 'none';
    } else {
        document.getElementById('resultMessage').textContent = `Você precisa de mais acertos para passar. Tente novamente!`;
        document.getElementById('continueButton').style.display = 'none';
        document.getElementById('retryButton').style.display = 'inline-block';
    }
    showScreen('resultScreen');
}

async function nextPhase() {
    gameState.currentPhase++;
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.questions = generateQuestions();
    await saveGameState();
    await showTutorial(gameState.currentPhase);
    showScreen('gameScreen');
    startQuestion();
}

async function retryPhase() {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.questions = generateQuestions();
    await saveGameState();
    showScreen('gameScreen');
    startQuestion();
}

async function restartGame() {
    showScreen('startScreen');
}

async function playCurrentAudio() {
    const letter = gameState.questions[gameState.currentQuestionIndex].correctLetter;
    const teacherId = gameState.teacherId;
    const { data } = await supabaseClient.storage.from('audio_uploads').list(teacherId, { search: `${letter}.` });
    if (data && data.length > 0) {
        const { data: { publicUrl } } = supabaseClient.storage.from('audio_uploads').getPublicUrl(`${teacherId}/${data[0].name}`);
        new Audio(publicUrl).play();
    } else {
        speak(letter);
    }
}

function speak(text, onEndCallback) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    if (onEndCallback) utterance.onend = onEndCallback;
    speechSynthesis.speak(utterance);
}

// =======================================================
// PARTE 7: FUNÇÕES DE UI (INTERFACE DO USUÁRIO)
// =======================================================
function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId)?.classList.add('active'); }
function showUserTypeScreen() { showScreen('userTypeScreen'); }
function showTeacherLogin() { showScreen('teacherLoginScreen'); }
function showTeacherRegister() { showScreen('teacherRegisterScreen'); }
function showStudentLogin() { showScreen('studentLoginScreen'); }
function showCreateClassModal() { document.getElementById('createClassModal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function showCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'block'; }
function hideCreateStudentForm() { document.getElementById('createStudentForm').style.display = 'none'; document.getElementById('createStudentFormElement').reset(); }

function showAudioSettingsModal() {
    const letterSelect = document.getElementById('letterSelect');
    if (letterSelect) letterSelect.innerHTML = ALPHABET.map(letter => `<option value="${letter}">${letter}</option>`).join('');
    document.getElementById('audioSettingsModal').classList.add('show');
}

function showTab(tabName, clickedButton) {
    const parent = clickedButton.closest('.modal-tabs');
    parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    const contentParent = clickedButton.closest('.modal-content');
    contentParent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    contentParent.querySelector('#' + tabName + 'Tab').classList.add('active');
}

function showFeedback(message, type = 'info') {
    const el = document.getElementById('globalFeedback');
    if (!el) return;
    const textEl = el.querySelector('.feedback-text') || el;
    textEl.textContent = message;
    el.className = `feedback ${type} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
}

function updateUI() {
    const gameScreen = document.getElementById('gameScreen');
    if(gameScreen.classList.contains('active')) {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('totalQuestions').textContent = gameState.questions.length;
        document.getElementById('attempts').textContent = gameState.attempts;
        document.getElementById('currentPhase').textContent = gameState.currentPhase;
        const progress = gameState.questions.length > 0 ? ((gameState.currentQuestionIndex) / gameState.questions.length) * 100 : 0;
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
    speak(instruction, () => mascot.classList.remove('talking'));
    gameState.tutorialsShown.push(phaseNumber);
    await saveGameState();
}

function hideTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'none';
}

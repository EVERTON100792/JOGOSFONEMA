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
const VOWELS = 'AEIOU'.split('');

let gameState = {};
let mediaRecorder;
let audioChunks = [];
let timerInterval;

// =======================================================
// PARTE 2: CONTEÚDO DO JOGO
// =======================================================
const gameInstructions = {
    1: "Olá! Nesta fase, ouça o som e clique na letra correspondente. Boa sorte!",
    2: "Legal! Agora, vamos descobrir a primeira letra. Veja a imagem e clique na vogal que começa o nome dela!",
    3: "Você está indo muito bem! Nesta fase, escolha a sílaba que começa o nome da figura. Vamos lá!"
};
const PHASE_2_WORDS = [ { word: 'ABELHA', image: '🐝', vowel: 'A' }, { word: 'ELEFANTE', image: '🐘', vowel: 'E' }, { word: 'IGREJA', image: '⛪', vowel: 'I' }, { word: 'ÔNIBUS', image: '🚌', vowel: 'O' }, { word: 'UVA', image: '🍇', vowel: 'U' }, { word: 'AVIÃO', image: '✈️', vowel: 'A' }, { word: 'ESTRELA', image: '⭐', vowel: 'E' }, { word: 'ÍNDIO', image: '🏹', vowel: 'I' }, { word: 'OVO', image: '🥚', vowel: 'O' }, { word: 'URSO', image: '🐻', vowel: 'U' }];
const PHASE_3_WORDS = [ { word: 'BOLA', image: '⚽', syllable: 'BO' }, { word: 'CASA', image: '🏠', syllable: 'CA' }, { word: 'DADO', image: '🎲', syllable: 'DA' }, { word: 'FACA', image: '🔪', syllable: 'FA' }, { word: 'GATO', image: '🐈', syllable: 'GA' }, { word: 'MACACO', image: '🐒', syllable: 'MA' }, { word: 'PATO', image: '🦆', syllable: 'PA' }, { word: 'SAPO', image: '🐸', syllable: 'SA' }, { word: 'VACA', image: '🐄', syllable: 'VA' }, { word: 'JANELA', image: '🖼️', syllable: 'JA' }];

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
        alert("ERRO CRÍTICO: O sistema de banco de dados (Supabase) não carregou.");
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
        passwordField.value = generateRandomPassword();
        passwordField.type = 'text';
        document.getElementById('togglePasswordBtn').textContent = '🙈';
    });
    document.getElementById('togglePasswordBtn')?.addEventListener('click', (e) => {
        const passwordField = document.getElementById('createStudentPassword');
        const isPassword = passwordField.type === 'password';
        passwordField.type = isPassword ? 'text' : 'password';
        e.target.textContent = isPassword ? '🙈' : '👁️';
    });
    document.getElementById('copyCredentialsBtn')?.addEventListener('click', () => {
        const username = document.getElementById('confirmStudentUsername').textContent;
        const password = document.getElementById('confirmStudentPassword').textContent;
        const textToCopy = `Usuário: ${username}\nSenha: ${password}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showFeedback('Dados copiados!', 'success');
        }, () => {
            showFeedback('Erro ao copiar.', 'error');
        });
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
        showFeedback('Cadastro realizado! Verifique seu e-mail.', 'success');
        showTeacherLogin();
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
                    <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button>
                    <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma"><i class="fas fa-trash"></i></button>
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
    if (!confirm(`ATENÇÃO!\n\nDeseja excluir a turma "${className}"?\nTodos os alunos e progressos serão apagados.`)) return;
    showFeedback('Excluindo turma...', 'info');
    const { error } = await supabaseClient.from('classes').delete().eq('id', classId);
    if (error) showFeedback(`Erro ao excluir: ${error.message}`, 'error');
    else {
        showFeedback(`Turma "${className}" excluída!`, 'success');
        await loadTeacherClasses();
    }
}
async function manageClass(classId, className) {
    currentClassId = classId;
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    showTab('studentsTab', document.querySelector('#manageClassModal .tab-btn'));
    await loadClassStudents();
    await loadStudentProgress();
    showModal('manageClassModal');
}
async function loadClassStudents() {
    const { data, error } = await supabaseClient.from('students').select('*').eq('class_id', currentClassId).order('name', { ascending: true });
    if (error) return console.error('Erro ao carregar alunos:', error);
    renderStudents(data);
}
function renderStudents(students) {
    const container = document.getElementById('studentsList');
    container.innerHTML = !students || students.length === 0 ? '<p>Nenhum aluno cadastrado.</p>' : students.map(student => `
        <div class="student-item">
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Usuário: ${student.username}</p>
            </div>
            <div class="student-actions">
                <button onclick="handleResetStudentPassword('${student.id}', '${student.name}')" class="btn small" title="Resetar Senha"><i class="fas fa-key"></i></button>
                <button onclick="handleDeleteStudent('${student.id}', '${student.name}')" class="btn small danger" title="Excluir Aluno"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}
async function loadStudentProgress() {
    const progressList = document.getElementById('studentProgressList');
    progressList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
    const { data: students, error: studentsError } = await supabaseClient.from('students').select('id, name').eq('class_id', currentClassId);
    if (studentsError) return progressList.innerHTML = '<p>Erro ao carregar alunos.</p>';
    if (students.length === 0) return progressList.innerHTML = '<p>Nenhum aluno nesta turma.</p>';
    const studentIds = students.map(s => s.id);
    const { data: progresses, error: progressError } = await supabaseClient.from('progress').select('*').in('student_id', studentIds);
    if (progressError) return progressList.innerHTML = '<p>Erro ao carregar progresso.</p>';
    progressList.innerHTML = students.map(student => {
        const progress = progresses.find(p => p.student_id === student.id);
        if (!progress) return `<div class="student-item"><div class="student-info"><h4>${student.name}</h4><p>Nenhum progresso.</p></div></div>`;
        const { current_phase: phase = 1, game_state: state = {} } = progress;
        const { score = 0, questions = [], currentQuestionIndex = 0 } = state;
        const total = questions.length || 10;
        const percentage = total > 0 ? (currentQuestionIndex / total) * 100 : 0;
        return `
            <div class="student-item">
                <div class="student-info" style="width:100%;">
                    <h4>${student.name}</h4>
                    <p>Fase: ${phase} | Pontos: ${score}/${total}</p>
                    <div class="student-progress-container">
                        <div class="student-progress-bar"><div class="student-progress-fill" style="width: ${percentage}%;"></div></div>
                    </div>
                </div>
            </div>`;
    }).join('');
}
async function handleCreateStudent(event) {
    event.preventDefault();
    const username = document.getElementById('createStudentUsername').value.trim();
    const plainPassword = document.getElementById('createStudentPassword').value;
    const submitButton = document.getElementById('createStudentSubmitBtn');
    if (!username || !plainPassword) return showFeedback("Preencha nome e senha.", "error");
    submitButton.disabled = true;
    submitButton.textContent = 'Criando...';
    try {
        const hashedPassword = await hashPassword(plainPassword);
        const { error } = await supabaseClient.from('students').insert([{ name: username, username, password: hashedPassword, class_id: currentClassId, teacher_id: currentUser.id }]);
        if (error) throw error;
        hideCreateStudentForm();
        document.getElementById('confirmStudentUsername').textContent = username;
        document.getElementById('confirmStudentPassword').textContent = plainPassword;
        showModal('studentCreatedModal');
        await loadClassStudents();
        await loadStudentProgress();
    } catch (error) {
        const message = error.message.includes('duplicate key') ? 'Este nome de usuário já existe.' : `Erro: ${error.message}`;
        showFeedback(message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Aluno';
    }
}
async function handleDeleteStudent(studentId, studentName) {
    if (!confirm(`Deseja excluir o aluno "${studentName}"?`)) return;
    const { error } = await supabaseClient.from('students').delete().eq('id', studentId);
    if (error) showFeedback(`Erro: ${error.message}`, 'error');
    else {
        showFeedback(`Aluno "${studentName}" excluído.`, 'success');
        await loadClassStudents();
        await loadStudentProgress();
    }
}
async function handleResetStudentPassword(studentId, studentName) {
    const newPassword = generateRandomPassword();
    if (!prompt(`A nova senha para "${studentName}" é:\n\n${newPassword}\n\nCopie e clique OK.`, newPassword)) return;
    try {
        const hashedPassword = await hashPassword(newPassword);
        const { error } = await supabaseClient.from('students').update({ password: hashedPassword }).eq('id', studentId);
        if (error) throw error;
        showFeedback(`Senha de "${studentName}" alterada!`, 'success');
    } catch (error) {
        showFeedback(`Erro ao resetar: ${error.message}`, 'error');
    }
}
async function handleAudioUpload() {
    const files = document.getElementById('audioUpload').files;
    if (files.length === 0) return showFeedback('Nenhum arquivo selecionado.', 'error');
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = 'Enviando...';
    for (const file of files) {
        const letter = file.name.split('.')[0].toUpperCase();
        if (!ALPHABET.includes(letter)) continue;
        const filePath = `${currentUser.id}/${letter}.${file.name.split('.').pop()}`;
        await supabaseClient.storage.from('audio_uploads').upload(filePath, file, { upsert: true });
    }
    statusDiv.innerHTML = 'Envio concluído.';
}
async function startRecording() { /* ...código sem alterações... */ }
function stopRecording() { /* ...código sem alterações... */ }
async function saveRecording() { /* ...código sem alterações... */ }
function startTimer() { /* ...código sem alterações... */ }
function stopTimer() { /* ...código sem alterações... */ }

// =======================================================
// PARTE 7: LÓGICA DO JOGO
// =======================================================
async function showStudentGame() { showScreen('startScreen'); }
async function startGame() { await loadGameState(); showScreen('gameScreen'); await showTutorial(gameState.currentPhase); startQuestion(); }
async function loadGameState() {
    const { data } = await supabaseClient.from('progress').select('game_state, current_phase').eq('student_id', currentUser.id).single();
    if (data && data.game_state && data.game_state.questions && data.game_state.currentQuestionIndex < data.game_state.questions.length) {
        gameState = data.game_state;
        if (!gameState.tutorialsShown) gameState.tutorialsShown = [];
    } else {
        const currentPhase = data?.current_phase || 1;
        gameState = { currentPhase, score: 0, attempts: 2, questions: generateQuestions(currentPhase), currentQuestionIndex: 0, teacherId: currentUser.teacher_id, tutorialsShown: [] };
        await saveGameState();
    }
}
async function saveGameState() {
    if (!currentUser || currentUser.type !== 'student') return;
    await supabaseClient.from('progress').upsert({ student_id: currentUser.id, current_phase: gameState.currentPhase, game_state: gameState, last_played: new Date().toISOString() }, { onConflict: 'student_id' });
}
function generateQuestions(phase) {
    let questions = []; const count = 10;
    switch (phase) {
        case 1: const l = [...ALPHABET].sort(() => .5-Math.random()); for(let i=0;i<count;i++){const c=l[i%l.length];questions.push({type:'letter_sound',correctAnswer:c,options:generateOptions(c,ALPHABET,4)})} break;
        case 2: const w2=[...PHASE_2_WORDS].sort(() => .5-Math.random()); for(let i=0;i<count;i++){const item=w2[i%w2.length];questions.push({type:'initial_vowel',word:item.word,image:item.image,correctAnswer:item.vowel,options:generateOptions(item.vowel,VOWELS,4)})} break;
        case 3: const w3=[...PHASE_3_WORDS].sort(() => .5-Math.random()); const allSyllables=PHASE_3_WORDS.map(w=>w.syllable); for(let i=0;i<count;i++){const item=w3[i%w3.length];questions.push({type:'initial_syllable',word:item.word,image:item.image,correctAnswer:item.syllable,options:generateOptions(item.syllable,allSyllables,4)})} break;
        default: questions=generateQuestions(3); break;
    }
    return questions;
}
function generateOptions(correct, source, count) { let opts=new Set([correct]); const avail=source.filter(i=>i!==correct); while(opts.size<count&&avail.length>0){opts.add(avail.splice(Math.floor(Math.random()*avail.length),1)[0])} return [...opts].sort(() => .5 - Math.random()) }
function startQuestion() {
    if (!gameState.questions || gameState.currentQuestionIndex >= gameState.questions.length) return endPhase();
    const q = gameState.questions[gameState.currentQuestionIndex];
    document.getElementById('nextQuestion').style.display = 'none';
    updateUI();
    switch(q.type){ case 'letter_sound': renderPhase1UI(q); break; case 'initial_vowel': renderPhase2UI(q); break; case 'initial_syllable': renderPhase3UI(q); break; }
    renderOptions(q.options);
    if(q.type === 'letter_sound') setTimeout(playCurrentAudio, 500);
}
function renderPhase1UI(q){ document.getElementById('audioQuestionArea').style.display='block';document.getElementById('imageQuestionArea').style.display='none';document.getElementById('questionText').textContent='Qual letra faz este som?';document.getElementById('repeatAudio').style.display='inline-block';}
function renderPhase2UI(q){ document.getElementById('audioQuestionArea').style.display='none';document.getElementById('imageQuestionArea').style.display='block';document.getElementById('imageEmoji').textContent=q.image;document.getElementById('wordDisplay').textContent=`__${q.word.substring(1)}`;document.getElementById('questionText').textContent='Qual vogal completa a palavra?';document.getElementById('repeatAudio').style.display='none';}
function renderPhase3UI(q){ document.getElementById('audioQuestionArea').style.display='none';document.getElementById('imageQuestionArea').style.display='block';document.getElementById('imageEmoji').textContent=q.image;document.getElementById('wordDisplay').textContent=`__${q.word.substring(q.correctAnswer.length)}`;document.getElementById('questionText').textContent='Qual sílaba começa a palavra?';document.getElementById('repeatAudio').style.display='none';}
function renderOptions(opts){ const grid=document.getElementById('lettersGrid'); grid.innerHTML=opts.map(o=>`<button class="letter-button">${o}</button>`).join(''); grid.querySelectorAll('.letter-button').forEach(b=>b.addEventListener('click',e=>selectAnswer(e.target.textContent)))}
async function selectAnswer(ans) {
    document.querySelectorAll('.letter-button').forEach(b=>b.disabled=true);
    const q = gameState.questions[gameState.currentQuestionIndex];
    const correct = ans === q.correctAnswer;
    document.querySelectorAll('.letter-button').forEach(b=>{if(b.textContent===q.correctAnswer)b.classList.add('correct');if(b.textContent===ans&&!correct)b.classList.add('incorrect')});
    if(correct){gameState.score++;showFeedback('Muito bem!','success');speak('Acertou');if(q.type!=='letter_sound')document.getElementById('wordDisplay').textContent=q.word}
    else{gameState.attempts--;showFeedback(`Quase! Era ${q.correctAnswer}`,'error');speak('Tente de novo')}
    await saveGameState(); updateUI();
    if(gameState.attempts<=0) setTimeout(endPhase,1500);
    else setTimeout(()=>document.getElementById('nextQuestion').style.display='block',1500);
}
function nextQuestion() { gameState.currentQuestionIndex++; startQuestion(); }
function endPhase() { const acc=gameState.questions.length>0?Math.round((gameState.score/gameState.questions.length)*100):0; showResultScreen(acc>=70&&gameState.attempts>0,acc); }
function showResultScreen(passed, acc){ showScreen('resultScreen');document.getElementById('finalScore').textContent=gameState.score;document.getElementById('accuracy').textContent=acc;document.getElementById('resultTitle').textContent=passed?'Parabéns!':'Não desanime!';document.getElementById('resultMessage').textContent=passed?'Você passou de fase!':'Tente novamente!';document.getElementById('continueButton').style.display=passed?'inline-block':'none';document.getElementById('retryButton').style.display=passed?'none':'inline-block';}
async function nextPhase() { gameState.currentPhase++; gameState.currentQuestionIndex=0; gameState.score=0; gameState.attempts=2; gameState.questions=generateQuestions(gameState.currentPhase); await saveGameState(); showScreen('gameScreen'); await showTutorial(gameState.currentPhase); startQuestion(); }
async function retryPhase() { gameState.currentQuestionIndex=0; gameState.score=0; gameState.attempts=2; await saveGameState(); showScreen('gameScreen'); startQuestion(); }
async function restartGame() { showScreen('startScreen'); }
async function playCurrentAudio() {
    const q = gameState.questions[gameState.currentQuestionIndex]; if(q.type!=='letter_sound')return;
    const l=q.correctAnswer; const {data}=await supabaseClient.storage.from('audio_uploads').list(gameState.teacherId,{search:`${l}.`});
    if(data&&data.length>0){const{data:{publicUrl}}=supabaseClient.storage.from('audio_uploads').getPublicUrl(`${gameState.teacherId}/${data[0].name}`);new Audio(publicUrl).play()}
    else speak(l);
}
function speak(text, cb) { if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';if(cb)u.onend=cb;speechSynthesis.speak(u)}

// =======================================================
// PARTE 8: FUNÇÕES DE UI (INTERFACE DO USUÁRIO)
// =======================================================
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id)?.classList.add('active')}
function showUserTypeScreen(){showScreen('userTypeScreen')}
function showTeacherLogin(){showScreen('teacherLoginScreen')}
function showTeacherRegister(){showScreen('teacherRegisterScreen')}
function showStudentLogin(){showScreen('studentLoginScreen')}
function showModal(id){document.getElementById(id)?.classList.add('show')}
function closeModal(id){document.getElementById(id)?.classList.remove('show')}
function showCreateStudentForm(){document.getElementById('createStudentForm').style.display='block'}
function hideCreateStudentForm(){const f=document.getElementById('createStudentForm');f.style.display='none';document.getElementById('createStudentFormElement').reset();document.getElementById('togglePasswordBtn').textContent='👁️'}
function showAudioSettingsModal(){const s=document.getElementById('letterSelect');if(s)s.innerHTML=ALPHABET.map(l=>`<option value="${l}">${l}</option>`).join('');showModal('audioSettingsModal');showTab('uploadFileTab',document.querySelector('#audioSettingsModal .tab-btn'))}
function showTab(id,btn){const p=btn.closest('.modal-content');p.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');p.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));p.querySelector('#'+id).classList.add('active')}
function showFeedback(msg,type='info'){const el=document.getElementById('globalFeedback');if(!el)return;const txt=el.querySelector('.feedback-text');if(txt)txt.textContent=msg;el.className=`show ${type}`;setTimeout(()=>el.className=el.className.replace('show',''),3000)}
function updateUI(){if(document.getElementById('gameScreen').classList.contains('active')&&gameState.questions?.length>0){document.getElementById('score').textContent=gameState.score;document.getElementById('totalQuestions').textContent=gameState.questions.length;document.getElementById('attempts').textContent=`${gameState.attempts} tentativa(s)`;document.getElementById('currentPhase').textContent=gameState.currentPhase;document.getElementById('progressFill').style.width=`${(gameState.currentQuestionIndex/gameState.questions.length)*100}%`}}
async function showTutorial(phase){if(gameState.tutorialsShown.includes(phase))return;const i=gameInstructions[phase];if(!i)return;const o=document.getElementById('tutorialOverlay');document.getElementById('tutorialText').textContent=i;o.style.display='flex';speak(i);gameState.tutorialsShown.push(phase);await saveGameState()}
function hideTutorial(){document.getElementById('tutorialOverlay').style.display='none'}

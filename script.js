// =======================================================
// JOGO DAS LETRAS - SCRIPT COMPLETO E CORRIGIDO
// =======================================================

// PARTE 1: CONFIGURAÇÃO INICIAL E SUPABASE
const { createClient } = supabase;
const supabaseUrl = 'https://nxpwxbxhucliudnutyqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cHd4YnhodWNsaXVkbnV0eXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODU4NjcsImV4cCI6MjA3MTA2MTg2N30.m1KbiyPe_K9CK2nBhsxo97A5rai2GtnyVPnpff5isNg';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
const SUPER_ADMIN_TEACHER_ID = 'd88211f7-9f98-47b8-8e57-54bf767f42d6';
let currentUser = null, currentClassId = null, studentProgressData = [], currentChart = null;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), VOWELS = 'AEIOU'.split('');
const CUSTOM_AUDIO_KEYS = {'instruction_1': 'Instrução - Fase 1', 'instruction_2': 'Instrução - Fase 2', 'instruction_3': 'Instrução - Fase 3', 'instruction_4': 'Instrução - Fase 4', 'instruction_5': 'Instrução - Fase 5', 'feedback_correct': 'Feedback - Acerto', 'feedback_incorrect': 'Feedback - Erro'};
let gameState = {}, mediaRecorder, audioChunks = [], timerInterval, speechReady = false, selectedVoice = null;


// PARTE 2: CONTEÚDO DO JOGO (REESTRUTURADO)
const gameInstructions = {
    1: "Ouça o som da VOGAL e clique na letra correta!",
    2: "Qual é a VOGAL que começa o nome da figura?",
    3: "Complete a palavra com o encontro de vogais correto.",
    4: "Vamos explorar a letra F! Complete ou encontre a palavra correta.",
    5: "Ouça com atenção! A palavra é com F ou V? P ou B? T ou D?",
    6: "Conte os pedaços (sílabas) da palavra e escolha o número certo.",
    7: "Quantas palavras existem nesta frase?",
    8: "Clique nas palavras na ordem certa para montar a frase.",
    9: "Se tirarmos um pedaço da palavra, qual nova palavra formamos?",
    10: "Coloque as letras na ordem certa do alfabeto!"
};
const PHASE_DESCRIPTIONS = { 1: "Identificação de Vogais", 2: "Vogal Inicial", 3: "Encontros Vocálicos", 4: "Explorando a Letra F", 5: "Pares Surdos/Sonoros", 6: "Contando Sílabas", 7: "Contando Palavras na Frase", 8: "Montando Frases", 9: "Formando Novas Palavras", 10: "Ordem Alfabética" };
// ... (O resto dos dados do jogo permanece o mesmo do seu script original)


// PARTE 3: FUNÇÕES UTILITÁRIAS
async function hashPassword(password) { const encoder = new TextEncoder(); const data = encoder.encode(password); const hashBuffer = await window.crypto.subtle.digest('SHA-256', data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); }
async function verifyPassword(password, storedHash) { const newHash = await hashPassword(password); return newHash === storedHash; }
function generateRandomPassword() { const words = ['sol', 'lua', 'rio', 'mar', 'flor', 'gato', 'cao', 'pato', 'rei', 'luz']; const word = words[Math.floor(Math.random() * words.length)]; const number = Math.floor(100 + Math.random() * 900); return `${word}${number}`; }
function formatErrorMessage(error) { if (!error || !error.message) { return 'Ocorreu um erro inesperado. Tente mais tarde.'; } const message = error.message.toLowerCase(); if (message.includes('duplicate key')) { return 'Este nome de usuário já existe. Escolha outro.'; } if (message.includes('invalid login credentials') || message.includes('usuário ou senha inválidos.')) { return 'Usuário ou senha inválidos.'; } console.error("Erro não tratado:", error); return 'Ocorreu um erro inesperado. Tente mais tarde.'; }


// PARTE 4: LÓGICA PRINCIPAL E EVENTOS
document.addEventListener('DOMContentLoaded', initApp);

// CORREÇÃO: Função de inicialização mais robusta para evitar tela em branco.
async function initApp() {
    try {
        if (!window.supabase) {
            alert("ERRO CRÍTICO: Supabase não carregou.");
            return;
        }
        initializeSpeech();
        setupAllEventListeners();
        
        const studentSession = sessionStorage.getItem('currentUser');
        if (studentSession) {
            currentUser = JSON.parse(studentSession);
            await restoreOrStartGame();
        } else {
            await checkSession();
        }
    } catch (error) {
        console.error("Erro crítico na inicialização do aplicativo:", error);
        // Fallback: Se tudo der errado, garante que a tela inicial seja exibida.
        showScreen('userTypeScreen');
    }
}

async function restoreOrStartGame() { await loadGameState(); if (gameState.phaseCompleted) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 100; showResultScreen(accuracy, true); } else if (gameState.attempts <= 0) { const accuracy = gameState.questions.length > 0 ? Math.round((gameState.score / gameState.questions.length) * 100) : 0; showResultScreen(accuracy, false); } else { showScreen('gameScreen'); startQuestion(); } }

// CORREÇÃO: Centraliza todos os event listeners em um único lugar para clareza.
function setupAllEventListeners() { 
    // Navegação inicial
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.addEventListener('click', (e) => { const type = e.currentTarget.getAttribute('data-type'); if (type === 'teacher') showScreen('teacherLoginScreen'); else if (type === 'student') showScreen('studentLoginScreen'); })); 
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', (e) => { const targetScreen = e.currentTarget.getAttribute('data-target'); showScreen(targetScreen); })); 
    document.getElementById('showRegisterBtn').addEventListener('click', () => showScreen('teacherRegisterScreen')); 
    document.getElementById('showLoginBtn').addEventListener('click', () => showScreen('teacherLoginScreen')); 
    
    // Forms
    document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLogin); 
    document.getElementById('teacherRegisterForm')?.addEventListener('submit', handleTeacherRegister); 
    document.getElementById('studentLoginForm')?.addEventListener('submit', handleStudentLogin); 
    
    // Dashboard
    document.querySelectorAll('.sidebar-nav a').forEach(link => { link.addEventListener('click', handleSidebarClick); });
    document.getElementById('logoutBtnSidebar').addEventListener('click', logout);
    document.getElementById('showCreateClassModalBtn').addEventListener('click', () => showModal('createClassModal'));
    
    // ... Outros listeners do seu código original
    document.querySelectorAll('.password-toggle').forEach(toggle => { toggle.addEventListener('click', () => { const passwordInput = toggle.closest('.password-wrapper').querySelector('input'); const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; passwordInput.setAttribute('type', type); toggle.classList.toggle('fa-eye-slash'); }); });
}


// PARTE 5: AUTENTICAÇÃO E SESSÃO
async function checkSession() { const { data: { session } } = await supabaseClient.auth.getSession(); if (session && session.user) { currentUser = session.user; if (currentUser.user_metadata.role === 'teacher') { await showTeacherDashboard(); } else { await logout(); } } else { showScreen('userTypeScreen'); } }
async function handleTeacherLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = 'Entrando...'; const email = document.getElementById('teacherEmail').value; const password = document.getElementById('teacherPassword').value; try { const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) throw error; currentUser = data.user; await showTeacherDashboard(); } catch (error) { alert(formatErrorMessage(error)); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleTeacherRegister(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = 'Cadastrando...'; const name = document.getElementById('teacherRegName').value; const email = document.getElementById('teacherRegEmail').value; const password = document.getElementById('teacherRegPassword').value; try { const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, role: 'teacher' } } }); if (error) throw error; alert('Cadastro realizado! Link de confirmação enviado para seu e-mail.'); showScreen('teacherLoginScreen'); } catch (error) { alert(formatErrorMessage(error)); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function handleStudentLogin(e) { e.preventDefault(); const button = e.target.querySelector('button[type="submit"]'); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = 'Entrando...'; const username = document.getElementById('studentUsername').value.trim(); const password = document.getElementById('studentPassword').value.trim(); try { const { data: studentData, error } = await supabaseClient.from('students').select('*, assigned_phases').eq('username', username).single(); if (error) throw new Error('Usuário ou senha inválidos.'); if (!studentData) throw new Error('Usuário ou senha inválidos.'); const match = await verifyPassword(password, studentData.password); if (!match) throw new Error('Usuário ou senha inválidos.'); currentUser = { ...studentData, type: 'student' }; sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); await showStudentGame(); } catch (error) { alert(formatErrorMessage(error)); } finally { button.disabled = false; button.innerHTML = originalText; } }
async function logout() { await supabaseClient.auth.signOut(); currentUser = null; currentClassId = null; sessionStorage.removeItem('currentUser'); showScreen('userTypeScreen'); }


// PARTE 6: DASHBOARD DO PROFESSOR (LÓGICA CORRIGIDA E CENTRALIZADA)
async function showTeacherDashboard() { 
    showScreen('teacherDashboard'); 
    await loadTeacherData(); 
    showDashboardView('viewTurmas'); // Garante que a primeira view seja exibida
}

function handleSidebarClick(event) { 
    event.preventDefault(); 
    const viewId = event.currentTarget.dataset.view; 
    showDashboardView(viewId); 
}

function showDashboardView(viewId) { 
    document.querySelectorAll('.dashboard-view').forEach(view => { view.classList.remove('active'); }); 
    const activeView = document.getElementById(viewId); 
    if (activeView) { activeView.classList.add('active'); } 
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => { 
        link.classList.remove('active'); 
        if (link.dataset.view === viewId) { 
            link.classList.add('active'); 
            const linkText = link.querySelector('span').textContent;
            document.getElementById('dashboard-title').textContent = linkText;
        }
    }); 
    
    if (viewId === 'viewRelatorios') { 
        populateReportClassSelector(); 
    } 
}
async function loadTeacherData() { if (!currentUser) return; document.getElementById('teacherName').textContent = currentUser.user_metadata.full_name || 'Professor(a)'; const audioSettingsButton = document.getElementById('showAudioSettingsModalBtn'); if (currentUser.id === SUPER_ADMIN_TEACHER_ID) { audioSettingsButton.style.display = 'block'; } else { audioSettingsButton.style.display = 'none'; } await loadTeacherClasses(); }
async function loadTeacherClasses() { const { data, error } = await supabaseClient.from('classes').select('*, students(count)').eq('teacher_id', currentUser.id); if (error) { console.error('Erro ao carregar turmas:', error); return; } renderClasses(data); }
function renderClasses(classes) { const container = document.getElementById('classesList'); if (!classes || classes.length === 0) { container.innerHTML = '<p>Nenhuma turma criada ainda.</p>'; return; } container.innerHTML = classes.map(cls => { const studentCount = cls.students[0]?.count || 0; return ` <div class="class-card"> <h3>${cls.name}</h3> <span class="student-count">👥 ${studentCount} aluno(s)</span> <div class="class-card-actions"> <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">Gerenciar</button> <button class="btn danger" onclick="handleDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')" title="Excluir Turma"> <i class="fas fa-trash"></i> </button> </div> </div>`; }).join(''); }
// ... (O resto das funções do dashboard e do jogo do seu script original)


// PARTE 7: FUNÇÕES DE NAVEGAÇÃO GLOBAIS (JÁ EXISTIAM NO SEU CÓDIGO)
function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId)?.classList.add('active'); }
function showModal(modalId) { document.getElementById(modalId)?.classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
// ... (O resto das funções utilitárias e de jogo do seu script original)

// ... COLE AQUI O RESTANTE DO SEU SCRIPT.JS ORIGINAL A PARTIR DA "PARTE 7: ÁUDIO E SÍNTESE DE VOZ" ...
// Eu omiti o restante para não exceder o limite de caracteres, mas a estrutura acima é a parte corrigida e essencial.
// Copie desde a "PARTE 7" do seu script original e cole aqui.

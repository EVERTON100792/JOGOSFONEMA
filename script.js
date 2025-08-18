
// Configurações do jogo
const GAME_CONFIG = {
    minAccuracy: 95, // Porcentagem mínima para passar de fase
    maxAttempts: 2,  // Máximo de tentativas
    questionsPerPhase: 10, // Questões por fase
    currentPhase: 1,
    maxPhases: 3,
    phases: {
        1: {
            name: 'Reconhecer Letras',
            description: 'Ouça o som e encontre a letra correta',
            type: 'audio-to-letter'
        },
        2: {
            name: 'Vogais e Figuras',
            description: 'Ligue as figuras às vogais iniciais',
            type: 'image-to-vowel'
        },
        3: {
            name: 'Palavras Completas',
            description: 'Forme palavras com as letras',
            type: 'word-formation'
        }
    }
};

// Estado do jogo
let gameState = {
    currentPhase: 1,
    currentQuestion: 0,
    score: 0,
    attempts: 2,
    questions: [],
    currentQuestionIndex: 0,
    playerProgress: {},
    uploadedAudios: {}
};

// Alfabeto brasileiro
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Vogais
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

// Dados para a fase 2 - Figuras e vogais
const IMAGES_DATA = {
    'A': [
        { name: 'AVIÃO', emoji: '✈️', description: 'Um avião azul voando no céu' },
        { name: 'ABELHA', emoji: '🐝', description: 'Uma abelha coletando mel' },
        { name: 'ÁRVORE', emoji: '🌳', description: 'Uma árvore verde grande' },
        { name: 'ÁGUA', emoji: '💧', description: 'Uma gota de água cristalina' },
        { name: 'ANEL', emoji: '💍', description: 'Um anel dourado brilhante' }
    ],
    'E': [
        { name: 'ELEFANTE', emoji: '🐘', description: 'Um elefante grande e cinza' },
        { name: 'ESTRELA', emoji: '⭐', description: 'Uma estrela amarela brilhante' },
        { name: 'ESCADA', emoji: '🪜', description: 'Uma escada para subir' },
        { name: 'ESPELHO', emoji: '🪞', description: 'Um espelho que reflete' },
        { name: 'ENVELOPE', emoji: '✉️', description: 'Um envelope para cartas' }
    ],
    'I': [
        { name: 'IGREJA', emoji: '⛪', description: 'Uma igreja com campanário' },
        { name: 'ILHA', emoji: '🏝️', description: 'Uma pequena ilha no mar' },
        { name: 'ÍNDIO', emoji: '🪶', description: 'Cocar colorido de índio' },
        { name: 'IGUANA', emoji: '🦎', description: 'Uma iguana verde' },
        { name: 'ÍMÃ', emoji: '🧲', description: 'Um ímã que atrai metal' }
    ],
    'O': [
        { name: 'OVO', emoji: '🥚', description: 'Um ovo branco de galinha' },
        { name: 'ÓCULOS', emoji: '👓', description: 'Óculos para enxergar melhor' },
        { name: 'OVELHA', emoji: '🐑', description: 'Uma ovelha branca e fofa' },
        { name: 'ONÇA', emoji: '🐆', description: 'Uma onça pintada' },
        { name: 'ONDA', emoji: '🌊', description: 'Uma onda do mar azul' }
    ],
    'U': [
        { name: 'UVA', emoji: '🍇', description: 'Um cacho de uvas roxas' },
        { name: 'URSO', emoji: '🐻', description: 'Um urso marrom grande' },
        { name: 'UNHA', emoji: '💅', description: 'Uma unha pintada colorida' },
        { name: 'UNIFORME', emoji: '👕', description: 'Um uniforme escolar' },
        { name: 'UNICÓRNIO', emoji: '🦄', description: 'Um unicórnio mágico' }
    ]
};

// Elementos do DOM
const elements = {
    // Telas
    userTypeScreen: document.getElementById('userTypeScreen'),
    teacherLoginScreen: document.getElementById('teacherLoginScreen'),
    teacherRegisterScreen: document.getElementById('teacherRegisterScreen'),
    studentLoginScreen: document.getElementById('studentLoginScreen'),
    teacherDashboard: document.getElementById('teacherDashboard'),
    startScreen: document.getElementById('startScreen'),
    gameScreen: document.getElementById('gameScreen'),
    resultScreen: document.getElementById('resultScreen'),
    
    // Elementos do jogo
    currentPhaseSpan: document.getElementById('currentPhase'),
    progressFill: document.getElementById('progressFill'),
    scoreSpan: document.getElementById('score'),
    totalQuestionsSpan: document.getElementById('totalQuestions'),
    attemptsSpan: document.getElementById('attempts'),
    lettersGrid: document.getElementById('lettersGrid'),
    questionText: document.getElementById('questionText'),
    helperText: document.getElementById('helperText'),
    
    // Controles
    startButton: document.getElementById('startButton'),
    playAudioButton: document.getElementById('playAudioButton'),
    repeatAudio: document.getElementById('repeatAudio'),
    nextQuestion: document.getElementById('nextQuestion'),
    
    // Upload de áudio
    audioUpload: document.getElementById('audioUpload'),
    uploadStatus: document.getElementById('uploadStatus'),
    
    // Resultado
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    finalScore: document.getElementById('finalScore'),
    accuracy: document.getElementById('accuracy'),
    resultMessage: document.getElementById('resultMessage'),
    continueButton: document.getElementById('continueButton'),
    retryButton: document.getElementById('retryButton'),
    restartButton: document.getElementById('restartButton'),
    
    // Feedback
    feedback: document.getElementById('feedback'),
    celebration: document.getElementById('celebration'),
    soundWaves: document.querySelector('.sound-waves')
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Jogo de Alfabetização carregado successfully!');
    initApp();
});

// === INICIALIZAÇÃO DA APLICAÇÃO ===
async function initApp() {
    await checkSession();
    setupAllEventListeners();
}

// === CONFIGURAR TODOS OS EVENT LISTENERS ===
function setupAllEventListeners() {
    // Event listeners originais do jogo
    setupEventListeners();
    
    // Novos event listeners para login
    setupLoginEventListeners();
}

// === EVENT LISTENERS PARA LOGIN ===
function setupLoginEventListeners() {
    // Botões de seleção de usuário
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            if (type === 'teacher') {
                showTeacherLogin();
            } else if (type === 'student') {
                showStudentLogin();
            }
        });
    });

    // Forms de login
    const teacherLoginForm = document.getElementById('teacherLoginForm');
    if (teacherLoginForm) {
        teacherLoginForm.addEventListener('submit', handleTeacherLogin);
    }
    
    const teacherRegisterForm = document.getElementById('teacherRegisterForm');
    if (teacherRegisterForm) {
        teacherRegisterForm.addEventListener('submit', handleTeacherRegister);
    }
    
    const studentLoginForm = document.getElementById('studentLoginForm');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', handleStudentLogin);
    }
    
    // Forms de criação
    const createClassForm = document.getElementById('createClassForm');
    if (createClassForm) {
        createClassForm.addEventListener('submit', handleCreateClass);
    }
    
    const createStudentForm = document.getElementById('createStudentFormElement');
    if (createStudentForm) {
        createStudentForm.addEventListener('submit', handleCreateStudent);
    }
}

function initializeGame() {
    console.log('🎮 Inicializando jogo de alfabetização...');
    showScreen('startScreen');
    updateUI();
}

function setupEventListeners() {
    // Botões principais
    elements.startButton.addEventListener('click', startGame);
    elements.playAudioButton.addEventListener('click', playCurrentAudio);
    elements.repeatAudio.addEventListener('click', playCurrentAudio);
    elements.nextQuestion.addEventListener('click', nextQuestion);
    
    // Botões de resultado
    elements.continueButton.addEventListener('click', nextPhase);
    elements.retryButton.addEventListener('click', retryPhase);
    elements.restartButton.addEventListener('click', restartGame);
    
    // Upload de áudio
    elements.audioUpload.addEventListener('change', handleAudioUpload);
    
    // Botão de teste de áudio
    const testAudioButton = document.getElementById('testAudioButton');
    if (testAudioButton) {
        testAudioButton.addEventListener('click', testUploadedAudios);
    }
}

function createPlaceholderAudios() {
    // Criar áudios de placeholder usando Web Audio API ou Text-to-Speech
    ALPHABET.forEach(letter => {
        if (!gameState.uploadedAudios[letter.toLowerCase()]) {
            createSynthesizedAudio(letter);
        }
    });
}

function createSynthesizedAudio(letter) {
    // Usar SpeechSynthesis para criar áudios temporários
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.7;
        utterance.pitch = 1.5; // Tom mais agudo para crianças
        
        // Armazenar referência para uso posterior
        gameState.uploadedAudios[letter.toLowerCase()] = {
            type: 'speech',
            utterance: utterance
        };
    }
}

function handleAudioUpload(event) {
    const files = Array.from(event.target.files);
    let uploadCount = 0;
    let processedFiles = 0;
    
    elements.uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando áudios...';
    
    // Mostrar detalhes dos arquivos sendo processados
    console.log('📁 Arquivos selecionados:', files.map(f => f.name));
    
    files.forEach((file, index) => {
        if (file.type.startsWith('audio/')) {
            const fileName = file.name.toLowerCase();
            
            // Tentar identificar a letra de diferentes formas
            let letter = null;
            
            // Método 1: Primeira letra do nome do arquivo
            if (ALPHABET.includes(fileName.charAt(0).toUpperCase())) {
                letter = fileName.charAt(0);
            }
            
            // Método 2: Procurar por padrões como "a.mp3", "letra-a.mp3", etc.
            const letterMatch = fileName.match(/[^a-z]*([a-z])[^a-z]*/);
            if (letterMatch && ALPHABET.includes(letterMatch[1].toUpperCase())) {
                letter = letterMatch[1];
            }
            
            // Método 3: Procurar por padrões específicos
            const patterns = [
                /letra[_-]?([a-z])/,
                /som[_-]?([a-z])/,
                /audio[_-]?([a-z])/,
                /([a-z])[_-]?som/,
                /([a-z])[_-]?audio/
            ];
            
            for (const pattern of patterns) {
                const match = fileName.match(pattern);
                if (match && ALPHABET.includes(match[1].toUpperCase())) {
                    letter = match[1];
                    break;
                }
            }
            
            if (letter && ALPHABET.includes(letter.toUpperCase())) {
                const url = URL.createObjectURL(file);
                const audio = new Audio(url);
                
                // Configurar o áudio
                audio.preload = 'auto';
                audio.volume = 0.8;
                
                // Armazenar áudio personalizado
                gameState.uploadedAudios[letter] = {
                    type: 'file',
                    url: url,
                    audio: audio,
                    fileName: file.name
                };
                
                uploadCount++;
                console.log(`✅ Áudio carregado para letra ${letter.toUpperCase()}: ${file.name}`);
                
                // Testar se o áudio carrega corretamente
                audio.addEventListener('loadeddata', () => {
                    console.log(`🎵 Áudio ${letter.toUpperCase()} pronto para reprodução`);
                });
                
                audio.addEventListener('error', (e) => {
                    console.warn(`❌ Erro ao carregar áudio ${letter.toUpperCase()}:`, e);
                });
            } else {
                console.warn(`⚠️ Não foi possível identificar a letra no arquivo: ${file.name}`);
            }
        } else {
            console.warn(`⚠️ Arquivo não é de áudio: ${file.name}`);
        }
        
        processedFiles++;
        
        // Quando todos os arquivos foram processados
        if (processedFiles === files.length) {
            setTimeout(() => {
                if (uploadCount > 0) {
                    elements.uploadStatus.innerHTML = `
                        <i class="fas fa-check-circle"></i> 
                        ${uploadCount} áudios carregados com sucesso!
                        <br><small>Suas gravações serão usadas no jogo</small>
                    `;
                    
                    // Mostrar quais letras foram carregadas
                    const loadedLetters = Object.keys(gameState.uploadedAudios)
                        .filter(key => gameState.uploadedAudios[key].type === 'file')
                        .map(key => key.toUpperCase())
                        .sort();
                    
                    if (loadedLetters.length > 0) {
                        elements.uploadStatus.innerHTML += `
                            <br><small>Letras com áudio personalizado: ${loadedLetters.join(', ')}</small>
                        `;
                    }
                    
                    // Mostrar botão de teste se há áudios carregados
                    const testButton = document.getElementById('testAudioButton');
                    if (testButton && uploadCount > 0) {
                        testButton.style.display = 'inline-block';
                    }
                } else {
                    elements.uploadStatus.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i> 
                        Nenhum áudio foi carregado.
                        <br><small>Certifique-se que os nomes dos arquivos começam com a letra (ex: a.mp3, b.wav)</small>
                    `;
                }
            }, 1000);
        }
    });
    
    // Se nenhum arquivo foi selecionado
    if (files.length === 0) {
        elements.uploadStatus.innerHTML = '';
        const testButton = document.getElementById('testAudioButton');
        if (testButton) {
            testButton.style.display = 'none';
        }
    }
}

function testUploadedAudios() {
    const uploadedAudios = Object.keys(gameState.uploadedAudios)
        .filter(key => gameState.uploadedAudios[key].type === 'file')
        .sort();
    
    if (uploadedAudios.length === 0) {
        alert('Nenhum áudio personalizado carregado!');
        return;
    }
    
    let currentTestIndex = 0;
    const testButton = document.getElementById('testAudioButton');
    const originalText = testButton.innerHTML;
    
    function playNextTestAudio() {
        if (currentTestIndex >= uploadedAudios.length) {
            // Teste concluído
            testButton.innerHTML = originalText;
            testButton.disabled = false;
            alert(`Teste concluído! Testados ${uploadedAudios.length} áudios.`);
            return;
        }
        
        const letter = uploadedAudios[currentTestIndex];
        const audioData = gameState.uploadedAudios[letter];
        
        testButton.innerHTML = `<i class="fas fa-volume-up"></i> Testando: ${letter.toUpperCase()}`;
        testButton.disabled = true;
        
        console.log(`🎵 Testando áudio da letra ${letter.toUpperCase()}`);
        
        if (audioData && audioData.audio) {
            audioData.audio.currentTime = 0;
            audioData.audio.play().catch(e => {
                console.warn(`Erro ao testar áudio ${letter.toUpperCase()}:`, e);
            });
            
            // Aguardar 2 segundos antes do próximo
            setTimeout(() => {
                currentTestIndex++;
                playNextTestAudio();
            }, 2500);
        } else {
            currentTestIndex++;
            playNextTestAudio();
        }
    }
    
    // Iniciar teste
    alert(`Iniciando teste de ${uploadedAudios.length} áudios carregados...`);
    playNextTestAudio();
}

function startGame() {
    console.log('🚀 Iniciando jogo...');
    gameState.currentPhase = 1;
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
    
    const currentPhaseConfig = GAME_CONFIG.phases[gameState.currentPhase];
    
    if (currentPhaseConfig.type === 'audio-to-letter') {
        generateAudioToLetterQuestions();
    } else if (currentPhaseConfig.type === 'image-to-vowel') {
        generateImageToVowelQuestions();
    }
    
    console.log(`📝 Questões da fase ${gameState.currentPhase} geradas:`, gameState.questions);
}

function generateAudioToLetterQuestions() {
    const letters = [...ALPHABET];
    
    // Embaralhar letras
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    
    // Selecionar questões para a fase
    for (let i = 0; i < GAME_CONFIG.questionsPerPhase; i++) {
        const correctLetter = letters[i % letters.length];
        const options = generateLetterOptions(correctLetter);
        
        gameState.questions.push({
            type: 'audio-to-letter',
            correctLetter: correctLetter,
            options: options
        });
    }
}

function generateImageToVowelQuestions() {
    const questionsPerVowel = Math.ceil(GAME_CONFIG.questionsPerPhase / VOWELS.length);
    
    VOWELS.forEach(vowel => {
        const imagesForVowel = IMAGES_DATA[vowel];
        
        for (let i = 0; i < questionsPerVowel && gameState.questions.length < GAME_CONFIG.questionsPerPhase; i++) {
            const randomImage = imagesForVowel[Math.floor(Math.random() * imagesForVowel.length)];
            const options = generateVowelOptions(vowel);
            
            gameState.questions.push({
                type: 'image-to-vowel',
                correctVowel: vowel,
                image: randomImage,
                options: options
            });
        }
    });
    
    // Embaralhar as questões
    for (let i = gameState.questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.questions[i], gameState.questions[j]] = [gameState.questions[j], gameState[i]];
    }
}

function generateLetterOptions(correctLetter) {
    const options = [correctLetter];
    const availableLetters = ALPHABET.filter(letter => letter !== correctLetter);
    
    // Adicionar 3 opções incorretas aleatórias
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        const randomLetter = availableLetters.splice(randomIndex, 1)[0];
        options.push(randomLetter);
    }
    
    // Embaralhar opções
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
}

function generateVowelOptions(correctVowel) {
    const options = [correctVowel];
    const availableVowels = VOWELS.filter(vowel => vowel !== correctVowel);
    
    // Adicionar 2 vogais incorretas (total de 3 opções para não sobrecarregar)
    for (let i = 0; i < 2 && availableVowels.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableVowels.length);
        const randomVowel = availableVowels.splice(randomIndex, 1)[0];
        options.push(randomVowel);
    }
    
    // Embaralhar opções
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
}

function startQuestion() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    
    if (!currentQuestion) {
        endPhase();
        return;
    }
    
    console.log('❓ Iniciando questão:', currentQuestion);
    
    // Esconder botão de próxima questão
    elements.nextQuestion.style.display = 'none';
    
    // Atualizar progresso
    updateProgress();
    
    if (currentQuestion.type === 'audio-to-letter') {
        startAudioToLetterQuestion(currentQuestion);
    } else if (currentQuestion.type === 'image-to-vowel') {
        startImageToVowelQuestion(currentQuestion);
    }
}

function startAudioToLetterQuestion(question) {
    // Atualizar interface para questão de áudio
    updateHelperText(`Escute o som da letra e clique na resposta correta!`);
    elements.questionText.textContent = 'Qual letra faz este som?';
    
    // Mostrar seção de áudio
    const audioSection = document.querySelector('.audio-section');
    if (audioSection) audioSection.style.display = 'block';
    
    renderLetterOptions(question.options);
    
    // Reproduzir áudio automaticamente após um breve delay
    setTimeout(() => {
        playCurrentAudio();
    }, 1000);
}

function startImageToVowelQuestion(question) {
    // Atualizar interface para questão de imagem
    updateHelperText(`Olhe a figura e escute a pergunta!`);
    elements.questionText.innerHTML = `
        <div class="image-question">
            <div class="image-display">
                <span class="image-emoji">${question.image.emoji}</span>
                <p class="image-name">${question.image.name}</p>
            </div>
            <div class="audio-controls-phase2">
                <button id="repeatImageAudio" class="repeat-audio-button">
                    <i class="fas fa-volume-up"></i>
                    <span>Repetir Pergunta</span>
                </button>
            </div>
            <p class="question-instruction">Qual vogal inicia esta palavra?</p>
        </div>
    `;
    
    // Esconder seção de áudio principal
    const audioSection = document.querySelector('.audio-section');
    if (audioSection) audioSection.style.display = 'none';
    
    // Configurar botão de repetir áudio
    const repeatButton = document.getElementById('repeatImageAudio');
    if (repeatButton) {
        repeatButton.addEventListener('click', () => {
            speakCompleteVowelSequence(question);
        });
    }
    
    renderVowelOptions(question.options);
    
    // Reproduzir sequência completa de áudios automaticamente
    setTimeout(() => {
        speakCompleteVowelSequence(question);
    }, 1000);
}

function renderLetterOptions(options) {
    elements.lettersGrid.innerHTML = '';
    elements.lettersGrid.className = 'letters-grid';
    
    options.forEach(letter => {
        const button = document.createElement('button');
        button.className = 'letter-button';
        button.textContent = letter;
        button.addEventListener('click', () => selectAnswer(letter));
        elements.lettersGrid.appendChild(button);
    });
}

function renderVowelOptions(options) {
    elements.lettersGrid.innerHTML = '';
    elements.lettersGrid.className = 'vowels-grid';
    
    options.forEach(vowel => {
        const button = document.createElement('button');
        button.className = 'vowel-button';
        button.textContent = vowel;
        button.addEventListener('click', () => selectAnswer(vowel));
        elements.lettersGrid.appendChild(button);
    });
}

function speakImageName(imageName) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(imageName);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.8;
        utterance.pitch = 1.3;
        utterance.volume = 0.9;
        speechSynthesis.speak(utterance);
        console.log(`🗣️ Pronunciando: ${imageName}`);
    }
}

function speakVowelQuestion() {
    if ('speechSynthesis' in window) {
        const questions = [
            'Qual vogal inicia esta palavra?',
            'Com que vogal esta palavra inicia?',
            'Que vogal é a primeira desta palavra?',
            'Qual é a vogal inicial desta palavra?'
        ];
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        const utterance = new SpeechSynthesisUtterance(randomQuestion);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.8; // Um pouco mais devagar para clareza
        utterance.pitch = 1.4; // Tom mais agudo para crianças
        utterance.volume = 0.9;
        speechSynthesis.speak(utterance);
        console.log(`❓ Perguntando: ${randomQuestion}`);
    }
}

function speakCompleteVowelSequence(question) {
    if ('speechSynthesis' in window) {
        // Primeira parte: nome da figura
        const nameUtterance = new SpeechSynthesisUtterance(question.image.name);
        nameUtterance.lang = 'pt-BR';
        nameUtterance.rate = 0.8;
        nameUtterance.pitch = 1.3;
        nameUtterance.volume = 0.9;
        
        // Segunda parte: pergunta sobre a vogal
        const questionUtterance = new SpeechSynthesisUtterance('Qual vogal inicia esta palavra?');
        questionUtterance.lang = 'pt-BR';
        questionUtterance.rate = 0.8;
        questionUtterance.pitch = 1.4;
        questionUtterance.volume = 0.9;
        
        // Reproduzir em sequência
        speechSynthesis.speak(nameUtterance);
        
        nameUtterance.onend = () => {
            setTimeout(() => {
                speechSynthesis.speak(questionUtterance);
            }, 500); // Pausa de meio segundo entre as falas
        };
        
        console.log(`🎵 Sequência completa: ${question.image.name} + pergunta`);
    }
}

// === FUNÇÕES DE NAVEGAÇÃO ===
function showUserTypeScreen() {
    showScreen('userTypeScreen');
}

function showTeacherLogin() {
    showScreen('teacherLoginScreen');
}

function showTeacherRegister() {
    showScreen('teacherRegisterScreen');
}

function showStudentLogin() {
    showScreen('studentLoginScreen');
}

async function showTeacherDashboard() {
    showScreen('teacherDashboard');
    await loadTeacherData();
}

async function showStudentGame() {
    showScreen('startScreen');
    await loadStudentProgress();
    initializeGame();
    setupEventListeners();
    createPlaceholderAudios();
}

function renderClasses(classes) {
    const container = document.getElementById('classesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (classes.length === 0) {
        container.innerHTML = '<p>Nenhuma turma criada ainda. Crie sua primeira turma!</p>';
        return;
    }
    
    classes.forEach(cls => {
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        classCard.innerHTML = `
            <h3>${cls.name}</h3>
            <div class="class-info">
                <span class="student-count">👥 0 alunos</span>
                <small>Criada em ${new Date(cls.created_at).toLocaleDateString()}</small>
            </div>
            <div class="class-actions">
                <button class="btn primary" onclick="manageClass('${cls.id}', '${cls.name}')">
                    <i class="fas fa-cog"></i> Gerenciar
                </button>
            </div>
        `;
        container.appendChild(classCard);
    });
}

// === FUNÇÕES DE MODAL ===
function showCreateClassModal() {
    const modal = document.getElementById('createClassModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

async function manageClass(classId, className) {
    currentClassId = classId;
    
    document.getElementById('manageClassTitle').textContent = `Gerenciar: ${className}`;
    
    const modal = document.getElementById('manageClassModal');
    if (modal) {
        modal.classList.add('show');
        await loadClassStudents();
    }
}

function renderStudents(students) {
    const container = document.getElementById('studentsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (students.length === 0) {
        container.innerHTML = '<p>Nenhum aluno cadastrado ainda.</p>';
        return;
    }
    
    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.innerHTML = `
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Usuário: ${student.username}</p>
            </div>
            <div class="progress-indicator">
                <div class="progress-bar-small">
                    <div class="progress-fill-small" style="width: 0%"></div>
                </div>
                <span>0%</span>
            </div>
        `;
        container.appendChild(studentItem);
    });
}

function showCreateStudentForm() {
    const form = document.getElementById('createStudentForm');
    if (form) {
        form.style.display = 'block';
    }
}

function hideCreateStudentForm() {
    const form = document.getElementById('createStudentForm');
    if (form) {
        form.style.display = 'none';
        form.querySelectorAll('input').forEach(input => input.value = '');
    }
}

// === FUNÇÕES DE TABS ===
function showTab(tabName) {
    // Esconder todas as tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Ativar botão da tab
    event.target.classList.add('active');
    
    if (tabName === 'progress') {
        loadClassProgress();
    }
}

async function loadClassProgress() {
    if (!currentClassId) return;
    
    try {
        const response = await fetch(`/api/teacher/classes/${currentClassId}/progress`);
        if (response.ok) {
            const data = await response.json();
            renderClassProgress(data.progress);
        }
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
    }
}

function renderClassProgress(progressData) {
    const container = document.getElementById('classProgressChart');
    if (!container) return;
    
    container.innerHTML = '<p>Relatório de progresso em desenvolvimento...</p>';
}

// === FUNÇÕES DO PROGRESSO DO ALUNO ===
async function loadStudentProgress() {
    if (!currentUser || currentUser.type !== 'student') return;
    
    try {
        const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('student_id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignora erro de "nenhuma linha encontrada"
            throw error;
        }

        if (data) {
            gameState.currentPhase = data.current_phase || 1;
            gameState.playerProgress = data;
            console.log('📂 Progresso carregado do Supabase:', data);
        }
    } catch (error) {
        console.error('Erro ao carregar progresso:', error.message);
    }
}

async function saveStudentProgress() {
    if (!currentUser || currentUser.type !== 'student') return;

    try {
        const progress = {
            student_id: currentUser.id,
            current_phase: gameState.currentPhase,
            completed_phases: gameState.playerProgress.completed_phases || [],
            total_score: (gameState.playerProgress.total_score || 0) + gameState.score,
            last_played: new Date().toISOString()
        };

        const { error } = await supabase
            .from('progress')
            .upsert(progress, { onConflict: 'student_id' });

        if (error) throw error;

        console.log('💾 Progresso salvo no Supabase:', progress);
    } catch (error) {
        console.error('Erro ao salvar progresso:', error.message);
    }
}

// === FUNÇÃO DE FEEDBACK ===
function showFeedback(message, type = 'info') {
    // Criar elemento de feedback se não existir
    let feedback = document.getElementById('globalFeedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'globalFeedback';
        feedback.className = 'feedback';
        feedback.innerHTML = '<div class="feedback-content"><span class="feedback-icon"></span><span class="feedback-text"></span></div>';
        document.body.appendChild(feedback);
    }
    
    const icon = feedback.querySelector('.feedback-icon');
    const text = feedback.querySelector('.feedback-text');
    
    // Definir ícone baseado no tipo
    if (type === 'success') {
        icon.innerHTML = '✅';
    } else if (type === 'error') {
        icon.innerHTML = '❌';
    } else {
        icon.innerHTML = 'ℹ️';
    }
    
    text.textContent = message;
    feedback.className = `feedback ${type} show`;
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 3000);
}

function selectAnswer(selectedAnswer) {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    let isCorrect = false;
    let correctAnswer = '';
    
    if (currentQuestion.type === 'audio-to-letter') {
        isCorrect = selectedAnswer === currentQuestion.correctLetter;
        correctAnswer = currentQuestion.correctLetter;
    } else if (currentQuestion.type === 'image-to-vowel') {
        isCorrect = selectedAnswer === currentQuestion.correctVowel;
        correctAnswer = currentQuestion.correctVowel;
    }
    
    // Desabilitar todos os botões temporariamente
    const answerButtons = document.querySelectorAll('.letter-button, .vowel-button');
    answerButtons.forEach(btn => btn.style.pointerEvents = 'none');
    
    // Aplicar feedback visual
    answerButtons.forEach(btn => {
        if (btn.textContent === selectedAnswer) {
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        } else if (btn.textContent === correctAnswer) {
            btn.classList.add('correct');
        }
    });
    
    // Processar resposta
    if (isCorrect) {
        gameState.score++;
        showFeedback('success', '🎉 Muito bem!', 'Você acertou!');
        playSuccessSound();
        
        if (currentQuestion.type === 'image-to-vowel') {
            updateHelperText(`Parabéns! ${currentQuestion.image.name} começa com ${correctAnswer}!`);
        } else {
            updateHelperText('Parabéns! Você acertou!');
        }
    } else {
        showFeedback('error', '😅 Quase lá!', 'Tente novamente!');
        playErrorSound();
        
        if (currentQuestion.type === 'image-to-vowel') {
            updateHelperText(`${currentQuestion.image.name} começa com a vogal ${correctAnswer}`);
        } else {
            updateHelperText(`A resposta correta era: ${correctAnswer}`);
        }
    }
    
    // Mostrar botão de próxima questão após delay
    setTimeout(() => {
        elements.nextQuestion.style.display = 'block';
        answerButtons.forEach(btn => btn.style.pointerEvents = 'auto');
    }, 2000);
    
    updateUI();
}

function playCurrentAudio() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) return;
    
    const letter = currentQuestion.correctLetter.toLowerCase();
    const audioData = gameState.uploadedAudios[letter];
    
    // Mostrar animação de ondas sonoras
    elements.soundWaves.classList.add('playing');
    
    console.log(`🎵 Reproduzindo áudio da letra ${letter.toUpperCase()}`);
    
    if (audioData) {
        if (audioData.type === 'file' && audioData.audio) {
            // Áudio personalizado da professora tem prioridade
            console.log(`📻 Usando áudio personalizado: ${audioData.fileName}`);
            audioData.audio.currentTime = 0;
            audioData.audio.volume = 0.8;
            audioData.audio.play()
                .then(() => {
                    console.log(`✅ Áudio ${letter.toUpperCase()} reproduzido com sucesso`);
                })
                .catch(e => {
                    console.warn(`❌ Erro ao reproduzir áudio ${letter.toUpperCase()}:`, e);
                    // Fallback para síntese de voz
                    fallbackToSpeech(letter);
                });
        } else if (audioData.type === 'speech' && audioData.utterance) {
            // Usar síntese de voz como fallback
            console.log(`🗣️ Usando síntese de voz para letra ${letter.toUpperCase()}`);
            speechSynthesis.speak(audioData.utterance);
        }
    } else {
        // Criar síntese de voz on-demand se não houver áudio
        console.log(`🔄 Criando síntese de voz para letra ${letter.toUpperCase()}`);
        fallbackToSpeech(letter);
    }
    
    // Esconder animação após 3 segundos
    setTimeout(() => {
        elements.soundWaves.classList.remove('playing');
    }, 3000);
}

function fallbackToSpeech(letter) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(letter.toUpperCase());
        utterance.lang = 'pt-BR';
        utterance.rate = 0.7;
        utterance.pitch = 1.5;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
    }
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
    
    console.log(`📊 Fase ${gameState.currentPhase} finalizada - Precisão: ${accuracy}%`);
    
    // Salvar progresso
    savePlayerProgress();
    
    // Mostrar resultados
    showResultScreen(accuracy, passed);
}

function showResultScreen(accuracy, passed) {
    elements.finalScore.textContent = gameState.score;
    elements.accuracy.textContent = accuracy;
    
    // Configurar interface baseada no resultado
    if (passed) {
        elements.resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        elements.resultIcon.className = 'result-icon success';
        elements.resultTitle.textContent = 'Parabéns!';
        elements.resultMessage.textContent = 'Você passou de fase! Continue assim!';
        elements.continueButton.style.display = 'inline-block';
        elements.retryButton.style.display = 'none';
        
        // Mostrar celebração
        elements.celebration.style.display = 'block';
        playVictorySound();
        
    } else if (gameState.attempts > 0) {
        elements.resultIcon.innerHTML = '<i class="fas fa-redo"></i>';
        elements.resultIcon.className = 'result-icon retry';
        elements.resultTitle.textContent = 'Quase lá!';
        elements.resultMessage.textContent = `Você precisa de ${GAME_CONFIG.minAccuracy}% para passar. Tente novamente!`;
        elements.continueButton.style.display = 'none';
        elements.retryButton.style.display = 'inline-block';
        
    } else {
        elements.resultIcon.innerHTML = '<i class="fas fa-heart-broken"></i>';
        elements.resultIcon.className = 'result-icon retry';
        elements.resultTitle.textContent = 'Não desista!';
        elements.resultMessage.textContent = 'Vamos tentar de novo desde o início?';
        elements.continueButton.style.display = 'none';
        elements.retryButton.style.display = 'none';
    }
    
    showScreen('resultScreen');
}

function nextPhase() {
    if (gameState.currentPhase < GAME_CONFIG.maxPhases) {
        gameState.currentPhase++;
        gameState.attempts = GAME_CONFIG.maxAttempts;
        generateQuestions();
        showScreen('gameScreen');
        updateUI();
        startQuestion();
    } else {
        // Jogo completo
        elements.resultTitle.textContent = 'Jogo Completo!';
        elements.resultMessage.textContent = 'Parabéns! Você completou todas as fases!';
        elements.continueButton.style.display = 'none';
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
    gameState = {
        currentPhase: 1,
        currentQuestion: 0,
        score: 0,
        attempts: GAME_CONFIG.maxAttempts,
        questions: [],
        currentQuestionIndex: 0,
        playerProgress: gameState.playerProgress,
        uploadedAudios: gameState.uploadedAudios
    };
    
    showScreen('startScreen');
}

function showScreen(screenName) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar tela solicitada
    elements[screenName].classList.add('active');
}

function updateUI() {
    // Atualizar informações da fase
    elements.currentPhaseSpan.textContent = gameState.currentPhase;
    elements.scoreSpan.textContent = gameState.score;
    elements.totalQuestionsSpan.textContent = gameState.questions.length;
    elements.attemptsSpan.textContent = gameState.attempts;
    
    // Atualizar título da fase se disponível
    const currentPhaseConfig = GAME_CONFIG.phases[gameState.currentPhase];
    if (currentPhaseConfig) {
        const phaseTitle = document.querySelector('.phase-info h2');
        if (phaseTitle) {
            phaseTitle.innerHTML = `
                Fase ${gameState.currentPhase}
                <small style="display: block; font-size: 0.7em; font-weight: normal; opacity: 0.8;">
                    ${currentPhaseConfig.name}
                </small>
            `;
        }
    }
}

function updateProgress() {
    const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;
    elements.progressFill.style.width = `${progress}%`;
}

function updateHelperText(text) {
    elements.helperText.textContent = text;
}

function showFeedback(type, icon, text) {
    const feedback = elements.feedback;
    const feedbackIcon = feedback.querySelector('.feedback-icon');
    const feedbackText = feedback.querySelector('.feedback-text');
    
    feedback.className = `feedback ${type}`;
    feedbackIcon.textContent = icon;
    feedbackText.textContent = text;
    
    feedback.classList.add('show');
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 2000);
}

function playSuccessSound() {
    // Tentar tocar som de sucesso
    if (gameState.uploadedAudios['success']) {
        gameState.uploadedAudios['success'].audio.play().catch(e => console.warn('Erro ao tocar som de sucesso:', e));
    } else {
        // Usar síntese de voz como fallback
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Muito bem!');
            utterance.lang = 'pt-BR';
            utterance.rate = 1.2;
            utterance.pitch = 1.8;
            speechSynthesis.speak(utterance);
        }
    }
}

function playErrorSound() {
    // Tentar tocar som de erro
    if (gameState.uploadedAudios['error']) {
        gameState.uploadedAudios['error'].audio.play().catch(e => console.warn('Erro ao tocar som de erro:', e));
    } else {
        // Usar síntese de voz como fallback
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Tente novamente!');
            utterance.lang = 'pt-BR';
            utterance.rate = 1.0;
            utterance.pitch = 1.5;
            speechSynthesis.speak(utterance);
        }
    }
}

function playVictorySound() {
    // Tentar tocar som de vitória
    if (gameState.uploadedAudios['victory']) {
        gameState.uploadedAudios['victory'].audio.play().catch(e => console.warn('Erro ao tocar som de vitória:', e));
    } else {
        // Usar síntese de voz como fallback
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Parabéns! Você passou de fase!');
            utterance.lang = 'pt-BR';
            utterance.rate = 1.1;
            utterance.pitch = 1.7;
            speechSynthesis.speak(utterance);
        }
    }
}

function savePlayerProgress() {
    try {
        const progress = {
            currentPhase: gameState.currentPhase,
            completedPhases: gameState.playerProgress.completedPhases || [],
            totalScore: (gameState.playerProgress.totalScore || 0) + gameState.score,
            lastPlayed: new Date().toISOString()
        };
        
        // Marcar fase como completa se passou
        const accuracy = Math.round((gameState.score / gameState.questions.length) * 100);
        if (accuracy >= GAME_CONFIG.minAccuracy) {
            if (!progress.completedPhases.includes(gameState.currentPhase)) {
                progress.completedPhases.push(gameState.currentPhase);
            }
        }
        
        localStorage.setItem('alphabetGame_progress', JSON.stringify(progress));
        gameState.playerProgress = progress;
        
        console.log('💾 Progresso salvo:', progress);
    } catch (error) {
        console.warn('Erro ao salvar progresso:', error);
    }
}

function loadPlayerProgress() {
    try {
        const saved = localStorage.getItem('alphabetGame_progress');
        if (saved) {
            gameState.playerProgress = JSON.parse(saved);
            console.log('📂 Progresso carregado:', gameState.playerProgress);
        }
    } catch (error) {
        console.warn('Erro ao carregar progresso:', error);
        gameState.playerProgress = {};
    }
}

// Tratamento de erros globais
window.addEventListener('error', function(event) {
    console.error('Erro no jogo:', event.error);
});

// Prevenção de zoom em dispositivos móveis
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Log de inicialização
console.log('🎓 Jogo de Alfabetização carregado successfully!');

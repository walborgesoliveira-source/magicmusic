// Magic Music App State & Controller

const CURATED_SEED_SONGS = [
    {
        id: 1,
        title: "O Brilho da Júlia",
        artist: "Magic Music AI & Pedro",
        language: "Aniversário",
        category: "Pop BR",
        coverColorHex: "0xFFF43F5E",
        originalLyrics: `[Verso 1]\nHoje o sol brilha com força no olhar\nPois é seu dia de comemorar\nJúlia faz trinta com riso sutil\nEspalhando alegria como ninguém viu\n\n[Refrão]\nParabéns, Júlia, estrela do amanhecer!\nTodo esse amor que criamos pra você\nQue sua luz continue a brilhar\nE que seus gatos venham festejar!\n\n[Verso 2]\nHistórias lindas que o tempo guardou\nSua risada que a todos curou\nSempre cuidando de quem está por perto\nCom seu abraço doce e afeto certo\n\n[Refrão]\nParabéns, Júlia, estrela do amanhecer!\nTodo esse amor que criamos pra você\nQue sua luz continue a brilhar\nE que seus gatos venham festejar!\n\n[Outro]\nTrinta anos de pura emoção e amor\nParabéns pra Júlia, seja onde for!`,
        translatedLyrics: "Sincronizada via TTS. Gênero: Pop.",
        romanization: "Alegre, Emocionante, Festivo",
        durationSeconds: 120,
        isFavorite: true
    },
    {
        id: 2,
        title: "Nosso Doce Lar",
        artist: "Magic Music AI & Thiago",
        language: "Declaração de amor",
        category: "Acústico / MPB",
        coverColorHex: "0xFF8B5CF6",
        originalLyrics: `[Verso 1]\nNo labirinto do meu caminhar\nSeu abraço doce me fez ancorar\nMariana, o som do seu riso é canção\nQue traz acalento pro meu coração\n\n[Refrão]\nTe amar é a coisa mais pura e real\nNosso café da manhã de quintal\nJuntos sonhando em frente ao mar\nMariana, nosso amor é o meu lar\n\n[Verso 2]\nLembra de quando a gente viajou?\nA chuva caindo e você me abraçou\nSua mania de ler antes de dormir\nÉ o que me faz suspirar e sorrir\n\n[Refrão]\nTe amar é a coisa mais pura e real\nNosso café da manhã de quintal\nJuntos sonhando em frente ao mar\nMariana, nosso amor é o meu lar\n\n[Outro]\nSempre contigo pro que der e vier\nVocê é o meu amor, minha linda mulher...`,
        translatedLyrics: "Sincronizada via TTS. Gênero: MPB Autoral.",
        romanization: "Romântico, Suave, Poético",
        durationSeconds: 135,
        isFavorite: false
    },
    {
        id: 3,
        title: "Festa na Firma do André",
        artist: "Magic Music AI & Amigos",
        language: "Pegadinha",
        category: "Trap / Rap",
        coverColorHex: "0xFFF59E0B",
        originalLyrics: `[Verso 1]\nLá vem o André atrasado de novo\nDizendo que o trânsito parou o povo\nMas todo mundo sabe qual é o rolê\nEle tava jogando videogame até o amanhecer!\n\n[Refrão]\nAndré, o rei do cafezinho demorado!\nSempre com o fone de ouvido plugado\nPrometeu o relatório pra ontem às dez\nMas tá no WhatsApp gastando o inglês!\n\n[Verso 2]\nDe calço na mesa ou fingindo reunião\nSua risada ecoa por todo o salão\nCom o prato de coxinha dominando o setor\nAndré é nosso herói trabalhador!\n\n[Refrão]\nAndré, o rei do cafezinho demorado!\nSempre com o fone de ouvido plugado\nPrometeu o relatório pra ontem às dez\nMas tá no WhatsApp gastando o inglês!\n\n[Outro]\nValeu, André, figura sem igual\nO setor de suporte te acha sensacional!`,
        translatedLyrics: "Sincronizada via TTS. Gênero: Hip Hop / Trap.",
        romanization: "Divertido, Descontraído, Zueira",
        durationSeconds: 110,
        isFavorite: false
    }
];

// Fallback Offline Generator Templates (Copying Android SongTemplates)
const SongTemplates = {
    getFallbackTemplate(occasion, style, name, stories, vibes) {
        const finalName = name || "Você";
        const finalStory = stories || "que alegra a vida de todos nós";
        let title = "";
        switch (occasion) {
            case "Aniversário": title = `O Dia de ${finalName}`; break;
            case "Declaração de amor": title = `Te Amar, ${finalName}`; break;
            case "Casamento": title = `${finalName} e o Amor Eterno`; break;
            case "Pegadinha": title = `O Show de ${finalName}`; break;
            case "Motivação": title = `Força, ${finalName}`; break;
            default: title = `Festa de ${finalName}`; break;
        }

        let lyrics = "";
        switch (occasion) {
            case "Aniversário":
                lyrics = `[Verso 1]\nHoje o céu brilha com outro tom\nCelebrando a sua história e seu dom\n${finalName} faz mais um ano vencer\nTantas memórias pra gente viver\n\n[Refrão]\nParabéns, que dia tão feliz!\nVocê é tudo que a vida sempre quis\n${finalName}, sorria pro amanhã\nSeu brilho é joia sob o sol da manhã\n\n[Verso 2]\nHistórias lindas que o tempo guardou\nE essa piada que a gente relembrou:\n${finalStory}\nSiga em frente com todo o carinho\nNunca estará só em seu caminho\n\n[Refrão]\nParabéns, que dia tão feliz!\nVocê é tudo que a vida sempre quis\n${finalName}, sorria pro amanhã\nSeu brilho é joia sob o sol da manhã\n\n[Outro]\nUm ano de paz, de amor sem fim\nParabéns pra você, é sim!`;
                break;
            case "Declaração de amor":
                lyrics = `[Verso 1]\nNo labirinto do meu caminhar\nSeu olhar me ensinou a respirar\n${finalName}, o seu riso me cura a dor\nÉs meu compasso, minha rima de amor\n\n[Refrão]\nPor você eu canto essa canção\nQue bate forte no meu coração\nTe amar, ${finalName}, é o meu viver\nO pôr do sol mais lindo de se ver\n\n[Verso 2]\nLembra quando tudo começou?\nO seu perfume no ar se espalhou\nComo se dizia: ${finalStory}\nNossa história é o meu maior troféu\n\n[Refrão]\nPor você eu canto essa canção\nQue bate forte no meu coração\nTe amar, ${finalName}, é o meu viver\nO pôr do sol mais lindo de se ver\n\n[Outro]\nSempre contigo, seja como for\n${finalName}, meu eterno amor...`;
                break;
            case "Casamento":
                lyrics = `[Verso 1]\nDuas vidas prontas pra recomeçar\nSob as bênçãos eternas do altar\n${finalName} deu o sim de todo coração\nNum laço firme de amor e união\n\n[Refrão]\nO amor uniu o que o tempo selou\nUma história linda que agora começou\nDois caminhos, uma só direção\nUnidos na mesma canção\n\n[Verso 2]\nCúmplices parceiros construindo o lar\n${finalStory}\nAs promessas que juramos proteger\nAté o tempo enfim envelhecer\n\n[Refrão]\nO amor uniu o que o tempo selou\nUma história linda que agora começou\nDois caminhos, uma só direção\nUnidos na mesma canção\n\n[Outro]\nPara sempre juntos no altar\nSeu amor é o meu eterno lar...`;
                break;
            case "Pegadinha":
                lyrics = `[Verso 1]\nLá vem ${finalName} de novo aprontar\nNinguém na firma consegue aguentar\nSempre dormindo ou jogando conversa fora\nMas na hora do lanche ele nunca demora!\n\n[Refrão]\nQue figura ruidosa e sem igual!\n${finalName} é atração de festival\nSua piada é mais velha que o mundo\nMas faz rir até o mais profundo\n\n[Verso 2]\nOlha só de quem estamos falando:\n${finalStory}\nSeu telefone não para de vibrar\nDizendo que vai trabalhar!\n\n[Refrão]\nQue figura ruidosa e sem igual!\n${finalName} é atração de festival\nSua piada é mais velha que o mundo\nMas faz rir até o mais profundo\n\n[Outro]\nValeu, ${finalName}, cara de pau\nVocê é nosso herói nacional!`;
                break;
            case "Motivação":
                lyrics = `[Verso 1]\nA tempestade tenta te parar\nMas a sua força vai te levantar\n${finalName}, levante os olhos pro infinito\nSeu potencial é o grito mais bonito\n\n[Refrão]\nSiga em frente, não olhe pra trás\nO seu foco te guiará para a paz\n${finalName}, você nasceu para vencer\nNenhuma montanha vai te deter!\n\n[Verso 2]\nLembre da jornada e das lições\nDa superação em tantas gerações\nQuando pensavam: ${finalStory}\nA sua luz rasgou o escuro do véu!\n\n[Refrão]\nSiga em frente, não olhe pra trás\nO seu foco te guiará para a paz\n${finalName}, você nasceu para vencer\nNenhuma montanha vai te deter!\n\n[Outro]\nForça infinita no seu coração\nEssa é a sua canção...`;
                break;
            default:
                lyrics = `[Verso 1]\nO som tá batendo, a pista esquentou\nE ${finalName} com estilo chegou\nEsqueça os problemas, venha festejar\nEssa noite não tem pressa de acabar\n\n[Refrão]\nFesta louca, energia sem fim!\n${finalName} comanda a balada sim!\nErgam os copos, celebrem o agora\nDeixem a tristeza lá fora!\n\n[Verso 2]\nA galera pulando, cantando no refrão\nA nossa amizade é pura emoção\nComo diz o lema: ${finalStory}\nA diversão tá garantida sob o céu!\n\n[Refrão]\nFesta louca, energia sem fim!\n${finalName} comanda a balada sim!\nErgam os copos, celebrem o agora\nDeixem a tristeza lá fora!\n\n[Outro]\nA noite inteira curtindo o role\nSó termina quando o sol nascer!`;
                break;
        }

        const colors = ["0xFFF43F5E", "0xFF8B5CF6", "0xFFD946EF", "0xFF06B6D4", "0xFF10B981", "0xFFF59E0B"];
        const hex = colors[Math.floor(Math.random() * colors.length)];

        return {
            id: Date.now(),
            title: title,
            artist: `Magic Music AI & ${finalName}`,
            language: occasion,
            category: style,
            coverColorHex: hex,
            originalLyrics: lyrics,
            translatedLyrics: "Rápida prévia instrumental disponível. Sincronização automática via TTS.",
            romanization: vibes.join(", "),
            durationSeconds: 120,
            isFavorite: false
        };
    }
};

// Database/Storage controller
const AppDB = {
    getSongs() {
        const local = localStorage.getItem("magic_music_songs");
        if (!local) {
            localStorage.setItem("magic_music_songs", JSON.stringify(CURATED_SEED_SONGS));
            return CURATED_SEED_SONGS;
        }
        return JSON.parse(local);
    },
    saveSongs(songs) {
        localStorage.setItem("magic_music_songs", JSON.stringify(songs));
    },
    getCredits() {
        const local = localStorage.getItem("magic_music_credits");
        if (local === null) {
            localStorage.setItem("magic_music_credits", "3");
            return 3;
        }
        return parseInt(local, 10);
    },
    saveCredits(credits) {
        localStorage.setItem("magic_music_credits", credits.toString());
    }
};

// Application State
let songs = [];
let credits = 3;
let activeTab = "create";
let currentPlayingSong = null;
let isPlaying = false;
let playbackProgress = 0; // fraction 0.0 to 1.0
let activeLyricLineIndex = 0;
let playbackInterval = null;
const html5Audio = new Audio();
let adminModeActive = false;

let wizardStep = 1;
let selectedOccasion = "Aniversário";
let selectedStyle = "Pop BR";
let wizardDraftSong = null;

let currentQuizQuestion = null;
let selectedPackAmount = null;

// Web Audio API Synthesizer Context
let audioCtx = null;
let masterGain = null;
let analyser = null;
let synthTimer = null;
let synthBeatIndex = 0;

// Initialize Web Audio Context on Interaction
function initAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.25, audioCtx.currentTime); // Safe volume
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // Small size for visualizer bands
    
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
}

// Synthesize backing drum kick sound
function playSynthKick(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.3);
}

// Synthesize backing snare noise burst
function playSynthSnare(time) {
    if (!audioCtx) return;
    // Create White Noise buffer
    const bufferSize = audioCtx.sampleRate * 0.2; // 0.2s duration
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, time);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + 0.25);
}

// Synthesize acoustic shaker
function playSynthShaker(time) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.05;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(6000, time);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time);
}

// Synthesize chords based on style
function playSynthChord(time, style, chordIndex) {
    if (!audioCtx) return;
    
    // Choose chord frequencies
    let freqs = [];
    let oscType = "sine";
    let vol = 0.12;
    let duration = 0.8;
    let isArpeggio = false;
    
    switch (style) {
        case "Pop BR":
            oscType = "sine";
            duration = 1.6;
            switch (chordIndex % 4) {
                case 0: freqs = [261.63, 329.63, 392.00]; break; // C
                case 1: freqs = [196.00, 246.94, 293.66]; break; // G
                case 2: freqs = [220.00, 261.63, 329.63]; break; // Am
                default: freqs = [174.61, 220.00, 261.63]; break; // F
            }
            break;
        case "Trap / Rap":
            oscType = "triangle"; // Deep sub bass feel
            duration = 1.6;
            vol = 0.22;
            switch (chordIndex % 2) {
                case 0: freqs = [110.00, 130.81, 164.81]; break; // Am Deep
                default: freqs = [73.42, 87.31, 110.00]; break; // Dm Deep
            }
            break;
        case "Rock":
            oscType = "sawtooth"; // Power chords guitar distorted style
            duration = 0.8;
            vol = 0.08;
            switch (chordIndex % 4) {
                case 0: freqs = [130.81, 196.00]; break; // C5
                case 1: freqs = [98.00, 146.83]; break; // G5
                case 2: freqs = [110.00, 164.81]; break; // A5
                default: freqs = [87.31, 130.81]; break; // F5
            }
            break;
        case "Eletrônica":
            oscType = "sawtooth";
            duration = 0.4; // rapid pulses
            vol = 0.06;
            switch (chordIndex % 2) {
                case 0: freqs = [164.81, 246.94, 329.63]; break; // E
                default: freqs = [220.00, 330.00, 440.00]; break; // A
            }
            break;
        case "Acústico / MPB":
            oscType = "triangle"; // Plucky acoustic guitar chords
            duration = 1.0;
            vol = 0.16;
            isArpeggio = true; // Pluck arpeggios
            switch (chordIndex % 4) {
                case 0: freqs = [261.63, 329.63, 392.00, 493.88]; break; // Cmaj7
                case 1: freqs = [293.66, 349.23, 440.00, 587.33]; break; // Dm7
                case 2: freqs = [196.00, 246.94, 293.66, 349.23]; break; // G7
                default: freqs = [174.61, 220.00, 261.63, 329.63]; break; // Fmaj7
            }
            break;
        default: // Sertanejo
            oscType = "sine";
            duration = 1.2;
            switch (chordIndex % 2) {
                case 0: freqs = [196.00, 246.94, 293.66]; break; // G
                default: freqs = [146.83, 184.99, 220.00]; break; // D
            }
            break;
    }
    
    // Schedule the oscillators
    freqs.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(f, time + (isArpeggio ? idx * 0.08 : 0));
        
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.05 + (isArpeggio ? idx * 0.08 : 0));
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(time);
        osc.stop(time + duration + 0.1);
    });
}

// Start Synthesizer scheduler loops
function startBackingSynthesizer(style) {
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    
    let tempoBpm = 110;
    if (style === "Trap / Rap") tempoBpm = 135;
    if (style === "Eletrônica") tempoBpm = 125;
    if (style === "Acústico / MPB") tempoBpm = 88;
    
    const beatInterval = 60 / tempoBpm; // duration of one beat in seconds
    synthBeatIndex = 0;
    
    // Scheduler clock ticking every beat
    function scheduleNextBeat() {
        const now = audioCtx.currentTime;
        const nextTime = now + beatInterval;
        const chordIdx = Math.floor(synthBeatIndex / 4);
        
        // 1. Play drums depending on rhythm style
        if (style === "Trap / Rap") {
            // Kick on 1 and 3, Snare on 2 and 4, rapid hats
            if (synthBeatIndex % 4 === 0 || synthBeatIndex % 4 === 2) playSynthKick(nextTime);
            if (synthBeatIndex % 4 === 1 || synthBeatIndex % 4 === 3) playSynthSnare(nextTime);
            // Hihats
            playSynthShaker(nextTime);
            playSynthShaker(nextTime + beatInterval / 2);
        } else if (style === "Eletrônica") {
            // Four on the floor kick (every beat)
            playSynthKick(nextTime);
            if (synthBeatIndex % 2 === 1) playSynthSnare(nextTime);
            playSynthShaker(nextTime + beatInterval / 2);
        } else if (style === "Acústico / MPB") {
            // Soft shakers only
            if (synthBeatIndex % 2 === 0) playSynthShaker(nextTime);
            playSynthShaker(nextTime + beatInterval / 2);
        } else if (style === "Rock") {
            // Power beat
            if (synthBeatIndex % 2 === 0) playSynthKick(nextTime);
            else playSynthSnare(nextTime);
        } else { // Pop & Sertanejo
            if (synthBeatIndex % 4 === 0 || synthBeatIndex % 4 === 2) playSynthKick(nextTime);
            if (synthBeatIndex % 4 === 2) playSynthSnare(nextTime);
        }
        
        // 2. Play instrumental chords
        if (style === "Eletrônica") {
            // Pulse chord on every beat
            playSynthChord(nextTime, style, chordIdx);
        } else if (synthBeatIndex % 4 === 0) {
            // Play longer chords every 4 beats
            playSynthChord(nextTime, style, chordIdx);
        }
        
        synthBeatIndex++;
        synthTimer = setTimeout(scheduleNextBeat, beatInterval * 1000);
    }
    
    scheduleNextBeat();
}

function stopBackingSynthesizer() {
    if (synthTimer) {
        clearTimeout(synthTimer);
        synthTimer = null;
    }
}

// Web Speech API Vocal Singer
function speakLyricVocals(text, style) {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Cancel any active speakings immediately
    
    if (!text || text.trim() === "" || text.startsWith("[")) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    
    // Customize pitch/speed rates according to music styles
    switch (style) {
        case "Trap / Rap":
            utterance.pitch = 1.05;
            utterance.rate = 1.22;
            break;
        case "Eletrônica":
            utterance.pitch = 1.30;
            utterance.rate = 1.10;
            break;
        case "Acústico / MPB":
            utterance.pitch = 1.08;
            utterance.rate = 0.85;
            break;
        case "Sertanejo":
            utterance.pitch = 1.20;
            utterance.rate = 0.95;
            break;
        case "Rock":
            utterance.pitch = 1.18;
            utterance.rate = 1.00;
            break;
        default: // Pop BR, others
            utterance.pitch = 1.15;
            utterance.rate = 1.00;
            break;
    }
    
    window.speechSynthesis.speak(utterance);
}

function stopLyricVocals() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

// HTML5 Canvas Bouncing Equalizer Renderer
function drawVisualizerBars() {
    const canvas = document.getElementById("visualizer-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = 4;
    const gap = 3;
    const barsCount = Math.floor(width / (barWidth + gap));
    
    let freqData = new Uint8Array(barsCount);
    if (isPlaying && analyser) {
        analyser.getByteFrequencyData(freqData);
    }
    
    const timeNow = Date.now() * 0.005;
    
    for (let i = 0; i < barsCount; i++) {
        let val = 0;
        if (isPlaying && analyser) {
            // Read frequency value
            val = freqData[i] / 255;
        } else {
            // Draw slow floating idle wave
            val = (Math.sin(i * 0.35 + timeNow) * 0.45 + 0.55) * 0.08;
        }
        
        // Compute bar height
        const barHeight = height * Math.max(val * 1.5, 0.08);
        const x = i * (barWidth + gap);
        const y = height - barHeight;
        
        // Choose theme colors depending on index (alternating Pink and Indigo)
        const baseColor = i % 2 === 0 ? "rgba(244, 63, 94," : "rgba(99, 102, 241,";
        
        // 1. Draw glowing background shadow
        ctx.fillStyle = `${baseColor} 0.18)`;
        ctx.fillRect(x - 2, y - 1, barWidth + 4, barHeight + 1);
        
        // 2. Draw vertical gradient foreground bar
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "#f43f5e"); // Pink top
        gradient.addColorStop(1, "#6366f1"); // Indigo bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
    }
    
    requestAnimationFrame(drawVisualizerBars);
}

// View-controller and Navigation functions
function switchTab(tabId) {
    if (tabId === "admin" && !adminModeActive) {
        alert("Acesso restrito ao Administrador. Clique no ícone de escudo no topo para fazer login.");
        switchTab("create");
        return;
    }
    
    activeTab = tabId;
    
    // Update active nav item class
    document.querySelectorAll(".nav-item").forEach(el => {
        el.classList.toggle("active", el.getAttribute("data-tab") === tabId);
    });
    
    // Update active tab pane class
    document.querySelectorAll(".tab-pane").forEach(el => {
        el.classList.toggle("active", el.id === `tab-${tabId}`);
    });
    
    if (tabId === "player") {
        renderPlayerScreen();
    } else if (tabId === "library") {
        renderLibraryScreen();
    } else if (tabId === "admin") {
        renderAdminPendingList();
    }
}

// App Initialization
window.addEventListener("DOMContentLoaded", async () => {
    songs = AppDB.getSongs();
    credits = AppDB.getCredits();
    
    // Render initial page elements
    updateCreditsUI();
    renderLibraryScreen();
    setupWizardListeners();
    setupPixClicker();
    
    // Start visualizer animation loop
    drawVisualizerBars();

    // Setup Progress slider listener
    const progressSlider = document.getElementById("player-progress-bar");
    if (progressSlider) {
        progressSlider.addEventListener("input", (e) => {
            if (!currentPlayingSong) return;
            const pct = parseInt(e.target.value) / 100;
            const duration = currentPlayingSong.audioUrl ? html5Audio.duration : currentPlayingSong.durationSeconds;
            if (!duration || isNaN(duration)) return;
            let targetTime = pct * duration;
            
            // 1-minute preview lock
            if (!currentPlayingSong.isPurchased && targetTime >= 60) {
                targetTime = 60;
                e.target.value = Math.floor((60 / duration) * 100);
                document.getElementById("player-progress-fill").style.width = `${e.target.value}%`;
                pauseSong();
                openSongPurchaseCheckout(currentPlayingSong);
                return;
            }
            
            if (currentPlayingSong.audioUrl) {
                html5Audio.currentTime = targetTime;
                playbackProgress = pct;
                document.getElementById("player-time-elapsed").innerText = formatTime(Math.floor(targetTime));
            } else {
                playbackProgress = pct;
                const cleanLines = currentPlayingSong.originalLyrics.split("\n")
                    .filter(l => l.trim() !== "" && !l.trim().startsWith("["));
                activeLyricLineIndex = Math.min(Math.floor(pct * cleanLines.length), cleanLines.length - 1);
                renderPlayerScreen();
            }
        });
    }

    // Sync with backend server
    await syncSongsWithServer();
});

async function syncSongsWithServer() {
    try {
        const response = await fetch("/api/songs");
        if (response.ok) {
            const serverSongs = await response.json();
            if (Array.isArray(serverSongs) && serverSongs.length > 0) {
                songs = serverSongs;
                AppDB.saveSongs(songs);
                renderLibraryScreen();
            }
        }
    } catch (e) {
        console.warn("Could not sync songs with server, using local database:", e);
    }
}


// Setup Occasion & Style cards click listeners in the wizard
function setupWizardListeners() {
    // Occasion Option Selection
    document.querySelectorAll('#panel-step-1 .option-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#panel-step-1 .option-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            selectedOccasion = card.getAttribute('data-occasion');
        });
    });
    
    // Style Option Selection
    document.querySelectorAll('#panel-step-2 .option-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('#panel-step-2 .option-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            selectedStyle = card.getAttribute('data-style');
        });
    });
    
    // Vibe Chips Selection
    document.querySelectorAll('#vibe-chips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
        });
    });
}

function updateCreditsUI() {
    document.getElementById("credits-count").innerText = credits;
    document.getElementById("shop-credits-count").innerText = credits;
    document.getElementById("nav-credits-text").innerText = `Crédito: ${credits}`;
}

// Wizard Step Navigation
function goToStep(stepNumber) {
    wizardStep = stepNumber;
    
    // Update stepper visual indicators
    document.querySelectorAll(".stepper .step").forEach(stepNode => {
        const val = parseInt(stepNode.getAttribute("data-step"), 10);
        stepNode.classList.toggle("active", val === stepNumber);
        stepNode.classList.toggle("completed", val < stepNumber);
    });
    
    // Update step lines
    const lines = document.querySelectorAll(".stepper .step-line");
    lines.forEach((lineNode, index) => {
        lineNode.classList.toggle("completed", index + 1 < stepNumber);
    });
    
    // Display targeted panel
    document.querySelectorAll(".wizard-panel").forEach(panel => {
        panel.classList.toggle("active", panel.id === `panel-step-${stepNumber}`);
    });
}

function resetWizard() {
    document.getElementById("recipient-name").value = "";
    document.getElementById("key-stories").value = "";
    document.querySelectorAll("#vibe-chips .chip").forEach(el => {
        el.classList.toggle("selected", el.getAttribute("data-vibe") === "Alegre" || el.getAttribute("data-vibe") === "Divertido");
    });
    wizardDraftSong = null;
    goToStep(1);
}

// AI Lyrics generator
async function draftLyricsWithAI() {
    const name = document.getElementById("recipient-name").value.trim();
    if (!name) {
        alert("Por favor, insira o nome da pessoa!");
        return;
    }
    
    if (credits <= 0) {
        alert("Você está sem créditos! Adquira mais na Loja.");
        switchTab("shop");
        return;
    }
    
    const stories = document.getElementById("key-stories").value.trim();
    const vibes = Array.from(document.querySelectorAll("#vibe-chips .chip.selected")).map(el => el.getAttribute("data-vibe"));
    
    // Open Loading Overlay Modal
    openModal("production-modal");
    document.getElementById("production-status-text").innerText = "Invocando musas poéticas da IA...";
    
    try {
        console.log("Requesting lyrics generation from server...");
        const response = await fetch("/api/generate-lyrics", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                occasion: selectedOccasion,
                style: selectedStyle,
                name: name,
                stories: stories,
                vibes: vibes
            })
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const generatedSong = await response.json();
        console.log("Lyrics generated successfully via Gemini API:", generatedSong);
        wizardDraftSong = generatedSong;
    } catch (error) {
        console.warn("Failed to generate via server API, using local fallback template:", error);
        // Local fallback template
        wizardDraftSong = SongTemplates.getFallbackTemplate(selectedOccasion, selectedStyle, name, stories, vibes);
        // Add default fields for local generation
        wizardDraftSong.sunoPrompt = "acoustic pop, vocal, melodic";
        wizardDraftSong.status = "ready"; // Local fallback is immediately ready
        wizardDraftSong.audioUrl = ""; // Synthesized locally
        wizardDraftSong.isPurchased = false;
        wizardDraftSong.id = songs.length > 0 ? Math.max(...songs.map(s => s.id)) + 1 : 1;
    }
    
    closeModal("production-modal");
    
    // Pre-populate input fields of step 4
    document.getElementById("draft-title").value = wizardDraftSong.title;
    document.getElementById("draft-lyrics").value = wizardDraftSong.originalLyrics;
    
    goToStep(4);
}

// Production simulation and database insert
async function finalizeProduction() {
    if (!wizardDraftSong) return;
    
    const finalTitle = document.getElementById("draft-title").value;
    const finalLyrics = document.getElementById("draft-lyrics").value;
    
    // Update local draft
    wizardDraftSong.title = finalTitle;
    wizardDraftSong.originalLyrics = finalLyrics;
    
    openModal("production-modal");
    
    // Deduct credits locally
    credits = Math.max(0, credits - 1);
    AppDB.saveCredits(credits);
    updateCreditsUI();
    
    // Check if it's a server-created song (has a backend DB link)
    const isServerBacked = wizardDraftSong.status === "pending_audio" || wizardDraftSong.createdAt;

    if (isServerBacked) {
        document.getElementById("production-status-text").innerText = "Salvando a letra personalizada... ✍️";
        try {
            // Update the server's record with finalized lyrics/title
            await fetch("/api/update-song", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    songId: wizardDraftSong.id,
                    title: finalTitle,
                    originalLyrics: finalLyrics
                })
            });
            
            document.getElementById("production-status-text").innerText = "Enviando para o estúdio de produção... 🚀";
            await new Promise(r => setTimeout(r, 1000));
            document.getElementById("production-status-text").innerText = "Pedido de produção registrado! 🎧";
            await new Promise(r => setTimeout(r, 1000));
            
            await syncSongsWithServer();
            
            closeModal("production-modal");
            alert("Sua letra foi criada! Nossa equipe técnica produzirá o áudio no Suno AI. Acompanhe na biblioteca!");
            
            // Auto play the new song (will show pending state)
            const matchedSong = songs.find(s => s.id === wizardDraftSong.id) || wizardDraftSong;
            selectSong(matchedSong);
            resetWizard();
        } catch (e) {
            console.error("Error finalizing server production:", e);
            closeModal("production-modal");
            alert("Erro ao enviar pedido para o servidor. Salvando localmente.");
            // fallback save
            songs.push(wizardDraftSong);
            AppDB.saveSongs(songs);
            selectSong(wizardDraftSong);
            resetWizard();
        }
    } else {
        // Offline / Fallback mode
        const steps = [
            "Letra aprovada! ✍️",
            "Afinando as guitarras e teclados virtuais... 🎸",
            "Aquecendo a banda de sintetizadores... 🎹",
            "Ajustando vocais digitais em português... 🎤",
            "Mixagem e masterização concluídas! 🎧"
        ];
        
        let i = 0;
        function runProductionStep() {
            if (i < steps.length) {
                document.getElementById("production-status-text").innerText = steps[i];
                i++;
                setTimeout(runProductionStep, 1000);
            } else {
                songs.push(wizardDraftSong);
                AppDB.saveSongs(songs);
                closeModal("production-modal");
                alert("Música produzida com sucesso! Redirecionando para o player.");
                selectSong(wizardDraftSong);
                resetWizard();
            }
        }
        runProductionStep();
    }
}

// Library Screen Renderer
function renderLibraryScreen() {
    const container = document.getElementById("library-songs-container");
    if (!container) return;
    
    const activeFilter = document.querySelector(".filter-chip.active")?.getAttribute("data-filter") || "Todas";
    
    // Setup Filter chips click listener once if rendering
    document.querySelectorAll(".filter-chip").forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll(".filter-chip").forEach(el => el.classList.remove("active"));
            chip.classList.add("active");
            renderLibraryScreen();
        };
    });
    
    const filtered = songs.filter(song => {
        if (activeFilter === "Todas") return true;
        if (activeFilter === "Favoritas") return song.isFavorite;
        if (activeFilter === "Declaração") return song.language.includes("Declaração");
        return song.language === activeFilter;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-library">
                <i class="material-icons">audio_file</i>
                <h4>Nenhuma música encontrada</h4>
                <p>Crie uma música no painel de geração para começar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = "";
    filtered.forEach(song => {
        const isCurPlaying = currentPlayingSong && currentPlayingSong.id === song.id;
        const color = song.coverColorHex.replace("0xFF", "#");
        
        const card = document.createElement("div");
        card.className = `song-card ${isCurPlaying ? "playing" : ""}`;
        card.onclick = () => selectSong(song);
        
        card.innerHTML = `
            <div class="song-cover-box" style="background-color: ${color}">
                <i class="material-icons">music_note</i>
            </div>
            <div class="song-details-box">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
                <div class="tags-row">
                    <span class="badge-tag badge-pink">${song.language}</span>
                    <span class="badge-tag badge-indigo">${song.category}</span>
                </div>
            </div>
            <div class="song-actions-box">
                <div class="song-actions-row">
                    <i class="material-icons favorite-btn ${song.isFavorite ? "favorite-active" : ""}" data-id="${song.id}">
                        ${song.isFavorite ? "favorite" : "favorite_border"}
                    </i>
                    <i class="material-icons delete-btn" data-id="${song.id}">delete</i>
                </div>
                <span class="song-duration-label">02:00</span>
            </div>
        `;
        
        // Listeners for Favorite/Delete
        card.querySelector(".favorite-btn").onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(song.id);
        };
        card.querySelector(".delete-btn").onclick = (e) => {
            e.stopPropagation();
            deleteSong(song.id);
        };
        
        container.appendChild(card);
    });
}

// Selected Song handler
function selectSong(song) {
    currentPlayingSong = song;
    playbackProgress = 0;
    activeLyricLineIndex = 0;
    pauseSong();
    switchTab("player");
}

function toggleFavorite(id) {
    songs = songs.map(s => {
        if (s.id === id) {
            const nextFav = !s.isFavorite;
            if (currentPlayingSong && currentPlayingSong.id === id) {
                currentPlayingSong.isFavorite = nextFav;
            }
            return { ...s, isFavorite: nextFav };
        }
        return s;
    });
    AppDB.saveSongs(songs);
    renderLibraryScreen();
    if (activeTab === "player") renderPlayerScreen();
}

function deleteSong(id) {
    if (confirm("Tem certeza que deseja apagar essa música do seu acervo?")) {
        songs = songs.filter(s => s.id !== id);
        AppDB.saveSongs(songs);
        
        if (currentPlayingSong && currentPlayingSong.id === id) {
            currentPlayingSong = null;
            pauseSong();
            document.getElementById("mini-player").style.display = "none";
        }
        renderLibraryScreen();
    }
}

// Player Screen Renderer
function renderPlayerScreen() {
    if (!currentPlayingSong) {
        document.getElementById("lyrics-scroll-box").innerHTML = '<div class="no-lyrics">Selecione ou crie uma música no acervo!</div>';
        document.getElementById("player-song-title").innerText = "Nenhuma faixa selecionada";
        document.getElementById("player-song-artist").innerText = "Magic Music AI";
        return;
    }
    
    const song = currentPlayingSong;
    const color = song.coverColorHex.replace("0xFF", "#");
    
    // Details
    document.getElementById("player-song-genre").innerText = song.language.toUpperCase();
    document.getElementById("player-song-style").innerText = `ESTILO: ${song.category.toUpperCase()}`;
    document.getElementById("player-song-title").innerText = song.title;
    document.getElementById("player-song-artist").innerText = song.artist;
    document.getElementById("vinyl-center-color").style.backgroundColor = color;
    
    // Grooves color accent border
    const vinylDisc = document.getElementById("vinyl-disc");
    vinylDisc.style.borderColor = color;
    
    // Lyrics list drawing
    const cleanLines = song.originalLyrics.split("\n")
        .filter(l => l.trim() !== "" && !l.trim().startsWith("["));
        
    const scrollBox = document.getElementById("lyrics-scroll-box");
    scrollBox.innerHTML = "";
    
    cleanLines.forEach((lineText, index) => {
        const lineNode = document.createElement("div");
        lineNode.className = `lyric-line ${index === activeLyricLineIndex ? "active" : ""}`;
        lineNode.innerText = lineText;
        if (index === activeLyricLineIndex) {
            lineNode.style.color = color;
            lineNode.style.borderLeft = `3px solid ${color}`;
        } else {
            lineNode.style.color = "";
            lineNode.style.borderLeft = "";
        }
        
        // Seek line on click
        lineNode.onclick = () => seekToLine(index);
        scrollBox.appendChild(lineNode);
    });
    
    // Trigger scroll position sync
    syncLyricsScroll();
}

function syncLyricsScroll() {
    const scrollBox = document.getElementById("lyrics-scroll-box");
    const activeNode = scrollBox.querySelector(".lyric-line.active");
    if (activeNode) {
        const topPos = activeNode.offsetTop;
        scrollBox.scrollTop = topPos - scrollBox.clientHeight / 2 + activeNode.clientHeight / 2;
    }
}

// Media Playback Controls
function playSong() {
    if (!currentPlayingSong) return;
    
    // Check pending status
    if (currentPlayingSong.status === "pending_audio") {
        alert("Esta música ainda está na fila de produção! Nosso estúdio está gerando o áudio no Suno AI. Por favor, aguarde alguns instantes.");
        return;
    }
    
    isPlaying = true;
    document.getElementById("play-icon").innerText = "pause";
    document.getElementById("vinyl-disc").classList.add("spinning");
    
    // Floating mini player display
    const mini = document.getElementById("mini-player");
    document.getElementById("mini-title").innerText = currentPlayingSong.title;
    document.getElementById("mini-artist").innerText = currentPlayingSong.artist;
    document.getElementById("mini-player-cover").style.backgroundColor = currentPlayingSong.coverColorHex.replace("0xFF", "#");
    document.getElementById("mini-play-icon").innerText = "pause";
    mini.style.display = "flex";
    
    const cleanLines = currentPlayingSong.originalLyrics.split("\n")
        .filter(l => l.trim() !== "" && !l.trim().startsWith("["));

    // Check if song has real Suno MP3 audio
    if (currentPlayingSong.audioUrl) {
        // Stop mock synths if running
        stopBackingSynthesizer();
        stopLyricVocals();
        
        // Setup HTML5 Audio
        if (html5Audio.src !== currentPlayingSong.audioUrl) {
            html5Audio.src = currentPlayingSong.audioUrl;
        }
        
        html5Audio.play().catch(e => console.error("Error playing HTML5 audio:", e));
        
        clearInterval(playbackInterval);
        const progressSlider = document.getElementById("player-progress-bar");
        
        playbackInterval = setInterval(() => {
            if (!html5Audio.duration || isNaN(html5Audio.duration)) return;
            
            const duration = html5Audio.duration;
            const currentTime = html5Audio.currentTime;
            
            // 1-minute preview restriction
            if (!currentPlayingSong.isPurchased && currentTime >= 60) {
                html5Audio.currentTime = 60;
                pauseSong();
                openSongPurchaseCheckout(currentPlayingSong);
                return;
            }
            
            playbackProgress = currentTime / duration;
            if (playbackProgress >= 1.0) {
                playbackProgress = 1.0;
                pauseSong();
            }
            
            const percent = Math.floor(playbackProgress * 100);
            progressSlider.value = percent;
            document.getElementById("player-progress-fill").style.width = `${percent}%`;
            
            document.getElementById("player-time-elapsed").innerText = formatTime(Math.floor(currentTime));
            document.getElementById("player-time-total").innerText = formatTime(Math.floor(duration));
            
            // Lyrics auto advance
            if (cleanLines.length > 0) {
                const nextLineIdx = Math.floor(playbackProgress * cleanLines.length);
                const constrainedIdx = Math.min(nextLineIdx, cleanLines.length - 1);
                if (constrainedIdx !== activeLyricLineIndex) {
                    activeLyricLineIndex = constrainedIdx;
                    renderPlayerScreen();
                }
            }
        }, 500);
        
    } else {
        // Mock Web Audio Synthesis Mode
        initAudioContext();
        startBackingSynthesizer(currentPlayingSong.category);
        speakLyricVocals(cleanLines[activeLyricLineIndex], currentPlayingSong.category);
        
        clearInterval(playbackInterval);
        const duration = currentPlayingSong.durationSeconds;
        const progressSlider = document.getElementById("player-progress-bar");
        
        playbackInterval = setInterval(() => {
            const elapsed = playbackProgress * duration;
            
            // 1-minute lock on mock synthesizer
            if (!currentPlayingSong.isPurchased && elapsed >= 60) {
                playbackProgress = 60 / duration;
                pauseSong();
                openSongPurchaseCheckout(currentPlayingSong);
                return;
            }
            
            playbackProgress += 0.5 / duration;
            if (playbackProgress >= 1.0) {
                playbackProgress = 1.0;
                pauseSong();
            }
            
            const percent = Math.floor(playbackProgress * 100);
            progressSlider.value = percent;
            document.getElementById("player-progress-fill").style.width = `${percent}%`;
            
            document.getElementById("player-time-elapsed").innerText = formatTime(Math.floor(playbackProgress * duration));
            document.getElementById("player-time-total").innerText = formatTime(duration);
            
            if (cleanLines.length > 0) {
                const nextLineIdx = Math.floor(playbackProgress * cleanLines.length);
                const constrainedIdx = Math.min(nextLineIdx, cleanLines.length - 1);
                if (constrainedIdx !== activeLyricLineIndex) {
                    activeLyricLineIndex = constrainedIdx;
                    speakLyricVocals(cleanLines[activeLyricLineIndex], currentPlayingSong.category);
                    renderPlayerScreen();
                }
            }
        }, 500);
    }
}

function pauseSong() {
    isPlaying = false;
    document.getElementById("play-icon").innerText = "play_arrow";
    document.getElementById("vinyl-disc").classList.remove("spinning");
    document.getElementById("mini-play-icon").innerText = "play_arrow";
    
    // Stop HTML5 Audio
    html5Audio.pause();
    
    // Stop vocal & synthesis
    stopLyricVocals();
    stopBackingSynthesizer();
    
    clearInterval(playbackInterval);
}

function togglePlayPause() {
    if (isPlaying) pauseSong(); else playSong();
}

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function seekToLine(lineIndex) {
    if (!currentPlayingSong) return;
    const cleanLines = currentPlayingSong.originalLyrics.split("\n")
        .filter(l => l.trim() !== "" && !l.trim().startsWith("["));
    
    if (cleanLines.length > 0) {
        activeLyricLineIndex = lineIndex;
        playbackProgress = lineIndex / cleanLines.length;
        
        // Update progress bar
        const percent = Math.floor(playbackProgress * 100);
        document.getElementById("player-progress-bar").value = percent;
        document.getElementById("player-progress-fill").style.width = `${percent}%`;
        
        if (isPlaying) {
            // Speak vocal
            speakLyricVocals(cleanLines[activeLyricLineIndex], currentPlayingSong.category);
        }
        renderPlayerScreen();
    }
}

function seekLineRelative(direction) {
    if (!currentPlayingSong) return;
    const cleanLines = currentPlayingSong.originalLyrics.split("\n")
        .filter(l => l.trim() !== "" && !l.trim().startsWith("["));
    const nextIdx = activeLyricLineIndex + direction;
    if (nextIdx >= 0 && nextIdx < cleanLines.length) {
        seekToLine(nextIdx);
    }
}

// Share simulated trigger
function shareSong() {
    if (!currentPlayingSong) return;
    const text = `Ouça a música personalizada "${currentPlayingSong.title}" no Magic Music!\n\nLetra:\n${currentPlayingSong.originalLyrics}`;
    if (navigator.share) {
        navigator.share({
            title: currentPlayingSong.title,
            text: text,
            url: window.location.href
        }).catch(err => console.log(err));
    } else {
        // Fallback copy
        navigator.clipboard.writeText(text);
        alert("Texto da música copiado para compartilhar!");
    }
}

// Download simulated/real action
function downloadSong() {
    if (!currentPlayingSong) return;
    
    if (!currentPlayingSong.isPurchased) {
        alert("O download está bloqueado na versão de prévia de 1 minuto. Adquira a música completa para liberá-lo!");
        openSongPurchaseCheckout(currentPlayingSong);
        return;
    }
    
    if (currentPlayingSong.audioUrl) {
        const link = document.createElement('a');
        link.href = currentPlayingSong.audioUrl;
        link.download = `${currentPlayingSong.title}.mp3`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Renderizando instrumental sintético completo MP3... O download começará em breve no seu dispositivo!");
    }
}

// Modals display control
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// Interactive Quiz Game Challenge
function openQuizGame() {
    if (!currentPlayingSong) {
        alert("Selecione uma música primeiro!");
        return;
    }
    generateQuizQuestion(currentPlayingSong);
    openModal("quiz-modal");
}

function generateQuizQuestion(song) {
    const cleanLines = song.originalLyrics.split("\n")
        .filter(l => l.trim() !== "" && !l.trim().startsWith("["));
        
    if (cleanLines.length === 0) return;
    
    // Choose a random line
    const randomLine = cleanLines[Math.floor(Math.random() * cleanLines.length)];
    const words = randomLine.split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(w => w.length > 3);
    
    if (words.length === 0) {
        // Fallback
        currentQuizQuestion = null;
        document.getElementById("quiz-blank-line").innerText = "Erro ao carregar desafio.";
        return;
    }
    
    const targetWord = words[Math.floor(Math.random() * words.length)];
    const blankedLine = randomLine.replace(targetWord, "____");
    
    // Distractors
    const distractors = new Set();
    const allWords = cleanLines.flatMap(l => l.split(/\s+/)).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(w => w.length > 3 && w.toLowerCase() !== targetWord.toLowerCase());
    
    // Shuffle and pick 3
    allWords.sort(() => 0.5 - Math.random());
    for (let w of allWords) {
        if (distractors.size < 3) distractors.add(w);
    }
    
    // Fallbacks if not enough distractors
    const fallbacks = ["sorriso", "abraço", "canção", "alegria", "luz", "dia", "melodia", "parabéns"];
    for (let w of fallbacks) {
        if (distractors.size < 3 && w.toLowerCase() !== targetWord.toLowerCase()) distractors.add(w);
    }
    
    const options = Array.from(distractors);
    options.push(targetWord);
    options.sort(() => 0.5 - Math.random()); // Shuffle options
    
    currentQuizQuestion = {
        linePrompt: randomLine,
        missingWord: targetWord,
        blankedLine: blankedLine,
        options: options
    };
    
    // Update UI
    document.getElementById("quiz-blank-line").innerText = blankedLine;
    document.getElementById("quiz-feedback-box").style.display = "none";
    document.getElementById("btn-next-quiz").style.display = "none";
    
    const container = document.getElementById("quiz-options-container");
    container.innerHTML = "";
    
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "quiz-opt-btn";
        btn.innerText = opt;
        btn.onclick = () => checkQuizAnswer(opt, btn);
        container.appendChild(btn);
    });
}

function checkQuizAnswer(selected, btn) {
    if (!currentQuizQuestion) return;
    
    // Disable all options buttons
    document.querySelectorAll(".quiz-opt-btn").forEach(b => b.disabled = true);
    
    const feedback = document.getElementById("quiz-feedback-box");
    feedback.style.display = "block";
    
    const isCorrect = selected.toLowerCase() === currentQuizQuestion.missingWord.toLowerCase();
    
    if (isCorrect) {
        btn.classList.add("correct");
        feedback.className = "quiz-feedback-box feedback-success";
        feedback.innerText = "A rima é perfeita! Você acertou! 🎉";
    } else {
        btn.classList.add("wrong");
        feedback.className = "quiz-feedback-box feedback-error";
        feedback.innerText = `Oops, tente de novo! A resposta correta era: "${currentQuizQuestion.missingWord}"`;
        
        // Highlight correct button
        document.querySelectorAll(".quiz-opt-btn").forEach(b => {
            if (b.innerText.toLowerCase() === currentQuizQuestion.missingWord.toLowerCase()) {
                b.classList.add("correct");
            }
        });
    }
    
    document.getElementById("btn-next-quiz").style.display = "block";
}

function nextQuizQuestion() {
    if (currentPlayingSong) {
        generateQuizQuestion(currentPlayingSong);
    }
}

// Simulated Credit Shop purchase Pix checkout
function buyCredits(amount) {
    selectedPackAmount = amount;
    const price = amount === 1 ? "19,90" : (amount === 3 ? "34,90" : "49,90");
    
    document.getElementById("pix-price").innerText = `R$ ${price}`;
    
    // Create valid copyable Pix string
    const fullPixCode = `00020101021226830014br.gov.bcb.pix0136magicmusicpixkey@magicmusic.com5204000053039860503${price.replace(",", ".")}5802BR5907MagicMusic6009Sao Paulo6304`;
    document.getElementById("pix-code-text").innerText = `${fullPixCode.substring(0, 32)}...`;
    
    // Setup Pix copying trigger
    const clicker = document.getElementById("pix-code-clicker");
    clicker.onclick = () => {
        navigator.clipboard.writeText(fullPixCode);
        alert("Código Pix copiado para a área de transferência!");
    };
    
    // Setup confirm simulation trigger
    const confirmBtn = document.getElementById("btn-confirm-payment");
    confirmBtn.onclick = () => {
        credits += selectedPackAmount;
        AppDB.saveCredits(credits);
        updateCreditsUI();
        closeModal("pix-modal");
        alert(`Pagamento confirmado! +${selectedPackAmount} créditos liberados!`);
    };
    
    openModal("pix-modal");
}

// --- ADMIN MODE & WEB AUDIO PREVIEW INTEGRATION ---
let purchasingSongId = null;

function toggleAdminMode() {
    if (adminModeActive) {
        adminModeActive = false;
        document.querySelector('.btn-admin-trigger').style.color = '#a1a1aa';
        switchTab('library');
    } else {
        const password = prompt("Digite a senha do painel administrativo:");
        if (password === "magicadmin") {
            adminModeActive = true;
            document.querySelector('.btn-admin-trigger').style.color = '#10b981'; // Green indicator
            switchTab('admin');
        } else if (password !== null) {
            alert("Senha incorreta!");
        }
    }
}

async function renderAdminPendingList() {
    const container = document.getElementById("admin-pending-list");
    if (!container) return;
    
    container.innerHTML = `<div class="loading-text" style="color: #a1a1aa; padding: 20px; text-align: center; font-size: 14px;">Carregando músicas pendentes...</div>`;
    
    try {
        const response = await fetch("/api/admin/pending");
        if (!response.ok) throw new Error("Server error");
        const pendingSongs = await response.json();
        
        if (pendingSongs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #a1a1aa; padding: 30px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
                    <i class="material-icons" style="font-size: 40px; color: #10b981; margin-bottom: 10px;">check_circle</i>
                    <h4 style="color: #fff; margin-bottom: 5px;">Tudo em dia!</h4>
                    <p style="font-size: 13px; color: #a1a1aa;">Nenhuma música na fila aguardando áudio do Suno.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = "";
        pendingSongs.forEach(song => {
            const card = document.createElement("div");
            card.className = "pending-admin-card";
            card.style = "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;";
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 10px;">
                    <div>
                        <h4 style="color: #fff; font-size: 15px;">${song.title}</h4>
                        <p style="font-size: 12px; color: #a1a1aa;">Estilo: <strong>${song.category}</strong> | Destinatário: <strong>${song.artist.split('&')[1]?.trim() || 'Desconhecido'}</strong></p>
                    </div>
                    <span style="font-size: 11px; padding: 2px 6px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 4px;">Aguardando Suno</span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;"><strong>Prompt do Suno (Crie no Suno com este estilo):</strong></p>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" readonly value="${song.sunoPrompt}" id="suno-prompt-${song.id}" style="flex: 1; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px 8px; font-size: 12px; border-radius: 4px;">
                        <button onclick="copyTextById('suno-prompt-${song.id}')" style="background: #27272a; border: none; color: #fff; padding: 4px 10px; font-size: 12px; border-radius: 4px; cursor: pointer;">Copiar</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;"><strong>Letra Gerada (Use no modo Custom no Suno):</strong></p>
                    <div style="display: flex; gap: 8px;">
                        <textarea readonly id="suno-lyrics-${song.id}" style="flex: 1; height: 60px; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px 8px; font-size: 11px; border-radius: 4px; resize: none; font-family: monospace;">${song.originalLyrics}</textarea>
                        <button onclick="copyTextById('suno-lyrics-${song.id}')" style="background: #27272a; border: none; color: #fff; padding: 4px 10px; font-size: 12px; border-radius: 4px; cursor: pointer; align-self: flex-start;">Copiar</button>
                    </div>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; display: flex; gap: 10px; align-items: center;">
                    <input type="text" placeholder="Cole a URL do áudio MP3 gerado no Suno" id="audio-input-${song.id}" style="flex: 1; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 10px; font-size: 13px; border-radius: 4px;">
                    <button onclick="submitAudioUrl(${song.id})" style="background: #10b981; border: none; color: #000; font-weight: bold; padding: 6px 15px; font-size: 13px; border-radius: 4px; cursor: pointer;">Liberar Música</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center; font-size: 14px;">Erro ao carregar do servidor. Verifique a conexão.</div>`;
    }
}

function copyTextById(id) {
    const el = document.getElementById(id);
    if (el) {
        el.select();
        navigator.clipboard.writeText(el.value);
        alert("Texto copiado com sucesso!");
    }
}

async function submitAudioUrl(songId) {
    const audioUrl = document.getElementById(`audio-input-${songId}`).value.trim();
    if (!audioUrl) {
        alert("Cole a URL do áudio primeiro!");
        return;
    }
    
    try {
        const response = await fetch("/api/admin/submit-audio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ songId, audioUrl })
        });
        
        if (response.ok) {
            alert("Música liberada com sucesso! O áudio já está disponível para o cliente.");
            await syncSongsWithServer();
            renderAdminPendingList();
        } else {
            alert("Falha ao salvar. Verifique a conexão com o servidor.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro de rede ao salvar.");
    }
}

function openSongPurchaseCheckout(song) {
    purchasingSongId = song.id;
    const price = "19,90";
    document.getElementById("pix-price").innerText = `R$ ${price}`;
    
    const fullPixCode = `00020101021226830014br.gov.bcb.pix0136magicmusicpixkey@magicmusic.com520400005303986050319.905802BR5907MagicMusic6009Sao Paulo6304`;
    document.getElementById("pix-code-text").innerText = `${fullPixCode.substring(0, 32)}...`;
    
    const clicker = document.getElementById("pix-code-clicker");
    clicker.onclick = () => {
        navigator.clipboard.writeText(fullPixCode);
        alert("Código Pix de compra da música copiado!");
    };
    
    const confirmBtn = document.getElementById("btn-confirm-payment");
    confirmBtn.onclick = async () => {
        try {
            // Confirm purchase on server
            await fetch("/api/purchase-song", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ songId: song.id })
            });
            
            // Update local state
            song.isPurchased = true;
            songs = songs.map(s => s.id === song.id ? { ...s, isPurchased: true } : s);
            AppDB.saveSongs(songs);
            
            closeModal("pix-modal");
            alert(`Pagamento confirmado! A música "${song.title}" foi liberada por completo para ouvir e baixar!`);
            
            purchasingSongId = null;
            renderPlayerScreen();
            renderLibraryScreen();
            
            // Resume play
            playSong();
        } catch (e) {
            console.error("Error confirming song purchase:", e);
            // Fallback unlock if server offline
            song.isPurchased = true;
            songs = songs.map(s => s.id === song.id ? { ...s, isPurchased: true } : s);
            AppDB.saveSongs(songs);
            closeModal("pix-modal");
            alert(`Pagamento confirmado! A música foi liberada.`);
            purchasingSongId = null;
            renderPlayerScreen();
            renderLibraryScreen();
            playSong();
        }
    };
    
    openModal("pix-modal");
}

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
            translatedLyrics: "Letra aprovada. Áudio final aguardando produção em estúdio.",
            romanization: vibes.join(", "),
            durationSeconds: 120,
            sunoPrompt: `${style || "pop"}, portuguese vocals, personalized song`,
            audioUrl: null,
            status: "pending_audio",
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
    }
};

// Application State
let songs = [];
let activeTab = "create";
let adminModeActive = false;

let wizardStep = 1;
let selectedOccasion = "Aniversário";
let selectedStyle = "Pop BR";
let wizardDraftSong = null;

let adminSessionPassword = "";
let clientSongs = [];
let clientLookupPerformed = false;

let approvalToken = null;
let approvalAudioEl = null;
let approvalPlaying = false;
let paymentToken = null;
let pixCopyPasteCode = '';

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
    
    if (tabId === "library") {
        renderLibraryScreen();
    } else if (tabId === "client") {
        renderClientArea();
    } else if (tabId === "admin") {
        switchAdminTab('pedidos');
        renderAdminPendingList();
    }
}

// App Initialization
window.addEventListener("DOMContentLoaded", async () => {
    songs = AppDB.getSongs();

    renderLibraryScreen();
    setupWizardListeners();
    setupClientLookupListener();

    await syncSongsWithServer();
});

async function syncSongsWithServer() {
    // A biblioteca exibe apenas as músicas de exemplo locais.
    // Clientes encontram seus pedidos via aba "Cliente" (busca por WhatsApp/e-mail).
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

function applyCpfMask(input) {
    input.addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '').substring(0, 11);
        if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
        this.value = v;
    });
}

function setupClientLookupListener() {
    const input = document.getElementById("client-contact");
    if (!input) return;

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            lookupClientSongs();
        }
    });
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
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-whatsapp").value = "";
    document.getElementById("customer-email").value = "";
    document.getElementById("customer-notes").value = "";
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
        wizardDraftSong.sunoPrompt = `${selectedStyle}, portuguese vocals, personalized song`;
        wizardDraftSong.status = "pending_audio";
        wizardDraftSong.audioUrl = null;
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
    const customerName = document.getElementById("customer-name").value.trim();
    const customerWhatsapp = document.getElementById("customer-whatsapp").value.trim();
    const customerEmail = document.getElementById("customer-email").value.trim();
    const customerNotes = document.getElementById("customer-notes").value.trim();

    if (!customerWhatsapp) {
        alert("Informe o WhatsApp para a equipe entregar o MP3 final.");
        return;
    }
    
    // Update local draft
    wizardDraftSong.title = finalTitle;
    wizardDraftSong.originalLyrics = finalLyrics;
    wizardDraftSong.customerName = customerName;
    wizardDraftSong.customerWhatsapp = customerWhatsapp;
    wizardDraftSong.customerEmail = customerEmail;
    wizardDraftSong.customerNotes = customerNotes;
    
    openModal("production-modal");

    // Check if it's a server-created song (has a backend DB link)
    const isServerBacked = Boolean(wizardDraftSong.createdAt);

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
                    originalLyrics: finalLyrics,
                    customerName,
                    customerWhatsapp,
                    customerEmail,
                    customerNotes
                })
            });
            
            document.getElementById("production-status-text").innerText = "Enviando para o estúdio de produção... 🚀";
            await new Promise(r => setTimeout(r, 1000));
            document.getElementById("production-status-text").innerText = "Pedido de produção registrado! 🎧";
            await new Promise(r => setTimeout(r, 1000));
            
            await syncSongsWithServer();
            
            closeModal("production-modal");
            alert("Pedido enviado! Nossa equipe produzirá o áudio e você receberá a prévia para aprovação.");
            resetWizard();
            switchTab("library");
        } catch (e) {
            console.error("Error finalizing server production:", e);
            closeModal("production-modal");
            alert("Erro ao enviar pedido para o servidor. Salvando localmente.");
            // fallback save
            songs.push(wizardDraftSong);
            AppDB.saveSongs(songs);
            resetWizard();
            switchTab("library");
        }
    } else {
        document.getElementById("production-status-text").innerText = "Registrando pedido de produção...";
        try {
            const response = await fetch("/api/production-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(wizardDraftSong)
            });

            if (!response.ok) throw new Error(`Server returned status ${response.status}`);
            const result = await response.json();
            const savedSong = result.song || wizardDraftSong;

            await syncSongsWithServer();
            closeModal("production-modal");
            alert("Letra criada e enviada para produção. O áudio será liberado quando o MP3 final estiver pronto.");
            resetWizard();
            switchTab("library");
        } catch (e) {
            console.error("Error registering production request:", e);
            songs.push(wizardDraftSong);
            AppDB.saveSongs(songs);
            closeModal("production-modal");
            alert("Pedido salvo localmente, mas não foi possível enviar aviso de produção agora.");
            resetWizard();
            switchTab("library");
        }
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
        const color = song.coverColorHex.replace("0xFF", "#");

        const card = document.createElement("div");
        card.className = `song-card`;
        
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

function toggleFavorite(id) {
    songs = songs.map(s => {
        if (s.id === id) {
            const nextFav = !s.isFavorite;
            return { ...s, isFavorite: nextFav };
        }
        return s;
    });
    AppDB.saveSongs(songs);
    renderLibraryScreen();
}

function deleteSong(id) {
    if (confirm("Tem certeza que deseja apagar essa música do seu acervo?")) {
        songs = songs.filter(s => s.id !== id);
        AppDB.saveSongs(songs);
        renderLibraryScreen();
    }
}

// Modals display control
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// Client area: lookup and delivery
async function lookupClientSongs() {
    const input = document.getElementById("client-contact");
    const contact = input ? input.value.trim() : "";

    if (!contact || contact.length < 5) {
        alert("Informe o WhatsApp ou e-mail usado no pedido.");
        return;
    }

    const container = document.getElementById("client-results");
    if (container) {
        container.innerHTML = `<div class="client-empty-state"><i class="material-icons">hourglass_top</i><h4>Buscando pedidos</h4><p>Consultando as músicas vinculadas ao seu contato.</p></div>`;
    }

    try {
        const response = await fetch(`/api/client/songs?contact=${encodeURIComponent(contact)}`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        clientLookupPerformed = true;
        clientSongs = await response.json();
        renderClientArea();
    } catch (e) {
        console.error(e);
        if (container) {
            container.innerHTML = `<div class="client-empty-state client-error"><i class="material-icons">error</i><h4>Não foi possível buscar</h4><p>Confira o contato informado e tente novamente.</p></div>`;
        }
    }
}

function renderClientArea() {
    const container = document.getElementById("client-results");
    if (!container) return;

    if (!Array.isArray(clientSongs) || clientSongs.length === 0) {
        const initialTitle = clientLookupPerformed ? "Nenhum pedido encontrado" : "Entre com seu contato";
        const initialText = clientLookupPerformed
            ? "Digite o mesmo WhatsApp ou e-mail usado quando a música foi enviada para produção."
            : "Use o mesmo WhatsApp ou e-mail informado na criação da música.";
        const initialIcon = clientLookupPerformed ? "manage_search" : "account_circle";

        container.innerHTML = `
            <div class="client-empty-state">
                <i class="material-icons">${initialIcon}</i>
                <h4>${initialTitle}</h4>
                <p>${initialText}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    clientSongs
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .forEach(song => {
            const card = document.createElement("div");
            const color = (song.coverColorHex || "0xFFF43F5E").replace("0xFF", "#");
            const safeTitle = escapeHtml(song.title);
            const safeCreatedAt = song.createdAt ? new Date(song.createdAt).toLocaleDateString("pt-BR") : "-";
            const st = song.status;
            const token = song.approvalToken;

            const isDelivered   = st === "delivered" || st === "paid" || st === "ready";
            const isPreview     = st === "preview_ready";
            const isPayment     = st === "awaiting_payment";
            const isAdjustment  = st === "adjustment_requested";

            const statusLabel = isDelivered  ? "Entregue ✓"
                : isPreview                  ? "Prévia disponível"
                : isPayment                  ? "Aguardando pagamento"
                : isAdjustment               ? "Ajuste solicitado"
                                             : "Em produção";

            const statusCls = isDelivered  ? "ready"
                : isPreview              ? "preview-ready"
                : isPayment              ? "awaiting-payment"
                : isAdjustment           ? "adjustment"
                                         : "pending";

            const bodyText = isDelivered
                ? "Seu MP3 final está pronto. Baixe abaixo."
                : isPreview
                ? "Sua prévia de 60 segundos está pronta! Ouça e aprove para gerar o pagamento."
                : isPayment
                ? "Prévia aprovada! Conclua o pagamento PIX para liberar o download completo."
                : isAdjustment
                ? "Pedido de ajuste recebido. Nossa equipe está revisando."
                : "Nossa equipe está produzindo o áudio. Volte aqui para acompanhar.";

            const actionsHtml = isDelivered ? `
                <a class="btn btn-success" href="/api/download/${token}" download="${safeTitle}.mp3">
                    <i class="material-icons">download</i> Baixar MP3
                </a>` : isPreview && token ? `
                <a class="btn btn-pink" href="/pedido/${token}" style="text-decoration:none;display:flex;align-items:center;gap:4px;">
                    <i class="material-icons">headphones</i> Ouvir e Aprovar
                </a>` : isPayment && token ? `
                <a class="btn btn-pink" href="/pagamento/${token}" style="text-decoration:none;display:flex;align-items:center;gap:4px;">
                    <i class="material-icons">pix</i> Pagar via PIX
                </a>` : `
                <button class="btn btn-secondary" disabled>
                    <i class="material-icons">hourglass_top</i> Aguardando
                </button>`;

            card.className = "client-song-card";
            card.innerHTML = `
                <div class="client-song-top">
                    <div class="client-cover" style="background-color: ${color}">
                        <i class="material-icons">music_note</i>
                    </div>
                    <div class="client-song-info">
                        <h4>${safeTitle}</h4>
                        <span>Pedido em ${safeCreatedAt}</span>
                    </div>
                    <span class="client-status ${statusCls}">${statusLabel}</span>
                </div>
                <div class="client-song-body"><p>${bodyText}</p></div>
                <div class="client-song-actions">${actionsHtml}</div>
            `;
            container.appendChild(card);
        });
}

function openClientSong(songId) {
    const song = clientSongs.find(item => item.id === songId);
    if (!song) return;
    switchTab("client");
}

function downloadClientSong(songId) {
    const song = clientSongs.find(item => item.id === songId);
    const isDelivered = song && (song.status === "delivered" || song.status === "paid" || song.status === "ready");
    if (!isDelivered || !song.approvalToken) {
        alert("O MP3 final ainda não está disponível.");
        return;
    }
    const link = document.createElement("a");
    link.href = `/api/download/${song.approvalToken}`;
    link.download = `${song.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- ADMIN MODE ---

async function toggleAdminMode() {
    if (adminModeActive) {
        adminModeActive = false;
        adminSessionPassword = "";
        document.querySelector('.btn-admin-trigger').style.color = '#a1a1aa';
        switchTab('library');
    } else {
        const password = prompt("Digite a senha do painel administrativo:");
        if (password === null) return;

        adminSessionPassword = password.trim();
        if (!adminSessionPassword) {
            alert("Informe a senha administrativa.");
            return;
        }

        try {
            const response = await fetch("/api/admin/pending", {
                headers: getAdminHeaders()
            });

            if (!response.ok) {
                adminSessionPassword = "";
                alert("Senha incorreta!");
                return;
            }

            adminModeActive = true;
            document.querySelector('.btn-admin-trigger').style.color = '#10b981'; // Green indicator
            switchTab('admin');
        } catch (e) {
            console.error(e);
            adminSessionPassword = "";
            alert("Não foi possível validar o acesso administrativo.");
        }
    }
}

function getAdminHeaders() {
    return {
        "X-Admin-Password": adminSessionPassword
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function renderAdminPendingList() {
    const container = document.getElementById("admin-pending-list");
    if (!container) return;
    
    container.innerHTML = `<div class="loading-text" style="color: #a1a1aa; padding: 20px; text-align: center; font-size: 14px;">Carregando músicas pendentes...</div>`;
    
    try {
        const response = await fetch("/api/admin/pending", {
            headers: getAdminHeaders()
        });
        if (response.status === 401) {
            adminModeActive = false;
            adminSessionPassword = "";
            document.querySelector('.btn-admin-trigger').style.color = '#a1a1aa';
            switchTab("library");
            alert("Sessão administrativa expirada ou senha inválida.");
            return;
        }
        if (!response.ok) throw new Error("Server error");
        const pendingSongs = await response.json();
        
        if (pendingSongs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #a1a1aa; padding: 30px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
                    <i class="material-icons" style="font-size: 40px; color: #10b981; margin-bottom: 10px;">check_circle</i>
                    <h4 style="color: #fff; margin-bottom: 5px;">Tudo em dia!</h4>
                    <p style="font-size: 13px; color: #a1a1aa;">Nenhuma música na fila aguardando envio de MP3.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = "";
        pendingSongs.forEach(song => {
            const card = document.createElement("div");
            const recipient = song.artist?.split('&')[1]?.trim() || "Desconhecido";
            const safeTitle = escapeHtml(song.title);
            const safeCategory = escapeHtml(song.category);
            const safeRecipient = escapeHtml(recipient);
            const safeSunoPrompt = escapeHtml(song.sunoPrompt);
            const safeLyrics = escapeHtml(song.originalLyrics);
            const safeCustomerName = escapeHtml(song.customerName || "-");
            const safeCustomerWhatsapp = escapeHtml(song.customerWhatsapp || "-");
            const safeCustomerEmail = escapeHtml(song.customerEmail || "-");
            const safeCustomerNotes = escapeHtml(song.customerNotes || "-");
            card.className = "pending-admin-card";
            card.style = "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;";
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 10px;">
                    <div>
                        <h4 style="color: #fff; font-size: 15px;">${safeTitle}</h4>
                        <p style="font-size: 12px; color: #a1a1aa;">Estilo: <strong>${safeCategory}</strong> | Destinatário: <strong>${safeRecipient}</strong></p>
                    </div>
                    <span style="font-size: 11px; padding: 2px 6px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 4px;">Aguardando MP3</span>
                </div>

                <div style="margin-bottom: 12px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 6px; padding: 10px;">
                    <p style="font-size: 12px; color: #d4d4d8; margin-bottom: 6px;"><strong>Contato para entrega</strong></p>
                    <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">Nome: <strong style="color: #fff;">${safeCustomerName}</strong><br>WhatsApp: <strong style="color: #fff;">${safeCustomerWhatsapp}</strong><br>E-mail: <strong style="color: #fff;">${safeCustomerEmail}</strong><br>Obs.: <strong style="color: #fff;">${safeCustomerNotes}</strong></p>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;"><strong>Estilo Musical:</strong></p>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" readonly value="${safeSunoPrompt}" id="suno-prompt-${song.id}" style="flex: 1; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px 8px; font-size: 12px; border-radius: 4px;">
                        <button onclick="copyTextById('suno-prompt-${song.id}')" style="background: #27272a; border: none; color: #fff; padding: 4px 10px; font-size: 12px; border-radius: 4px; cursor: pointer;">Copiar</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;"><strong>Letra do Pedido:</strong></p>
                    <div style="display: flex; gap: 8px;">
                        <textarea readonly id="suno-lyrics-${song.id}" style="flex: 1; height: 60px; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px 8px; font-size: 11px; border-radius: 4px; resize: none; font-family: monospace;">${safeLyrics}</textarea>
                        <button onclick="copyTextById('suno-lyrics-${song.id}')" style="background: #27272a; border: none; color: #fff; padding: 4px 10px; font-size: 12px; border-radius: 4px; cursor: pointer; align-self: flex-start;">Copiar</button>
                    </div>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; display: flex; gap: 10px; align-items: center;">
                    <label style="flex: 1; background: #000; border: 1px dashed rgba(255,255,255,0.2); color: #a1a1aa; padding: 6px 10px; font-size: 13px; border-radius: 4px; cursor: pointer; text-align: center;">
                        <input type="file" accept="audio/mpeg,audio/mp3" id="mp3-file-${song.id}" style="display:none;" onchange="updateFileLabel(${song.id})">
                        <span id="mp3-label-${song.id}">📁 Selecionar MP3</span>
                    </label>
                    <button onclick="uploadMp3File(${song.id})" style="background: #10b981; border: none; color: #000; font-weight: bold; padding: 6px 15px; font-size: 13px; border-radius: 4px; cursor: pointer; white-space: nowrap;">Enviar MP3</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center; font-size: 14px;">Erro ao carregar do servidor. Verifique a conexão.</div>`;
    }
}

// --- ADMIN SUB-NAV ---

let adminTab = 'pedidos';
let customersData = [];

function switchAdminTab(tab) {
    adminTab = tab;
    const btnPedidos   = document.getElementById('admin-tab-pedidos');
    const btnClientes  = document.getElementById('admin-tab-clientes');
    const secPedidos   = document.getElementById('admin-section-pedidos');
    const secClientes  = document.getElementById('admin-section-clientes');

    const activeStyle   = 'flex:1; padding:9px; font-size:13px; font-weight:600; border-radius:8px; border:none; cursor:pointer; background:#e11d48; color:#fff;';
    const inactiveStyle = 'flex:1; padding:9px; font-size:13px; font-weight:600; border-radius:8px; border:none; cursor:pointer; background:rgba(255,255,255,0.07); color:#a1a1aa;';

    if (tab === 'pedidos') {
        btnPedidos.style.cssText  = activeStyle;
        btnClientes.style.cssText = inactiveStyle;
        secPedidos.style.display  = 'block';
        secClientes.style.display = 'none';
    } else {
        btnPedidos.style.cssText  = inactiveStyle;
        btnClientes.style.cssText = activeStyle;
        secPedidos.style.display  = 'none';
        secClientes.style.display = 'block';
        renderAdminCustomers();
    }
}

async function renderAdminCustomers() {
    const container = document.getElementById('admin-customers-list');
    if (!container) return;
    container.innerHTML = `<div style="text-align:center; color:#a1a1aa; padding:20px; font-size:13px;">Carregando clientes...</div>`;

    try {
        const resp = await fetch('/api/admin/customers', { headers: getAdminHeaders() });
        if (!resp.ok) throw new Error('Erro ao carregar clientes');
        customersData = await resp.json();

        if (customersData.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:#a1a1aa; padding:30px; font-size:13px;">Nenhum cliente cadastrado ainda.</div>`;
            return;
        }

        container.innerHTML = `
            <div style="font-size:11px; color:#6b7280; margin-bottom:10px;">${customersData.length} clientes encontrados</div>
            ${customersData.map(c => `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:14px 16px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                            <p style="margin:0; font-size:14px; font-weight:600; color:#fff;">${escapeHtml(c.name || '—')}</p>
                            <p style="margin:2px 0 0; font-size:12px; color:#a1a1aa;">${escapeHtml(c.whatsapp || '—')}</p>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:11px; padding:2px 8px; border-radius:20px; background:rgba(225,29,72,0.12); color:#f43f5e; font-weight:600;">${c.total_orders} pedido${c.total_orders != 1 ? 's' : ''}</span>
                            ${parseInt(c.paid_orders) > 0 ? `<br><span style="font-size:11px; padding:2px 8px; border-radius:20px; background:rgba(16,185,129,0.12); color:#10b981; font-weight:600; margin-top:4px; display:inline-block;">${c.paid_orders} pago${c.paid_orders != 1 ? 's' : ''}</span>` : ''}
                        </div>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:11px; color:#6b7280;">
                        ${c.email ? `<span><i class="material-icons" style="font-size:12px; vertical-align:middle;">email</i> ${escapeHtml(c.email)}</span>` : ''}
                        ${c.cpf ? `<span><i class="material-icons" style="font-size:12px; vertical-align:middle;">badge</i> ${escapeHtml(c.cpf)}</span>` : ''}
                        <span><i class="material-icons" style="font-size:12px; vertical-align:middle;">calendar_today</i> ${c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('pt-BR') : '—'}</span>
                    </div>
                </div>
            `).join('')}
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px; font-size:13px;">Erro ao carregar clientes.</div>`;
    }
}

function exportCustomersCsv() {
    if (!customersData.length) { alert('Nenhum dado para exportar.'); return; }
    const header = ['Nome', 'WhatsApp', 'E-mail', 'CPF', 'Total Pedidos', 'Pedidos Pagos', 'Último Pedido'];
    const rows = customersData.map(c => [
        c.name || '',
        c.whatsapp || '',
        c.email || '',
        c.cpf || '',
        c.total_orders || 0,
        c.paid_orders || 0,
        c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('pt-BR') : ''
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magic-music-clientes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyTextById(id) {
    const el = document.getElementById(id);
    if (el) {
        el.select();
        navigator.clipboard.writeText(el.value);
        alert("Texto copiado com sucesso!");
    }
}

function updateFileLabel(songId) {
    const input = document.getElementById(`mp3-file-${songId}`);
    const label = document.getElementById(`mp3-label-${songId}`);
    if (input && input.files[0]) {
        label.textContent = `✅ ${input.files[0].name}`;
    }
}

async function uploadMp3File(songId) {
    const input = document.getElementById(`mp3-file-${songId}`);
    if (!input || !input.files[0]) {
        alert("Selecione um arquivo MP3 primeiro.");
        return;
    }
    const file = input.files[0];
    const label = document.getElementById(`mp3-label-${songId}`);
    label.textContent = "⏳ Enviando...";
    try {
        const response = await fetch("/api/admin/upload-audio", {
            method: "POST",
            headers: {
                "Content-Type": "audio/mpeg",
                "X-Song-Id": String(songId),
                ...getAdminHeaders()
            },
            body: file
        });
        if (response.ok) {
            alert("MP3 enviado e prévia gerada! O cliente já pode ouvir e aprovar.");
            await renderAdminPendingList();
        } else {
            const data = await response.json().catch(() => ({}));
            alert("Erro ao enviar: " + (data.error || response.status));
            label.textContent = "📁 Selecionar MP3 do computador";
        }
    } catch (e) {
        console.error(e);
        alert("Erro de rede ao enviar o arquivo.");
        label.textContent = "📁 Selecionar MP3 do computador";
    }
}

// =====================================================================
// APPROVAL SCREEN — /pedido/:token
// =====================================================================

function detectRoute() {
    const routePath = window.location.pathname;
    if (routePath.startsWith('/pedido/')) {
        const token = routePath.replace('/pedido/', '').split('/')[0];
        if (token) {
            const app = document.querySelector('.app-container');
            if (app) app.style.display = 'none';
            showApprovalScreen(token);
            return true;
        }
    }
    if (routePath.startsWith('/pagamento/')) {
        const token = routePath.replace('/pagamento/', '').split('/')[0];
        if (token) {
            const app = document.querySelector('.app-container');
            if (app) app.style.display = 'none';
            showPaymentScreen(token);
            return true;
        }
    }
    return false;
}

function showApprovalScreen(token) {
    approvalToken = token;
    const screen = document.getElementById('approval-screen');
    if (!screen) return;
    screen.style.display = 'flex';
    screen.style.flexDirection = 'column';
    const loading = document.getElementById('approval-loading');
    if (loading) { loading.style.display = 'flex'; loading.style.flexDirection = 'column'; loading.style.alignItems = 'center'; }
    const content = document.getElementById('approval-content');
    if (content) content.style.display = 'none';
    const err = document.getElementById('approval-error');
    if (err) err.style.display = 'none';
    fetchApprovalOrder(token);
}

async function fetchApprovalOrder(token) {
    try {
        const resp = await fetch('/api/order/' + token);
        if (!resp.ok) throw new Error('not_found');
        const song = await resp.json();
        renderApprovalContent(song);
    } catch (_) {
        const loading = document.getElementById('approval-loading');
        if (loading) loading.style.display = 'none';
        const err = document.getElementById('approval-error');
        if (err) err.style.display = 'block';
    }
}

function renderApprovalContent(song) {
    const loading = document.getElementById('approval-loading');
    if (loading) loading.style.display = 'none';
    const color = (song.coverColorHex || '0xFFF43F5E').replace('0xFF', '#');
    const cover = document.getElementById('approval-cover');
    if (cover) cover.style.background = color;
    const titleEl = document.getElementById('approval-title');
    if (titleEl) titleEl.textContent = song.title || '—';
    const metaEl = document.getElementById('approval-meta');
    if (metaEl) metaEl.textContent = (song.language || '—') + ' · ' + (song.category || '—');
    const dateEl = document.getElementById('approval-date');
    if (dateEl) dateEl.textContent = song.createdAt ? 'Pedido em ' + new Date(song.createdAt).toLocaleDateString('pt-BR') : '';
    if (song.status === 'awaiting_payment') {
        window.location.href = '/pagamento/' + song.approvalToken;
        return;
    }
    if (song.status === 'adjustment_requested') {
        const adj = document.getElementById('approval-state-adjusted');
        if (adj) adj.style.display = 'block';
        return;
    }
    const contentEl = document.getElementById('approval-content');
    if (contentEl) contentEl.style.display = 'block';
    if (song.previewUrl) {
        const wrap = document.getElementById('approval-player-wrap');
        if (wrap) wrap.style.display = 'block';
        approvalAudioEl = document.getElementById('approval-audio');
        if (approvalAudioEl) {
            approvalAudioEl.src = song.previewUrl;
            approvalAudioEl.addEventListener('timeupdate', updateApprovalProgress);
            approvalAudioEl.addEventListener('ended', function() {
                approvalPlaying = false;
                const icon = document.getElementById('approval-play-icon');
                if (icon) icon.textContent = 'play_arrow';
            });
        }
    } else {
        const noPreview = document.getElementById('approval-no-preview');
        if (noPreview) noPreview.style.display = 'block';
    }
    if (['paid', 'delivered', 'cancelled'].includes(song.status)) {
        const actions = document.getElementById('approval-actions');
        if (actions) actions.style.display = 'none';
    }
}

function toggleApprovalPlay() {
    if (!approvalAudioEl) return;
    if (approvalPlaying) {
        approvalAudioEl.pause();
        approvalPlaying = false;
        const icon = document.getElementById('approval-play-icon');
        if (icon) icon.textContent = 'play_arrow';
    } else {
        approvalAudioEl.play();
        approvalPlaying = true;
        const icon = document.getElementById('approval-play-icon');
        if (icon) icon.textContent = 'pause';
    }
}

function updateApprovalProgress() {
    if (!approvalAudioEl || !approvalAudioEl.duration) return;
    const pct = (approvalAudioEl.currentTime / approvalAudioEl.duration) * 100;
    const prog = document.getElementById('approval-progress');
    if (prog) prog.value = pct;
    const fill = document.getElementById('approval-progress-fill');
    if (fill) fill.style.width = pct + '%';
    const m = Math.floor(approvalAudioEl.currentTime / 60);
    const s = Math.floor(approvalAudioEl.currentTime % 60);
    const timeEl = document.getElementById('approval-time');
    if (timeEl) timeEl.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function seekApprovalAudio(value) {
    if (!approvalAudioEl || !approvalAudioEl.duration) return;
    approvalAudioEl.currentTime = (value / 100) * approvalAudioEl.duration;
}

function showAdjustForm() {
    const actions = document.getElementById('approval-actions');
    if (actions) actions.style.display = 'none';
    const form = document.getElementById('approval-adjust-form');
    if (form) form.style.display = 'block';
}

function hideAdjustForm() {
    const form = document.getElementById('approval-adjust-form');
    if (form) form.style.display = 'none';
    const actions = document.getElementById('approval-actions');
    if (actions) actions.style.display = 'flex';
}

async function approveOrder() {
    if (!approvalToken) return;
    try {
        const resp = await fetch('/api/order/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: approvalToken })
        });
        if (!resp.ok) throw new Error('error');
        if (approvalAudioEl) approvalAudioEl.pause();
        window.location.href = '/pagamento/' + approvalToken;
    } catch (_) {
        alert('Não foi possível aprovar o pedido. Tente novamente.');
    }
}

async function submitAdjustment() {
    const descEl = document.getElementById('approval-adjust-desc');
    const desc = descEl ? descEl.value.trim() : '';
    if (!desc) { alert('Descreva o ajuste desejado.'); return; }
    if (!approvalToken) return;
    try {
        const resp = await fetch('/api/order/request-adjustment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: approvalToken, description: desc })
        });
        if (!resp.ok) throw new Error('error');
        const contentEl = document.getElementById('approval-content');
        if (contentEl) contentEl.style.display = 'none';
        const form = document.getElementById('approval-adjust-form');
        if (form) form.style.display = 'none';
        const adjState = document.getElementById('approval-state-adjusted');
        if (adjState) adjState.style.display = 'block';
        if (approvalAudioEl) approvalAudioEl.pause();
    } catch (_) {
        alert('Não foi possível enviar o ajuste. Tente novamente.');
    }
}

// =====================================================================
// PAYMENT SCREEN — /pagamento/:token
// =====================================================================

function showPaymentScreen(token) {
    paymentToken = token;
    const screen = document.getElementById('payment-screen');
    if (!screen) return;
    screen.style.display = 'flex';
    screen.style.flexDirection = 'column';
    const loadingEl = document.getElementById('payment-loading');
    if (loadingEl) { loadingEl.style.display = 'flex'; }
    const contentEl = document.getElementById('payment-content');
    if (contentEl) contentEl.style.display = 'none';
    const errEl = document.getElementById('payment-error');
    if (errEl) errEl.style.display = 'none';
    fetchAndRenderPayment(token);
}

async function fetchAndRenderPayment(token) {
    try {
        const resp = await fetch('/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Erro ao gerar cobrança PIX');
        renderPaymentContent(data);
    } catch (e) {
        const loadingEl = document.getElementById('payment-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        const msgEl = document.getElementById('payment-error-msg');
        if (msgEl) msgEl.textContent = e.message;
        const errEl = document.getElementById('payment-error');
        if (errEl) errEl.style.display = 'block';
    }
}

function renderPaymentContent(data) {
    const loadingEl = document.getElementById('payment-loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const value = typeof data.value === 'number'
        ? data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'R$ ' + data.value;
    const valEl = document.getElementById('payment-value');
    if (valEl) valEl.textContent = value;
    if (data.dueDate) {
        const parts = data.dueDate.split('-');
        const dueEl = document.getElementById('payment-due');
        if (dueEl) dueEl.textContent = 'Válido até ' + parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    if (data.pix && data.pix.qrCodeImage) {
        const qrImg = document.getElementById('payment-qr-img');
        if (qrImg) qrImg.src = 'data:image/png;base64,' + data.pix.qrCodeImage;
    }
    pixCopyPasteCode = (data.pix && data.pix.copyPaste) ? data.pix.copyPaste : '';
    const codeEl = document.getElementById('payment-pix-code');
    if (codeEl) codeEl.textContent = pixCopyPasteCode.length > 40 ? pixCopyPasteCode.substring(0, 40) + '…' : pixCopyPasteCode;
    const contentEl = document.getElementById('payment-content');
    if (contentEl) contentEl.style.display = 'block';
}

function copyPaymentPixCode() {
    if (!pixCopyPasteCode) return;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(pixCopyPasteCode)
            .then(function() { alert('Código PIX copiado! Cole no seu banco para pagar.'); })
            .catch(function() { _fallbackCopyPix(); });
    } else {
        _fallbackCopyPix();
    }
}

function _fallbackCopyPix() {
    var el = document.createElement('textarea');
    el.value = pixCopyPasteCode;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Código PIX copiado!');
}

document.addEventListener('DOMContentLoaded', function() {
    const splash = document.getElementById('splash-screen');
    const mainApp = document.getElementById('main-app');

    setTimeout(function() {
        splash.classList.add('fade-out');
        if (mainApp) mainApp.style.opacity = '1';
        setTimeout(function() { splash.style.display = 'none'; }, 500);
    }, 5000);

    detectRoute();
});

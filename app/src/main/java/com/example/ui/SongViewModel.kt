package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.BilingualSong
import com.example.data.SongRepository
import com.example.data.GeminiClient
import com.example.data.SongTemplates
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SongViewModel(private val repository: SongRepository) : ViewModel() {

    // Reactive list of songs from Room
    val songs: StateFlow<List<BilingualSong>> = repository.allSongs
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _credits = MutableStateFlow(3)
    val credits: StateFlow<Int> = _credits.asStateFlow()

    // Interactive Lyric Player States
    private val _currentPlayingSong = MutableStateFlow<BilingualSong?>(null)
    val currentPlayingSong: StateFlow<BilingualSong?> = _currentPlayingSong.asStateFlow()

    private val _showSongCheckoutEvent = MutableStateFlow<BilingualSong?>(null)
    val showSongCheckoutEvent: StateFlow<BilingualSong?> = _showSongCheckoutEvent.asStateFlow()

    fun clearCheckoutEvent() {
        _showSongCheckoutEvent.value = null
    }

    fun triggerCheckout() {
        _showSongCheckoutEvent.value = _currentPlayingSong.value
    }

    fun purchaseCurrentSong() {
        val song = _currentPlayingSong.value ?: return
        viewModelScope.launch {
            val updated = song.copy(isPurchased = true)
            repository.updateSong(updated)
            _currentPlayingSong.value = updated
        }
    }

    private val _playbackProgress = MutableStateFlow(0f) // Progress fraction 0.0 - 1.0
    val playbackProgress: StateFlow<Float> = _playbackProgress.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _activeLyricIndex = MutableStateFlow(0)
    val activeLyricIndex: StateFlow<Int> = _activeLyricIndex.asStateFlow()

    // Song Generation Wizard States
    private val _isGenerating = MutableStateFlow(false)
    val isGenerating: StateFlow<Boolean> = _isGenerating.asStateFlow()

    private val _generationStatus = MutableStateFlow("")
    val generationStatus: StateFlow<String> = _generationStatus.asStateFlow()

    private val _wizardDraftSong = MutableStateFlow<BilingualSong?>(null)
    val wizardDraftSong: StateFlow<BilingualSong?> = _wizardDraftSong.asStateFlow()

    private var playbackJob: Job? = null

    init {
        // Prepopulate database with curated personalized AI songs if empty
        viewModelScope.launch {
            repository.allSongs.collect { list ->
                if (list.isEmpty()) {
                    seedMagicMusicPreGeneratedSongs()
                }
            }
        }
    }

    private suspend fun seedMagicMusicPreGeneratedSongs() {
        val curatedList = listOf(
            BilingualSong(
                title = "O Brilho da Júlia",
                artist = "Magic Music AI & Pedro",
                language = "Aniversário",
                category = "Pop BR",
                coverColorHex = "0xFFF43F5E", // Rose Gold Pink
                originalLyrics = """[Verso 1]
Hoje o sol brilha com força no olhar
Pois é seu dia de comemorar
Júlia faz trinta com riso sutil
Espalhando alegria como ninguém viu

[Refrão]
Parabéns, Júlia, estrela do amanhecer!
Todo esse amor que criamos pra você
Que sua luz continue a brilhar
E que seus gatos venham festejar!

[Verso 2]
Histórias lindas que o tempo guardou
Sua risada que a todos curou
Sempre cuidando de quem está por perto
Com seu abraço doce e afeto certo

[Refrão]
Parabéns, Júlia, estrela do amanhecer!
Todo esse amor que criamos pra você
Que sua luz continue a brilhar
E que seus gatos venham festejar!

[Outro]
Trinta anos de pura emoção e amor
Parabéns pra Júlia, seja onde for!""",
                translatedLyrics = "Sincronizada via TTS. Gênero: Pop.",
                romanization = "Alegre, Emocionante, Festivo",
                durationSeconds = 120,
                isFavorite = true
            ),
            BilingualSong(
                title = "Nosso Doce Lar",
                artist = "Magic Music AI & Thiago",
                language = "Declaração de amor",
                category = "Acústico / MPB",
                coverColorHex = "0xFF8B5CF6", // Electric Indigo
                originalLyrics = """[Verso 1]
No labirinto do meu caminhar
Seu abraço doce me fez ancorar
Mariana, o som do seu riso é canção
Que traz acalento pro meu coração

[Refrão]
Te amar é a coisa mais pura e real
Nosso café da manhã de quintal
Juntos sonhando em frente ao mar
Mariana, nosso amor é o meu lar

[Verso 2]
Lembra de quando a gente viajou?
A chuva caindo e você me abraçou
Sua mania de ler antes de dormir
É o que me faz suspirar e sorrir

[Refrão]
Te amar é a coisa mais pura e real
Nosso café da manhã de quintal
Juntos sonhando em frente ao mar
Mariana, nosso amor é o meu lar

[Outro]
Sempre contigo pro que der e vier
Você é o meu amor, minha linda mulher...""",
                translatedLyrics = "Sincronizada via TTS. Gênero: MPB Autoral.",
                romanization = "Romântico, Suave, Poético",
                durationSeconds = 135,
                isFavorite = false
            ),
            BilingualSong(
                title = "Festa na Firma do André",
                artist = "Magic Music AI & Amigos",
                language = "Pegadinha",
                category = "Trap / Rap",
                coverColorHex = "0xFFF59E0B", // Glowing Amber
                originalLyrics = """[Verso 1]
Lá vem o André atrasado de novo
Dizendo que o trânsito parou o povo
Mas todo mundo sabe qual é o rolê
Ele tava jogando videogame até o amanhecer!

[Refrão]
André, o rei do cafezinho demorado!
Sempre com o fone de ouvido plugado
Prometeu o relatório pra ontem às dez
Mas tá no WhatsApp gastando o inglês!

[Verso 2]
De calço na mesa ou fingindo reunião
Sua risada ecoa por todo o salão
Com o prato de coxinha dominando o setor
André é nosso herói trabalhador!

[Refrão]
André, o rei do cafezinho demorado!
Sempre com o fone de ouvido plugado
Prometeu o relatório pra ontem às dez
Mas tá no WhatsApp gastando o inglês!

[Outro]
Valeu, André, figura sem igual
O setor de suporte te acha sensacional!""",
                translatedLyrics = "Sincronizada via TTS. Gênero: Hip Hop / Trap.",
                romanization = "Divertido, Descontraído, Zueira",
                durationSeconds = 110,
                isFavorite = false
            )
        )
        repository.insertAll(curatedList)
    }

    fun selectSong(song: BilingualSong) {
        _currentPlayingSong.value = song
        _playbackProgress.value = 0f
        _activeLyricIndex.value = 0
        pauseSong()
    }

    fun playSong() {
        val song = _currentPlayingSong.value ?: return
        
        // Block playing if song is pending audio
        if (song.status == "pending_audio") {
            return
        }

        _isPlaying.value = true
        playbackJob?.cancel()
        playbackJob = viewModelScope.launch {
            val songDuration = song.durationSeconds.toFloat()
            val totalLines = song.originalLyrics.split("\n")
                .filter { it.isNotBlank() && !it.startsWith("[") }.size

            while (_isPlaying.value) {
                delay(100)
                val currentProg = _playbackProgress.value
                val newProg = currentProg + (0.1f / songDuration)

                // Enforce 1-minute preview lock (60 seconds)
                val elapsedSeconds = newProg * songDuration
                if (!song.isPurchased && elapsedSeconds >= 60f) {
                    _playbackProgress.value = 60f / songDuration
                    _isPlaying.value = false
                    _showSongCheckoutEvent.value = song
                    break
                }

                if (newProg >= 1f) {
                    _playbackProgress.value = 1f
                    _isPlaying.value = false
                    break
                } else {
                    _playbackProgress.value = newProg
                    // Calculate active lyric line based on progress fraction
                    if (totalLines > 0) {
                        val predictedLine = (newProg * totalLines).toInt().coerceIn(0, totalLines - 1)
                        _activeLyricIndex.value = predictedLine
                    }
                }
            }
        }
    }

    fun pauseSong() {
        _isPlaying.value = false
        playbackJob?.cancel()
    }

    fun togglePlayPause() {
        if (_isPlaying.value) pauseSong() else playSong()
    }

    fun seekToLine(lineIndex: Int) {
        val song = _currentPlayingSong.value ?: return
        val cleanLines = song.originalLyrics.split("\n")
            .filter { it.isNotBlank() && !it.startsWith("[") }
        val totalLines = cleanLines.size
        if (totalLines > 0) {
            var progressFraction = (lineIndex.toFloat() / totalLines.toFloat()).coerceIn(0f, 0.99f)

            // Enforce 1-minute lock on seek
            val targetSeconds = progressFraction * song.durationSeconds
            if (!song.isPurchased && targetSeconds >= 60f) {
                progressFraction = 60f / song.durationSeconds.toFloat()
                _showSongCheckoutEvent.value = song
                pauseSong()
            }

            _playbackProgress.value = progressFraction
            val finalLineIdx = (progressFraction * totalLines).toInt().coerceIn(0, totalLines - 1)
            _activeLyricIndex.value = finalLineIdx
        }
    }

    fun toggleFavorite(song: BilingualSong) {
        viewModelScope.launch {
            repository.setFavorite(song.id, !song.isFavorite)
            if (_currentPlayingSong.value?.id == song.id) {
                _currentPlayingSong.value = _currentPlayingSong.value?.copy(isFavorite = !song.isFavorite)
            }
        }
    }

    fun addCredits(amount: Int) {
        _credits.value += amount
    }

    fun deleteSong(song: BilingualSong) {
        viewModelScope.launch {
            repository.deleteSong(song.id)
            if (_currentPlayingSong.value?.id == song.id) {
                _currentPlayingSong.value = null
                pauseSong()
            }
        }
    }

    // AI Generation Pipeline (Magic Music Style)
    fun draftLyricsWithAI(
        occasion: String,
        style: String,
        name: String,
        stories: String,
        vibes: List<String>
    ) {
        if (_credits.value <= 0) return

        viewModelScope.launch {
            _isGenerating.value = true
            _generationStatus.value = "Convocando musas poéticas da IA..."

            // Use Gemini API client, fall back to offline high quality template if returns null
            val generatedSong = GeminiClient.generateCustomSong(occasion, style, name, stories, vibes)
                ?: SongTemplates.getFallbackTemplate(occasion, style, name, stories, vibes)

            _wizardDraftSong.value = generatedSong
            _isGenerating.value = false
            _generationStatus.value = ""
        }
    }

    fun updateDraftedLyrics(updatedLyrics: String) {
        _wizardDraftSong.value = _wizardDraftSong.value?.copy(originalLyrics = updatedLyrics)
    }

    fun finalizeProduction(onDone: (BilingualSong) -> Unit) {
        val draft = _wizardDraftSong.value ?: return
        if (_credits.value <= 0) return

        viewModelScope.launch {
            _isGenerating.value = true
            _credits.value = (_credits.value - 1).coerceAtLeast(0)

            val steps = listOf(
                "Letra aprovada! ✍️",
                "Afinando as guitarras e teclados virtuais... 🎸",
                "Aquecendo a banda de sintetizadores... 🎹",
                "Ajustando vocais digitais em português... 🎤",
                "Produzindo efeitos especiais... ✨",
                "Mixagem e masterização de alta fidelidade concluídas! 🎧"
            )

            for (step in steps) {
                _generationStatus.value = step
                delay(1200)
            }

            // Save finalized song to Room Database
            repository.insertSong(draft)
            _isGenerating.value = false
            _generationStatus.value = ""
            _wizardDraftSong.value = null

            onDone(draft)
        }
    }

    fun resetWizard() {
        _wizardDraftSong.value = null
        _isGenerating.value = false
        _generationStatus.value = ""
    }

    // Fast-Quiz state for guess word activity
    data class QuizQuestion(
        val linePrompt: String,
        val missingWord: String,
        val lineWithBlank: String,
        val options: List<String>
    )

    private val _currentQuizQuestion = MutableStateFlow<QuizQuestion?>(null)
    val currentQuizQuestion: StateFlow<QuizQuestion?> = _currentQuizQuestion.asStateFlow()

    private val _quizFeedback = MutableStateFlow<Boolean?>(null)
    val quizFeedback: StateFlow<Boolean?> = _quizFeedback.asStateFlow()

    fun generateQuizQuestion(song: BilingualSong) {
        _quizFeedback.value = null
        val cleanLines = song.originalLyrics.split("\n")
            .filter { it.isNotBlank() && !it.startsWith("[") }

        if (cleanLines.isEmpty()) {
            _currentQuizQuestion.value = null
            return
        }

        val randomLine = cleanLines.random()
        val words = randomLine.split(" ", ",", ".", "?", "!").filter { it.trim().length > 3 }
        if (words.isEmpty()) {
            _currentQuizQuestion.value = null
            return
        }

        val targetWord = words.random()
        val blankedLine = randomLine.replaceFirst(targetWord, "____")

        val distractors = mutableSetOf<String>()
        val allOtherWords = cleanLines.flatMap { it.split(" ") }
            .map { it.replace(Regex("[^a-zA-Záàâãéèêíïóôõöúçñ]"), "") }
            .filter { it.trim().length > 3 && !it.equals(targetWord, ignoreCase = true) }

        distractors.addAll(allOtherWords.shuffled().take(3))

        val fallbacks = listOf("sorriso", "abraço", "canção", "alegria", "luz", "dia", "melodia", "parabéns")
        var i = 0
        while (distractors.size < 3 && i < fallbacks.size) {
            if (!fallbacks[i].equals(targetWord, ignoreCase = true)) distractors.add(fallbacks[i])
            i++
        }

        val options = (distractors + targetWord).shuffled()

        _currentQuizQuestion.value = QuizQuestion(
            linePrompt = randomLine,
            missingWord = targetWord,
            lineWithBlank = blankedLine,
            options = options
        )
    }

    fun checkQuizAnswer(selectedOption: String) {
        val current = _currentQuizQuestion.value ?: return
        if (selectedOption.equals(current.missingWord, ignoreCase = true)) {
            _quizFeedback.value = true
        } else {
            _quizFeedback.value = false
        }
    }
}

class SongViewModelFactory(private val repository: SongRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(SongViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return SongViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

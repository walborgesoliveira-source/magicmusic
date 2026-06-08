package com.example

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.room.Room
import com.example.data.*
import com.example.ui.*
import com.example.ui.theme.*
import java.util.Locale
import androidx.compose.foundation.lazy.rememberLazyListState

data class OccasionOption(
    val id: String,
    val icon: ImageVector,
    val title: String,
    val desc: String
)

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize Android TextToSpeech for real-time vocals
        textToSpeech = TextToSpeech(this, this)

        // Initialize Room DB & Repository
        val database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java, "magic_music_db"
        )
            .fallbackToDestructiveMigration()
            .build()
        val repository = SongRepository(database.songDao())

        // Instantiate ViewModel
        val factory = SongViewModelFactory(repository)
        val viewModel = ViewModelProvider(this, factory)[SongViewModel::class.java]

        setContent {
            MyApplicationTheme {
                MainAppScreen(
                    viewModel = viewModel,
                    onSpeak = { text, style -> speakLyric(text, style) }
                )
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = textToSpeech?.setLanguage(Locale("pt", "BR"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("MainActivity", "Portuguese TTS language pack is missing or not supported.")
            } else {
                isTtsReady = true
                // Make TTS sound slightly more singing-like/musical by raising pitch slightly
                textToSpeech?.setPitch(1.15f)
                textToSpeech?.setSpeechRate(1.0f)
            }
        } else {
            Log.e("MainActivity", "Initialization of TextToSpeech failed.")
        }
    }

    private fun speakLyric(text: String, style: String) {
        if (!isTtsReady || text.isBlank() || text.startsWith("[")) {
            textToSpeech?.stop()
            return
        }
        try {
            textToSpeech?.stop()
            // Set dynamic pitch & speech rate parameters based on musical style
            when (style) {
                "Trap / Rap" -> {
                    textToSpeech?.setPitch(1.05f)
                    textToSpeech?.setSpeechRate(1.22f)
                }
                "Eletrônica" -> {
                    textToSpeech?.setPitch(1.30f)
                    textToSpeech?.setSpeechRate(1.10f)
                }
                "Acústico / MPB" -> {
                    textToSpeech?.setPitch(1.08f)
                    textToSpeech?.setSpeechRate(0.88f)
                }
                "Sertanejo" -> {
                    textToSpeech?.setPitch(1.20f)
                    textToSpeech?.setSpeechRate(0.95f)
                }
                "Rock" -> {
                    textToSpeech?.setPitch(1.18f)
                    textToSpeech?.setSpeechRate(1.00f)
                }
                else -> { // Pop BR and other styles
                    textToSpeech?.setPitch(1.15f)
                    textToSpeech?.setSpeechRate(1.00f)
                }
            }
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "LyricUtterance")
        } catch (e: Exception) {
            Log.e("MainActivity", "Error speaking TTS: ${e.message}")
        }
    }

    override fun onPause() {
        super.onPause()
        textToSpeech?.stop()
        AudioSynthPlayer.stopPlaying()
    }

    override fun onDestroy() {
        super.onDestroy()
        textToSpeech?.shutdown()
        textToSpeech = null
        AudioSynthPlayer.stopPlaying()
    }
}

@Composable
fun MainAppScreen(
    viewModel: SongViewModel,
    onSpeak: (String, String) -> Unit
) {
    val songs by viewModel.songs.collectAsStateWithLifecycle()
    val currentSong by viewModel.currentPlayingSong.collectAsStateWithLifecycle()
    val isPlaying by viewModel.isPlaying.collectAsStateWithLifecycle()
    val progress by viewModel.playbackProgress.collectAsStateWithLifecycle()
    val activeLineIdx by viewModel.activeLyricIndex.collectAsStateWithLifecycle()
    val credits by viewModel.credits.collectAsStateWithLifecycle()

    var activeTab by remember { mutableStateOf("create") } // "create", "library", "player", "shop"

    // Sync synthesizer backing audio track with playing states
    LaunchedEffect(isPlaying, currentSong) {
        if (isPlaying && currentSong != null) {
            AudioSynthPlayer.startPlaying(currentSong!!.category)
        } else {
            AudioSynthPlayer.stopPlaying()
        }
    }

    // Sync TextToSpeech singer vocals with active lyrics highlights
    LaunchedEffect(activeLineIdx, isPlaying, currentSong) {
        if (isPlaying && currentSong != null) {
            val cleanLines = currentSong!!.originalLyrics.split("\n")
                .filter { it.isNotBlank() && !it.startsWith("[") }
            val currentLineText = cleanLines.getOrNull(activeLineIdx)
            if (currentLineText != null) {
                // Strip metadata tags or parentheses for clean TTS recitation
                val speakableText = currentLineText.replace(Regex("\\[.*?\\]"), "").trim()
                onSpeak(speakableText, currentSong!!.category)
            }
        } else {
            onSpeak("", "") // Stops active speaking
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp,
                windowInsets = WindowInsets.navigationBars
            ) {
                NavigationBarItem(
                    selected = activeTab == "create",
                    onClick = { activeTab = "create" },
                    icon = { Icon(Icons.Default.AutoAwesome, contentDescription = "Criar Música") },
                    label = { Text("Criar", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NeonPink,
                        selectedTextColor = NeonPink,
                        indicatorColor = NeonPink.copy(alpha = 0.2f),
                        unselectedIconColor = LightGrayText,
                        unselectedTextColor = LightGrayText
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "library",
                    onClick = { activeTab = "library" },
                    icon = { Icon(Icons.Default.LibraryMusic, contentDescription = "Minhas Letras") },
                    label = { Text("Músicas", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NeonPink,
                        selectedTextColor = NeonPink,
                        indicatorColor = NeonPink.copy(alpha = 0.2f),
                        unselectedIconColor = LightGrayText,
                        unselectedTextColor = LightGrayText
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "player",
                    onClick = {
                        if (currentSong == null && songs.isNotEmpty()) {
                            viewModel.selectSong(songs.first())
                        }
                        activeTab = "player"
                    },
                    icon = { Icon(Icons.Default.PlayCircle, contentDescription = "Player") },
                    label = { Text("Player", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NeonPink,
                        selectedTextColor = NeonPink,
                        indicatorColor = NeonPink.copy(alpha = 0.2f),
                        unselectedIconColor = LightGrayText,
                        unselectedTextColor = LightGrayText
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "shop",
                    onClick = { activeTab = "shop" },
                    icon = { Icon(Icons.Default.ShoppingBag, contentDescription = "Loja de Créditos") },
                    label = { Text("Crédito: $credits", fontSize = 11.sp, fontWeight = FontWeight.Black) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = GlowingAmber,
                        selectedTextColor = GlowingAmber,
                        indicatorColor = GlowingAmber.copy(alpha = 0.15f),
                        unselectedIconColor = LightGrayText,
                        unselectedTextColor = LightGrayText
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            SpaceBlack,
                            SpaceBlack.copy(alpha = 0.96f),
                            DeepSpaceCard
                        )
                    )
                )
        ) {
            AnimatedContent(
                targetState = activeTab,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(200))
                },
                label = "NavigationTabTransition"
            ) { targetTab ->
                when (targetTab) {
                    "create" -> GenerationWizardScreen(
                        viewModel = viewModel,
                        credits = credits,
                        onCompleted = { song ->
                            viewModel.selectSong(song)
                            activeTab = "player"
                        },
                        onBuyCreditsRedirect = { activeTab = "shop" }
                    )
                    "library" -> LibraryScreen(
                        songs = songs,
                        currentPlaying = currentSong,
                        onSongSelect = { song ->
                            viewModel.selectSong(song)
                            activeTab = "player"
                        },
                        onToggleFavorite = { viewModel.toggleFavorite(it) },
                        onDeleteSong = { viewModel.deleteSong(it) }
                    )
                    "player" -> PlayerScreen(
                        song = currentSong,
                        isPlaying = isPlaying,
                        progress = progress,
                        activeLineIdx = activeLineIdx,
                        onPlayPauseToggle = { viewModel.togglePlayPause() },
                        onLineClick = { viewModel.seekToLine(it) },
                        onBackToLibrary = { activeTab = "library" },
                        viewModel = viewModel
                    )
                    "shop" -> CreditShopScreen(
                        credits = credits,
                        onPurchasePack = { amount -> viewModel.addCredits(amount) }
                    )
                }
            }

            // Quick floating bottom mini player bar if playing in other screens
            if (activeTab != "player" && currentSong != null && isPlaying) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 12.dp, start = 16.dp, end = 16.dp)
                        .fillMaxWidth()
                        .widthIn(max = 600.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(DeepSpaceCard.copy(alpha = 0.95f))
                        .border(1.dp, NeonPink.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                        .clickable { activeTab = "player" }
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(currentSong!!.coverColorHex.toLongOrNull() ?: 0xFFF43F5EL)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.MusicNote, contentDescription = "", tint = Color.White, modifier = Modifier.size(22.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = currentSong!!.title,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = currentSong!!.artist,
                                    color = LightGrayText,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        IconButton(onClick = { viewModel.togglePlayPause() }) {
                            Icon(
                                imageVector = Icons.Default.Pause,
                                contentDescription = "Pausar",
                                tint = NeonPink,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }
        }
    }

    val showCheckoutEvent by viewModel.showSongCheckoutEvent.collectAsStateWithLifecycle()
    if (showCheckoutEvent != null) {
        val songToBuy = showCheckoutEvent!!
        val context = LocalContext.current
        AlertDialog(
            onDismissRequest = { viewModel.clearCheckoutEvent() },
            containerColor = DeepSpaceCard,
            title = {
                Text(
                    text = "Desbloquear Música Completa",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black
                )
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Você ouviu a prévia de 1 minuto de \"${songToBuy.title}\"!",
                        color = Color.White,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Icon(
                        Icons.Default.QrCode2,
                        contentDescription = "QR Code Pix",
                        tint = NeonPink,
                        modifier = Modifier.size(120.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Pague via Pix copia e cola:",
                        color = LightGrayText,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    val songPrice = "9,90"
                    val songPixCode = "00020101021226830014br.gov.bcb.pix0136magicsongria-${songToBuy.id}@pixkey.com5204000053039860503${songPrice.replace(",", ".")}5802BR5907MagicMusic6009Sao Paulo6304"
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SpaceBlack)
                            .clickable {
                                try {
                                    val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("Código Pix Música", songPixCode)
                                    clipboard.setPrimaryClip(clip)
                                    android.widget.Toast.makeText(context, "Código Pix copiado!", android.widget.Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    Log.e("MainActivity", "Error copying to clipboard: ${e.message}")
                                }
                            }
                            .padding(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = songPixCode,
                                color = GlowingAmber,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "Copiar Código Pix",
                                tint = GlowingAmber,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "R$ $songPrice",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "A liberação do áudio completo e download é imediata.",
                        color = LightGrayText,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )
                }
            },
            confirmButton = {
                Button(
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                    onClick = {
                        viewModel.purchaseCurrentSong()
                        viewModel.clearCheckoutEvent()
                        android.widget.Toast.makeText(
                            context,
                            "Pagamento confirmado! Música \"${songToBuy.title}\" desbloqueada com sucesso!",
                            android.widget.Toast.LENGTH_LONG
                        ).show()
                    }
                ) {
                    Text("Confirmar Simulação 💰", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.clearCheckoutEvent() }) {
                    Text("Voltar", color = LightGrayText)
                }
            }
        )
    }
}

// ------------------------------------------------------------------------
// TAB 1: CREATOR WIZARD SCREEN
// ------------------------------------------------------------------------
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GenerationWizardScreen(
    viewModel: SongViewModel,
    credits: Int,
    onCompleted: (BilingualSong) -> Unit,
    onBuyCreditsRedirect: () -> Unit
) {
    val isGenerating by viewModel.isGenerating.collectAsStateWithLifecycle()
    val generationStatus by viewModel.generationStatus.collectAsStateWithLifecycle()
    val draftedSong by viewModel.wizardDraftSong.collectAsStateWithLifecycle()

    var step by remember { mutableStateOf(1) } // 1: Occasion, 2: Style, 3: Details & Prompts, 4: Preview/Edit, 5: Production

    var selectedOccasion by remember { mutableStateOf("Aniversário") }
    var selectedStyle by remember { mutableStateOf("Pop BR") }
    var recipientName by remember { mutableStateOf("") }
    var keyStories by remember { mutableStateOf("") }
    val selectedVibes = remember { mutableStateListOf("Alegre", "Divertido") }

    val occasions = listOf(
        OccasionOption("Aniversário", Icons.Default.Cake, "Aniversário", "Comemorar um ano de vitórias"),
        OccasionOption("Declaração", Icons.Default.Favorite, "Declaração de amor", "Derreter o coração de quem ama"),
        OccasionOption("Casamento", Icons.Default.FavoriteBorder, "Casamento", "Para o altar ou noivado dos sonhos"),
        OccasionOption("Pegadinha", Icons.Default.MoodBad, "Pegadinha", "Fazer graça com piadas internas"),
        OccasionOption("Motivação", Icons.Default.Bolt, "Motivação", "Dar aquela força e inspiração"),
        OccasionOption("Festa", Icons.Default.MusicNote, "Festa", "Esquentar a pista de dança")
    )

    val styles = listOf(
        Pair("Pop BR", "Vitorioso, moderno e radiofônico"),
        Pair("Acústico / MPB", "Voz suave e violão poético"),
        Pair("Trap / Rap", "Batida urbana, graves pesados e ritmo rápido"),
        Pair("Rock", "Guitarras enérgicas e batidas pulsantes"),
        Pair("Eletrônica", "Sintetizadores contagiantes e dançantes"),
        Pair("Sertanejo", "Modão sertanejo animado de bota e chapéu")
    )

    val availableVibes = listOf("Alegre", "Romântico", "Emocionante", "Divertido", "Épico", "Nostálgico")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
            .widthIn(max = 600.dp)
    ) {
        // Logo Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Magic",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.SansSerif
            )
            Text(
                text = "Music",
                color = NeonPink,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.SansSerif
            )
            Spacer(modifier = Modifier.width(4.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(GlowingAmber)
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text("IA COMPOSITOR", color = SpaceBlack, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Músicas personalizadas e emocionantes com letras reais em segundos",
            color = LightGrayText,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(18.dp))

        // Credits Check Indicator
        if (credits == 0) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonPink.copy(alpha = 0.15f))
                    .border(2.dp, NeonPink, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Você está sem créditos de geração!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Button(
                        onClick = onBuyCreditsRedirect,
                        colors = ButtonDefaults.buttonColors(containerColor = GlowingAmber)
                    ) {
                        Text("Adquirir Créditos", color = SpaceBlack, fontWeight = FontWeight.Black)
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Stepper Progress Line
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            for (i in 1..4) {
                val isCompleted = i < step
                val isActive = i == step
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(
                            if (isCompleted) EmeraldGreen
                            else if (isActive) NeonPink
                            else DarkAccentBorder
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (isCompleted) {
                        Icon(Icons.Default.Check, contentDescription = "", tint = Color.White, modifier = Modifier.size(16.dp))
                    } else {
                        Text("$i", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
                if (i < 4) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(2.dp)
                            .background(if (i < step) EmeraldGreen else DarkAccentBorder)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Generating modal or progress panel overlay
        if (isGenerating) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(DeepSpaceCard)
                    .border(1.dp, NeonPink, RoundedCornerShape(16.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = NeonPink, strokeWidth = 5.dp, modifier = Modifier.size(54.dp))
                    Spacer(modifier = Modifier.height(18.dp))
                    Text(
                        text = "ESTÚDIO MAGIC MUSIC EM AÇÃO",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = generationStatus,
                        color = GlowingAmber,
                        textAlign = TextAlign.Center,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            return
        }

        // Steps Wizard Panels
        when (step) {
            1 -> {
                Text("Passo 1: Qual é a ocasião especial?", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Spacer(modifier = Modifier.height(12.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    occasions.forEach { occ ->
                        val isSel = occ.title == selectedOccasion
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (isSel) NeonPink.copy(alpha = 0.15f) else DeepSpaceCard)
                                .border(1.dp, if (isSel) NeonPink else DarkAccentBorder, RoundedCornerShape(14.dp))
                                .clickable { selectedOccasion = occ.title }
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(if (isSel) NeonPink else DarkAccentBorder),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(occ.icon, contentDescription = "", tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(occ.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(occ.desc, color = LightGrayText, fontSize = 11.sp)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                Button(
                    onClick = { step = 2 },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = NeonPink)
                ) {
                    Text("Continuar", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            2 -> {
                Text("Passo 2: Escolha o estilo musical", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Spacer(modifier = Modifier.height(12.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    styles.forEach { st ->
                        val isSel = st.first == selectedStyle
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (isSel) ElectricIndigo.copy(alpha = 0.15f) else DeepSpaceCard)
                                .border(1.dp, if (isSel) ElectricIndigo else DarkAccentBorder, RoundedCornerShape(14.dp))
                                .clickable { selectedStyle = st.first }
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.MusicVideo,
                                contentDescription = "",
                                tint = if (isSel) ElectricIndigo else LightGrayText,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(st.first, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(st.second, color = LightGrayText, fontSize = 11.sp)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = { step = 1 },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                    ) {
                        Text("Voltar")
                    }
                    Button(
                        onClick = { step = 3 },
                        modifier = Modifier
                            .weight(2f)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NeonPink)
                    ) {
                        Text("Continuar", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }

            3 -> {
                Text("Passo 3: Detalhes da personalização", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = recipientName,
                    onValueChange = { recipientName = it },
                    label = { Text("Para quem é a música? (Nome completo ou apelido)") },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = DeepSpaceCard,
                        unfocusedContainerColor = DeepSpaceCard,
                        focusedLabelColor = NeonPink,
                        focusedIndicatorColor = NeonPink
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("recipient_name_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = keyStories,
                    onValueChange = { keyStories = it },
                    label = { Text("Histórias englobáveis, apelidos, piadas, qualidades") },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = DeepSpaceCard,
                        unfocusedContainerColor = DeepSpaceCard,
                        focusedLabelColor = NeonPink,
                        focusedIndicatorColor = NeonPink
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text("Sentimento / Vibe:", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(6.dp))
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    availableVibes.forEach { vb ->
                        val isSelected = selectedVibes.contains(vb)
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                if (isSelected) selectedVibes.remove(vb) else selectedVibes.add(vb)
                            },
                            label = { Text(vb, color = Color.White, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = ElectricIndigo,
                                containerColor = DeepSpaceCard
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = { step = 2 },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                    ) {
                        Text("Voltar")
                    }
                    Button(
                        onClick = {
                            if (recipientName.isNotBlank()) {
                                viewModel.draftLyricsWithAI(
                                    occasion = selectedOccasion,
                                    style = selectedStyle,
                                    name = recipientName,
                                    stories = keyStories,
                                    vibes = selectedVibes
                                )
                                step = 4
                            }
                        },
                        enabled = recipientName.isNotBlank() && credits > 0,
                        modifier = Modifier
                            .weight(2f)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NeonPink)
                    ) {
                        Text("Criar Letras Rítmicas ✨", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }

            4 -> {
                if (draftedSong == null) {
                    Text("Iniciando gerador de letras...", color = LightGrayText)
                } else {
                    Text("Passo 4: Revise e Ajuste a Letra", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Edite o rascunho abaixo livremente se achar necessário!", color = LightGrayText, fontSize = 11.sp)

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = draftedSong!!.title,
                        onValueChange = {},
                        label = { Text("Título Sugerido") },
                        enabled = false,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = draftedSong!!.originalLyrics,
                        onValueChange = { viewModel.updateDraftedLyrics(it) },
                        label = { Text("Edição da Letra Completa") },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = DeepSpaceCard,
                            unfocusedContainerColor = DeepSpaceCard,
                            focusedTextColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(300.dp),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = {
                                viewModel.resetWizard()
                                step = 3
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                        ) {
                            Text("Refazer")
                        }
                        Button(
                            onClick = {
                                viewModel.finalizeProduction { finalSong ->
                                    onCompleted(finalSong)
                                }
                            },
                            modifier = Modifier
                                .weight(2f)
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen)
                        ) {
                            Text("Gerar Áudio & Vocais Reais 🎤", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ------------------------------------------------------------------------
// TAB 2: PLAYLIST LIBRARY SCREEN
// ------------------------------------------------------------------------
@Composable
fun LibraryScreen(
    songs: List<BilingualSong>,
    currentPlaying: BilingualSong?,
    onSongSelect: (BilingualSong) -> Unit,
    onToggleFavorite: (BilingualSong) -> Unit,
    onDeleteSong: (BilingualSong) -> Unit
) {
    var selectedCategoryFilter by remember { mutableStateOf("Todas") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .widthIn(max = 600.dp)
    ) {
        Text("Dedicatórias Produzidas", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
        Text("Lista de músicas guardadas no seu acervo Magic Music", color = LightGrayText, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(14.dp))

        // Categories filter chips
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val filters = listOf("Todas", "Aniversário", "Declaração", "Pegadinha", "Favoritas")
            items(filters) { item ->
                val isSelected = selectedCategoryFilter == item
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedCategoryFilter = item },
                    label = { Text(item, color = Color.White) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = NeonPink,
                        containerColor = DeepSpaceCard
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        val filteredSongs = songs.filter { song ->
            when (selectedCategoryFilter) {
                "Todas" -> true
                "Favoritas" -> song.isFavorite
                "Declaração" -> song.language.contains("Declaração")
                else -> song.language == selectedCategoryFilter
            }
        }

        if (filteredSongs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.AudioFile, contentDescription = "", tint = LightGrayText, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Nenhuma música nessa categoria", color = Color.White, fontWeight = FontWeight.Bold)
                    Text("Suba para Criar e produza sua primeira canção!", color = LightGrayText, fontSize = 11.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredSongs) { song ->
                    val coverColor = Color(song.coverColorHex.toLongOrNull() ?: 0xFFF43F5EL)
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSongSelect(song) },
                        colors = CardDefaults.cardColors(containerColor = DeepSpaceCard),
                        border = BorderStroke(
                            1.dp,
                            if (currentPlaying?.id == song.id) NeonPink else DarkAccentBorder
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(coverColor),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.MusicNote, contentDescription = "", tint = Color.White, modifier = Modifier.size(24.dp))
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                 Text(
                                     text = song.title,
                                     color = Color.White,
                                     fontWeight = FontWeight.Bold,
                                     fontSize = 15.sp,
                                     maxLines = 1,
                                     overflow = TextOverflow.Ellipsis
                                 )
                                 Text(
                                     text = song.artist,
                                     color = LightGrayText,
                                     fontSize = 12.sp,
                                     maxLines = 1,
                                     overflow = TextOverflow.Ellipsis
                                 )
                                 Spacer(modifier = Modifier.height(4.dp))
                                 Row(
                                     horizontalArrangement = Arrangement.spacedBy(6.dp),
                                     verticalAlignment = Alignment.CenterVertically
                                 ) {
                                     Box(
                                         modifier = Modifier
                                             .clip(RoundedCornerShape(6.dp))
                                             .background(NeonPink.copy(alpha = 0.15f))
                                             .padding(horizontal = 6.dp, vertical = 2.dp)
                                     ) {
                                         Text(song.language, color = NeonPink, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                     }
                                     Box(
                                         modifier = Modifier
                                             .clip(RoundedCornerShape(6.dp))
                                             .background(ElectricIndigo.copy(alpha = 0.15f))
                                             .padding(horizontal = 6.dp, vertical = 2.dp)
                                     ) {
                                         Text(song.category, color = ElectricIndigo, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                     }
                                     if (song.status == "pending_audio") {
                                         Box(
                                             modifier = Modifier
                                                 .clip(RoundedCornerShape(6.dp))
                                                 .background(LightGrayText.copy(alpha = 0.15f))
                                                 .padding(horizontal = 6.dp, vertical = 2.dp)
                                         ) {
                                             Text("Processando...", color = LightGrayText, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                         }
                                     } else {
                                         if (song.isPurchased) {
                                             Box(
                                                 modifier = Modifier
                                                     .clip(RoundedCornerShape(6.dp))
                                                     .background(EmeraldGreen.copy(alpha = 0.15f))
                                                     .padding(horizontal = 6.dp, vertical = 2.dp)
                                             ) {
                                                 Text("Completa", color = EmeraldGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                             }
                                         } else {
                                             Box(
                                                 modifier = Modifier
                                                     .clip(RoundedCornerShape(6.dp))
                                                     .background(GlowingAmber.copy(alpha = 0.15f))
                                                     .padding(horizontal = 6.dp, vertical = 2.dp)
                                             ) {
                                                 Text("Prévia (1 min)", color = GlowingAmber, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                             }
                                         }
                                     }
                                 }
                             }
                            Column(horizontalAlignment = Alignment.End) {
                                Row {
                                    IconButton(onClick = { onToggleFavorite(song) }) {
                                        Icon(
                                            imageVector = if (song.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                            contentDescription = "",
                                            tint = if (song.isFavorite) NeonPink else LightGrayText,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    IconButton(onClick = { onDeleteSong(song) }) {
                                        Icon(Icons.Default.Delete, contentDescription = "", tint = LightGrayText.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
                                    }
                                }
                                Text("Tempo: 2:00", color = LightGrayText, fontSize = 9.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ------------------------------------------------------------------------
// TAB 3: IMMERSIVE retro RECORD PLAYER SCREEN & INTERACTIVE KARAOKE LIST & EQUALIZER
// ------------------------------------------------------------------------
@Composable
fun PlayerScreen(
    song: BilingualSong?,
    isPlaying: Boolean,
    progress: Float,
    activeLineIdx: Int,
    onPlayPauseToggle: () -> Unit,
    onLineClick: (Int) -> Unit,
    onBackToLibrary: () -> Unit,
    viewModel: SongViewModel
) {
    if (song == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Selecione ou crie uma canção para ouvir!", color = LightGrayText)
        }
        return
    }

    val context = LocalContext.current
    val cleanLines = remember(song) {
        song.originalLyrics.split("\n")
            .filter { it.isNotBlank() && !it.startsWith("[") }
    }

    val coverColor = Color(song.coverColorHex.toLongOrNull() ?: 0xFFF43F5EL)

    // Scroll mechanism to center active lyrics lines
    val lazyListState = rememberLazyListState()
    LaunchedEffect(activeLineIdx) {
        if (cleanLines.isNotEmpty() && !lazyListState.isScrollInProgress) {
            lazyListState.animateScrollToItem((activeLineIdx - 1).coerceAtLeast(0))
        }
    }

    // Dynamic wave visualizer transitions
    val infiniteTransition = rememberInfiniteTransition()
    val animOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    var showQuizGame by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .widthIn(max = 600.dp)
    ) {
        // Player screen header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBackToLibrary) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Voltar", tint = Color.White)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = song.language.uppercase(),
                    color = NeonPink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Magic Music Player",
                    color = LightGrayText,
                    fontSize = 11.sp
                )
            }
            IconButton(onClick = {
                viewModel.generateQuizQuestion(song)
                showQuizGame = true
            }) {
                Icon(Icons.Default.School, contentDescription = "Desafio Letra", tint = GlowingAmber)
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (song.status == "pending_audio") {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(GlowingAmber.copy(alpha = 0.15f))
                    .border(1.dp, GlowingAmber.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(
                        color = GlowingAmber,
                        strokeWidth = 3.dp,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Aguardando áudio do Suno... Nosso produtor está gerando a faixa! A prévia estará disponível em breve.",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else if (!song.isPurchased) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(NeonPink.copy(alpha = 0.15f))
                    .border(1.dp, NeonPink.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .clickable { viewModel.triggerCheckout() }
                    .padding(10.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.Bolt, contentDescription = "", tint = NeonPink, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Gostou da prévia? Toque aqui para liberar a música completa!",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Retro spinning record / visual cover illustration side by side with lyrics or centralized
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(DeepSpaceCard)
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Rotating disk
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .graphicsLayer {
                        rotationZ = if (isPlaying) progress * 360f * 15f else 0f
                    }
                    .clip(CircleShape)
                    .background(Color(0xFF111111)),
                contentAlignment = Alignment.Center
            ) {
                // Vinyl grooves
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(color = Color.White.copy(alpha = 0.08f), radius = size.minDimension / 2.3f)
                    drawCircle(color = Color.White.copy(alpha = 0.08f), radius = size.minDimension / 3f)
                    drawCircle(color = Color.White.copy(alpha = 0.08f), radius = size.minDimension / 4.5f)
                }
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(coverColor),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.MusicNote, contentDescription = "", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }

            Spacer(modifier = Modifier.width(18.dp))

            // Text detail & dynamic canvas Equalizer side bars
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = song.title,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = song.artist,
                    color = LightGrayText,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Canvas equalizer bouncing to our synth amplitude
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(36.dp)
                ) {
                    val barWidth = 4.dp.toPx()
                    val gap = 3.dp.toPx()
                    val bars = (size.width / (barWidth + gap)).toInt()
                    val visualAmp = if (isPlaying) AudioSynthPlayer.currentVisualizerAmplitude else 0.08f

                    for (b in 0 until bars) {
                        val sineScalar = kotlin.math.sin(b * 0.35f + animOffset) * 0.45f + 0.55f
                        val multiplier = (visualAmp * 1.6f).coerceIn(0.08f, 1.0f)
                        val barHeight = size.height * sineScalar * multiplier
                        val x = b * (barWidth + gap)
                        val y = size.height - barHeight

                        val baseColor = if (b % 2 == 0) NeonPink else ElectricIndigo

                        // Draw a soft glowing shadow behind the bar
                        drawRoundRect(
                            color = baseColor.copy(alpha = 0.18f),
                            topLeft = androidx.compose.ui.geometry.Offset(x - 2.dp.toPx(), y - 1.dp.toPx()),
                            size = androidx.compose.ui.geometry.Size(barWidth + 4.dp.toPx(), barHeight + 1.dp.toPx()),
                            cornerRadius = androidx.compose.ui.geometry.CornerRadius(3.dp.toPx())
                        )

                        // Draw gradient foreground bar
                        val gradientBrush = Brush.verticalGradient(
                            colors = listOf(NeonPink, ElectricIndigo),
                            startY = y,
                            endY = size.height
                        )

                        drawRoundRect(
                            brush = gradientBrush,
                            topLeft = androidx.compose.ui.geometry.Offset(x, y),
                            size = androidx.compose.ui.geometry.Size(barWidth, barHeight),
                            cornerRadius = androidx.compose.ui.geometry.CornerRadius(2.dp.toPx())
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Lyrics View Container with glowing highlights
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(DeepSpaceCard)
                .border(1.dp, DarkAccentBorder, RoundedCornerShape(20.dp))
                .padding(horizontal = 12.dp)
        ) {
            LazyColumn(
                state = lazyListState,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 40.dp, bottom = 40.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                itemsIndexed(cleanLines) { index, lineText ->
                    val isActive = index == activeLineIdx
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (isActive) coverColor.copy(alpha = 0.15f)
                                else Color.Transparent
                            )
                            .clickable { onLineClick(index) }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = lineText,
                            color = if (isActive) coverColor else Color.White,
                            fontSize = if (isActive) 18.sp else 15.sp,
                            fontWeight = if (isActive) FontWeight.ExtraBold else FontWeight.Medium,
                            textAlign = TextAlign.Start,
                            lineHeight = 22.sp
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Audio controls progress
        Column(modifier = Modifier.fillMaxWidth()) {
            val totalSeconds = song.durationSeconds
            val elapsedSeconds = (progress * totalSeconds).toInt()
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = String.format("%02d:%02d", elapsedSeconds / 60, elapsedSeconds % 60),
                    color = LightGrayText,
                    fontSize = 11.sp
                )
                Text(
                    text = "ESTILO: ${song.category}",
                    color = GlowingAmber,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = String.format("%02d:%02d", totalSeconds / 60, totalSeconds % 60),
                    color = LightGrayText,
                    fontSize = 11.sp
                )
            }
            Slider(
                value = progress,
                onValueChange = {}, // managed automatically internally or via skips
                colors = SliderDefaults.colors(
                    activeTrackColor = coverColor,
                    inactiveTrackColor = DarkAccentBorder,
                    thumbColor = coverColor
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Multimedia Playback controllers (Skip, Play, Pause, Share)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = {
                    val shareIntent = android.content.Intent().apply {
                        action = android.content.Intent.ACTION_SEND
                        putExtra(
                            android.content.Intent.EXTRA_TEXT,
                            "Ouça a música personalizada \"${song.title}\" criada usando IA no Magic Music!\n\nLetra:\n${song.originalLyrics}"
                        )
                        type = "text/plain"
                    }
                    context.startActivity(android.content.Intent.createChooser(shareIntent, "Compartilhar Música"))
                },
                modifier = Modifier
                    .clip(CircleShape)
                    .background(DarkAccentBorder)
                    .size(44.dp)
            ) {
                Icon(Icons.Default.Share, contentDescription = "Compartilhar", tint = Color.White, modifier = Modifier.size(18.dp))
            }

            IconButton(
                onClick = { if (activeLineIdx > 0) onLineClick(activeLineIdx - 1) },
                modifier = Modifier.size(44.dp)
            ) {
                Icon(Icons.Default.SkipPrevious, contentDescription = "Anterior", tint = Color.White, modifier = Modifier.size(34.dp))
            }

            IconButton(
                onClick = { if (song.status != "pending_audio") onPlayPauseToggle() },
                enabled = song.status != "pending_audio",
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (song.status == "pending_audio") Color.Gray.copy(alpha = 0.5f) else coverColor)
                    .size(60.dp)
                    .testTag("play_pause_button")
            ) {
                Icon(
                    imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (isPlaying) "Pausar" else "Deixar cantar",
                    tint = if (song.status == "pending_audio") Color.LightGray else Color.White,
                    modifier = Modifier.size(34.dp)
                )
            }

            IconButton(
                onClick = { if (activeLineIdx < cleanLines.size - 1) onLineClick(activeLineIdx + 1) },
                modifier = Modifier.size(44.dp)
            ) {
                Icon(Icons.Default.SkipNext, contentDescription = "Próxima", tint = Color.White, modifier = Modifier.size(34.dp))
            }

            IconButton(
                onClick = {
                    if (song.isPurchased) {
                        android.widget.Toast.makeText(context, "Baixando instrumental completo MP3...", android.widget.Toast.LENGTH_SHORT).show()
                    } else {
                        android.widget.Toast.makeText(context, "Adquira a versão completa para desbloquear o download!", android.widget.Toast.LENGTH_SHORT).show()
                    }
                },
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (song.isPurchased) DarkAccentBorder else DarkAccentBorder.copy(alpha = 0.4f))
                    .size(44.dp)
            ) {
                Icon(
                    imageVector = if (song.isPurchased) Icons.Default.Download else Icons.Default.Lock,
                    contentDescription = if (song.isPurchased) "Baixar" else "Bloqueado",
                    tint = if (song.isPurchased) Color.White else Color.Gray,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }

    // Interactive Game Challenge Dialog
    if (showQuizGame) {
        val question by viewModel.currentQuizQuestion.collectAsStateWithLifecycle()
        val feedback by viewModel.quizFeedback.collectAsStateWithLifecycle()

        AlertDialog(
            onDismissRequest = { showQuizGame = false },
            containerColor = DeepSpaceCard,
            title = {
                Text("Desafio: Complete a Letra", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    if (question == null) {
                        Text("Carregando o desafio de letras...", color = LightGrayText)
                    } else {
                        Text(
                            text = question!!.lineWithBlank,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            question!!.options.forEach { opt ->
                                val isSelectedBefore = feedback != null
                                val isCorrect = opt == question!!.missingWord
                                val isFeedbackWrong = feedback == false
                                val bg = when {
                                    isSelectedBefore && isCorrect -> EmeraldGreen.copy(alpha = 0.2f)
                                    isSelectedBefore && !isCorrect -> NeonPink.copy(alpha = 0.1f)
                                    else -> DarkAccentBorder.copy(alpha = 0.5f)
                                }
                                val borderCol = when {
                                    isSelectedBefore && isCorrect -> EmeraldGreen
                                    else -> DarkAccentBorder
                                }
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(bg)
                                        .border(1.dp, borderCol, RoundedCornerShape(10.dp))
                                        .clickable(enabled = !isSelectedBefore) {
                                            viewModel.checkQuizAnswer(opt)
                                        }
                                        .padding(12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(opt, color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        if (feedback != null) {
                            if (feedback == true) {
                                Text("A rima é perfeita! Você acertou! 🎉", color = EmeraldGreen, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                            } else {
                                Text("Oops, tente de novo! A resposta correta era: \"${question!!.missingWord}\"", color = NeonPink, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                if (feedback != null) {
                    Button(
                        colors = ButtonDefaults.buttonColors(containerColor = NeonPink),
                        onClick = { viewModel.generateQuizQuestion(song) }
                    ) {
                        Text("Próximo", color = Color.White)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showQuizGame = false }) {
                    Text("Voltar ao Player", color = LightGrayText)
                }
            }
        )
    }
}

// ------------------------------------------------------------------------
// TAB 4: LOJA DE CRÉDITOS / SHOPPING PANEL
// ------------------------------------------------------------------------
@Composable
fun CreditShopScreen(
    credits: Int,
    onPurchasePack: (Int) -> Unit
) {
    val context = LocalContext.current
    var showPixDialogForPackAmount by remember { mutableStateOf<Int?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .widthIn(max = 600.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Logo Shop
        Text("Loja de Crédito Magic Music", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
        Text("Adquira tokens de geração rápida para bolar novas e emocionantes faixas!", color = LightGrayText, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))

        // Balance Display Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(
                    Brush.radialGradient(
                        colors = listOf(GlowingAmber.copy(alpha = 0.25f), Color.Transparent)
                    )
                )
                .border(1.5.dp, GlowingAmber, RoundedCornerShape(18.dp))
                .padding(18.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("SEU SALDO ATUAL", color = LightGrayText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Bolt, contentDescription = "", tint = GlowingAmber, modifier = Modifier.size(34.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "$credits música${if (credits == 1) "" else "s"}",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text("Nossos Combos de Créditos", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text("Os valores são de cobrança única. Sem assinaturas ocultas.", color = LightGrayText, fontSize = 11.sp)

        Spacer(modifier = Modifier.height(14.dp))

        // Pack Option 1: 1 music
        ShopPackItem(
            title = "1 Canção Personalizada",
            descr = "Perfeito para experimentar ou presentear alguém especial hoje.",
            pricing = "R$ 19,90",
            buttonText = "Adquirir",
            accentColor = NeonPink,
            onBuy = { showPixDialogForPackAmount = 1 }
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Pack Option 2: 3 music (popular)
        ShopPackItem(
            title = "Combo 3 Canções (Economize!)",
            descr = "Mais vendido! R$ 11,63 por canção. Perfeito para várias datas especiais.",
            pricing = "R$ 34,90",
            buttonText = "Comprar Popular ⭐",
            accentColor = GlowingAmber,
            onBuy = { showPixDialogForPackAmount = 3 }
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Pack Option 3: 5 music
        ShopPackItem(
            title = "Super Pack 5 Canções",
            descr = "Melhor Tarifa! Apenas R$ 9,98 por canção. Total liberdade criativa.",
            pricing = "R$ 49,90",
            buttonText = "Comprar Master Pack",
            accentColor = ElectricIndigo,
            onBuy = { showPixDialogForPackAmount = 5 }
        )
    }

    // Checkout Simulative Dialog
    if (showPixDialogForPackAmount != null) {
        val count = showPixDialogForPackAmount!!
        val priceStr = when (count) {
            1 -> "19,90"
            3 -> "34,90"
            else -> "49,90"
        }
        AlertDialog(
            onDismissRequest = { showPixDialogForPackAmount = null },
            containerColor = DeepSpaceCard,
            title = {
                Text("Processando Pagamento", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.QrCode2, contentDescription = "", tint = Color.White, modifier = Modifier.size(110.dp))
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Pague via Pix copia e cola:", color = LightGrayText, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    val fullPixCode = "00020101021226830014br.gov.bcb.pix0136magicmusicpixkey@magicmusic.com5204000053039860503${priceStr.replace(",", ".")}5802BR5907MagicMusic6009Sao Paulo6304"
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SpaceBlack)
                            .clickable {
                                try {
                                    val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("Código Pix", fullPixCode)
                                    clipboard.setPrimaryClip(clip)
                                    android.widget.Toast.makeText(context, "Código Pix copiado!", android.widget.Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    Log.e("MainActivity", "Error copying to clipboard: ${e.message}")
                                }
                            }
                            .padding(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = fullPixCode,
                                color = GlowingAmber,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "Copiar Código Pix",
                                tint = GlowingAmber,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "R$ $priceStr",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "O crédito será adicionado automaticamente após confirmação.",
                        color = LightGrayText,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )
                }
            },
            confirmButton = {
                Button(
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                    onClick = {
                        onPurchasePack(count)
                        showPixDialogForPackAmount = null
                        android.widget.Toast.makeText(context, "Pagamento confirmado! +$count créditos liberados!", android.widget.Toast.LENGTH_LONG).show()
                    }
                ) {
                    Text("Confirmar Simulação 💰", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPixDialogForPackAmount = null }) {
                    Text("Cancelar", color = LightGrayText)
                }
            }
        )
    }
}

@Composable
fun ShopPackItem(
    title: String,
    descr: String,
    pricing: String,
    buttonText: String,
    accentColor: Color,
    onBuy: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DeepSpaceCard),
        border = BorderStroke(1.dp, DarkAccentBorder)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, color = accentColor, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(descr, color = LightGrayText, fontSize = 11.sp)
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(pricing, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                Button(
                    onClick = onBuy,
                    colors = ButtonDefaults.buttonColors(containerColor = accentColor),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(buttonText, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

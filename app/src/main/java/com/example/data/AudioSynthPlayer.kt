package com.example.data

import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.sin
import kotlin.random.Random

object AudioSynthPlayer {
    private const val TAG = "AudioSynthPlayer"
    private const val SAMPLE_RATE = 22050
    private var audioTrack: AudioTrack? = null
    private var playJob: Job? = null
    private val isRunning = AtomicBoolean(false)
    private var activeStyle = "Pop BR"

    // Real-time amplitude value for the visualizer
    @Volatile
    var currentVisualizerAmplitude = 0f

    fun startPlaying(style: String) {
        if (isRunning.get()) {
            if (activeStyle == style) return
            stopPlaying()
        }

        activeStyle = style
        isRunning.set(true)

        playJob = GlobalScope.launch(Dispatchers.Default) {
            val bufferSize = AudioTrack.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            ) * 2

            try {
                audioTrack = AudioTrack(
                    AudioManager.STREAM_MUSIC,
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferSize,
                    AudioTrack.MODE_STREAM
                )

                audioTrack?.play()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize AudioTrack or start playing", e)
                isRunning.set(false)
                return@launch
            }

            // Synthesizer variables
            val samplesCount = 1024
            val buffer = ShortArray(samplesCount)
            var sampleIndex = 0L

            // Frequencies for chord notes (Root, 3rd, 5th)
            // Progressions:
            // Pop: C (261Hz, 330, 392) -> G (196Hz, 247, 293) -> Am (220Hz, 261, 330) -> F (174Hz, 220, 261)
            // Trap: Am (220Hz, 261, 330) -> Dm (146Hz, 174, 220)
            // Rock: Power chords C5 (130Hz, 196) -> G5 (98Hz, 146) -> A5 (110Hz, 165) -> F5 (87Hz, 130)
            // Eletrônica: E (164Hz, 207, 246) -> A (220Hz, 277, 330) triplets
            // MPB/Acústico: Cmaj7 (261Hz, 329, 392, 493) slow
            // Sertanejo: G (196Hz, 247, 293) -> D (146Hz, 185, 220)

            var currentChordIndex = 0
            val chordDurationSamples = SAMPLE_RATE * 2 // 2 seconds per chord
            var kickTrigger = 0
            val kickInterval = SAMPLE_RATE / 2 // every 0.5s (110 BPM approx)
            var snareTrigger = SAMPLE_RATE / 4 // offset of snare

            while (isRunning.get()) {
                val chordIndex = (sampleIndex / chordDurationSamples).toInt() % 4
                
                // Audio Synthesis Loop
                for (i in 0 until samplesCount) {
                    val localIndex = sampleIndex + i
                    val styleLocalIndex = localIndex.toDouble()

                    // Chord frequencies selection
                    val freqs = when (activeStyle) {
                        "Pop BR" -> when (chordIndex) {
                            0 -> doubleArrayOf(261.63, 329.63, 392.00) // C
                            1 -> doubleArrayOf(196.00, 246.94, 293.66) // G
                            2 -> doubleArrayOf(220.00, 261.63, 329.63) // Am
                            else -> doubleArrayOf(174.61, 220.00, 261.63) // F
                        }
                        "Trap / Rap" -> when (chordIndex % 2) {
                            0 -> doubleArrayOf(110.00, 130.81, 164.81) // Am (Deep)
                            else -> doubleArrayOf(73.42, 87.31, 110.00) // Dm (Deep)
                        }
                        "Rock" -> when (chordIndex) {
                            0 -> doubleArrayOf(130.81, 196.00, 261.63) // C5
                            1 -> doubleArrayOf(98.00, 146.83, 196.00) // G5
                            2 -> doubleArrayOf(110.00, 164.81, 220.00) // A5
                            else -> doubleArrayOf(87.31, 130.81, 174.61) // F5
                        }
                        "Eletrônica" -> when (chordIndex % 2) {
                            0 -> doubleArrayOf(164.81, 246.94, 329.63) // E
                            else -> doubleArrayOf(220.00, 330.00, 440.00) // A
                        }
                        "Acústico / MPB" -> when (chordIndex) {
                            0 -> doubleArrayOf(261.63, 329.63, 392.00, 493.88) // Cmaj7
                            1 -> doubleArrayOf(293.66, 349.23, 440.00, 587.33) // Dm7
                            2 -> doubleArrayOf(196.00, 246.94, 293.66, 349.23) // G7
                            else -> doubleArrayOf(174.61, 220.00, 261.63, 329.63) // Fmaj7
                        }
                        else -> when (chordIndex % 2) { // Sertanejo
                            0 -> doubleArrayOf(196.00, 246.94, 293.66) // G
                            else -> doubleArrayOf(146.83, 184.99, 220.00) // D
                        }
                    }

                    // 1. Synthesize Chord Instrument
                    var instrumentWave = 0.0
                    for (f in freqs) {
                        val phase = (2.0 * Math.PI * f * styleLocalIndex) / SAMPLE_RATE
                        val wave = when (activeStyle) {
                            "Rock" -> {
                                // Square distortion style wave for Rock guitar feel
                                val sinVal = sin(phase)
                                if (sinVal >= 0) 0.5 else -0.5
                            }
                            "Eletrônica" -> {
                                // Teeth or sawtooth-like wave for synth feel
                                (phase % (2.0 * Math.PI)) / Math.PI - 1.0
                            }
                            "Trap / Rap" -> {
                                // Soft sub sine waves
                                sin(phase)
                            }
                            "Acústico / MPB" -> {
                                // Pure sinusoid plucking envelope
                                val pluckEnvelope = 1.0 - ((localIndex % (SAMPLE_RATE / 2)) / (SAMPLE_RATE / 2.0))
                                sin(phase) * pluckEnvelope.coerceIn(0.0, 1.0)
                            }
                            else -> sin(phase) // Pop & others use soft sine blended chords
                        }
                        instrumentWave += wave
                    }
                    instrumentWave /= freqs.size

                    // 2. Synthesize Drum Beats Rhythms
                    // Kick Drum synthesis (exponential low tone sweep)
                    val sampleModKick = (localIndex % kickInterval).toInt()
                    val kickSweepFreq = (150.0 * Math.exp(-sampleModKick / 1000.0)).coerceAtLeast(35.0)
                    val kickPhase = (2.0 * Math.PI * kickSweepFreq * sampleModKick) / SAMPLE_RATE
                    val kickVol = Math.exp(-sampleModKick / 3000.0).coerceIn(0.0, 1.0)
                    val kickSample = sin(kickPhase) * kickVol * 0.45

                    // Snare Drum synthesis (decaying noise burst + mid body)
                    val sampleModSnare = ((localIndex + snareTrigger) % kickInterval).toInt()
                    val snareNoise = if (LocalNoiseGenerator.nextNoise() > 0) 1.0 else -1.0
                    val snareVol = Math.exp(-sampleModSnare / 4000.0).coerceIn(0.0, 1.0)
                    val snareSample = snareNoise * snareVol * 0.22

                    // Combine & Mix down
                    var finalSample = when (activeStyle) {
                        "Trap / Rap" -> {
                            // Focus on deep sub-bass instrument, rapid hi-hats
                            val hhMod = (localIndex % (kickInterval / 4)).toInt() // ultra fast hihats
                            val hhNoise = if (LocalNoiseGenerator.nextNoise() > 0) 1.0 else -1.0
                            val hhVol = Math.exp(-hhMod / 300.0).coerceIn(0.0, 1.0)
                            
                            (instrumentWave * 0.40) + (kickSample * 0.50) + (snearTrapSample(localIndex, kickInterval) * 0.20) + (hhNoise * hhVol * 0.08)
                        }
                        "Rock" -> {
                            // Heavy instruments, simpler heavy acoustic-style drums
                            (instrumentWave * 0.25) + (kickSample * 0.40) + (snareSample * 0.35)
                        }
                        "Eletrônica" -> {
                            // Fast, highly rhythmic kick and synth
                            val hhPlay = if ((localIndex % (kickInterval / 2)) < 500) 0.1 else 0.0
                            val hhSample = (if (LocalNoiseGenerator.nextNoise() > 0) 1.0 else -1.0) * hhPlay

                            (instrumentWave * 0.30) + (kickSample * 0.45) + (snareSample * 0.20) + hhSample
                        }
                        "Acústico / MPB" -> {
                            // Very soft shaker/noise, high instrument level
                            val shMod = (localIndex % (SAMPLE_RATE / 2)).toInt()
                            val shakerVol = Math.exp(-shMod / 10000.0).coerceIn(0.0, 1.0)
                            val shaker = (if (LocalNoiseGenerator.nextNoise() > 0) 1.0 else -1.0) * shakerVol * 0.02
                            
                            (instrumentWave * 0.82) + shaker
                        }
                        else -> { // Pop BR, Sertanejo
                            // Standard balanced pop drums
                            (instrumentWave * 0.42) + (kickSample * 0.30) + (snareSample * 0.25)
                        }
                    }

                    // Absolute limits safety check
                    finalSample = finalSample.coerceIn(-1.0, 1.0)

                    // Write 16-bit short value
                    buffer[i] = (finalSample * Short.MAX_VALUE).toInt().toShort()
                }

                // Push buffer to AudioTrack
                audioTrack?.write(buffer, 0, samplesCount)

                // Render dynamic visualizer amplitude from the final wrote stream sample
                var maxAmplitude = 0f
                for (v in buffer) {
                    val absVal = Math.abs(v.toFloat() / Short.MAX_VALUE)
                    if (absVal > maxAmplitude) {
                        maxAmplitude = absVal
                    }
                }
                currentVisualizerAmplitude = maxAmplitude

                sampleIndex += samplesCount
            }

            // Cleanup when loop ends
            try {
                audioTrack?.stop()
                audioTrack?.release()
                audioTrack = null
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    private fun snearTrapSample(localIdx: Long, interval: Int): Double {
        val sweep = ((localIdx + (interval / 2)) % interval).toInt()
        val snareNoise = if (LocalNoiseGenerator.nextNoise() > 0) 1.0 else -1.0
        val snareVol = Math.exp(-sweep / 2500.0).coerceIn(0.0, 1.0)
        return snareNoise * snareVol
    }

    fun stopPlaying() {
        isRunning.set(false)
        playJob?.cancel()
        playJob = null
        try {
            audioTrack?.stop()
            audioTrack?.release()
            audioTrack = null
        } catch (e: Exception) {
            // ignore
        }
    }
}

object LocalNoiseGenerator {
    private val random = Random(System.currentTimeMillis())
    fun nextNoise(): Float {
        return random.nextFloat() * 2f - 1f
    }
}

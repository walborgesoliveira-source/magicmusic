package com.example.data

import android.util.Log
import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object GeminiClient {
    private const val TAG = "GeminiClient"
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun generateCustomSong(
        occasion: String,
        style: String,
        name: String,
        stories: String,
        vibes: List<String>
    ): BilingualSong? = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY") {
            Log.e(TAG, "Gemini API key is not set. Falling back to template.")
            return@withContext null
        }

        val prompt = """
            Você é o compositor poético profissional do Magic Music (magicmusic.com), uma IA de criação musical personalizada em português.
            Sua missão é criar a letra de uma canção personalizada com rimas perfeitas, ritmo incrível e alto impacto emocional ou engraçado.
            
            Informações do destinatário:
            - Ocasião: $occasion
            - Estilo Musical: $style
            - Nome do destinatário: $name
            - Histórias/Piadas internas/Detalhes importantes: $stories
            - Sentimentos/Vibes indicadas: ${vibes.joinToString(", ")}

            Regras de Estrutura da Letra:
            - Crie um título original, poético e cativante no campo "title".
            - Escreva a letra da canção no campo "lyrics" em português.
            - A letra DEVE conter exatamente de 4 a 6 estrofes intercaladas com um Refrão marcante. Ex:
              [Verso 1]
              (linhas de verso)
              
              [Refrão]
              (linhas de refrão)
              
              [Verso 2]
              (linhas de verso)
              
              [Refrão]
              (linhas de refrão)
              
              [Outro]
              (linhas de desfecho)
            - Mantenha cada linha curta, limpa e poética. Use boas rimas (AABB, ABAB, etc.).
            
            Por favor, responda estritamente no formato de JSON obedecendo a estrutura abaixo, sem comentários adicionais fora do JSON:
            {
              "title": "Título da Música",
              "artist": "Magic Music AI & $name",
              "lyrics": "[Verso 1]\nLinha 1...\nLinha 2...\n\n[Refrão]\nRefrão linha 1...\nRefrão linha 2...\n\n[Verso 2]\n...",
              "durationSeconds": 120
            }
        """.trimIndent()

        try {
            // Build the JSON body
            val requestBodyJson = JSONObject().apply {
                val contentsArray = JSONArray().apply {
                    put(JSONObject().apply {
                        val partsArray = JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", prompt)
                            })
                        }
                        put("parts", partsArray)
                    })
                }
                put("contents", contentsArray)

                val genConfig = JSONObject().apply {
                    put("responseMimeType", "application/json")
                    put("temperature", 0.7)
                }
                put("generationConfig", genConfig)
            }

            val requestBodyStr = requestBodyJson.toString()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = requestBodyStr.toRequestBody(mediaType)

            val url = "$BASE_URL?key=$apiKey"
            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "Request failed with code ${response.code}: ${response.body?.string()}")
                    return@withContext null
                }

                val responseBodyStr = response.body?.string() ?: return@withContext null
                val responseJson = JSONObject(responseBodyStr)

                // parse candidates
                val candidates = responseJson.optJSONArray("candidates") ?: return@withContext null
                if (candidates.length() == 0) return@withContext null
                val candidate = candidates.getJSONObject(0)
                val content = candidate.getJSONObject("content")
                val parts = content.getJSONArray("parts")
                if (parts.length() == 0) return@withContext null
                val textOutput = parts.getJSONObject(0).getString("text")

                // parse structured JSON string from Gemini text
                val textJson = JSONObject(textOutput)
                val generatedTitle = textJson.optString("title", "Canção para $name")
                val generatedArtist = textJson.optString("artist", "Magic Music AI & $name")
                val generatedLyrics = textJson.optString("lyrics", "")
                val duration = textJson.optInt("durationSeconds", 120)

                if (generatedLyrics.isBlank()) return@withContext null

                val colors = listOf("0xFFF43F5E", "0xFF8B5CF6", "0xFFD946EF", "0xFF06B6D4", "0xFF10B981", "0xFFF59E0B")
                val randomColor = colors.random()

                return@withContext BilingualSong(
                    title = generatedTitle,
                    artist = generatedArtist,
                    language = occasion,
                    category = style,
                    coverColorHex = randomColor,
                    originalLyrics = generatedLyrics,
                    translatedLyrics = "Letra sincronizada de alta fidelidade.",
                    romanization = vibes.joinToString(", "),
                    durationSeconds = duration,
                    isFavorite = false
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during Gemini generation: ${e.message}", e)
            return@withContext null
        }
    }
}

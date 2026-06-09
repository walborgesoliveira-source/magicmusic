package com.example.data

import kotlin.random.Random

object SongTemplates {

    fun getFallbackTemplate(
        occasion: String,
        style: String,
        name: String,
        stories: String,
        vibes: List<String>
    ): BilingualSong {
        val finalName = if (name.isBlank()) "Você" else name
        val finalStory = if (stories.isBlank()) "que alegra a vida de todos nós" else stories
        val title = when (occasion) {
            "Aniversário" -> "O Dia de $finalName"
            "Declaração de amor" -> "Te Amar, $finalName"
            "Casamento" -> "$finalName e o Amor Eterno"
            "Pegadinha" -> "O Show de $finalName"
            "Motivação" -> "Força, $finalName"
            else -> "Festa de $finalName"
        }

        val lyrics = when (occasion) {
            "Aniversário" -> {
                """[Verso 1]
Hoje o céu brilha com outro tom
Celebrando a sua história e seu dom
$finalName faz mais um ano vencer
Tantas memórias pra gente viver

[Refrão]
Parabéns, que dia tão feliz!
Você é tudo que a vida sempre quis
$finalName, sorria pro amanhã
Seu brilho é joia sob o sol da manhã

[Verso 2]
Histórias lindas que o tempo guardou
E essa piada que a gente relembrou:
$finalStory
Siga em frente com todo o carinho
Nunca estará só em seu caminho

[Refrão]
Parabéns, que dia tão feliz!
Você é tudo que a vida sempre quis
$finalName, sorria pro amanhã
Seu brilho é joia sob o sol da manhã

[Outro]
Um ano de paz, de amor sem fim
Parabéns pra você, é sim!"""
            }
            "Declaração de amor" -> {
                """[Verso 1]
No labirinto do meu caminhar
Seu olhar me ensinou a respirar
$finalName, o seu riso me cura a dor
És meu compasso, minha rima de amor

[Refrão]
Por você eu canto essa canção
Que bate forte no meu coração
Te amar, $finalName, é o meu viver
O pôr do sol mais lindo de se ver

[Verso 2]
Lembra quando tudo começou?
O seu perfume no ar se espalhou
Como se dizia: $finalStory
Nossa história é o meu maior troféu

[Refrão]
Por você eu canto essa canção
Que bate forte no meu coração
Te amar, $finalName, é o meu viver
O pôr do sol mais lindo de se ver

[Outro]
Sempre contigo, seja como for
$finalName, meu eterno amor..."""
            }
            "Casamento" -> {
                """[Verso 1]
Duas vidas prontas pra recomeçar
Sob as bênçãos eternas do altar
$finalName deu o sim de todo coração
Num laço firme de amor e união

[Refrão]
O amor uniu o que o tempo selou
Uma história linda que agora começou
Dois caminhos, uma só direção
Unidos na mesma canção

[Verso 2]
Cúmplices parceiros construindo o lar
$finalStory
As promessas que juramos proteger
Até o tempo enfim envelhecer

[Refrão]
O amor uniu o que o tempo selou
Uma história linda que agora começou
Dois caminhos, uma só direção
Unidos na mesma canção

[Outro]
Para sempre juntos no altar
Seu amor é o meu eterno lar..."""
            }
            "Pegadinha" -> {
                """[Verso 1]
Lá vem $finalName de novo aprontar
Ninguém na firma consegue aguentar
Sempre dormindo ou jogando conversa fora
Mas na hora do lanche ele nunca demora!

[Refrão]
Que figura ruidosa e sem igual!
$finalName é atração de festival
Sua piada é mais velha que o mundo
Mas faz rir até o mais profundo

[Verso 2]
Olha só de quem estamos falando:
$finalStory
Seu telefone não para de vibrar
Dizendo que vai trabalhar!

[Refrão]
Que figura ruidosa e sem igual!
$finalName é atração de festival
Sua piada é mais velha que o mundo
Mas faz rir até o mais profundo

[Outro]
Valeu, $finalName, cara de pau
Você é nosso herói nacional!"""
            }
            "Motivação" -> {
                """[Verso 1]
A tempestade tenta te parar
Mas a sua força vai te levantar
$finalName, levante os olhos pro infinito
Seu potencial é o grito mais bonito

[Refrão]
Siga em frente, não olhe pra trás
O seu foco te guiará para a paz
$finalName, você nasceu para vencer
Nenhuma montanha vai te deter!

[Verso 2]
Lembre da jornada e das lições
Da superação em tantas gerações
Quando pensavam: $finalStory
A sua luz rasgou o escuro do véu!

[Refrão]
Siga em frente, não olhe pra trás
O seu foco te guiará para a paz
$finalName, você nasceu para vencer
Nenhuma montanha vai te deter!

[Outro]
Força infinita no seu coração
Essa é a sua canção..."""
            }
            else -> {
                """[Verso 1]
O som tá batendo, a pista esquentou
E $finalName com estilo chegou
Esqueça os problemas, venha festejar
Essa noite não tem pressa de acabar

[Refrão]
Festa louca, energia sem fim!
$finalName comanda a balada sim!
Ergam os copos, celebrem o agora
Deixem a tristeza lá fora!

[Verso 2]
A galera pulando, cantando no refrão
A nossa amizade é pura emoção
Como diz o lema: $finalStory
A diversão tá garantida sob o céu!

[Refrão]
Festa louca, energia sem fim!
$finalName comanda a balada sim!
Ergam os copos, celebrem o agora
Deixem a tristeza lá fora!

[Outro]
A noite inteira curtindo o role
Só termina quando o sol nascer!"""
            }
        }

        val colors = listOf("0xFFF43F5E", "0xFF8B5CF6", "0xFFD946EF", "0xFF06B6D4", "0xFF10B981", "0xFFF59E0B")
        val hex = colors.random()

        return BilingualSong(
            title = title,
            artist = "Magic Music AI & $finalName",
            language = occasion,
            category = style,
            coverColorHex = hex,
            originalLyrics = lyrics,
            translatedLyrics = "Rápida prévia instrumental disponível. Sincronização automática via TTS.",
            romanization = vibes.joinToString(", "),
            durationSeconds = 120,
            isFavorite = false
        )
    }
}

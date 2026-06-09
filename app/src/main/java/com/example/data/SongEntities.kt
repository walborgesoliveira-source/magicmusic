package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "songs")
data class BilingualSong(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val artist: String,
    val language: String,
    val category: String, // e.g., "Pop", "K-Pop", "Latin", "French"
    val coverColorHex: String, // e.g., "0xFFE91E63" for card accents
    val originalLyrics: String, // Lines separated by \n
    val translatedLyrics: String, // Lines separated by \n
    val romanization: String = "", // Optional lines separated by \n
    val durationSeconds: Int = 180,
    val isFavorite: Boolean = false,
    val isPurchased: Boolean = false,
    val audioUrl: String? = null,
    val status: String = "ready"
)

@Dao
interface SongDao {
    @Query("SELECT * FROM songs ORDER BY id ASC")
    fun getAllSongs(): Flow<List<BilingualSong>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSong(song: BilingualSong)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(songs: List<BilingualSong>)

    @Update
    suspend fun updateSong(song: BilingualSong)

    @Query("UPDATE songs SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun setFavorite(id: Int, isFavorite: Boolean)

    @Query("DELETE FROM songs WHERE id = :id")
    suspend fun deleteSong(id: Int)
}

@Database(entities = [BilingualSong::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun songDao(): SongDao
}

class SongRepository(private val songDao: SongDao) {
    val allSongs: Flow<List<BilingualSong>> = songDao.getAllSongs()

    suspend fun insertSong(song: BilingualSong) = songDao.insertSong(song)
    suspend fun insertAll(songs: List<BilingualSong>) = songDao.insertAll(songs)
    suspend fun updateSong(song: BilingualSong) = songDao.updateSong(song)
    suspend fun setFavorite(id: Int, isFavorite: Boolean) = songDao.setFavorite(id, isFavorite)
    suspend fun deleteSong(id: Int) = songDao.deleteSong(id)
}

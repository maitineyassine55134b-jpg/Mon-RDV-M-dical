package ma.monrdv.medical.data

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

enum class ProviderType { DOCTOR, CABINET }

data class Provider(
    val id: String,
    val name: String,
    val specialty: String,
    val description: String,
    val city: String,
    val address: String,
    val price: Int,
    val rating: Double,
    val patients: String,
    val type: ProviderType
)

enum class AppointmentStatus { UPCOMING, DONE, CANCELLED }

data class Appointment(
    val id: String,
    val provider: Provider,
    val dateTime: LocalDateTime,
    val reason: String,
    val status: AppointmentStatus,
    val amount: Int
)

data class AppNotification(val id: Int, val title: String, val message: String, val time: String)

data class UserProfile(
    val name: String,
    val email: String,
    val phone: String,
    val isGuest: Boolean = false
)

data class BookingDraft(val providerId: String, val dateTime: LocalDateTime, val reason: String)

fun LocalDateTime.frLabel(): String =
    format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH:mm", Locale.FRENCH))

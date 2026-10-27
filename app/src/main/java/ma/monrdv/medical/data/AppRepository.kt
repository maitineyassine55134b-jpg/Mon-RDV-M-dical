package ma.monrdv.medical.data

import java.time.LocalDate
import java.time.LocalDateTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Source de données en mémoire (démo).
 * Pour la production, remplacer le contenu de ces fonctions par des appels à un backend
 * (API REST ou Firebase). Les écrans n'ont pas besoin d'être modifiés.
 */
object AppRepository {

    private val providers = listOf(
        Provider("d1", "Dr. Rafik Derossi", "Pédiatre", "Se consacre au développement et aux maladies de l'enfant.", "Fès", "V4WD+JF Fès, Clinique de Pédiatrie", 300, 4.8, "500+", ProviderType.DOCTOR),
        Provider("d2", "Dr. Fatiha El Modane", "Généraliste", "Diagnostic des maladies courantes et orientation vers les spécialistes si nécessaire.", "Casablanca", "Cabinet médical, Casablanca", 250, 4.6, "800+", ProviderType.DOCTOR),
        Provider("d3", "Dr. Jamila El Idrissi", "Cardiologue", "Spécialiste du cœur et des vaisseaux sanguins.", "Rabat", "Cabinet de cardiologie, Rabat", 400, 4.9, "1200+", ProviderType.DOCTOR),
        Provider("d4", "Morad Hadawi", "Rhumatologue", "Traite les douleurs articulaires, musculaires et les maladies auto-immunes comme l'arthrite.", "Casablanca", "Cabinet de rhumatologie, Casablanca", 350, 4.7, "600+", ProviderType.DOCTOR),
        Provider("d5", "Said Khaldone", "ORL", "Spécialiste des troubles de l'oreille, du nez et de la gorge.", "Rabat", "Cabinet ORL, Rabat", 320, 4.5, "400+", ProviderType.DOCTOR),
        Provider("c1", "Hôpital Universitaire IBN SINA", "Radiologie", "Centre hospitalo-universitaire, l'une des structures hospitalières les plus importantes du Maroc.", "Rabat", "Av. Ahmed, Rabat", 500, 4.7, "3000+", ProviderType.CABINET),
        Provider("c2", "Clinique Psychiatrique La Vallée", "Santé mentale", "Service de santé mentale.", "Tamesna", "Palmerie G30, Tamesna", 450, 4.4, "250+", ProviderType.CABINET),
        Provider("c3", "Cabinet de Pédiatrie Dr. Ahmed Masrour", "Pédiatrie", "Cabinet de pédiatrie.", "Casablanca", "Ibn Sina, 40 Rue 16 Novembre, Agdal", 280, 4.5, "300+", ProviderType.CABINET),
        Provider("c4", "Cabinet Dentaire Dr Mouad Ettaleb", "Dentiste", "Soins dentaires.", "Aïn Aouda", "Résidence Al Arch, Av. Doukala", 300, 4.3, "200+", ProviderType.CABINET)
    )

    val timeSlots = listOf("09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00")

    val notifications = listOf(
        AppNotification(1, "Rappel de RDV", "N'oubliez pas votre rendez-vous demain à 14:00 avec Dr. Fatiha El Modane.", "Hier"),
        AppNotification(2, "Nouveau créneau disponible", "Dr. Fatiha El Modane a un nouveau créneau le 30 avril à 14:00.", "Hier"),
        AppNotification(3, "RDV annulé", "Le rendez-vous avec le Pr. Omar El Aoufir a été annulé.", "Il y a 5 h"),
        AppNotification(4, "Paiement reçu", "Votre paiement de 300 MAD a été traité avec succès.", "Il y a 3 j")
    )

    private val accounts = mutableMapOf<String, Pair<String, UserProfile>>() // email -> (mot de passe, profil)

    private val _user = MutableStateFlow<UserProfile?>(null)
    val user: StateFlow<UserProfile?> = _user.asStateFlow()

    private val _appointments = MutableStateFlow(seedAppointments())
    val appointments: StateFlow<List<Appointment>> = _appointments.asStateFlow()

    /** Réservation en cours, entre la page de réservation et le paiement. */
    var draft: BookingDraft? = null

    fun provider(id: String): Provider = providers.first { it.id == id }

    fun search(query: String, type: ProviderType): List<Provider> = providers.filter { p ->
        p.type == type && (
            query.isBlank() ||
                p.name.contains(query, ignoreCase = true) ||
                p.specialty.contains(query, ignoreCase = true) ||
                p.city.contains(query, ignoreCase = true)
            )
    }

    // ----- Compte -----

    /** Retourne null si l'inscription réussit, sinon le message d'erreur. */
    fun register(name: String, email: String, phone: String, password: String): String? {
        val mail = email.trim().lowercase()
        return when {
            name.isBlank() -> "Veuillez saisir votre nom complet"
            !Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$").matches(mail) -> "Adresse email invalide"
            phone.count { it.isDigit() } < 9 -> "Numéro de téléphone invalide"
            password.length < 6 -> "Le mot de passe doit contenir au moins 6 caractères"
            accounts.containsKey(mail) -> "Un compte existe déjà avec cet email"
            else -> {
                val profile = UserProfile(name.trim(), mail, phone.trim())
                accounts[mail] = password to profile
                _user.value = profile
                null
            }
        }
    }

    /** Retourne null si la connexion réussit, sinon le message d'erreur. */
    fun login(email: String, password: String): String? {
        val entry = accounts[email.trim().lowercase()] ?: return "Aucun compte avec cet email"
        if (entry.first != password) return "Mot de passe incorrect"
        _user.value = entry.second
        return null
    }

    fun continueAsGuest(name: String) {
        _user.value = UserProfile(name.trim(), "", "", isGuest = true)
    }

    fun logout() {
        _user.value = null
    }

    fun updateProfile(name: String, phone: String) {
        val current = _user.value ?: return
        val updated = current.copy(name = name.trim(), phone = phone.trim())
        if (!current.isGuest) {
            val password = accounts[current.email]?.first ?: return
            accounts[current.email] = password to updated
        }
        _user.value = updated
    }

    // ----- Rendez-vous -----

    fun find(id: String): Appointment? = _appointments.value.firstOrNull { it.id == id }

    fun createAppointment(draft: BookingDraft): Appointment {
        val p = provider(draft.providerId)
        val appt = Appointment(
            id = "RDV${System.currentTimeMillis()}",
            provider = p,
            dateTime = draft.dateTime,
            reason = draft.reason,
            status = AppointmentStatus.UPCOMING,
            amount = p.price
        )
        _appointments.update { listOf(appt) + it }
        return appt
    }

    fun cancel(id: String) {
        _appointments.update { list ->
            list.map { if (it.id == id) it.copy(status = AppointmentStatus.CANCELLED) else it }
        }
    }

    private fun seedAppointments(): List<Appointment> {
        val today = LocalDate.now()
        return listOf(
            Appointment("a1", provider("d1"), today.plusDays(3).atTime(10, 0), "Consultation de suivi", AppointmentStatus.UPCOMING, 300),
            Appointment("a2", provider("d3"), today.minusDays(6).atTime(14, 0), "Bilan cardiaque", AppointmentStatus.DONE, 400),
            Appointment("a3", provider("d2"), today.minusDays(12).atTime(9, 0), "Consultation générale", AppointmentStatus.DONE, 250),
            Appointment("a4", provider("c1"), today.minusDays(7).atTime(11, 0), "Radiographie", AppointmentStatus.CANCELLED, 500)
        )
    }
}

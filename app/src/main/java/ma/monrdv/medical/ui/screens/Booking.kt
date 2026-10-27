package ma.monrdv.medical.ui.screens

import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.TextStyle
import java.util.Locale
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import ma.monrdv.medical.data.AppRepository
import ma.monrdv.medical.data.Appointment
import ma.monrdv.medical.data.BookingDraft
import ma.monrdv.medical.data.frLabel
import ma.monrdv.medical.data.saveReceiptPdf
import ma.monrdv.medical.ui.components.AppField
import ma.monrdv.medical.ui.components.PrimaryButton
import ma.monrdv.medical.ui.theme.ErrorRed
import ma.monrdv.medical.ui.theme.Primary
import ma.monrdv.medical.ui.theme.Success

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(id: String, onBack: () -> Unit, onConfirm: () -> Unit) {
    val p = AppRepository.provider(id)
    val days = remember { (1..14).map { LocalDate.now().plusDays(it.toLong()) } }
    var dayIndex by rememberSaveable { mutableStateOf(-1) }
    var slot by rememberSaveable { mutableStateOf("") }
    var reason by rememberSaveable { mutableStateOf("") }
    val canContinue = dayIndex >= 0 && slot.isNotEmpty() && reason.isNotBlank()

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            TopAppBar(
                windowInsets = WindowInsets(0, 0, 0, 0),
                title = { Text("Prendre un rendez-vous") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour")
                    }
                }
            )
        },
        bottomBar = {
            Box(Modifier.padding(20.dp)) {
                PrimaryButton("Continuer vers le paiement", enabled = canContinue) {
                    AppRepository.draft = BookingDraft(
                        providerId = id,
                        dateTime = days[dayIndex].atTime(LocalTime.parse(slot)),
                        reason = reason.trim()
                    )
                    onConfirm()
                }
            }
        }
    ) { pad ->
        Column(Modifier.padding(pad).padding(20.dp).verticalScroll(rememberScrollState())) {
            Text(p.name, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(p.specialty, color = Primary)
            Spacer(Modifier.height(20.dp))

            Text("Date souhaitée", fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            Row(
                Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                days.forEachIndexed { i, d ->
                    FilterChip(
                        selected = dayIndex == i,
                        onClick = { dayIndex = i },
                        label = { Text("${d.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.FRENCH)} ${d.dayOfMonth}") }
                    )
                }
            }

            Spacer(Modifier.height(20.dp))
            Text("Créneau horaire", fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            Row(
                Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AppRepository.timeSlots.forEach { t ->
                    FilterChip(selected = slot == t, onClick = { slot = t }, label = { Text(t) })
                }
            }

            Spacer(Modifier.height(20.dp))
            AppField(
                value = reason,
                onValueChange = { reason = it },
                label = "Motif de consultation",
                placeholder = "Décrivez brièvement votre motif...",
                keyboard = KeyboardType.Text,
                singleLine = false,
                minLines = 3
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(onBack: () -> Unit, onPaid: (String) -> Unit) {
    val draft = AppRepository.draft
    if (draft == null) {
        Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Aucune réservation en cours")
            TextButton(onClick = onBack) { Text("Retour") }
        }
        return
    }

    val p = AppRepository.provider(draft.providerId)
    val methods = listOf(
        "Carte bancaire (Visa, MasterCard, CMI, BMCE)",
        "Mobile money (Orange Pay, Cash Plus, MT Cash)",
        "Virement bancaire (BMCE Direct, Attijari Mobile, CIH Mobile)"
    )
    var method by rememberSaveable { mutableStateOf(0) }
    var cardNumber by rememberSaveable { mutableStateOf("") }
    var expiry by rememberSaveable { mutableStateOf("") }
    var cvv by rememberSaveable { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var processing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            TopAppBar(
                windowInsets = WindowInsets(0, 0, 0, 0),
                title = { Text("Paiement") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour")
                    }
                }
            )
        }
    ) { pad ->
        Column(Modifier.padding(pad).padding(20.dp).verticalScroll(rememberScrollState())) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text("Résumé du RDV", fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(6.dp))
                    Text(p.name, fontWeight = FontWeight.Bold)
                    Text(p.specialty, color = Primary)
                    Text(draft.dateTime.frLabel(), color = Color.Gray)
                    Spacer(Modifier.height(6.dp))
                    Text("Montant : ${p.price} MAD", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(20.dp))
            Text("Méthode de paiement", fontWeight = FontWeight.SemiBold)
            methods.forEachIndexed { i, label ->
                Row(
                    Modifier.fillMaxWidth().clickable { method = i }.padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(selected = method == i, onClick = { method = i })
                    Text(label, fontSize = 14.sp)
                }
            }

            Spacer(Modifier.height(12.dp))
            if (method == 0) {
                AppField(
                    value = cardNumber,
                    onValueChange = { cardNumber = it },
                    label = "Numéro de la carte",
                    placeholder = "1234 5678 9012 3456",
                    keyboard = KeyboardType.Number
                )
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    AppField(
                        value = expiry,
                        onValueChange = { expiry = it },
                        label = "MM/AA",
                        modifier = Modifier.weight(1f),
                        keyboard = KeyboardType.Number
                    )
                    AppField(
                        value = cvv,
                        onValueChange = { if (it.length <= 3) cvv = it },
                        label = "CVV",
                        modifier = Modifier.weight(1f),
                        keyboard = KeyboardType.Number,
                        password = true
                    )
                }
            } else {
                Text("Suivez les instructions reçues après validation.", color = Color.Gray)
            }

            error?.let {
                Text(it, color = ErrorRed, modifier = Modifier.padding(top = 8.dp))
            }

            Spacer(Modifier.height(20.dp))
            PrimaryButton(
                text = if (processing) "Traitement en cours..." else "Payer ${p.price} MAD",
                enabled = !processing
            ) {
                val cardOk = method != 0 ||
                    (cardNumber.count { it.isDigit() } >= 12 && expiry.isNotBlank() && cvv.length == 3)
                if (!cardOk) {
                    error = "Vérifiez les détails de votre carte"
                } else {
                    error = null
                    processing = true
                    scope.launch {
                        delay(1200) // simulation du traitement du paiement
                        val appt = AppRepository.createAppointment(draft)
                        AppRepository.draft = null
                        onPaid(appt.id)
                    }
                }
            }
        }
    }
}

@Composable
fun ConfirmationScreen(id: String, onHome: () -> Unit) {
    val appt = AppRepository.find(id)
    val context = LocalContext.current

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = Success,
            modifier = Modifier.size(96.dp)
        )
        Spacer(Modifier.height(12.dp))
        Text("Confirmé !", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Success)
        Text("Votre rendez-vous a été réservé avec succès.", textAlign = TextAlign.Center)
        Spacer(Modifier.height(20.dp))

        if (appt != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(appt.provider.name, fontWeight = FontWeight.Bold)
                    Text(appt.provider.specialty, color = Primary)
                    Text(appt.dateTime.frLabel(), color = Color.Gray)
                    Spacer(Modifier.height(6.dp))
                    Text("Montant payé : ${appt.amount} MAD", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(Modifier.height(20.dp))
            PrimaryButton("Télécharger le reçu PDF") {
                val path = saveReceiptPdf(context, appt)
                Toast.makeText(context, "Reçu enregistré : $path", Toast.LENGTH_LONG).show()
            }
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = { addToCalendar(context, appt) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Enregistrer sur le calendrier")
            }
        }

        TextButton(onClick = onHome) { Text("Retour à l'accueil") }
    }
}

private fun addToCalendar(context: Context, appt: Appointment) {
    val start = appt.dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    val intent = Intent(Intent.ACTION_INSERT).apply {
        data = CalendarContract.Events.CONTENT_URI
        putExtra(CalendarContract.Events.TITLE, "RDV ${appt.provider.name}")
        putExtra(CalendarContract.Events.DESCRIPTION, appt.reason)
        putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
        putExtra(CalendarContract.EXTRA_EVENT_END_TIME, start + 30 * 60 * 1000L)
    }
    runCatching { context.startActivity(intent) }
}

package ma.monrdv.medical.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ma.monrdv.medical.data.AppRepository
import ma.monrdv.medical.data.Appointment
import ma.monrdv.medical.data.AppointmentStatus
import ma.monrdv.medical.data.UserProfile
import ma.monrdv.medical.data.frLabel
import ma.monrdv.medical.ui.components.AppField
import ma.monrdv.medical.ui.theme.ErrorRed
import ma.monrdv.medical.ui.theme.Primary
import ma.monrdv.medical.ui.theme.SoftBlue
import ma.monrdv.medical.ui.theme.Success

@Composable
fun AppointmentsScreen() {
    val all by AppRepository.appointments.collectAsState()
    var tab by remember { mutableStateOf(0) }
    val upcoming = all.filter { it.status == AppointmentStatus.UPCOMING }.sortedBy { it.dateTime }
    val history = all.filter { it.status != AppointmentStatus.UPCOMING }.sortedByDescending { it.dateTime }
    val list = if (tab == 0) upcoming else history

    Column(Modifier.fillMaxSize()) {
        Text("Mes rendez-vous", fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp))
        TabRow(selectedTabIndex = tab) {
            Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("À venir (${upcoming.size})") })
            Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Historique (${history.size})") })
        }
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (list.isEmpty()) {
                item { Text("Aucun rendez-vous pour le moment", color = Color.Gray) }
            }
            items(list, key = { it.id }) { AppointmentCard(it) }
        }
    }
}

@Composable
private fun AppointmentCard(a: Appointment) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(a.provider.name, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                StatusChip(a.status)
            }
            Text("${a.provider.specialty} · ${a.dateTime.frLabel()}", color = Color.Gray, fontSize = 13.sp)
            if (a.status == AppointmentStatus.UPCOMING) {
                TextButton(onClick = { AppRepository.cancel(a.id) }) {
                    Text("Annuler le rendez-vous", color = ErrorRed)
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: AppointmentStatus) {
    val (label, color) = when (status) {
        AppointmentStatus.UPCOMING -> "À venir" to Primary
        AppointmentStatus.DONE -> "Terminé" to Success
        AppointmentStatus.CANCELLED -> "Annulé" to ErrorRed
    }
    Text(
        label,
        color = Color.White,
        fontSize = 12.sp,
        modifier = Modifier
            .background(color, RoundedCornerShape(50))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

@Composable
fun NotificationsScreen() {
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { Text("Notifications", fontSize = 22.sp, fontWeight = FontWeight.Bold) }
        items(AppRepository.notifications, key = { it.id }) { n ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(Modifier.padding(14.dp)) {
                    Icon(Icons.Filled.Notifications, contentDescription = null, tint = Primary)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(n.title, fontWeight = FontWeight.SemiBold)
                        Text(n.message, fontSize = 13.sp, color = Color.Gray)
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(n.time, fontSize = 11.sp, color = Color.Gray)
                }
            }
        }
    }
}

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    val user by AppRepository.user.collectAsState()
    var editing by remember { mutableStateOf(false) }
    val u = user ?: return

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Filled.Person,
            contentDescription = null,
            tint = Primary,
            modifier = Modifier.size(96.dp).background(SoftBlue, CircleShape).padding(24.dp)
        )
        Spacer(Modifier.height(12.dp))
        Text(u.name, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text(if (u.isGuest) "Mode visiteur" else u.email, color = Color.Gray)
        if (!u.isGuest) Text(u.phone, color = Color.Gray)

        Spacer(Modifier.height(24.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column {
                ProfileItem(Icons.Filled.Edit, "Modifier mes informations") { editing = true }
                HorizontalDivider()
                ProfileItem(Icons.Filled.ExitToApp, "Se déconnecter", color = ErrorRed) {
                    AppRepository.logout()
                    onLogout()
                }
            }
        }

        if (editing) {
            EditProfileDialog(u) { editing = false }
        }
    }
}

@Composable
private fun ProfileItem(
    icon: ImageVector,
    text: String,
    color: Color = Primary,
    onClick: () -> Unit
) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = color)
        Spacer(Modifier.width(12.dp))
        Text(text, color = color, modifier = Modifier.weight(1f))
        Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = Color.Gray)
    }
}

@Composable
private fun EditProfileDialog(u: UserProfile, onDismiss: () -> Unit) {
    var name by remember { mutableStateOf(u.name) }
    var phone by remember { mutableStateOf(u.phone) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Modifier mes informations") },
        text = {
            Column {
                AppField(name, { name = it }, "Nom complet")
                Spacer(Modifier.height(8.dp))
                AppField(phone, { phone = it }, "Téléphone", keyboard = KeyboardType.Phone)
            }
        },
        confirmButton = {
            TextButton(onClick = {
                AppRepository.updateProfile(name, phone)
                onDismiss()
            }) { Text("Enregistrer") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Annuler") }
        }
    )
}

package ma.monrdv.medical.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import ma.monrdv.medical.data.AppRepository
import ma.monrdv.medical.ui.components.*
import ma.monrdv.medical.ui.theme.ErrorRed
import ma.monrdv.medical.ui.theme.Primary
import ma.monrdv.medical.ui.theme.SoftBlue
import androidx.compose.ui.unit.sp

@Composable
fun WelcomeScreen(onStart: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(48.dp))
        BrandLogo()
        Spacer(Modifier.height(32.dp))
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = SoftBlue)
        ) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Avec Mon RDV Médical, n'oubliez plus vos rendez-vous.", fontWeight = FontWeight.Bold)
                Text("Réservez en un clic, gagnez du temps et choisissez le médecin de votre choix sans vous déplacer.")
                Text(
                    "« Parce que vous êtes au cœur de tout, nous avons rapproché la guérison. »",
                    fontStyle = FontStyle.Italic,
                    color = Primary
                )
            }
        }
        Spacer(Modifier.weight(1f))
        PrimaryButton("Commencer", onClick = onStart)
    }
}

@Composable
fun LoginScreen(onLoggedIn: () -> Unit, onRegister: () -> Unit) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var showGuest by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AuthHeader("Se connecter", "Content de vous revoir")
        AppField(
            value = email,
            onValueChange = { email = it },
            label = "Adresse email",
            placeholder = "exemple@mail.com",
            keyboard = KeyboardType.Email
        )
        Spacer(Modifier.height(12.dp))
        AppField(
            value = password,
            onValueChange = { password = it },
            label = "Mot de passe",
            placeholder = "Saisir le mot de passe",
            keyboard = KeyboardType.Password,
            password = true
        )
        error?.let {
            Text(it, color = ErrorRed, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        }
        Spacer(Modifier.height(20.dp))
        PrimaryButton("Se connecter") {
            val err = AppRepository.login(email, password)
            if (err == null) {
                onLoggedIn()
            } else {
                error = err
            }
        }
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = { showGuest = true },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Continuer comme visiteur")
        }
        TextButton(onClick = onRegister) {
            Text("Pas de compte ? S'inscrire")
        }
    }

    if (showGuest) {
        GuestDialog(
            onDismiss = { showGuest = false },
            onConfirm = { name ->
                AppRepository.continueAsGuest(name)
                onLoggedIn()
            }
        )
    }
}

@Composable
fun RegisterScreen(onRegistered: () -> Unit, onLogin: () -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AuthHeader("Inscription", "Créez votre compte pour gérer vos rendez-vous")
        AppField(name, { name = it }, "Nom complet", placeholder = "Nom et prénom")
        Spacer(Modifier.height(12.dp))
        AppField(email, { email = it }, "Adresse email", placeholder = "exemple@mail.com", keyboard = KeyboardType.Email)
        Spacer(Modifier.height(12.dp))
        AppField(phone, { phone = it }, "Téléphone", placeholder = "+212 6 00 00 00 00", keyboard = KeyboardType.Phone)
        Spacer(Modifier.height(12.dp))
        AppField(
            value = password,
            onValueChange = { password = it },
            label = "Mot de passe",
            placeholder = "6 caractères minimum",
            keyboard = KeyboardType.Password,
            password = true
        )
        error?.let {
            Text(it, color = ErrorRed, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        }
        Spacer(Modifier.height(20.dp))
        PrimaryButton("S'inscrire") {
            val err = AppRepository.register(name, email, phone, password)
            if (err == null) {
                onRegistered()
            } else {
                error = err
            }
        }
        TextButton(onClick = onLogin) {
            Text("J'ai déjà un compte ? Se connecter")
        }
    }
}

@Composable
fun GuestDialog(onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var name by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Mode visiteur") },
        text = {
            Column {
                Text("Accédez à l'application sans créer de compte. Saisissez simplement votre nom complet.")
                Spacer(Modifier.height(12.dp))
                AppField(name, { name = it }, "Nom complet", placeholder = "Nom et prénom")
            }
        },
        confirmButton = {
            TextButton(onClick = { if (name.isNotBlank()) onConfirm(name) }) { Text("Continuer") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Annuler") }
        }
    )
}

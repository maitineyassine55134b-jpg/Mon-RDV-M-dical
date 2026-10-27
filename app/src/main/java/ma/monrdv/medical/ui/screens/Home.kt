package ma.monrdv.medical.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ma.monrdv.medical.data.AppRepository
import ma.monrdv.medical.data.Provider
import ma.monrdv.medical.data.ProviderType
import ma.monrdv.medical.ui.components.PrimaryButton
import ma.monrdv.medical.ui.theme.Accent
import ma.monrdv.medical.ui.theme.Primary
import ma.monrdv.medical.ui.theme.SoftBlue

@Composable
fun HomeScreen(onProvider: (String) -> Unit) {
    val user by AppRepository.user.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }
    var type by remember { mutableStateOf(ProviderType.DOCTOR) }
    val results = AppRepository.search(query, type)

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 12.dp)) {
        Text("Bienvenue ${user?.name.orEmpty()}", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Chercher un médecin ou un cabinet...") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(12.dp))
        TabRow(selectedTabIndex = if (type == ProviderType.DOCTOR) 0 else 1) {
            Tab(selected = type == ProviderType.DOCTOR, onClick = { type = ProviderType.DOCTOR }, text = { Text("Médecins") })
            Tab(selected = type == ProviderType.CABINET, onClick = { type = ProviderType.CABINET }, text = { Text("Cabinets") })
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (results.isEmpty()) {
                item { Text("Aucun résultat", color = Color.Gray) }
            }
            items(results, key = { it.id }) { p ->
                ProviderCard(p) { onProvider(p.id) }
            }
        }
    }
}

@Composable
fun ProviderCard(p: Provider, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            ProviderIcon(p.type, size = 44.dp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(p.name, fontWeight = FontWeight.SemiBold)
                Text(p.specialty, color = Primary)
                Text("${p.city} · ${p.price} MAD", fontSize = 13.sp, color = Color.Gray)
            }
            Text("★ ${p.rating}", color = Accent, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun ProviderIcon(type: ProviderType, size: Dp) {
    Icon(
        imageVector = if (type == ProviderType.DOCTOR) Icons.Filled.Person else Icons.Filled.LocalHospital,
        contentDescription = null,
        tint = Primary,
        modifier = Modifier
            .size(size)
            .background(SoftBlue, CircleShape)
            .padding(10.dp)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProviderScreen(id: String, onBack: () -> Unit, onBook: () -> Unit) {
    val p = AppRepository.provider(id)
    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            TopAppBar(
                windowInsets = WindowInsets(0, 0, 0, 0),
                title = { Text(if (p.type == ProviderType.DOCTOR) "Profil du médecin" else "Profil du cabinet") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour")
                    }
                }
            )
        },
        bottomBar = {
            Box(Modifier.padding(20.dp)) {
                PrimaryButton("Prendre un rendez-vous", onClick = onBook)
            }
        }
    ) { pad ->
        Column(
            Modifier.padding(pad).padding(20.dp).verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ProviderIcon(p.type, size = 96.dp)
            Spacer(Modifier.height(16.dp))
            Text(p.name, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(p.specialty, color = Primary, fontWeight = FontWeight.SemiBold)
            Text("★ ${p.rating} · ${p.patients} patients", color = Color.Gray)
            Spacer(Modifier.height(20.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text("À propos", fontWeight = FontWeight.SemiBold)
                    Text(p.description)
                    Spacer(Modifier.height(12.dp))
                    Text("Adresse", fontWeight = FontWeight.SemiBold)
                    Text("${p.address}, ${p.city}")
                    Spacer(Modifier.height(12.dp))
                    Text("Tarif de consultation : ${p.price} MAD", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

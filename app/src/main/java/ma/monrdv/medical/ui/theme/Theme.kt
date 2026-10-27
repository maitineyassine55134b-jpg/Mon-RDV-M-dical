package ma.monrdv.medical.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Palette issue de la charte graphique Mon RDV Médical
val Primary = Color(0xFF009FE3)
val PrimaryDark = Color(0xFF2657A3)
val Secondary = Color(0xFF5ABEBD)
val Success = Color(0xFF009640)
val ErrorRed = Color(0xFFE34511)
val Accent = Color(0xFFE2B709)
val Pink = Color(0xFFC9368C)
val SoftBlue = Color(0xFFC2D7F0)
val TextDark = Color(0xFF1E1E1E)

private val LightScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Color.White,
    secondary = Secondary,
    onSecondary = Color.White,
    tertiary = Accent,
    error = ErrorRed,
    onError = Color.White,
    background = Color(0xFFF5F9FD),
    onBackground = TextDark,
    surface = Color.White,
    onSurface = TextDark,
    surfaceVariant = SoftBlue
)

@Composable
fun MonRdvTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightScheme,
        typography = Typography(),
        content = content
    )
}

package ma.monrdv.medical

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import ma.monrdv.medical.ui.navigation.AppNavHost
import ma.monrdv.medical.ui.theme.MonRdvTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MonRdvTheme {
                AppNavHost()
            }
        }
    }
}

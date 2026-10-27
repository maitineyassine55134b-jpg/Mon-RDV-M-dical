package ma.monrdv.medical.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import ma.monrdv.medical.ui.screens.AppointmentsScreen
import ma.monrdv.medical.ui.screens.BookingScreen
import ma.monrdv.medical.ui.screens.ConfirmationScreen
import ma.monrdv.medical.ui.screens.HomeScreen
import ma.monrdv.medical.ui.screens.LoginScreen
import ma.monrdv.medical.ui.screens.NotificationsScreen
import ma.monrdv.medical.ui.screens.PaymentScreen
import ma.monrdv.medical.ui.screens.ProfileScreen
import ma.monrdv.medical.ui.screens.ProviderScreen
import ma.monrdv.medical.ui.screens.RegisterScreen
import ma.monrdv.medical.ui.screens.WelcomeScreen

object Routes {
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val HOME = "home"
    const val APPOINTMENTS = "appointments"
    const val NOTIFICATIONS = "notifications"
    const val PROFILE = "profile"
    const val PROVIDER = "provider/{id}"
    const val BOOKING = "booking/{id}"
    const val PAYMENT = "payment"
    const val CONFIRMATION = "confirmation/{id}"

    fun provider(id: String) = "provider/$id"
    fun booking(id: String) = "booking/$id"
    fun confirmation(id: String) = "confirmation/$id"
}

private fun NavHostController.goTo(route: String) =
    navigate(route) { popUpTo(graph.id) { inclusive = true } }

@Composable
fun AppNavHost() {
    val nav = rememberNavController()
    val entry by nav.currentBackStackEntryAsState()
    val route = entry?.destination?.route
    val mainRoutes = listOf(Routes.HOME, Routes.APPOINTMENTS, Routes.NOTIFICATIONS, Routes.PROFILE)

    Scaffold(
        bottomBar = {
            if (route != null && route in mainRoutes) BottomBar(nav, route)
        }
    ) { padding ->
        NavHost(nav, startDestination = Routes.WELCOME, modifier = Modifier.padding(padding)) {

            // Authentification
            composable(Routes.WELCOME) {
                WelcomeScreen(onStart = { nav.navigate(Routes.LOGIN) })
            }
            composable(Routes.LOGIN) {
                LoginScreen(
                    onLoggedIn = { nav.goTo(Routes.HOME) },
                    onRegister = { nav.navigate(Routes.REGISTER) }
                )
            }
            composable(Routes.REGISTER) {
                RegisterScreen(
                    onRegistered = { nav.goTo(Routes.HOME) },
                    onLogin = { nav.popBackStack() }
                )
            }

            // Accueil et profil du praticien
            composable(Routes.HOME) {
                HomeScreen(onProvider = { nav.navigate(Routes.provider(it)) })
            }
            composable(
                Routes.PROVIDER,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStack ->
                val id = backStack.arguments?.getString("id").orEmpty()
                ProviderScreen(
                    id = id,
                    onBack = { nav.popBackStack() },
                    onBook = { nav.navigate(Routes.booking(id)) }
                )
            }

            // Réservation, paiement, confirmation
            composable(
                Routes.BOOKING,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStack ->
                val id = backStack.arguments?.getString("id").orEmpty()
                BookingScreen(
                    id = id,
                    onBack = { nav.popBackStack() },
                    onConfirm = { nav.navigate(Routes.PAYMENT) }
                )
            }
            composable(Routes.PAYMENT) {
                PaymentScreen(
                    onBack = { nav.popBackStack() },
                    onPaid = { apptId ->
                        nav.navigate(Routes.confirmation(apptId)) { popUpTo(Routes.HOME) }
                    }
                )
            }
            composable(
                Routes.CONFIRMATION,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStack ->
                ConfirmationScreen(
                    id = backStack.arguments?.getString("id").orEmpty(),
                    onHome = { nav.goTo(Routes.HOME) }
                )
            }

            // Onglets principaux
            composable(Routes.APPOINTMENTS) { AppointmentsScreen() }
            composable(Routes.NOTIFICATIONS) { NotificationsScreen() }
            composable(Routes.PROFILE) {
                ProfileScreen(onLogout = { nav.goTo(Routes.WELCOME) })
            }
        }
    }
}

@Composable
private fun BottomBar(nav: NavHostController, current: String) {
    val items = listOf(
        Triple(Routes.HOME, "Accueil", Icons.Filled.Home),
        Triple(Routes.APPOINTMENTS, "Rendez-vous", Icons.Filled.CalendarMonth),
        Triple(Routes.NOTIFICATIONS, "Notifications", Icons.Filled.Notifications),
        Triple(Routes.PROFILE, "Profil", Icons.Filled.Person)
    )
    NavigationBar {
        items.forEach { (route, label, icon) ->
            NavigationBarItem(
                selected = current == route,
                onClick = {
                    nav.navigate(route) {
                        popUpTo(Routes.HOME)
                        launchSingleTop = true
                    }
                },
                icon = { Icon(icon, contentDescription = label) },
                label = { Text(label) }
            )
        }
    }
}

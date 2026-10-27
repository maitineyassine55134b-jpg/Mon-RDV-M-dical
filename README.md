# Mon RDV Médical – Application Android

Application Android (Kotlin + Jetpack Compose) de prise de rendez-vous médicaux, basée sur les maquettes Figma, les wireframes, la charte graphique et le user flow du projet.

## Parcours couvert

1. Accueil → **Commencer**
2. **Connexion** / **Inscription** / **Continuer comme visiteur** (nom complet)
3. **Accueil** : recherche, onglets Médecins / Cabinets
4. **Profil** du médecin ou du cabinet
5. **Réservation** : date, créneau, motif
6. **Paiement** : carte, mobile money, virement
7. **Confirmation** : reçu PDF, ajout au calendrier
8. **Rendez-vous** : à venir / historique, annulation
9. **Notifications**
10. **Profil** : modifier les informations, déconnexion

## Obtenir l'APK depuis GitHub (sans rien installer)

1. Créez un dépôt GitHub (privé ou public) et poussez ce projet sur la branche `main` :
   ```bash
   git init
   git add .
   git commit -m "Mon RDV Médical v1.0"
   git branch -M main
   git remote add origin https://github.com/<votre-compte>/mon-rdv-medical.git
   git push -u origin main
   ```
2. Ouvrez l'onglet **Actions** du dépôt, puis le workflow **Build APK**.
3. Une fois le build vert, téléchargez l'artefact **mon-rdv-medical-debug** : il contient `app-debug.apk`.
4. Transférez l'APK sur votre téléphone Android et installez-le (autorisez « Installer des applications inconnues » pour votre gestionnaire de fichiers).

Le build se relance à chaque push, ou manuellement via **Run workflow**.

## Ouvrir et tester dans Android Studio

Ouvrez le dossier du projet dans Android Studio (Hedgehog ou plus récent), laissez Gradle synchroniser, puis lancez l'application sur un émulateur ou un appareil.

## Structure

```
app/src/main/java/ma/monrdv/medical/
├── MainActivity.kt
├── data/            Modèles, AppRepository (données de démo), reçu PDF
├── ui/theme/        Couleurs de la charte (#009FE3, #5ABEBD, #E34511, #009640…)
├── ui/components/   Logo, boutons, champs réutilisables
├── ui/navigation/   Routes et barre de navigation
└── ui/screens/      Auth, Accueil/Profil médecin, Réservation/Paiement/Confirmation, Rendez-vous/Notifications/Profil
```

## Limites de cette version (démo)

- Les données (comptes, médecins, rendez-vous) sont **en mémoire** : elles disparaissent à la fermeture de l'application. Pour la production, branchez un backend (Firebase, API REST) dans `AppRepository`.
- Le paiement est **simulé** : aucune transaction réelle n'est effectuée. Une intégration avec une passerelle (CMI, etc.) est nécessaire.
- Les polices Montserrat et Open Sans de la charte ne sont pas incluses ; l'application utilise la police système. Ajoutez les fichiers `.ttf` dans `res/font/` pour les activer.
- L'écran Carte (Map) des wireframes n'est pas inclus.
- L'APK généré est un APK **debug**. Pour publier sur le Play Store, il faudra créer une clé de signature et générer un AAB signé.

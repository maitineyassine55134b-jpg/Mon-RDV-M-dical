# Mon RDV Médical

Application web progressive (PWA) de prise de rendez-vous médicaux — projet **DES 101 / M108**, Yassine Maitine (2025/2026).
HTML + CSS + JavaScript pur, **sans build ni dépendance à installer** : elle fonctionne telle quelle sur GitHub Pages.

> Parce que vous êtes au cœur de tout, nous avons rapproché la guérison.

## Fonctionnalités (parcours du « User flow »)
| Étape du user flow | Dans l'application |
|---|---|
| Logo → Page d'accueil → Commencer | Splash, écran d'accueil, « Commencer » |
| Se connecter / S'inscrire / Visiteur | Comptes locaux (mot de passe haché SHA‑256), validation, réessai en cas d'erreur, mode visiteur, mot de passe oublié |
| Page principale : médecin ou cabinet ? | Onglets Médecins / Cabinets, recherche en direct, filtres (spécialité, ville, Top, disponibles), tri (note, prix, distance), pagination |
| Recherche par Map / nom de cabinet | Carte interactive OpenStreetMap (Leaflet), « Autour de moi » (géolocalisation) |
| Voir le profil du médecin | Photo, note (modifiable), patients, expérience, tarif, langues, lieu + itinéraire, appel |
| Formulaire de réservation | Nom, téléphone (format marocain), e‑mail, date, créneaux **réellement bloqués** s'ils sont déjà pris, motif, Annuler |
| Enregistrer sur le calendrier avant de payer | Export `.ics` (avec rappel 24 h) |
| Voulez‑vous terminer le paiement ? | Confirmation à la sortie de la page de paiement |
| Méthodes de paiement | Carte (validation Luhn, expiration, CVV), Mobile Money, virement (référence + RIB) — **paiement simulé** |
| Confirmation + reçu PDF | Page « Confirmé ! », reçu PDF (jsPDF) |
| Calendrier | Mois/année, pastilles par statut, filtre par jour, détail, modification, annulation |
| Notifications (app / médecin / cabinet) | Confirmation, paiement, rappel la veille, message du cabinet, annulation, nouveau créneau ; badge, lu/non lu, alertes navigateur |
| Profil | Statistiques, historique, édition (nom, téléphone, photo), sécurité (mot de passe, export, suppression), support, déconnexion |
| Création de compte depuis le mode visiteur | Les rendez-vous du visiteur sont transférés au nouveau compte |

**Données :** 45 médecins + 4 cabinets (profils de démonstration, coordonnées approximatives).
Les 5 médecins des maquettes gardent leurs photos ; les 40 autres ont un portrait illustré généré dans le style de la charte.

## Identité
Logo vectoriel officiel extrait de la charte (`assets/logo.svg`, `assets/logo-mark.svg`) · couleurs `#009fe3` `#2657a3` `#009640` `#e34511` `#e2b709` · Montserrat / Open Sans · icônes SVG (aucun emoji).

## Structure
```
index.html          ← application AUTONOME (CSS, JS et images intégrés) : c'est le seul fichier indispensable
manifest.webmanifest, sw.js, assets/   ← optionnels : installation sur téléphone + mode hors ligne
src/                ← sources lisibles (style.css, data.js, app.js, template.html)
build.py            ← régénère index.html après modification des sources : python3 build.py
```

## Lancer en local
```bash
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```
(double-cliquer sur `index.html` fonctionne aussi ; l’installation sur téléphone et le mode hors ligne nécessitent http(s)).

## Publier sur GitHub Pages
1. Créer un dépôt, y envoyer tout le contenu de ce dossier (`index.html` à la racine).
2. *Settings → Pages → Deploy from a branch → `main` / root → Save*.
3. L'application est disponible sur `https://<utilisateur>.github.io/<depot>/` et peut être **installée** sur le téléphone (« Ajouter à l'écran d'accueil »).

## Remplacer les portraits par de vraies photos
Déposer la photo (carrée, ≥ 160 px) dans `assets/img/`, ajouter `img:'assets/img/d12.jpg'` au médecin dans `src/data.js`, puis lancer `python3 build.py`.

## Limites à connaître
- **Pas de serveur** : comptes, rendez‑vous et notifications sont stockés dans le navigateur (`localStorage`) de l'appareil. Pour une vraie mise en production multi‑utilisateurs, il faudra un backend (authentification, base de données, passerelle de paiement CMI/Stripe, e‑mails/SMS).
- Le paiement est une **simulation** : aucune donnée bancaire n'est envoyée ni conservée.
- Adresse support à remplacer dans `src/data.js` (`SUPPORT_EMAIL`).

## Application Android (APK) via GitHub
Le dépôt contient un workflow **GitHub Actions** (`.github/workflows/android.yml`) basé sur Capacitor :
1. Envoyer tout le dossier sur GitHub (branche `main`).
2. Onglet **Actions** → « Build Android APK » (il démarre tout seul à chaque *push*, ou bouton *Run workflow*).
3. À la fin (≈ 5-8 min) télécharger l'artefact **mon-rdv-medical-apk** → `app-debug.apk`.
4. Copier l'APK sur le téléphone, autoriser « sources inconnues », installer.

Pour publier sur Google Play il faudra une version *release* signée (keystore) et un compte développeur Google (25 USD, une fois).
Limites de la version Android : les téléchargements du reçu PDF et du fichier `.ics` ne fonctionnent pas encore dans la WebView (il faut les plugins Capacitor *Filesystem* + *Share*).

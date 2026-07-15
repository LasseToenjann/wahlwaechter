"use strict";
/* =========================================================================
   WAHLWÄCHTER – Spieldaten
   Alle Inhalte sind fiktiv. Parteien, Personen und Medien sind erfunden.
   Fiktive Parteien: Bündnis Morgen (BM), Soziale Mitte (SM),
   Freie Zukunftspartei (FZP), Heimatliste (HL)
   ========================================================================= */

const DATA = {

  scoring: {
    base: 100,
    timeBonusPerSec: 4,
    sleuthBonus: 40,          // richtig mit <= 1 Energie
    sleuthMaxEnergy: 1,
    streakBonus: 20,
    streakCap: 5,
    energyLeftBonus: 10,      // pro Restenergie am Wochenende
    dmgFakeApproved: 12,      // Fake freigegeben
    dmgRealFlagged: 6,        // Echtes gekennzeichnet
    dmgTimeout: 8,
    finalMultiplier: (index) => 0.5 + Math.max(0, index) / 200,
    bossPointsBase: 200,      // Boss/Showdown: Basis, x2-Logik im Code
  },

  weeks: [
    { nr: 1, cases: 6, energy: 14, timer: 45, title: "Woche 1 – Erste Wellen",
      intro: "HYDRA testet die Abwehr. Die ersten gemeldeten Beiträge treffen ein. Noch sind die Fälschungen nachlässig – wer prüft, findet Spuren." },
    { nr: 2, cases: 6, energy: 12, timer: 40, title: "Woche 2 – Das Netz zieht sich zu",
      intro: "HYDRA lernt. Gekaufte Alt-Accounts, gefälschte Impressen, echte Videos im falschen Kontext. Einzelne Indizien reichen nicht mehr." },
    { nr: 3, cases: 6, energy: 10, timer: 35, title: "Woche 3 – Endspiel um die Wahrheit",
      intro: "Letzte Woche vor der Wahl. HYDRAs Fälschungen sind fast perfekt – einzelne Beweiskanäle wurden gezielt gesäubert. Nur die Kombination der Indizien trägt noch." },
  ],

  ranks: [
    { min: 3600, name: "Legende der Wahlintegrität", icon: "🏛️" },
    { min: 2900, name: "HYDRA-Schreck", icon: "🛡️" },
    { min: 2200, name: "Leitstellen-Profi", icon: "🎖️" },
    { min: 1500, name: "Faktenjäger:in", icon: "🔎" },
    { min: 800,  name: "Junior-Analyst:in", icon: "📋" },
    { min: 0,    name: "Praktikant:in der Prüfstelle", icon: "☕" },
  ],

  tools: [
    { id: "forensik", icon: "🔬", name: "Medienforensik", desc: "Artefakte, Schatten, Lippensynchronität, Metadaten" },
    { id: "quelle",   icon: "📡", name: "Quellen-Check",  desc: "Domain-Alter, Impressum, existiert die Redaktion?" },
    { id: "account",  icon: "🤖", name: "Account-Analyse", desc: "Alter, Posting-Muster, Follower-Struktur" },
    { id: "fakten",   icon: "🧭", name: "Fakten-Abgleich", desc: "Berichten unabhängige Quellen dasselbe?" },
  ],

  /* =======================================================================
     FALL-DOSSIERS
     evidence: Text pro Kanal, null = Werkzeug nicht anwendbar (kein Medium).
     Die Oberfläche (text) verrät NIE die Wahrheit – Indizien nur in evidence.
     ======================================================================= */
  cases: [

    /* ---------------------------- WOCHE 1 ---------------------------- */
    {
      id: "w1_deepfake_kaya", week: 1, isFake: true, category: "Deepfake-Video",
      medium: "video", source: "Video-Plattform", author: "PolitikInsider32", handle: "@politikinsider32",
      reach: "214.000 Aufrufe · 8.900 geteilt",
      title: "„Kaya verhöhnt Rentner!“",
      text: "Ausschnitt aus einer Wahlkampfrede: Spitzenkandidatin Elif Kaya (Bündnis Morgen) sagt in die Kamera: „Wer über 70 ist, sollte über die Zukunft ehrlicherweise nicht mehr abstimmen dürfen.“ Das Publikum applaudiert.",
      evidence: {
        forensik: "Bei Zischlauten laufen Lippen und Ton minimal auseinander. Kayas Ohrring verschwindet in zwei Frames. Die Halspartie wirkt bei Kopfdrehung leicht verwaschen.",
        quelle:   "Der Kanal existiert seit 3 Wochen und hat kein Impressum. Das Video nennt keine Quelle für den Auftritt – kein Datum, kein Ort.",
        account:  "Der Account postet ausschließlich Anti-BM-Inhalte, bis zu 40-mal am Tag, auch nachts um 3 Uhr im Minutentakt.",
        fakten:   "Die Original-Rede vom Parteitag ist vollständig online: Die Passage existiert – aber Kaya zitiert dort einen Kommentar, den sie anschließend scharf kritisiert. Der Ausschnitt schneidet die Einordnung weg und legt die Worte per KI-Stimme neu.",
      },
      resolution: "KI-FAKE. Ein klassischer Deepfake mit Kontextschnitt: echtes Setting, manipulierte Tonspur, weggeschnittene Einordnung. Verräterisch: Lippensynchronität, flackernde Details (Ohrring!) und der Abgleich mit der Originalrede. Solche „Cheapfakes+“ sind vor Wahlen weltweit dokumentiert."
    },
    {
      id: "w1_fakezeitung_wahllokal", week: 1, isFake: true, category: "Fake-Nachrichtenportal",
      medium: "artikel", source: "Nachrichtenportal", author: "Rheinbach Kurier", handle: "rheinbach-kurier.net",
      reach: "56.000 Leser · Push-Meldung",
      title: "„Wahllokale schließen wegen Personalmangel schon um 14 Uhr“",
      text: "Der Kreiswahlleiter habe intern bestätigt, dass wegen fehlender Wahlhelfer zahlreiche Wahllokale im Kreis am Wahlsonntag nur bis 14 Uhr öffnen. Betroffene sollten „notfalls auf die Stimmabgabe verzichten“.",
      evidence: {
        forensik: "Das Aufmacherbild ist ein Stockfoto eines Wahllokals aus einem anderen Bundesland; die Bildunterschrift behauptet, es sei „das Wahllokal Süd“.",
        quelle:   "Die Domain wurde vor 11 Tagen registriert. Das Impressum nennt eine Adresse, unter der sich ein Parkhaus befindet. Eine Redaktion „Rheinbach Kurier“ ist nirgends verzeichnet.",
        account:  "Die zugehörigen Social-Media-Konten wurden alle am selben Tag erstellt und folgen einander gegenseitig.",
        fakten:   "Die Kreiswahlleitung dementiert öffentlich. Öffnungszeiten der Wahllokale (8–18 Uhr) sind gesetzlich festgelegt und können nicht lokal verkürzt werden.",
      },
      resolution: "KI-FAKE. Wahlunterdrückung („voter suppression“): Falsche Informationen über den Wahlablauf sollen Menschen vom Wählen abhalten. Frisch registrierte Domain, gefälschtes Impressum, dementierende Behörde – der Quellen-Check entlarvt das Portal in Sekunden."
    },
    {
      id: "w1_botpfleger", week: 1, isFake: true, category: "Botnetz-Kampagne",
      medium: "post", source: "Kurznachrichtendienst", author: "Markus T.", handle: "@markus_pflege_88",
      reach: "31.000 Likes · Trend #Stationssterben",
      title: "Beitrag eines „Krankenpflegers“",
      text: "„Ich arbeite seit 12 Jahren als Pfleger. Was keiner sagt: Die Soziale Mitte plant nach der Wahl die Schließung von 40 % aller Stationen. Wir wurden intern schon informiert. Erzählt es weiter, bevor es gelöscht wird!“",
      evidence: {
        forensik: null,
        quelle:   "Der Beitrag verlinkt nichts – keine Quelle, kein Dokument, nur die Behauptung „intern informiert“.",
        account:  "Der Account ist 6 Wochen alt. Auffällig: 412 nahezu wortgleiche Beiträge anderer „Pfleger“, „Ärztinnen“ und „Sanitäter“ – alle Konten im Februar erstellt, alle mit KI-generiert wirkenden Profilbildern, gegenseitige Verstärkung im Minutentakt.",
        fakten:   "Es existiert kein Beschluss, kein Leak, kein Bericht. Die Zahl „40 %“ taucht ausschließlich in dieser Kampagne auf. Die Partei dementiert, unabhängige Gesundheitsjournalisten finden nichts.",
      },
      resolution: "KI-FAKE. Ein Botnetz simuliert eine „Graswurzel-Bewegung“ (Astroturfing): Hunderte erfundene Berufs-Personas streuen dieselbe Behauptung. Erkennbar an der Account-Analyse – Erstellungswellen, identische Muster, KI-Profilbilder. Der einzelne Post wirkt völlig glaubwürdig."
    },
    {
      id: "w1_targeting_zweitstimme", week: 1, isFake: true, category: "Microtargeting-Anzeige",
      medium: "anzeige", source: "Gesponserte Anzeige", author: "Bürger für Ehrlichkeit e.V.", handle: "Gesponsert",
      reach: "Zielgruppe: Erstwähler 18–24, Stadtrand",
      title: "„Dein Wahlkreis ist längst entschieden“",
      text: "„Statistisch steht der Sieger in deinem Wahlkreis seit 20 Jahren fest. Deine Stimme ändert daran nichts. Spar dir den Weg – dein Sonntag gehört dir.“ Dazu ein Bild entspannter Jugendlicher am See.",
      evidence: {
        forensik: "Das Bild ist KI-generiert: Eine Person am Bildrand hat sechs Finger, die Spiegelung im Wasser passt nicht zur Personengruppe.",
        quelle:   "Ein Verein „Bürger für Ehrlichkeit e.V.“ ist in keinem Vereinsregister zu finden. Die Anzeige nennt keine Verantwortlichen.",
        account:  "Das Werbekonto schaltet parallel Dutzende Varianten derselben Botschaft, jeweils zugeschnitten auf junge Wähler in bestimmten Stadtteilen.",
        fakten:   "Sachlich falsch: Mit der Zweitstimme zählt jede Stimme bundesweit für die Sitzverteilung – unabhängig vom Wahlkreisergebnis.",
      },
      resolution: "KI-FAKE. Demobilisierungs-Kampagne per Microtargeting: Eine erfundene Organisation redet gezielt Erstwählern ein, ihre Stimme sei wertlos – sachlich falsch. Nicht registrierter Absender + faktisch falsche Kernaussage + KI-Bild = eindeutig."
    },
    {
      id: "w1_kiartikel_studie", week: 1, isFake: true, category: "KI-generierter Artikel",
      medium: "artikel", source: "Nachrichtenportal", author: "energie-klartext.info", handle: "Redaktion Klartext",
      reach: "89.000 Leser",
      title: "„Geheime Studie: Strompreis verdreifacht sich nach der Wahl“",
      text: "Eine „unter Verschluss gehaltene Studie der Universität Bremerhaven“ belege: Setzt die nächste Regierung die Pläne der FZP um, verdreifache sich der Strompreis bis 2034. Zitiert wird „Prof. Dr. H. Lindqvist, Lehrstuhl für Energieökonomie“.",
      evidence: {
        forensik: "Das Porträtfoto des zitierten Professors zeigt bei Vergrößerung verschmolzene Brillenbügel und asymmetrische Pupillen – typische Merkmale von KI-Gesichtern.",
        quelle:   "Die Seite produziert täglich 60+ Artikel ohne Autorennamen in auffällig gleichförmigem Stil. Das Impressum führt in ein Bürodienstleistungszentrum im Ausland.",
        account:  "Verbreitet wird der Artikel fast ausschließlich von einem Ring aus 30 Accounts, die sonst Kryptowährungs-Spam posten.",
        fakten:   "Es gibt keine Universität Bremerhaven (nur eine Hochschule, ohne diesen Lehrstuhl). Ein „Prof. Lindqvist“ ist in keinem Vorlesungsverzeichnis, keiner Publikationsdatenbank zu finden. Die Studie existiert nicht.",
      },
      resolution: "KI-FAKE. Ein KI-Contentportal erfindet Studie, Universität und Professor gleich mit. Der Fakten-Abgleich (existiert die Institution? die Person? die Studie?) ist hier der Königsweg – erfundene Autoritäten halten keiner Überprüfung stand."
    },
    {
      id: "w1_echt_warnung", week: 1, isFake: false, category: "Echte Nachricht",
      medium: "artikel", source: "Nachrichtenportal", author: "Westkurier", handle: "westkurier.de",
      reach: "310.000 Leser",
      title: "„Bundeswahlleiterin warnt vor gefälschten Wahlbenachrichtigungen“",
      text: "Die Bundeswahlleiterin warnt vor Briefen mit falschen Angaben zum Wahllokal, die derzeit in mehreren Städten auftauchen. Wer unsicher sei, solle die Angaben auf der offiziellen Website der Gemeinde prüfen.",
      evidence: {
        forensik: "Das Artikelbild zeigt eine echte Pressekonferenz; Metadaten und Bildagentur-Nachweis sind vorhanden und konsistent.",
        quelle:   "Der Westkurier erscheint seit 1952, vollständiges Impressum, presserechtlich Verantwortliche namentlich genannt.",
        account:  "Verifiziertes Konto mit langjähriger, thematisch breiter Posting-Historie.",
        fakten:   "Die Warnung steht wortgleich in der offiziellen Pressemitteilung der Bundeswahlleiterin; mehrere unabhängige Medien berichten übereinstimmend.",
      },
      resolution: "ECHT. Eine reguläre Meldung eines etablierten Mediums, von der Originalquelle bestätigt. Übrigens: Dass über Fälschungen berichtet wird, macht die Meldung selbst nicht verdächtig – auch Warnungen vor Desinformation sind Nachrichten."
    },
    {
      id: "w1_echt_erstwaehlerin", week: 1, isFake: false, category: "Echter Bürgerbeitrag",
      medium: "post", source: "Foto-Plattform", author: "Lea", handle: "@lea.zwanzig32",
      reach: "241 Likes",
      title: "Erstwählerin mit Frage",
      text: "„Meine allererste Wahlbenachrichtigung!! 😍 Frage an alle: Kann ich einfach so ins Wahllokal oder muss ich vorher noch was beantragen? Bin komplett neu in dem Thema 😅 #Erstwahl“ – dazu ein Foto des Briefs auf einem Schreibtisch.",
      evidence: {
        forensik: "Handyfoto mit stimmigen Metadaten und natürlichem Schattenwurf; persönliche Daten auf dem Brief sind unkenntlich gemacht.",
        quelle:   "Kein Link, keine Behauptung – eine persönliche Frage.",
        account:  "Der Account ist erst 3 Wochen alt – aber: Klassenfahrt-Fotos, Kommentare von Mitschülern, unregelmäßige, menschliche Aktivität zu Tageszeiten.",
        fakten:   "Der Inhalt stellt keine Tatsachenbehauptung auf, die zu prüfen wäre. Die Frage ist sachlich sinnvoll (Antwort: Wahlbenachrichtigung oder Ausweis genügt).",
      },
      resolution: "ECHT. Falle umgangen: Ein junger Account ist allein KEIN Fake-Beweis – Erstwähler sind naturgemäß neu auf Plattformen. Entscheidend ist das Verhaltensmuster: echtes soziales Umfeld, menschlicher Rhythmus, keine Kampagnen-Botschaft. Übersperren würde hier eine echte Bürgerin treffen (Index-Schaden!)."
    },
    {
      id: "w1_satire_stoerfisch", week: 1, isFake: false, category: "Satire (legitim)",
      medium: "artikel", source: "Satire-Magazin", author: "Der Störfisch", handle: "stoerfisch.de",
      reach: "120.000 geteilt",
      title: "„Heimatliste verspricht, alle Wahlversprechen noch am Wahlabend zu brechen“",
      text: "„Ehrlichkeit ist unser Markenkern“, zitiert das Magazin einen fiktiven Sprecher. „Warum bis zur Regierungsbildung warten? Wir enttäuschen unsere Wähler ohne Umwege.“",
      evidence: {
        forensik: "Das Bild ist eine offensichtlich gestellte Fotomontage – im Stil des Magazins, mit sichtbarem Augenzwinkern.",
        quelle:   "„Der Störfisch“ ist ein seit 2011 bekanntes, klar als Satire gekennzeichnetes Magazin. Im Seitenfuß jeder Seite: „Satire. Alle Meldungen frei erfunden.“",
        account:  "Verifizierter Account, in der Biografie als Satire ausgewiesen.",
        fakten:   "Kein Medium behandelt die Meldung als real; sie ist als Witz gerahmt und wird auch so verstanden.",
      },
      resolution: "ECHT (LEGITIM). Satire ist keine Desinformation – sie ist von der Meinungs- und Kunstfreiheit geschützt und als Satire erkennbar gekennzeichnet. Eine Prüfstelle, die Satire sperrt, beschädigt die Demokratie, die sie schützen soll. (Grenzfall wird es erst, wenn Satire-Inhalte ohne Kennzeichnung als echt weiterverbreitet werden.)"
    },
    {
      id: "w1_echt_dienstwagen", week: 1, isFake: false, category: "Unbequeme, aber wahre Recherche",
      medium: "artikel", source: "Nachrichtenportal", author: "Recherchebüro Kontrast", handle: "kontrast-recherche.de",
      reach: "480.000 Leser",
      title: "„Landesminister nutzte Dienstwagen für private Wahlkampf-Touren“",
      text: "Fahrtenbücher, die dem Recherchebüro vorliegen, zeigen 23 private Fahrten des Landesministers Brenner (Heimatliste) auf Staatskosten. Brenner nennt den Bericht „reine Fake News einer gekauften Kampagne“.",
      evidence: {
        forensik: "Die veröffentlichten Fahrtenbuch-Scans zeigen konsistente Stempel, fortlaufende Seitenzahlen und plausible Kilometerstände.",
        quelle:   "Das Recherchebüro arbeitet seit Jahren mit namhaften Medien zusammen, Impressum und Finanzierung sind offengelegt.",
        account:  "Langjährige Historie mit Recherchen zu Parteien ALLER Lager – kein einseitiges Muster.",
        fakten:   "Zwei überregionale Zeitungen haben die Dokumente unabhängig geprüft und bestätigen die Kernaussagen. Die Staatskanzlei kündigt eine „interne Prüfung“ an – dementiert die Dokumente aber nicht.",
      },
      resolution: "ECHT. Die härteste Falle der Woche: Ein Politiker ruft „Fake News“ – das macht eine Recherche nicht falsch. Wer hier kennzeichnet, macht die Prüfstelle zum Zensurinstrument der Mächtigen. Genau dafür wird der Begriff „Fake News“ oft missbraucht: um wahre, unbequeme Berichte zu diskreditieren."
    },
    {
      id: "w1_echt_podium", week: 1, isFake: false, category: "Echter Bürgerbeitrag",
      medium: "post", source: "Kurznachrichtendienst", author: "Stadtjugendring Falkenau", handle: "@sjr_falkenau",
      reach: "1.800 Likes",
      title: "Einladung zur Podiumsdiskussion",
      text: "„Donnerstag, 19 Uhr, Stadthalle: Alle vier Direktkandidat:innen stellen sich euren Fragen! Eintritt frei, Fragen könnt ihr vorab per DM einreichen. Kommt vorbei – es geht um eure Zukunft! 🗳️“",
      evidence: {
        forensik: "Das Veranstaltungsplakat im Anhang nennt Ort, Zeit und Veranstalter; Layout identisch mit früheren Plakaten des Vereins.",
        quelle:   "Der Stadtjugendring ist als eingetragener Verein im Register zu finden; die Veranstaltung steht im offiziellen Stadtkalender.",
        account:  "Konto seit 2019 aktiv, postet über Jugendtreffs, Ferienprogramme und lokale Termine.",
        fakten:   "Die Stadthalle bestätigt die Buchung auf ihrer Website; die Lokalzeitung kündigt die Veranstaltung ebenfalls an.",
      },
      resolution: "ECHT. Ein ganz normaler zivilgesellschaftlicher Beitrag – demokratische Teilhabe in Reinform. Solche Fälle kosten kluge Prüfer:innen fast keine Energie: Ein einziger Quellen-Check genügt hier."
    },

    {
      id: "w1_urnenbild", week: 1, isFake: true, category: "KI-generiertes Bild",
      medium: "bild", source: "Kurznachrichtendienst", author: "WutbürgerNews", handle: "@wutbuerger_news",
      reach: "312.000 geteilt · Trend #Wahlchaos",
      title: "„Brennende Wahlurnen in Neustadt!“",
      text: "Ein dramatisches Foto zeigt brennende Wahlurnen vor einem Rathaus, davor rennende Menschen. „Es geht schon los – und die Medien SCHWEIGEN!“",
      evidence: {
        forensik: "Das Feuer wirft keinen Schatten, die Rathausuhr zeigt zwei verschiedene Zeiten und eine rennende Person hat drei Beine – klassische KI-Bildfehler.",
        quelle:   "Kein Ort, kein Datum, kein Fotografen-Name. Die Bildersuche findet das Motiv nirgendwo sonst – für ein „Großereignis“ unmöglich.",
        account:  "Der Account postet im Stundentakt Empörungs-Content zu wechselnden Themen, immer mit „…und die Medien schweigen!“",
        fakten:   "Weder Polizei noch Feuerwehr in Neustadt haben Einsätze gemeldet. Kein einziges Lokalmedium berichtet. Wahlurnen stehen zudem erst am Wahltag in Wahllokalen – nicht vorm Rathaus.",
      },
      resolution: "KI-FAKE. Emotionale Schock-Bilder sind der schnellste Weg zu Reichweite. Die Logikfrage entlarvt ihn ohne jede Technik: Warum stünden volle Wahlurnen Tage vor der Wahl auf dem Rathausplatz? Wut ist ein Werkzeug – wer sie fühlt, sollte doppelt prüfen."
    },
    {
      id: "w1_gewinnspiel", week: 1, isFake: true, category: "Phishing-Kampagne",
      medium: "anzeige", source: "Gesponserte Anzeige", author: "Wahl-Bonus 2032", handle: "Gesponsert",
      reach: "Zielgruppe: 18–29",
      title: "„Wählen & gewinnen: 500 € Prämie“",
      text: "„Die Bundesregierung belohnt Erstwähler! Registriere dich mit Name, Adresse und Ausweisnummer auf wahl-bonus2032.de und sichere dir nach der Stimmabgabe deine 500-€-Prämie.“",
      evidence: {
        forensik: "Das „Bundesadler“-Logo ist leicht verzerrt und spiegelverkehrt – ein KI-Nachbau des Originals.",
        quelle:   "Die Domain wahl-bonus2032.de wurde vor 6 Tagen anonym registriert und hat kein Impressum. Offizielle Stellen nutzen .bund.de-Adressen.",
        account:  "Das Werbekonto existiert seit einer Woche und schaltet nur diese eine Kampagne.",
        fakten:   "Es gibt keine staatliche Wahlprämie – Stimmenkauf wäre sogar strafbar (§ 108b StGB). Die Bundeswahlleiterin warnt vor genau solchen Datensammel-Maschen.",
      },
      resolution: "KI-FAKE (Phishing). Hier geht es nicht mal um Meinungen, sondern um deine Daten: Name, Adresse und Ausweisnummer sind Gold für Identitätsdiebstahl. Merksatz: Der Staat belohnt Wählen nie mit Geld – und fragt nie per Werbeanzeige nach Ausweisdaten."
    },
    {
      id: "w1_zitatkachel", week: 1, isFake: true, category: "Gefälschtes Zitat-Meme",
      medium: "bild", source: "Foto-Plattform", author: "PolitikZitate", handle: "@politik_zitate_de",
      reach: "178.000 geteilt",
      title: "Zitatkachel: „Steuern rauf für alle unter 30“",
      text: "Eine professionell gestaltete Kachel mit Foto von Dr. Sandmann und dem Zitat: „Wer unter 30 ist, hat vom Leben noch nichts geleistet – da sind höhere Steuern nur fair.“ Quelle: „Wahlkampfrede, 3. Juli“.",
      evidence: {
        forensik: "Foto und Layout sind sauber – Zitatkacheln lassen sich in Sekunden fälschen, Forensik hilft hier kaum.",
        quelle:   "Die Kachel nennt „Wahlkampfrede, 3. Juli“ – aber keinen Ort und kein überprüfbares Video.",
        account:  "Der Account verbreitet Kacheln gegen alle Parteien – Hauptsache Empörung, gemischtes Publikum.",
        fakten:   "Die komplette Rede vom 3. Juli ist online: Das Zitat fällt nie. Kein Medium hat es je gemeldet – bei so einem Satz undenkbar.",
      },
      resolution: "KI-FAKE. Das gefälschte Zitat-Meme ist die billigste und häufigste Desinformationsform überhaupt – kein Deepfake nötig, nur ein Bildeditor. Goldene Regel: Ein skandalöses Zitat ohne Video- oder Primärquelle ist erst mal keins."
    },
    {
      id: "w1_echt_wahlhelfer", week: 1, isFake: false, category: "Echter Behörden-Aufruf",
      medium: "post", source: "Kurznachrichtendienst", author: "Stadt Falkenau", handle: "@stadt_falkenau",
      reach: "9.400 geteilt",
      title: "„Wahlhelfer:innen gesucht – 50 € Erfrischungsgeld“",
      text: "Für den Wahlsonntag suchen wir noch 120 Wahlhelfer:innen! Ab 16 Jahren mit deutscher Staatsbürgerschaft möglich, es gibt 50 € Erfrischungsgeld und vorab eine Schulung. Anmeldung: stadt-falkenau.de/wahlhilfe",
      evidence: {
        forensik: "Grafik im bekannten Stadt-Design mit Wappen, identisch zur Website.",
        quelle:   "Verifiziertes Stadtkonto; der Link führt auf die offizielle Stadt-Domain mit Impressum.",
        account:  "Langjähriges Behördenkonto mit Bürgerinfos aller Art.",
        fakten:   "„Erfrischungsgeld“ für Wahlhelfer ist gesetzlich vorgesehen und völlig normal – im Gegensatz zu „Wahlprämien“ für Wähler. Die Lokalzeitung berichtet über den Helfermangel.",
      },
      resolution: "ECHT. Nicht verwechseln: Erfrischungsgeld für ehrenamtliche WahlHELFER ist legal und üblich – eine „Prämie“ für die Stimmabgabe wäre Stimmenkauf. Wer vorhin beim Phishing-Gewinnspiel aufgepasst hat, erkennt hier den feinen, aber entscheidenden Unterschied."
    },
    {
      id: "w1_echt_clickbait", week: 1, isFake: false, category: "Clickbait, aber echt",
      medium: "artikel", source: "Nachrichtenportal", author: "Nachrichten24", handle: "nachrichten24.de",
      reach: "690.000 Klicks",
      title: "„Kaya rechnet ab: ‚Dann sollen sie mich doch verklagen‘“",
      text: "Reißerische Schlagzeile, aber der Artikel dokumentiert sauber ein echtes TV-Interview: Kaya verteidigt ihren Mietendeckel-Plan gegen Verbandskritik und sagt den zitierten Satz wörtlich – das eingebettete Video zeigt die Szene.",
      evidence: {
        forensik: "Das eingebettete Interview stammt nachweislich aus der gestrigen Talkshow; Ton und Bild unverändert.",
        quelle:   "Etabliertes Portal mit Impressum; das Zitat ist mit Video belegt statt nur behauptet.",
        account:  "Normales Redaktionsverhalten.",
        fakten:   "Der Sender hat die komplette Sendung in der Mediathek; das Zitat fällt bei Minute 34 im beschriebenen Kontext.",
      },
      resolution: "ECHT. Clickbait ist nervig, aber nicht automatisch falsch: Die Schlagzeile übertreibt den Ton, doch Zitat und Kontext stimmen und sind mit Primärquelle belegt. Unterscheide schlechten Stil von Desinformation – gekennzeichnet wird nur Letzteres."
    },
    {
      id: "w1_echt_erklaervideo", week: 1, isFake: false, category: "Echtes Erklärvideo",
      medium: "video", source: "Video-Plattform", author: "Lina erklärt's", handle: "@lina.erklaert",
      reach: "89.000 Aufrufe",
      title: "„Erststimme, Zweitstimme – in 60 Sekunden“",
      text: "Ein schnell geschnittenes Hochformat-Video: Eine Studentin erklärt mit Sticker-Grafiken den Unterschied zwischen Erst- und Zweitstimme und warum die Zweitstimme über die Sitzverteilung entscheidet. „Quellen in der Beschreibung!“",
      evidence: {
        forensik: "Selbst gefilmtes Video mit konsistentem Licht; die Grafiken sind sichtbar selbst gebastelt.",
        quelle:   "In der Beschreibung verlinkt: Bundeszentrale für politische Bildung und Bundeswahlleiterin.",
        account:  "Seit 2 Jahren Erklärvideos zu Politik und Alltag, keine Parteinähe erkennbar.",
        fakten:   "Alle Aussagen decken sich mit den offiziellen Infos – die Zweitstimme ist tatsächlich die „wichtigere“ für die Machtverteilung.",
      },
      resolution: "ECHT. Junger Creator, lockerer Ton, Hochformat – nichts davon ist ein Fake-Signal. Entscheidend: korrekte Inhalte und offene Quellen. Solche Formate erreichen Erstwähler besser als jede Broschüre; sie zu sperren wäre ein Eigentor."
    },

    /* ---------------------------- WOCHE 2 ---------------------------- */
    {
      id: "w2_audioleak", week: 2, isFake: true, category: "Deepfake-Audio",
      medium: "video", source: "Kurznachrichtendienst", author: "LeaksDE", handle: "@leaks_de_2032",
      reach: "890.000 Aufrufe · #Sandmanngate",
      title: "„Geheimer Telefonmitschnitt“ von Dr. Sandmann",
      text: "Ein angeblich geleaktes Telefonat: Die Stimme von Spitzenkandidat Dr. Robert Sandmann (Soziale Mitte) sagt: „Nach der Wahl kassieren wir das Bürgergeld sofort – aber das erzählen wir denen natürlich erst hinterher.“ Dazu ein Standbild seines Porträts.",
      evidence: {
        forensik: "Die Stimmanalyse zeigt unnatürlich gleichmäßige Atempausen und fehlende Raumakustik – als wäre jede Silbe einzeln erzeugt. Kein Hintergrundrauschen eines echten Telefonats.",
        quelle:   "„LeaksDE“ hat keinerlei Historie verifizierter Leaks; die Audiodatei wird ohne Herkunftsangabe verbreitet („uns zugespielt“).",
        account:  "Der Account wurde vor 4 Monaten gekauft umbenannt: Ältere Beiträge (noch im Cache auffindbar) bewarben Sportwetten.",
        fakten:   "Kein seriöses Medium konnte die Aufnahme verifizieren. Sandmanns Terminkalender belegt für den behaupteten Zeitpunkt einen Live-Fernsehauftritt.",
      },
      resolution: "KI-FAKE. Stimm-Klone brauchen heute nur Sekunden an Ausgangsmaterial. Verräterisch: sterile Akustik ohne Raumklang, ein Account mit gekaufter Historie und ein wasserdichtes Alibi im Fakten-Abgleich. Audio-Deepfakes gelten als gefährlichste Kategorie, weil visuelle Prüfung entfällt."
    },
    {
      id: "w2_dokument", week: 2, isFake: true, category: "Gefälschtes Dokument",
      medium: "bild", source: "Kurznachrichtendienst", author: "Insider Politik", handle: "@insider_politik",
      reach: "156.000 geteilt",
      title: "„Internes Strategiepapier“ des Bündnis Morgen",
      text: "Foto eines Papiers mit BM-Logo, Stempel „VERTRAULICH“: „Strategie 2032: Benzinpreis auf 4 € anheben, Kommunikation: verschleiern bis nach der Wahl.“ Der Post: „Das wollen die euch verschweigen!!“",
      evidence: {
        forensik: "Der Schriftsatz des „Dokuments“ nutzt eine Schriftart, die die Partei nie verwendet. Der Stempel ist pixelidentisch mit einem Stock-Stempelbild aus dem Netz. Das Papier wirft keinen Schatten aufs Foto – digital montiert.",
        quelle:   "Kein Originaldokument, keine weiteren Seiten, keine Metadaten – nur dieses eine Foto.",
        account:  "Der Account existiert seit 2 Jahren und postet gemischt – hier versagt die Account-Analyse als alleiniges Indiz.",
        fakten:   "Die Partei veröffentlicht ihr echtes Strategiepapier als Reaktion vollständig; die zitierte Passage existiert darin nicht. Faktenchecker stufen das Foto als Montage ein.",
      },
      resolution: "KI-FAKE. Gefälschte „Leaks“ als Foto sind billig produziert und schwer rückverfolgbar. Achtung: Der verbreitende Account wirkte unauffällig – ab jetzt reicht ein einzelner Beweiskanal oft nicht mehr. Forensik (Montage-Spuren) und Fakten-Abgleich haben den Fall entschieden."
    },
    {
      id: "w2_lokalnetz", week: 2, isFake: true, category: "KI-Lokalnews-Netzwerk",
      medium: "artikel", source: "Nachrichtenportal", author: "Falkenauer Morgenpost", handle: "falkenauer-morgenpost.de",
      reach: "44.000 Leser lokal",
      title: "„Flüchtlingsheim statt Schwimmbad: Stadtrat beschließt heimlich Umwidmung“",
      text: "Die Stadt habe „in nichtöffentlicher Sitzung“ beschlossen, das sanierungsbedürftige Freibad zu schließen und das Gelände umzuwidmen. „Die Bürger erfahren es erst nach der Wahl“, so der Artikel.",
      evidence: {
        forensik: "Das „Foto des Freibads“ zeigt bei genauem Hinsehen ein Bad mit Palmen im Hintergrund – KI-generiert nach der Beschreibung „deutsches Freibad“.",
        quelle:   "Das Impressum wirkt vollständig – ist aber wortgleich vom echten „Falkenauer Anzeiger“ kopiert, nur die Namen wurden getauscht. Die Domain ist 7 Wochen alt. Die Seite gehört zu einem Netz von 12 identisch aufgebauten „Lokalzeitungen“.",
        account:  "Artikel erscheinen rund um die Uhr im 20-Minuten-Takt, für eine „Lokalredaktion“ unmöglich.",
        fakten:   "Die Tagesordnungen des Stadtrats sind öffentlich: Eine solche Sitzung gab es nicht. Der echte Falkenauer Anzeiger berichtet nichts dergleichen.",
      },
      resolution: "KI-FAKE. „Pink-Slime“-Netzwerke: KI-generierte Pseudo-Lokalzeitungen kapern das Vertrauen in Lokaljournalismus – gerade weil dort niemand Konkurrenz-Berichterstattung erwartet. Das kopierte Impressum zeigt: HYDRA fälscht jetzt auch die Kanäle, die letzte Woche noch sichere Indizien waren."
    },
    {
      id: "w2_kontextfake", week: 2, isFake: true, category: "Echtes Video, falscher Kontext",
      medium: "video", source: "Video-Plattform", author: "WahrheitJetzt", handle: "@wahrheit_jetzt",
      reach: "620.000 Aufrufe",
      title: "„Gestern: Ausschreitungen bei FZP-Kundgebung!“",
      text: "Wackelige Handyaufnahmen zeigen Rangeleien zwischen Demonstranten und Polizei, Rauch, Sirenen. „Das war GESTERN in Neustadt – die Medien verschweigen es! Ist DAS die Partei der bürgerlichen Mitte?“",
      evidence: {
        forensik: "Das Video ist technisch echt – keine Generierungsartefakte. Aber: Die Bildersuche findet dasselbe Video, hochgeladen vor 6 Jahren, aufgenommen in einem anderen Land (Straßenschilder in anderer Sprache bei Bild 0:41).",
        quelle:   "Der Kanal gibt keine Quelle an und hat schon zweimal alte Videos als „aktuell“ verbreitet (dokumentiert von Faktencheckern).",
        account:  "Aggressives Posting-Muster, aber echte Follower – uneindeutig.",
        fakten:   "Polizei Neustadt: keine Einsätze bei der Kundgebung, die friedlich verlief. Lokale Medien mit Fotos vom echten (ruhigen) Ablauf.",
      },
      resolution: "KI-FAKE (Desinformation). Der gefährlichste Trick der Woche: ein völlig ECHTES Video im FALSCHEN Kontext. Die Medienforensik allein gibt hier grünes Licht – erst Rückwärtssuche und Fakten-Abgleich entlarven die Umdeutung. Merke: „Echt aufgenommen“ heißt nicht „wahr behauptet“."
    },
    {
      id: "w2_altaccount", week: 2, isFake: true, category: "Gekaufter Alt-Account",
      medium: "post", source: "Kurznachrichtendienst", author: "Heinz Berger", handle: "@heinz_berger_koeln",
      reach: "88.000 geteilt",
      title: "„Wahlbetrug bei der Briefwahl“",
      text: "„Mein Nachbar arbeitet im Briefwahlzentrum. Er hat gesehen, wie nachts säckeweise Stimmzettel für die Soziale Mitte NACHTRÄGLICH eingeworfen wurden. Er darf nichts sagen, sonst verliert er den Job. TEILEN, bevor es gelöscht wird!“",
      evidence: {
        forensik: null,
        quelle:   "Keine überprüfbare Angabe: kein Ort, kein Datum, kein Beleg – nur „mein Nachbar“.",
        account:  "Der Account ist 13 Jahre alt – wirkt vertrauenswürdig. Aber: Bis vor 5 Monaten postete er auf Portugiesisch über Angeln; dann Namenswechsel, Historie gelöscht, seither nur noch deutsche Politik. Klassisches Muster eines gekauften Accounts.",
        fakten:   "Briefwahlunterlagen werden erst am Wahlabend unter Aufsicht ausgezählt; „nachts eingeworfene Säcke“ sind organisatorisch unmöglich. Identische „Nachbar“-Geschichten kursieren wortgleich in fünf Städten.",
      },
      resolution: "KI-FAKE. Wahlbetrugs-Legenden sind der Kern moderner Desinformation: Sie zielen nicht auf eine Partei, sondern auf das Vertrauen in die Wahl SELBST. Der 13 Jahre alte Account war die Falle – Alter schützt nicht vor Kauf. Der Sprach- und Themenbruch in der Historie verrät ihn."
    },
    {
      id: "w2_echt_zweitaccount", week: 2, isFake: false, category: "Echter Beitrag (junger Account)",
      medium: "post", source: "Kurznachrichtendienst", author: "Nora Weidel", handle: "@nweidel_privat",
      reach: "5.400 Likes",
      title: "Journalistin mit privatem Zweitkonto",
      text: "„Hier mal privat, nicht als Redakteurin: Die Aggressivität, mit der in diesem Wahlkampf über Kolleginnen hergezogen wird, macht mir Angst. Wir machen Fehler, ja. Aber wir erfinden keine Nachrichten. Fragt uns. Wir antworten.“",
      evidence: {
        forensik: null,
        quelle:   "Kein Nachrichteninhalt – eine persönliche Einordnung, als solche gekennzeichnet („hier mal privat“).",
        account:  "Konto erst 2 Monate alt und wenig Follower – ABER: Das verifizierte Hauptkonto der Journalistin verlinkt in der Biografie auf genau dieses Privatkonto.",
        fakten:   "Die Person existiert, arbeitet nachweislich als Redakteurin; der Beitrag behauptet keine prüfbaren Falschtatsachen.",
      },
      resolution: "ECHT. Wieder die Account-Falle, eine Stufe subtiler: Ein junges Konto MIT verifizierbarer Anbindung (Querverweis vom Hauptkonto) ist legitim. Wer nur auf das Kontoalter schaut, hätte hier eine echte Journalistin zensiert – mitten in einer Debatte über Pressefreiheit."
    },
    {
      id: "w2_echt_wahlwerbung", week: 2, isFake: false, category: "Zugespitzte, aber legale Wahlwerbung",
      medium: "anzeige", source: "Gesponserte Anzeige", author: "Freie Zukunftspartei", handle: "Gesponsert · FZP",
      reach: "1,2 Mio. Einblendungen",
      title: "„Sandmann kann Kanzler. Aber kann er auch rechnen?“",
      text: "Anzeige der FZP: „Die Pläne der Sozialen Mitte kosten 80 Milliarden. Bezahlen sollst: du. Am 26. September: Zweitstimme FZP.“ Dazu ein unvorteilhaftes (aber echtes) Foto Sandmanns.",
      evidence: {
        forensik: "Das Foto ist ein echtes, unbearbeitetes Pressefoto – nur unvorteilhaft ausgewählt.",
        quelle:   "Die Anzeige trägt das vorgeschriebene Impressum der Partei; das Werbekonto ist offiziell verifiziert.",
        account:  "Offizielles Parteikonto, transparente Anzeigenbibliothek einsehbar.",
        fakten:   "Die „80 Milliarden“ sind eine Schätzung eines parteinahen Instituts – umstritten und am oberen Rand, aber als Position vertretbar und öffentlich diskutiert. Keine erfundene Tatsache.",
      },
      resolution: "ECHT (LEGITIM). Harte, zugespitzte Wahlwerbung ist erlaubt – auch mit unvorteilhaften Fotos und umstrittenen Zahlen, solange Absender transparent und Kernaussagen keine erfundenen Tatsachen sind. Eine Prüfstelle ist kein Schiedsrichter für guten Geschmack. Grenze: erfundene Fakten, verdeckte Absender."
    },
    {
      id: "w2_echt_tippfehler", week: 2, isFake: false, category: "Echter Beitrag eines Politikers",
      medium: "post", source: "Kurznachrichtendienst", author: "Carla Vogt", handle: "@carla_vogt_fzp",
      reach: "67.000 Likes · viel Spott",
      title: "Peinlicher, aber echter Post",
      text: "„Heute großartige Gespräche am Infostand in Görlitz! Die Menschen wollen Verängerung, keine leeren Versprechen. #FZP“ – Der Tippfehler („Verängerung“ statt „Veränderung“) wird tausendfach verspottet: „Nicht mal ihre Bots können schreiben!“",
      evidence: {
        forensik: "Das Foto vom Infostand ist echt; Wetter und Ort stimmen mit dem öffentlichen Wahlkampfkalender überein.",
        quelle:   "Verifiziertes offizielles Konto der Kandidatin.",
        account:  "Normales Muster eines Politikerkontos im Wahlkampf; der Beitrag wurde von ihrem Team später korrigiert nachgereicht.",
        fakten:   "Der Termin in Görlitz fand nachweislich statt (Lokalpresse mit eigenen Fotos).",
      },
      resolution: "ECHT. Menschen machen Tippfehler – KI-Texte sind meist fehlerfrei glatt. Die Spott-Welle („bestimmt ein Bot!“) zeigt eine wichtige Lektion: Auch die VERMUTUNG von KI wird als Waffe benutzt. Nicht jeder peinliche Beitrag ist gefälscht; ein Klick in den Wahlkampfkalender klärt alles."
    },
    {
      id: "w2_echt_studie", week: 2, isFake: false, category: "Unbequeme, aber echte Studie",
      medium: "artikel", source: "Nachrichtenportal", author: "Nachrichten24", handle: "nachrichten24.de",
      reach: "540.000 Leser",
      title: "„Studie: Jeder dritte Wahlkampf-Post über Kandidatin Kaya stammt aus koordinierten Quellen“",
      text: "Eine Untersuchung des (fiktiven) Instituts für digitale Öffentlichkeit hat 2,1 Mio. Beiträge analysiert: 34 % der negativen Beiträge über Elif Kaya zeigen Muster koordinierter Verbreitung. Das Institut warnt vor „industrialisierter Meinungsmache“.",
      evidence: {
        forensik: "Die Grafiken im Artikel stammen nachvollziehbar aus dem Studien-PDF; keine Manipulation erkennbar.",
        quelle:   "Nachrichten24 ist ein etabliertes Portal; das Institut existiert, ist universitär angebunden und legt Methodik + Rohdaten offen.",
        account:  "Der Artikel wird organisch von Wissenschaftlern und Journalisten geteilt – kein Kampagnenmuster.",
        fakten:   "Die Studie ist auf der Instituts-Website abrufbar; zwei Fachleute kommentieren die Methodik in anderen Medien als solide (mit üblichen Einschränkungen).",
      },
      resolution: "ECHT. Meta-Falle: Ein Artikel ÜBER Desinformation ist selbst keine Desinformation. Prüfbare Studie, offene Methodik, unabhängige Einordnung – freigeben. Wer hier sperrt (etwa weil das Ergebnis einer Seite nützt), unterdrückt Forschung."
    },

    {
      id: "w2_umfragegrafik", week: 2, isFake: true, category: "Manipulierte Grafik",
      medium: "bild", source: "Kurznachrichtendienst", author: "Zahlen-Check", handle: "@zahlencheck_de",
      reach: "203.000 geteilt",
      title: "„Die WAHREN Umfragezahlen“",
      text: "Eine Balkengrafik im Design des Instituts Demoskopie Rheintal zeigt die Heimatliste bei 34 % – „Die Zahlen, die das Fernsehen euch nicht zeigt. Original-Institut, ungeschönt!“",
      evidence: {
        forensik: "Die Balken passen nicht zu den daneben gedruckten Prozentwerten; die Achse beginnt versteckt bei 15 %. Schriftart weicht minimal vom echten IDR-Design ab.",
        quelle:   "Die Grafik verlinkt nicht auf das Institut. Auf idr-umfragen.de existiert diese Erhebung nicht.",
        account:  "Der Account existiert seit 5 Wochen und teilt ausschließlich „unterdrückte Zahlen“ – stets ohne Quelle.",
        fakten:   "Das IDR dementiert öffentlich und zeigt die echte Umfrage: Heimatliste 21 %. Die gefälschte Grafik nutzt das echte Layout mit erfundenen Werten.",
      },
      resolution: "KI-FAKE. Gefälschte Umfragegrafiken kapern die Glaubwürdigkeit echter Institute – Layout kopieren, Zahlen austauschen, fertig. Prüfroutine: Gibt es die Erhebung auf der Instituts-Website? Beginnt die Achse bei null? Passen Balken und Zahlen zusammen?"
    },
    {
      id: "w2_auslandsmedium", week: 2, isFake: true, category: "Erfundener Auslandsbericht",
      medium: "post", source: "Kurznachrichtendienst", author: "Global Voices DE", handle: "@globalvoices_de",
      reach: "94.000 geteilt",
      title: "„Sogar die New York Times berichtet!“",
      text: "„Während deutsche Medien schweigen, titelt die New York Times: ‚German Election Rigged Before First Vote Cast‘. Übersetzung im Thread. Wacht auf!“",
      evidence: {
        forensik: "Der angehängte „Screenshot“ des Artikels nutzt eine falsche Schriftart und das Layout der NYT von vor zehn Jahren.",
        quelle:   "Auf nytimes.com existiert weder die Schlagzeile noch der angebliche Autor. Die Suche in Pressedatenbanken: kein Treffer.",
        account:  "Das Konto übersetzt angebliche Auslandsartikel im Tagestakt – keiner davon ist auffindbar.",
        fakten:   "Kein internationales Medium berichtet dergleichen. Die Masche: Ein prestigeträchtiges Auslandsmedium wird als Kronzeuge erfunden, weil kaum jemand das Original nachschlägt.",
      },
      resolution: "KI-FAKE. „Ausländische Medien berichten, unsere schweigen“ ist ein Klassiker – die Fälschung versteckt sich hinter einer Sprachbarriere. Gegenmittel: 30 Sekunden auf der Original-Website suchen. Existiert der Artikel dort nicht, existiert er nicht."
    },
    {
      id: "w2_drohpost", week: 2, isFake: true, category: "Einschüchterungs-Kampagne",
      medium: "post", source: "Kurznachrichtendienst", author: "WahlWahrheit88", handle: "@wahlwahrheit88",
      reach: "41.000 geteilt · viele Meldungen",
      title: "„Wir kennen eure Gesichter“",
      text: "Ein Post zeigt KI-generierte „Fahndungsplakate“ mit Gesichtern angeblicher Wahlhelfer aus Falkenau: „Diese Leute zählen eure Stimmen. Wir beobachten jedes Wahllokal. Betrug wird Konsequenzen haben.“",
      evidence: {
        forensik: "Die „Fotos“ zeigen typische GAN-Artefakte: asymmetrische Ohren, verschwommene Hintergründe, identische Augenpartien bei drei Personen.",
        quelle:   "Keine der Personen ist real identifizierbar; die Namen darunter existieren im Melderegister nicht.",
        account:  "Frisch registriert, folgt niemandem, postet nur Drohinhalte zur Wahl.",
        fakten:   "Die Polizei ermittelt bereits wegen Bedrohung und Verstoßes gegen das Wahlrecht (Wählernötigung, § 108 StGB). Wahlbeobachtung ist legal – Einschüchterung nicht.",
      },
      resolution: "KI-FAKE (Einschüchterung). Ziel ist nicht Täuschung, sondern Angst: Wahlhelfer sollen abspringen, Wähler sich beobachtet fühlen. Solche Inhalte sind auch strafrechtlich relevant – hier ist Kennzeichnen Pflicht, nicht Zensur. (Übrigens der seltene Fall, in dem alle vier Beweiskanäle sofort anschlagen.)"
    },
    {
      id: "w2_echt_altvideo", week: 2, isFake: false, category: "Peinlich, aber echt & korrekt datiert",
      medium: "video", source: "Video-Plattform", author: "PolitArchiv", handle: "@politarchiv",
      reach: "520.000 Aufrufe",
      title: "„Brenner 2019: ‚Digitalisierung ist Modekram‘“",
      text: "Ein klar mit „Archiv, 2019“ beschrifteter Ausschnitt zeigt Kandidat Brenner, wie er Digitalpolitik als „Modekram, der in zwei Jahren keinen mehr interessiert“ abtut. Der Kanal fragt: „Sollte das im Wahlkampf 2032 eine Rolle spielen?“",
      evidence: {
        forensik: "Das Video ist unbearbeitet und stammt nachweislich aus einer Landtagsdebatte 2019 (Parlamentsarchiv, identischer Wortlaut im Protokoll).",
        quelle:   "Der Kanal archiviert Politikeraussagen aller Parteien und datiert sie sauber – auch hier deutlich sichtbar.",
        account:  "Seit Jahren aktiv, Quellenangabe unter jedem Video.",
        fakten:   "Aussage, Ort und Datum stimmen; Brenners Team bestätigt sie („Position von damals“). Der Kontext wird NICHT verfälscht – anders als beim Kontext-Fake ist das Alter hier transparent.",
      },
      resolution: "ECHT (LEGITIM). Der feine Unterschied zum Kontext-Fake aus Woche 2: Hier ist das alte Material klar als alt gekennzeichnet und korrekt eingeordnet. Politiker an frühere Aussagen zu erinnern ist Kernaufgabe demokratischer Öffentlichkeit – unangenehm, aber legitim."
    },
    {
      id: "w2_echt_ngo", week: 2, isFake: false, category: "Kritischer NGO-Bericht",
      medium: "artikel", source: "Nachrichtenportal", author: "Transparenzwacht e.V.", handle: "transparenzwacht.org",
      reach: "150.000 Leser",
      title: "„Bericht: Parteispenden-Lücken bei drei von vier Parteien“",
      text: "Die NGO dokumentiert, dass BM, FZP und Heimatliste Großspenden teils erst nach Monaten meldeten – nur die Soziale Mitte blieb im Rahmen. Alle Rohdaten und die Methodik sind als Download verfügbar.",
      evidence: {
        forensik: "Die Belege sind Screenshots aus dem offiziellen Bundestags-Spendenregister – nachprüfbar identisch mit dem Original.",
        quelle:   "Eingetragener Verein, seit 2019 aktiv, finanziert über offengelegte Kleinspenden; Impressum vollständig.",
        account:  "Kritisiert nachweislich Parteien aller Richtungen – die Trefferliste diesmal auch.",
        fakten:   "Zwei Redaktionen haben die Auswertung nachvollzogen und bestätigen sie. Die betroffenen Parteien räumen „verspätete Meldungen“ ein.",
      },
      resolution: "ECHT. Watchdog-Organisationen sind unbequem – das ist ihr Job. Erkennungsmerkmale seriöser NGO-Arbeit: offene Rohdaten, nachvollziehbare Methodik, Kritik über Parteigrenzen hinweg. Dass ein Bericht einer Partei nützt, macht ihn nicht falsch."
    },
    {
      id: "w2_echt_lehrerin", week: 2, isFake: false, category: "Echter Erfahrungs-Thread",
      medium: "post", source: "Kurznachrichtendienst", author: "Frau Demir unterrichtet", handle: "@frau_demir",
      reach: "310.000 Likes",
      title: "Lehrerin über Deepfakes im Klassenzimmer",
      text: "„Heute hat ein Schüler ein ‚Beweisvideo‘ für Wahlbetrug gezeigt – KI-generiert, aber verdammt gut. Wir haben dann 90 Minuten Forensik statt Mathe gemacht. Beste Stunde des Jahres. Thread mit unseren 5 Prüfschritten: 🧵“",
      evidence: {
        forensik: null,
        quelle:   "Der Thread beschreibt Methoden, keine Tatsachenbehauptungen über Dritte; die 5 Prüfschritte decken sich mit Empfehlungen von Faktencheck-Organisationen.",
        account:  "Seit 2028 aktives Lehrerkonto mit Unterrichtsideen; von Bildungsjournalisten mehrfach zitiert.",
        fakten:   "Keine überprüfbaren Falschbehauptungen; der geschilderte Vorfall betrifft die eigene Klasse und nennt niemanden namentlich.",
      },
      resolution: "ECHT. Persönliche Erfahrungsberichte ohne Falschbehauptungen sind der Normalfall sozialer Medien – auch wenn sie viral gehen. Der Thread verbreitet sogar Medienkompetenz. Wichtig fürs Kalibrieren: Nicht jeder virale Post über Desinformation ist selbst welche."
    },

    /* ---------------------------- WOCHE 3 ---------------------------- */
    {
      id: "w3_perfekter_deepfake", week: 3, isFake: true, category: "High-End-Deepfake",
      medium: "video", source: "Video-Plattform", author: "BürgerKamera", handle: "@buergerkamera",
      reach: "1,4 Mio. Aufrufe",
      title: "„Heimlich gefilmt: Brenner beleidigt Wähler im Hinterzimmer“",
      text: "Ein scheinbar heimlich gefilmtes Video zeigt Kandidat Jonas Brenner (Heimatliste) beim Bier: „Unsere Wähler? Denen kannst du alles erzählen, Hauptsache laut. Denken ist nicht deren Stärke.“ Gelächter am Tisch.",
      evidence: {
        forensik: "Keine auffälligen Artefakte: Lippen synchron, Beleuchtung konsistent, natürliches Rauschen. Die neueste Generation von Video-KI besteht die Standardprüfung. Einzig ein Detail: Der Bierdeckel wechselt zwischen zwei Einstellungen die Brauerei-Aufschrift.",
        quelle:   "Der Kanal „BürgerKamera“ inszeniert sich als Bürgerjournalismus, nennt aber nie Ort, Datum oder Anwesende – bei angeblich heimlichen Aufnahmen praktisch nie überprüfbar.",
        account:  "Gewachsener Account mit gemischten Inhalten – unauffällig.",
        fakten:   "Brenner war zum behaupteten Zeitpunkt nachweislich auf einer Bühne vor 800 Zuschauern (Livestream mit Zeitstempel, Fotos dutzender Besucher). Das „Hinterzimmer-Treffen“ kann so nicht stattgefunden haben.",
      },
      resolution: "KI-FAKE. Die Forensik ist beim Stand 2032 fast machtlos – nur ein winziger Kontinuitätsfehler (Bierdeckel!) und vor allem das wasserdichte Alibi im Fakten-Abgleich entlarven den Clip. Lektion: Wenn die Technik perfekt fälscht, wird die Frage „KANN das überhaupt passiert sein?“ zum stärksten Werkzeug."
    },
    {
      id: "w3_persona", week: 3, isFake: true, category: "KI-Persona-Journalistin",
      medium: "artikel", source: "Nachrichtenportal", author: "Miriam Steinbach", handle: "medienblick-berlin.de",
      reach: "230.000 Leser",
      title: "„Exklusiv: Geheimtreffen zwischen BM-Spitze und Energiekonzernen“",
      text: "Die Journalistin „Miriam Steinbach“ berichtet unter Berufung auf „drei unabhängige Quellen“ von einem Geheimtreffen, bei dem das Bündnis Morgen Subventionszusagen gegen Wahlkampfspenden verhandelt haben soll. Der Text ist präzise, nüchtern, handwerklich stark.",
      evidence: {
        forensik: "Das Autorinnenfoto besteht die Standardprüfung – doch die Rückwärtssuche findet dasselbe Gesicht mit anderem Namen auf zwei weiteren Portalen. Das Gesicht existiert nur in diesen drei Biografien.",
        quelle:   "„medienblick-berlin.de“ wirkt professionell, Impressum vorhanden – die angegebene „Chefredaktion“ ist aber telefonisch nie erreichbar, das Portal ist 5 Monate alt.",
        account:  "„Miriam Steinbach“ hat Profile auf drei Netzwerken – alle im selben Monat erstellt, keine Interaktion vor diesem Datum, kein früheres Portfolio, keine Kollegen, die sie kennen.",
        fakten:   "Keine zweite Redaktion kann die Geschichte bestätigen. Die „drei Quellen“ bleiben vollständig anonym, keine Dokumente. Das dementierte Treffen lässt sich weder belegen noch orten.",
      },
      resolution: "KI-FAKE. Eine komplette synthetische Journalisten-Identität: KI-Gesicht, KI-Texte, aufgebaute Scheinreputation. Handwerklich perfekte Texte sind KEIN Echtheitsbeweis mehr. Entlarvend: Die Person hat keine Vergangenheit – echte Journalist:innen hinterlassen jahrelange Spuren (Artikel, Kollegen, Auftritte)."
    },
    {
      id: "w3_paidgrassroots", week: 3, isFake: true, category: "Bezahlte Echt-Accounts",
      medium: "post", source: "Kurznachrichtendienst", author: "Sina", handle: "@sina_mama_von3",
      reach: "Teil einer Welle: 2.400 ähnliche Posts",
      title: "„Ich war immer SM-Wählerin, aber…“",
      text: "„Ich habe 20 Jahre die Soziale Mitte gewählt. Aber was die mit unseren Schulen vorhaben, macht mich fassungslos. Zum ersten Mal im Leben wähle ich diesmal anders. Es fühlt sich komisch an, aber es ist richtig.“",
      evidence: {
        forensik: null,
        quelle:   "Der Post nennt keine überprüfbare Behauptung („was die vorhaben“ bleibt nebulös) – emotional statt faktisch.",
        account:  "Der Account ist ECHT: 6 Jahre alt, echte Familienfotos, echte Freunde. Die Account-Analyse gibt grünes Licht.",
        fakten:   "Auffällig erst im Muster: Binnen 48 Stunden posten über 2.000 echte Accounts nahezu dieselbe „Ich war immer X-Wähler, aber…“-Erzählung mit identischem Spannungsbogen. Ein Rechercheverbund deckt auf: Eine Agentur bezahlt Nutzer für das Posten vorformulierter „persönlicher“ Texte (5 € pro Post).",
      },
      resolution: "KI-FAKE (koordinierte Desinformation). Die perfekte Tarnung: ECHTE Menschen posten für Geld KI-vorformulierte „Erfahrungsberichte“. Jeder einzelne Account besteht jede Prüfung – nur die Schwarm-Perspektive im Fakten-Abgleich (identische Erzählmuster in Masse) verrät die Kampagne. Einzelfallprüfung stößt hier an ihre Grenze."
    },
    {
      id: "w3_klon_seite", week: 3, isFake: true, category: "Geklonte Nachrichtenseite",
      medium: "artikel", source: "Nachrichtenportal", author: "Westkurier", handle: "westkurier-aktuell.com",
      reach: "380.000 Klicks über Social Media",
      title: "„Westkurier: Kaya plant Verbot privater Autos ab 2035“",
      text: "Ein Artikel im exakten Design des Westkuriers – Logo, Schrift, Layout perfekt: Das Bündnis Morgen plane laut „internem Positionspapier“ ein vollständiges Verbot privater PKW ab 2035. Der Artikel kursiert massenhaft als Screenshot und Link.",
      evidence: {
        forensik: "Screenshot und Seite sind pixelgenau im Westkurier-Design – die Fälschung ist visuell perfekt.",
        quelle:   "Die Domain lautet westkurier-aktuell.com statt westkurier.de. Registriert vor 9 Tagen über einen Anonymisierungsdienst. Der echte Westkurier warnt auf seiner Startseite vor der Klon-Seite.",
        account:  "Verbreitung startete gleichzeitig über hunderte Accounts in Auto-Foren und Pendler-Gruppen – koordinierter Seeding-Start statt organischer Verbreitung.",
        fakten:   "Im echten Westkurier existiert der Artikel nicht. Das zitierte „Positionspapier“ kann niemand vorlegen; die Partei dementiert.",
      },
      resolution: "KI-FAKE. Doppelgänger-Websites klonen das Design echter Medien und hängen sich an deren Glaubwürdigkeit (dokumentierte reale Taktik!). Der entscheidende Blick gilt der Adresszeile: -aktuell.com statt .de. Design lässt sich kopieren, die Domain nicht."
    },
    {
      id: "w3_wahlmaschinen", week: 3, isFake: true, category: "Deepfake + Falschwissen",
      medium: "video", source: "Video-Plattform", author: "DemokratieWache", handle: "@demokratie_wache",
      reach: "2,1 Mio. Aufrufe · Trend #Wahlcomputer",
      title: "„Beweisvideo: Wahlcomputer manipulieren Stimmen“",
      text: "Ein „IT-Techniker“ zeigt anonym, wie er auf einem „Wahlcomputer, wie er am 26. September eingesetzt wird“, per USB-Stick Stimmen von der FZP zur Sozialen Mitte umleitet. „Teilt das, bevor die Wahl gestohlen wird!“",
      evidence: {
        forensik: "Das Video zeigt reale Hardware und eine echte Software-Oberfläche – technisch keine Generierungsartefakte. Die gezeigte Maschine ist ein Modell aus einem anderen Land.",
        quelle:   "Der Kanal wurde vor 8 Wochen erstellt und produziert täglich „Enthüllungen“ zu Wahlbetrug in verschiedenen Ländern – Textbausteine wiederholen sich wortgleich.",
        account:  "Follower-Zuwachs in unnatürlichen Sprüngen (je +40.000 binnen Stunden) – gekaufte Reichweite.",
        fakten:   "Der Kernfehler: In Deutschland wird mit Papier und Stift gewählt. Wahlcomputer sind seit dem Urteil des Bundesverfassungsgerichts 2009 faktisch nicht im Einsatz. Das Video kann den deutschen Wahlablauf nicht zeigen.",
      },
      resolution: "KI-FAKE (Desinformation). Hier schlägt WISSEN jede Technik-Prüfung: Deutschland wählt auf Papier – ein „deutscher Wahlcomputer-Hack“ ist unmöglich. Angriffe auf das Vertrauen in die Wahl-Infrastruktur sind die gefährlichste Desinformationsform, weil sie Verlierer zu Wahlanfechtungen und Unruhen motivieren."
    },
    {
      id: "w3_echt_whistleblower", week: 3, isFake: false, category: "Echter Whistleblower",
      medium: "post", source: "Kurznachrichtendienst", author: "aufrichtig_2032", handle: "@aufrichtig_2032",
      reach: "94.000 geteilt",
      title: "Anonymer Account mit brisanten Dokumenten",
      text: "„Ich arbeite in der Agentur, die für die Heimatliste Social-Media macht. Wir betreiben 200 Fake-Profile. Ich kann nicht mehr schweigen. Hier die Belege.“ Angehängt: Screenshots interner Auftragslisten, Rechnungen, ein Organigramm.",
      evidence: {
        forensik: "Die Screenshots zeigen konsistente Metadaten, fortlaufende Rechnungsnummern und reale Software-Oberflächen; Faktenchecker finden keine Montage-Spuren.",
        quelle:   "Der Account ist anonym und 3 Tage alt – bei Whistleblowern naturgemäß (Schutz vor Vergeltung).",
        account:  "Nur dieser eine Thread, dann Stille – untypisch für Bots (die skalieren), typisch für Einmal-Enthüller.",
        fakten:   "Zwei Redaktionen erklären binnen 24 h, die Dokumente unabhängig verifiziert und mit eigenen Quellen bestätigt zu haben. Die genannte Agentur löscht in derselben Nacht ihre Website. Die Wahlaufsicht leitet eine Prüfung ein.",
      },
      resolution: "ECHT. Der schwerste Fall des Spiels: Ein anonymer 3-Tage-Account – alle Account-Signale schreien „Fake“ – aber die DOKUMENTE halten unabhängiger Prüfung stand und Redaktionen bestätigen. Whistleblower sehen aus wie Trolle; der Unterschied liegt allein in der Verifizierbarkeit der Belege. Wer hier sperrt, schützt die Täter."
    },
    {
      id: "w3_echt_handyvideo", week: 3, isFake: false, category: "Echtes Amateurvideo",
      medium: "video", source: "Kurznachrichtendienst", author: "Deniz K.", handle: "@deniz_kre",
      reach: "410.000 Aufrufe",
      title: "„Sandmann weicht Frage aus und lässt Mikro abdrehen“",
      text: "Verwackeltes Hochkant-Video: Bei einem Marktplatz-Termin fragt eine Rentnerin Dr. Sandmann nach Kürzungsplänen. Er lächelt, antwortet ausweichend, dann dreht ein Mitarbeiter das Mikrofon ab. Die Menge buht.",
      evidence: {
        forensik: "Starke Kompressionsartefakte, Bildrauschen, abgehackte Schnitte – die automatische Analyse meldet „Auffälligkeiten“. Aber: Genau solche Artefakte erzeugt jedes mehrfach geteilte Handyvideo. Schatten, Reflexe und Menge sind physikalisch konsistent.",
        quelle:   "Der Uploader war nachweislich vor Ort (weitere eigene Fotos vom selben Termin, gleiche Kleidung in Spiegelung erkennbar).",
        account:  "Normaler Privataccount seit 2027, lokale Inhalte, echtes Umfeld.",
        fakten:   "Drei weitere Besucher haben dieselbe Szene aus anderen Winkeln gepostet; die Lokalzeitung bestätigt den Vorfall. Das Team Sandmann spricht von „technischem Defekt“ – bestreitet die Szene aber nicht.",
      },
      resolution: "ECHT. Die Forensik-Falle in Gegenrichtung: Schlechte Qualität ≠ Fälschung. Mehrfach komprimierte Handyvideos lösen in automatischen Detektoren Fehlalarme aus – während High-End-Fakes sauber durchlaufen. Mehrere unabhängige Blickwinkel sind der stärkste Echtheitsbeweis überhaupt."
    },
    {
      id: "w3_echt_eilmeldung", week: 3, isFake: false, category: "Echte Eilmeldung (erst eine Quelle)",
      medium: "artikel", source: "Nachrichtenportal", author: "Nachrichten24", handle: "nachrichten24.de",
      reach: "EILMELDUNG · 12 Minuten alt",
      title: "„Rechenzentrum der Wahl-Infrastruktur meldet Cyberangriff“",
      text: "Nach Informationen von Nachrichten24 hat ein Dienstleister, der Wählerverzeichnisse hostet, einen Angriffsversuch gemeldet. Das BSI sei eingeschaltet. Auswirkungen auf die Wahl seien „nach erster Einschätzung nicht zu erwarten“. Noch berichtet kein anderes Medium.",
      evidence: {
        forensik: null,
        quelle:   "Nachrichten24 ist etabliert; der Artikel nennt konkrete, später überprüfbare Details (Behörde eingeschaltet, Statement angefragt) und kennzeichnet Unbestätigtes sauber als unbestätigt.",
        account:  "Redaktionskonto, normales Verhalten.",
        fakten:   "Noch keine Zweitquelle – 12 Minuten nach Veröffentlichung normal. ABER: Das BSI bestätigt auf Anfrage „einen laufenden Vorgang“, ohne Details. Die Meldung übertreibt nicht und ruft nicht zu Panik auf.",
      },
      resolution: "ECHT. Exklusivmeldungen haben anfangs IMMER nur eine Quelle – das unterscheidet sie nicht von Fakes. Entscheidend: seriöses Medium, überprüfbare Anker (BSI bestätigt Vorgang), vorsichtige Sprache statt Panik. Wer jede unbestätigte Eilmeldung sperrt, schaltet den Journalismus ab. (Tipp: Solche Fälle mit wenig Energie freigeben und beobachten.)"
    },
    {
      id: "w3_echt_ki_spot", week: 3, isFake: false, category: "Gekennzeichneter KI-Wahlspot",
      medium: "video", source: "Video-Plattform", author: "Soziale Mitte", handle: "@soziale_mitte_de",
      reach: "3,4 Mio. Aufrufe",
      title: "KI-generierter Wahlspot – mit Kennzeichnung",
      text: "Ein visuell beeindruckender Spot der Sozialen Mitte zeigt ein Deutschland im Jahr 2040: fliegende Bahnen, grüne Städte, volle Klassenzimmer. Eingeblendet dauerhaft unten links: „Bilder KI-generiert. Zukunftsvision, keine realen Aufnahmen.“",
      evidence: {
        forensik: "Zu 100 % KI-generiertes Material – die Analyse schlägt bei jedem Frame an. Genau das behauptet der Spot aber auch selbst.",
        quelle:   "Offizieller, verifizierter Parteikanal; der Spot läuft parallel im regulären TV-Wahlwerbeprogramm.",
        account:  "Offizielles Parteikonto.",
        fakten:   "Der Spot stellt eine Vision dar, keine Tatsachenbehauptung über Gegner. Die KI-Kennzeichnung ist deutlich und dauerhaft sichtbar – er erfüllt damit die Transparenzregeln für KI-Inhalte im Wahlkampf.",
      },
      resolution: "ECHT (LEGITIM). Die Schlussfolgerung „KI-generiert = sperren“ wäre falsch: KI-Inhalte sind im Wahlkampf zulässig, wenn sie TRANSPARENT gekennzeichnet sind und niemandem falsche Aussagen unterschieben. Das Problem ist nie die Technik, sondern die Täuschung. Dieser Fall zieht die zentrale Grenze des ganzen Themas."
    },
    {
      id: "w3_echt_umfrage", week: 3, isFake: false, category: "Überraschende, aber echte Umfrage",
      medium: "artikel", source: "Nachrichtenportal", author: "Institut Demoskopie Rheintal", handle: "idr-umfragen.de",
      reach: "820.000 Leser über Medien",
      title: "„Sensation: Heimatliste erstmals zweistärkste Kraft“",
      text: "Die neue IDR-Umfrage sieht die Heimatliste bei 21 % – ein Sprung von 6 Punkten binnen eines Monats, vor der FZP. Anhänger anderer Parteien werfen dem Institut massenhaft Manipulation vor: „Gekaufte Umfrage, sowas ist unmöglich!“",
      evidence: {
        forensik: null,
        quelle:   "Das IDR ist Mitglied im Berufsverband der Meinungsforscher, veröffentlicht Methodik, Stichprobengröße (2.012 Befragte), Erhebungszeitraum und Fehlertoleranz (±2,5 %).",
        account:  "Institutskonto mit jahrelanger Historie; Umfragen fielen historisch mal für die eine, mal für die andere Seite überraschend aus.",
        fakten:   "Zwei andere Institute messen in derselben Woche 18 % und 19 % – der Trend (deutlicher Anstieg) wird unabhängig bestätigt, die Abweichung liegt im üblichen Rahmen zwischen Instituten.",
      },
      resolution: "ECHT. „Das kann nicht stimmen, das gefällt mir nicht“ ist kein Prüfkriterium. Seriöse Umfragen erkennt man an offener Methodik und Fehlertoleranz – nicht am Ergebnis. Wer unliebsame Zahlen sperrt, betreibt genau die Manipulation, die er bekämpfen soll. (Der Empörungssturm im Netz ist übrigens ein Lieblingsziel für echte Botnetze.)"
    },
    {
      id: "w3_sprachnachricht", week: 3, isFake: true, category: "Hyperlokaler Audio-Deepfake",
      medium: "video", source: "Kurznachrichtendienst", author: "Nachbarschaft Falkenau-Süd", handle: "Weitergeleitete Sprachnachricht",
      reach: "kursiert in 40+ Nachbarschaftsgruppen",
      title: "„Sprachnachricht vom Bürgermeister“",
      text: "Eine Sprachnachricht, angeblich vom Falkenauer Bürgermeister: „Liebe Mitbürger, aufgrund der Sicherheitslage müssen wir die Wahl in den Bezirken Süd und West leider auf kommende Woche verschieben. Bitte gebt das weiter.“ Die Stimme klingt täuschend echt.",
      evidence: {
        forensik: "Die Stimme trifft Klangfarbe und Dialekt perfekt – aber die Betonung ist unnatürlich gleichmäßig und Atemgeräusche fehlen komplett. Der Bürgermeister spricht öffentlich viel: perfektes Trainingsmaterial für Stimm-Klone.",
        quelle:   "Die Nachricht kommt ohne Absender über Weiterleitungsketten – niemand kann sagen, woher sie ursprünglich stammt.",
        account:  "Nicht anwendbar bei Kettenweiterleitungen – genau deshalb ist der Kanal so beliebt für Desinformation.",
        fakten:   "Wahltermine kann kein Bürgermeister verschieben – sie sind bundesgesetzlich festgelegt. Die Stadt dementiert auf allen Kanälen; der echte Bürgermeister hat ein Video-Statement veröffentlicht.",
      },
      resolution: "KI-FAKE. Der gefährlichste Angriff der Woche: hyperlokal, per Messenger, mit geklonter Stimme einer Vertrauensperson – und nicht öffentlich sichtbar, also schwer zu kontern. Merksatz: Wahltermine ändern sich nie per Sprachnachricht. Im Zweifel: Website der Stadt."
    },
    {
      id: "w3_eilmeldung_screenshot", week: 3, isFake: true, category: "Gefälschter Eilmeldungs-Screenshot",
      medium: "bild", source: "Kurznachrichtendienst", author: "BreakingLeaks", handle: "@breaking_leaks",
      reach: "1,1 Mio. Ansichten",
      title: "Screenshot: „Nachrichten24 EILMELDUNG“",
      text: "Ein Screenshot zeigt eine angebliche Push-Meldung von Nachrichten24: „EIL: Kaya tritt zurück – Staatsanwaltschaft bestätigt Ermittlungen“. Der Post: „Schon wieder gelöscht! Sichert den Screenshot!!“",
      evidence: {
        forensik: "Im Screenshot stimmt der Zeilenabstand des Logos nicht mit echten Nachrichten24-Pushes überein; die Uhrzeit-Anzeige nutzt ein Format, das die App nie hatte.",
        quelle:   "Auf nachrichten24.de existiert keine solche Meldung – auch nicht als Korrektur oder Löschhinweis. Die Redaktion dementiert.",
        account:  "Der Account lebt von „gelöschten“ Meldungen, die nie existierten – dreimal von Faktencheckern widerlegt.",
        fakten:   "Weder Staatsanwaltschaft noch irgendein Medium bestätigen Ermittlungen. Kaya tritt zwei Stunden später live auf. Das „schon gelöscht“-Framing soll die Nichtauffindbarkeit ERKLÄREN – ein Selbstimmunisierungs-Trick.",
      },
      resolution: "KI-FAKE. Der „Screenshot einer gelöschten Eilmeldung“ ist perfide: Er imitiert eine vertrauenswürdige Quelle und erklärt gleich mit, warum man das Original nicht findet. Wenn „gelöscht!“ die einzige Quelle ist, ist die Meldung fast immer erfunden."
    },
    {
      id: "w3_robocall", week: 3, isFake: true, category: "KI-Anruf-Kampagne",
      medium: "post", source: "Kurznachrichtendienst", author: "Renate B.", handle: "@renate_b_1958",
      reach: "67.000 geteilt",
      title: "„Ich wurde gerade ANGERUFEN“",
      text: "„Gerade rief mich ‚das Wahlamt‘ an: Wegen hoher Briefwahl-Nachfrage soll ich am Sonntag NICHT ins Wahllokal, meine Stimme sei ‚automatisch registriert‘. Die Stimme klang total offiziell. Ist das normal?? Bitte teilen, meine halbe Seniorengruppe hat den Anruf auch bekommen!“",
      evidence: {
        forensik: null,
        quelle:   "Der Post selbst ist eine ehrliche Nachfrage – die Desinformation steckt im beschriebenen ANRUF, nicht im Post.",
        account:  "Echtes Konto einer Seniorin, seit Jahren normale Aktivität. Sie ist Opfer, nicht Täterin.",
        fakten:   "Wahlämter rufen niemals an, und es gibt keine „automatische Registrierung“ der Stimme. Die Bundeswahlleiterin und mehrere Städte warnen zeitgleich vor exakt dieser Robocall-Welle mit KI-Stimme.",
      },
      resolution: "KI-FAKE (Desinformations-Kampagne per Robocall). Kniffliger Sonderfall: Der POST ist echt und gutgläubig – aber er transportiert die Falschinfo der Anrufer weiter. Richtig ist Kennzeichnen mit Aufklärung (so machen es Plattformen mit Warnhinweisen), damit die Behauptung „Stimme automatisch registriert“ nicht weiterwandert. Die Seniorin trifft keine Schuld."
    },
    {
      id: "w3_echt_korrektur", week: 3, isFake: false, category: "Transparente Korrektur",
      medium: "artikel", source: "Nachrichtenportal", author: "Westkurier", handle: "westkurier.de",
      reach: "88.000 Leser",
      title: "„In eigener Sache: Wir haben einen Fehler gemacht“",
      text: "Der Westkurier korrigiert seine gestrige Meldung über Wahlkampfkosten der FZP: Statt 12 Mio. € sind es 1,2 Mio. € – ein Kommafehler aus einer Agenturmeldung. „Der Fehler lag bei uns. Die Original-Meldung wurde korrigiert und markiert.“",
      evidence: {
        forensik: "Die korrigierte Originalmeldung trägt einen sichtbaren Korrekturvermerk mit Zeitstempel.",
        quelle:   "Etablierte Zeitung; die Korrektur nennt Ursache, Verantwortung und den richtigen Wert.",
        account:  "Redaktionskonto verweist aktiv auf die Korrektur – kein stilles Löschen.",
        fakten:   "Der korrigierte Wert deckt sich mit dem offiziellen Rechenschaftsbericht der Partei.",
      },
      resolution: "ECHT. Fehler passieren auch seriösen Medien – der Unterschied zu Desinformation ist der Umgang: sichtbare Korrektur statt stillem Löschen, Verantwortung statt Ausrede. Transparente Korrekturen sind ein STÄRKE-Signal einer Quelle, kein Schwäche-Signal."
    },
    {
      id: "w3_echt_preprint", week: 3, isFake: false, category: "Überraschende, echte Forschung",
      medium: "artikel", source: "Nachrichtenportal", author: "Wissenschaft Heute", handle: "wissenschaft-heute.de",
      reach: "134.000 Leser",
      title: "„Studie: Deepfake-Warnungen können Vertrauen MEHR beschädigen als Deepfakes“",
      text: "Ein Forschungsteam der (fiktiven) Universität Rheintal zeigt in einem Preprint: Wer ständig vor Fälschungen gewarnt wird, hält auch echte Aufnahmen häufiger für gefälscht – die „Lügendividende“. Der Artikel ordnet ein: Preprint, noch nicht begutachtet.",
      evidence: {
        forensik: null,
        quelle:   "Das Preprint ist öffentlich abrufbar, Autoren und Daten einsehbar; der Artikel kennzeichnet den Vorab-Status deutlich.",
        account:  "Etabliertes Wissenschaftsportal, das regelmäßig auch Einschränkungen von Studien benennt.",
        fakten:   "Der Befund klingt paradox, ist aber in der realen Forschung gut dokumentiert („liar's dividend“). Zwei unabhängige Fachleute nennen die Methodik im Artikel solide.",
      },
      resolution: "ECHT. Kontraintuitive Forschung ist kein Fake – und dieser Befund betrifft dich als Prüfer:in direkt: Überwarnung macht Menschen zynisch („ist eh alles fake“), und genau davon profitieren Lügner, deren echte Skandale dann als „bestimmt KI“ abgetan werden. Prüfen statt pauschal misstrauen."
    },
    {
      id: "w3_echt_panne", week: 3, isFake: false, category: "Langweilige Wahrheit",
      medium: "post", source: "Kurznachrichtendienst", author: "Landesrundfunk Technik", handle: "@lrf_technik",
      reach: "45.000 geteilt",
      title: "„Zur Livestream-Panne von gestern Abend“",
      text: "„Der Ausfall während der TV-Debatte (Minute 41–44) hatte eine unspektakuläre Ursache: ein defekter Encoder in Studio 3. Hier das Fehlerprotokoll und ein Foto des getauschten Geräts. Es wurde nichts ‚abgeschaltet‘, die fehlenden Minuten sind in der Mediathek.“",
      evidence: {
        forensik: "Das Foto zeigt reale Studiotechnik; das angehängte Fehlerprotokoll ist konsistent mit dem Ausfallzeitraum.",
        quelle:   "Offizielles Technik-Konto des Senders; die Mediathek enthält tatsächlich die vollständige Debatte.",
        account:  "Postet seit Jahren Technik-Transparenz („Warum war der Ton weg?“).",
        fakten:   "Unter #Debattengate kursiert die Theorie, der Stream sei „abgeschaltet worden, als Sandmann die Wahrheit sagte“ – die fehlenden Minuten sind aber vollständig abrufbar und enthalten nichts Brisantes.",
      },
      resolution: "ECHT. Technische Pannen sind der Rohstoff für Verschwörungstheorien – die langweilige Erklärung (defekter Encoder) ist fast immer die richtige, aber die aufregende verbreitet sich schneller. Wer die offizielle Erklärung sperrt, füttert die Theorie erst recht."
    },
  ],

  /* =======================================================================
     REALE VORBILDER & QUELLEN
     Alle Fälle des Spiels sind FIKTIV (erfundene Parteien, Personen, Medien),
     bilden aber dokumentierte, reale Techniken und Ereignisse nach.
     Diese Verweise werden in der Auflösung jedes Falls angezeigt.
     ======================================================================= */
  realRefs: {
    w1_deepfake_kaya: "2024 hielt ein KI-geklonter „Joe Biden“-Anruf Wähler in New Hampshire von der Vorwahl ab; der Urheber wurde zu 6 Mio. $ Strafe verurteilt (FCC). Kontext-Schnitte echter Reden („Cheapfakes“) sind laut Faktencheckern noch häufiger als echte Deepfakes.",
    w1_fakezeitung_wahllokal: "Falsche Angaben zu Wahlzeiten/-orten sind ein dokumentiertes Muster von Wahlunterdrückung – z. B. „Wähle per SMS“-Anzeigen im US-Wahlkampf 2016 (Ermittlungen gegen den Urheber 2021).",
    w1_botpfleger: "Koordinierte Fake-Berufsprofile: Der US-Senatsbericht zur russischen „Internet Research Agency“ (2018) und Metas Quartalsberichte zu „Coordinated Inauthentic Behavior“ dokumentieren tausende solcher Kampagnen.",
    w1_targeting_zweitstimme: "Demobilisierung per Microtargeting ist real: Der Cambridge-Analytica-Skandal (2018) und die „Deterrence“-Kategorien der Trump-Kampagne 2016 (Channel-4-Recherche 2020) zielten gezielt auf Nichtwählen.",
    w1_kiartikel_studie: "NewsGuard zählt inzwischen über 1.000 KI-generierte Pseudo-Nachrichtenseiten, die erfundene Experten und Studien zitieren (newsguardtech.com, laufend aktualisiert).",
    w1_echt_warnung: "Reale Praxis: Die Bundeswahlleiterin informiert und warnt öffentlich vor Falschinformationen zur Wahlorganisation (bundeswahlleiterin.de).",
    w1_echt_erstwaehlerin: "Verifikations-Grundregel (u. a. dpa-Faktencheck, Correctiv): Ein junges Konto allein ist kein Fake-Beweis – entscheidend sind Verhaltensmuster und Umfeld.",
    w1_satire_stoerfisch: "Satire ist grundrechtlich geschützt (Art. 5 GG); Vorbild: „Der Postillon“. Problematisch wird nur die Weiterverbreitung ohne Satire-Kontext.",
    w1_echt_dienstwagen: "Der Vorwurf „Fake News!“ gegen wahre Berichte ist eine dokumentierte Diskreditierungsstrategie (Forschung u. a. des Reuters Institute / Oxford).",
    w1_echt_podium: "Reale Praxis: Kommunale Wahlforen und Podiumsdiskussionen lassen sich über offizielle Stadtkalender und Lokalpresse in Sekunden verifizieren.",
    w2_audioleak: "Zwei Tage vor der Slowakei-Wahl 2023 kursierte ein KI-gefälschtes „Telefonmitschnitt“-Audio des Kandidaten Michal Šimečka – mitten in der Nachrichtensperrfrist, kaum noch korrigierbar (u. a. AFP-Faktencheck).",
    w2_dokument: "Gefälschte Dokumente in „Leaks“: Den „Macron Leaks“ im französischen Wahlkampf 2017 wurden nachweislich Fälschungen beigemischt (Untersuchungen von Mounk/CNRS u. a.).",
    w2_lokalnetz: "„Pink Slime“: Forscher (Columbia/Tow Center) dokumentierten über 1.200 automatisierte Pseudo-Lokalzeitungen in den USA; KI hat die Produktion massiv verbilligt.",
    w2_kontextfake: "Laut AFP, dpa und Correctiv ist echtes Material im falschen Kontext die häufigste Desinformationsform überhaupt – Gegenmittel: Bilderrückwärtssuche.",
    w2_altaccount: "Der Handel mit „gealterten“ Social-Media-Konten ist ein realer Schwarzmarkt; Briefwahl-Betrugslegenden kursierten massiv zur US-Wahl 2020 und zur Bundestagswahl 2021 (alle gerichtlich/behördlich widerlegt).",
    w2_echt_zweitaccount: "Standard-Verifikationsmethode: Querverweis vom verifizierten Hauptprofil (siehe Verification Handbook, European Journalism Centre).",
    w2_echt_wahlwerbung: "Zugespitzte Wahlwerbung ist legal; die EU-Verordnung über politische Werbung (ab 2025) verlangt vor allem Transparenz über Absender und Finanzierung.",
    w2_echt_tippfehler: "Die reflexhafte „Das ist ein Bot!“-Beschuldigung gegen echte Menschen ist ein erforschtes Phänomen – und selbst ein Werkzeug zur Diskreditierung.",
    w2_echt_studie: "Reale Vorbilder: Studien des Oxford Internet Institute und von HateAid zu koordinierten Kampagnen gegen Politikerinnen.",
    w3_perfekter_deepfake: "2024 überwies ein Konzern-Mitarbeiter in Hongkong 25 Mio. $ nach einer komplett deepgefakten Videokonferenz. Detektoren erkennen neueste Fakes zunehmend nicht mehr – Alibi- und Kontextprüfung („Kann das überhaupt sein?“) wird zur wichtigsten Methode.",
    w3_persona: "KI-generierte Journalisten-Personas mit GAN-Gesichtern sind dokumentiert, z. B. „Oliver Taylor“ (Reuters-Recherche 2020) und Graphika-Berichte zu Fake-Redaktionen.",
    w3_paidgrassroots: "Bezahlte „persönliche“ Posts echter Nutzer sind mehrfach aufgeflogen, u. a. Agentur-Kampagnen, die Influencer für politische Botschaften bezahlten (Meta/Graphika-Berichte zu „CIB“).",
    w3_klon_seite: "Die russische „Doppelgänger“-Kampagne (seit 2022, vom Auswärtigen Amt 2024 öffentlich gemacht) klonte Spiegel, Bild, FAZ u. a. unter täuschend ähnlichen Domains.",
    w3_wahlmaschinen: "Erfundene Wahlmaschinen-Manipulation nach der US-Wahl 2020 endete im größten Verleumdungsvergleich der US-Geschichte (Fox News/Dominion: 787,5 Mio. $, 2023). Deutschland wählt auf Papier – BVerfG-Urteil zu Wahlcomputern 2009.",
    w3_echt_whistleblower: "Echte Enthüllungen beginnen oft anonym: Ibiza-Video (2019) oder die Facebook Files – entscheidend war stets die unabhängige Verifikation der Dokumente durch Redaktionen.",
    w3_echt_handyvideo: "Bei stark komprimierten echten Videos produzieren Deepfake-Detektoren dokumentiert Fehlalarme (u. a. Deepfake Detection Challenge) – Kompressionsartefakte sind keine KI-Artefakte.",
    w3_echt_eilmeldung: "Nachrichtenagenturen (dpa, Reuters) kennzeichnen Unbestätigtes ausdrücklich – jede Exklusivmeldung hat anfangs genau eine Quelle. Vorsichtige Sprache ist das Echtheitssignal.",
    w3_echt_ki_spot: "Gekennzeichnete KI-Wahlwerbung ist real und zulässig: Der EU AI Act und Plattformregeln setzen auf Transparenzpflicht statt Verbot.",
    w3_echt_umfrage: "Seriosität von Umfragen erkennt man an offener Methodik und Fehlertoleranz (Standards des ADM / Rats der Deutschen Markt- und Sozialforschung) – nie am Ergebnis.",
    w1_urnenbild: "KI-Schockbilder gehen regelmäßig viral, z. B. das KI-Bild der „Explosion am Pentagon“ (Mai 2023), das kurzzeitig sogar die Börse bewegte – widerlegt binnen Minuten durch Ortslogik.",
    w1_gewinnspiel: "Phishing im Wahlkontext ist dokumentiert: Vor Wahlen warnen BSI und Verbraucherzentralen regelmäßig vor gefälschten „Behörden“-Seiten, die Ausweisdaten abgreifen. Stimmenkauf ist nach § 108b StGB strafbar.",
    w1_zitatkachel: "Erfundene Zitatkacheln sind laut Faktencheckern (dpa, Correctiv, Mimikama) die häufigste gemeldete Fälschungsart – Prominente von Merkel bis Lindner waren betroffen.",
    w1_echt_wahlhelfer: "Real: Wahlhelfer erhalten gesetzlich ein „Erfrischungsgeld“ (§ 10 BWO); Städte werben vor jeder Wahl öffentlich um Helfer.",
    w1_echt_clickbait: "Die Unterscheidung „schlechter Stil ≠ Desinformation“ entspricht der Praxis aller großen Faktencheck-Redaktionen: Geprüft werden Tatsachenbehauptungen, nicht Tonlagen.",
    w1_echt_erklaervideo: "Real: Formate wie die Erklärvideos der Bundeszentrale für politische Bildung oder von Creators wie „einfach politik“ erreichen Erstwähler nachweislich besser als klassische Kanäle.",
    w2_umfragegrafik: "Manipulierte Achsen und gefälschte Instituts-Grafiken sind dokumentierte Praxis; Institute wie Forsa und Infratest mussten mehrfach öffentlich gefälschten „eigenen“ Zahlen widersprechen.",
    w2_auslandsmedium: "Die „Doppelgänger“-Kampagne erfand komplette Artikel unter den Logos von Spiegel, Bild und internationalen Medien; erfundene „Auslandsberichte“ sind ein Standardtrick, dokumentiert u. a. von EU DisinfoLab.",
    w2_drohpost: "Einschüchterung von Wahlhelfern ist real dokumentiert, v. a. um die US-Wahlen 2020/2024 (Reuters-Recherchen zu Drohungen gegen „election workers“); in Deutschland greift u. a. § 108 StGB (Wählernötigung).",
    w2_echt_altvideo: "Archiv-Konfrontation ist legitime journalistische Praxis – entscheidend ist die korrekte Datierung. Der Unterschied zum „falschen Kontext“ (häufigste Desinfo-Form laut AFP/dpa) liegt genau dort.",
    w2_echt_ngo: "Reale Vorbilder: LobbyControl und abgeordnetenwatch.de dokumentieren Parteispenden-Meldelücken über alle Parteien hinweg – mit offenen Daten.",
    w2_echt_lehrerin: "Medienkompetenz-Unterricht mit echten Deepfake-Beispielen ist verbreitete Praxis (u. a. Materialien von klicksafe und der bpb).",
    w3_sprachnachricht: "Der geklonte „Biden-Robocall“ von New Hampshire 2024 lief genau so: KI-Stimme einer Vertrauensperson + falsche Wahl-Anweisung. Messenger-Ketten ohne Absender sind laut WhatsApp-eigenen Maßnahmen (Weiterleitungs-Limits) ein Haupt-Verbreitungsweg.",
    w3_eilmeldung_screenshot: "Gefälschte Screenshots „gelöschter“ Eilmeldungen etablierter Medien kursieren regelmäßig; die Tagesschau unterhält eine eigene Seite, die gefälschte Tagesschau-Screenshots sammelt und widerlegt.",
    w3_robocall: "KI-Robocalls mit falschen Wahl-Anweisungen sind real (New Hampshire 2024, 6-Mio.-$-Strafe). Dass gutgläubige Empfänger die Falschinfo weitertragen, ist der beabsichtigte Multiplikator-Effekt.",
    w3_echt_korrektur: "Transparente Korrekturvermerke sind Standard seriöser Redaktionen (Pressekodex Ziffer 3); Faktenchecker werten sichtbare Korrekturkultur als Vertrauenssignal.",
    w3_echt_preprint: "Die „Lügendividende“ (liar's dividend) ist ein realer Forschungsbefund (Chesney & Citron, 2019): Je mehr über Deepfakes gesprochen wird, desto leichter können Täter echte Aufnahmen als Fälschung abtun.",
    w3_echt_panne: "Reale Praxis: Sender wie ARD/ZDF erklären technische Pannen öffentlich, weil Sendeausfälle regelmäßig Verschwörungstheorien auslösen (dokumentiert u. a. bei TV-Duellen).",
  },

  /* =======================================================================
     ENDLOSMODUS – Schwierigkeitskurve pro „Schicht“ (5 Fälle)
     ======================================================================= */
  endless: {
    casesPerShift: 5,
    timerForShift: (s) => Math.max(14, 44 - 4 * s),   // 40, 36, 32 … min 14
    energyForShift: (s) => Math.max(3, 13 - s),        // 12, 11, 10 … min 3
    perfectShiftIndexBonus: 4,                         // fehlerfreie Schicht: Vertrauen erholt sich
    poolForShift: (s) => (s <= 1 ? [1] : s === 2 ? [2] : s === 3 ? [3] : [2, 3]),
  },

  /* =======================================================================
     DILEMMA-UPGRADES (nach Woche 1 und 2: 3 zufällige + Verzicht)
     effects: energyPerWeek, indexNow, timerPlus, freeProbe, damageShield
     ======================================================================= */
  dilemmas: [
    {
      id: "massenscan", name: "Massen-Scan-KI", icon: "🛰️",
      offer: "Eine KI durchsucht anlasslos ALLE öffentlichen und halböffentlichen Beiträge – auch private Gruppen. Eure Analysten bekommen deutlich mehr Hinweise.",
      effectText: "+3 Prüf-Energie pro Woche",
      costText: "−10 Demokratie-Index (anlasslose Massenüberwachung)",
      debrief: "Real diskutiert bei „Chatkontrolle“ & Co.: Massenüberwachung findet mehr – und stellt zugleich alle unter Generalverdacht. Ein Kernkonflikt zwischen Sicherheit und Grundrechten.",
      effects: { energyPerWeek: 3, indexNow: -10 },
    },
    {
      id: "autosperre", name: "Automatische Vorab-Sperrung", icon: "⚡",
      offer: "Verdächtige Beiträge werden von einer KI schon VOR eurer Prüfung unsichtbar geschaltet. Ihr gewinnt Zeit – aber die Maschine sperrt ohne menschliche Kontrolle und ohne Richter.",
      effectText: "+10 Sekunden Timer pro Fall",
      costText: "−12 Demokratie-Index (Löschung ohne Richtervorbehalt)",
      debrief: "„Overblocking“: Automatische Sperren treffen immer auch Legitimes – und wer entscheidet, was die Maschine für verdächtig hält? Upload-Filter-Debatte in Reinform.",
      effects: { timerPlus: 10, indexNow: -12 },
    },
    {
      id: "transparenz", name: "Transparenz-Offensive", icon: "📖",
      offer: "Ihr veröffentlicht ab sofort JEDE Prüfentscheidung mit vollständiger Begründung und lasst euch von einem unabhängigen Gremium kontrollieren. Das kostet Arbeitszeit – schafft aber Vertrauen.",
      effectText: "+8 Demokratie-Index",
      costText: "−1 Prüf-Energie pro Woche (Dokumentation bindet Kräfte)",
      debrief: "Demokratische Kontrolle ist unbequem und langsam – aber sie ist der Unterschied zwischen einer Prüfstelle und einem Zensurministerium.",
      effects: { energyPerWeek: -1, indexNow: 8 },
    },
    {
      id: "plattformdeal", name: "Deal mit den Plattformen", icon: "🤝",
      offer: "Die großen Netzwerke geben euch direkten Zugriff auf interne Account-Daten. Im Gegenzug teilt ihr eure Prüfergebnisse mit den Konzernen – was diese mit den Daten machen, kontrolliert ihr nicht.",
      effectText: "Erste Prüfung pro Fall kostenlos",
      costText: "−6 Demokratie-Index (Staatsdaten an private Konzerne)",
      debrief: "Staat-Plattform-Kooperationen sind effizient – und verschieben Macht zu Akteuren, die niemand gewählt hat. Wer kontrolliert die Kontrolleure?",
      effects: { freeProbe: true, indexNow: -6 },
    },
    {
      id: "beirat", name: "Bürger:innen-Beirat", icon: "🗣️",
      offer: "Ein zufällig gelostes Bürgergremium prüft eure umstrittenen Entscheidungen nach. Fehlurteile werden dadurch abgefedert – aber die Abstimmungsprozesse kosten Kapazität.",
      effectText: "Index-Schaden bei Fehlurteilen um 3 reduziert",
      costText: "−1 Prüf-Energie pro Woche (Beteiligung braucht Zeit)",
      debrief: "Bürgerräte sind ein reales Demokratie-Instrument: langsamer, aber legitimer. Fehler passieren trotzdem – sie werden nur besser aufgefangen.",
      effects: { damageShield: 3, energyPerWeek: -1 },
    },
    {
      id: "quellenschutz", name: "Pakt mit dem Journalismus", icon: "📰",
      offer: "Ihr verpflichtet euch öffentlich, journalistische Inhalte nie automatisiert zu sperren, und finanziert eine unabhängige Faktencheck-Redaktion mit.",
      effectText: "+5 Demokratie-Index sofort, +1 Energie pro Woche (Zuarbeit der Redaktion)",
      costText: "Kennzeichnungs-Fehlurteile kosten 2 Index MEHR (ihr habt es versprochen)",
      debrief: "Selbstbindung schafft Vertrauen – und erhöht die Fallhöhe. Wer sich öffentlich zu Pressefreiheit verpflichtet, wird an jedem Fehler doppelt gemessen.",
      effects: { indexNow: 5, energyPerWeek: 1, flagPenaltyPlus: 2 },
    },
    {
      id: "verzicht", name: "Bewusster Verzicht", icon: "🕊️", isPass: true,
      offer: "Ihr lehnt alle Aufrüstungen ab und erklärt öffentlich: „Wir schützen die Wahl mit rechtsstaatlichen Mitteln – mehr Befugnisse brauchen wir nicht.“",
      effectText: "+4 Demokratie-Index",
      costText: "Kein spielmechanischer Bonus",
      debrief: "Machtverzicht ist die unterschätzteste demokratische Tugend: Nicht jede verfügbare Technologie muss eingesetzt werden.",
      effects: { indexNow: 4 },
    },
  ],

  /* =======================================================================
     SHOWDOWN-BAUKASTEN (Duell-Finale & Solo-Boss)
     Der Fake wird aus Thema + Format + 2 Tarnungen gebaut.
     Tarnungen "säubern" je einen Beweiskanal.
     ======================================================================= */
  sabotage: {
    buildTime: 75,      // Sekunden Bauzeit
    huntTime: 90,       // Sekunden Suchzeit im Feed
    huntEnergy: 6,      // Prüf-Energie für den Boss-/Showdown-Feed
    feedSize: 4,        // 3 echte + 1 Fake
    maxCloaks: 2,
    budget: 5,          // Tarnungs-Budget: die zwei stärksten (je 3) passen NICHT zusammen

    themes: [
      {
        id: "wahltermin", name: "Termin-Verwirrung", icon: "🗓️",
        desc: "Falsche Infos zum Wahlablauf: verschobener Termin, geänderte Regeln.",
        title: "„Kurzfristige Änderung am Wahlsonntag“",
        text: "Wegen einer „Systemumstellung im Meldewesen“ könnten Bürger mit Nachnamen N–Z ihre Stimme erst am Montag abgeben, heißt es unter Berufung auf das Innenministerium.",
        fakten_dirty: "Das Innenministerium dementiert umgehend; Wahltermine sind bundesgesetzlich fixiert und können nicht „umgestellt“ werden.",
        fakten_clean: "Ein Dementi ist (noch) nicht auffindbar; die Meldung verweist vage auf „laufende Abstimmungen“ – schwer greifbar.",
      },
      {
        id: "skandal", name: "Skandal-Enthüllung", icon: "💣",
        desc: "Ein erfundener Skandal über eine Spitzenkandidatur, kurz vor knapp.",
        title: "„Verdeckte Auslandskonten bei Spitzenkandidatin“",
        text: "Ein „geleaktes Bankdokument“ soll belegen, dass die Kandidatin über eine Briefkastenfirma 2,3 Mio. € an Steuern vorbeigeschleust hat. „Behörden ermitteln bereits intern.“",
        fakten_dirty: "Keine Staatsanwaltschaft bestätigt Ermittlungen; die genannte Bank erklärt das Dokument für eine Fälschung mit fehlerhafter IBAN-Struktur.",
        fakten_clean: "Behörden geben „zu laufenden Vorgängen grundsätzlich keine Auskunft“ – das Dementi bleibt vage und die Gerüchteküche kocht.",
      },
      {
        id: "wahlbetrug", name: "Wahlbetrug-Legende", icon: "🗳️",
        desc: "Zweifel an der Auszählung säen – der Angriff auf die Wahl selbst.",
        title: "„Zeuge packt aus: Stimmzettel verschwinden“",
        text: "Ein „Wahlhelfer“ berichtet anonym, in seinem Bezirk seien bei der letzten Wahl „ganze Stapel“ von Stimmzetteln einer Partei „aussortiert“ worden – und diesmal sei es wieder geplant.",
        fakten_dirty: "Auszählungen sind öffentlich – jeder darf zuschauen. Für den Bezirk existieren Zählprotokolle mit Unterschriften aller Parteien; die Legende kursiert wortgleich in mehreren Städten.",
        fakten_clean: "Der Bezirk bleibt ungenannt, die Behauptung dadurch unwiderlegbar – klassische „nicht falsifizierbare“ Anekdote, die Prüfer ins Leere laufen lässt.",
      },
      {
        id: "gesundheit", name: "Gesundheitsgerücht", icon: "🏥",
        desc: "Zweifel an der Amtsfähigkeit einer Kandidatur streuen.",
        title: "„Verheimlichte Diagnose im Kanzlerkandidaten-Team?“",
        text: "Der Kandidat habe zwei Termine „aus persönlichen Gründen“ abgesagt – laut einem „Klinikinsider“ stecke eine ernste, verheimlichte Diagnose dahinter, die Amtsfähigkeit sei fraglich.",
        fakten_dirty: "Beide „abgesagten“ Termine fanden nachweislich statt (Fotos, Livestreams). Die zitierte Klinik hat den Kandidaten nie behandelt.",
        fakten_clean: "Die Terminlage ist unübersichtlich, das Team beruft sich auf Privatsphäre – ein Dementi bei Gesundheitsfragen wirkt immer wie Bestätigung.",
      },
      {
        id: "umfrage", name: "Umfrage-Fälschung", icon: "📊",
        desc: "Eine erfundene 'Umfrage' verschiebt die gefühlte Mehrheit.",
        title: "„Geheime Umfrage: Klarer Favorit stürzt ab“",
        text: "Eine „noch unveröffentlichte Institutsumfrage“ zeige einen dramatischen Absturz des Favoriten um 9 Punkte – „das Institut hält die Zahlen bis nach der Wahl zurück“, so die Quelle.",
        fakten_dirty: "Kein Institut kennt die Erhebung; die genannten Feldzeiten kollidieren mit veröffentlichten echten Umfragen, die stabil verlaufen.",
        fakten_clean: "Das angebliche Institut gibt „zu laufenden Erhebungen keine Auskunft“ – die Behauptung bleibt schwer greifbar, Dementis wirken formelhaft.",
      },
      {
        id: "infrastruktur", name: "Panik-Gerücht", icon: "⚠️",
        desc: "Angst vor Chaos am Wahltag soll Menschen zuhause halten.",
        title: "„Warnung: Chaos am Wahlsonntag erwartet“",
        text: "„Interne Behördenpapiere“ warnten vor Überlastung: stundenlange Schlangen, fehlende Stimmzettel, mögliche Ausschreitungen – wer kann, solle „den Wahltag meiden“.",
        fakten_dirty: "Die Wahlleitung dementiert; Stimmzettel-Logistik und Helferzahlen sind öffentlich dokumentiert und unauffällig. Das „Behördenpapier“ kann niemand vorlegen.",
        fakten_clean: "Einzelne echte Berichte über Helfermangel geben dem Gerücht einen wahren Kern – die Übertreibung ist schwer sauber zu widerlegen.",
      },
    ],

    formats: [
      {
        id: "video", name: "Deepfake-Video", icon: "🎬", medium: "video",
        author: "Klartext Kanal", source: "Video-Plattform", reach: "740.000 Aufrufe",
        forensik_dirty: "Bei schnellen Kopfbewegungen verschwimmt die Gesichtskante; die Brille spiegelt einen Raum, der nicht zur Umgebung passt.",
        forensik_clean: "Auch die Detailanalyse findet keine Artefakte – Beleuchtung, Lippen, Reflexe konsistent. (Neueste Generator-Generation.)",
        quelle_dirty: "Der Kanal ist 3 Wochen alt, ohne Impressum, ohne Herkunftsangabe des Materials.",
        quelle_clean: "Der Kanal existiert seit Jahren mit unverfänglichen Inhalten und wirkt gewachsen.",
        account_dirty: "Reichweite explodiert durch ein erkennbares Bot-Netz: identische Kommentare im Minutentakt.",
        account_clean: "Die Verbreitung wirkt organisch – geteilt von echten, unauffälligen Konten.",
      },
      {
        id: "artikel", name: "Fake-Newsportal", icon: "📰", medium: "artikel",
        author: "Hauptstadt Report", source: "Nachrichtenportal", reach: "310.000 Leser",
        forensik_dirty: "Das Aufmacherbild ist KI-generiert: Im Hintergrund verschmelzen zwei Personen an der Schulter.",
        forensik_clean: "Das Bildmaterial ist echtes, lizenziertes Agenturmaterial – forensisch einwandfrei.",
        quelle_dirty: "Domain 12 Tage alt, Impressum führt zu einer Briefkastenadresse, Redaktion nicht auffindbar.",
        quelle_clean: "Gekaufte Alt-Domain (seit 2016 registriert), komplett kopiertes, plausibles Impressum – der Quellen-Check gibt fälschlich grünes Licht.",
        account_dirty: "Die Social-Konten des „Portals“ wurden alle diese Woche erstellt und pushen nur diesen einen Artikel.",
        account_clean: "Verbreitung über etablierte Themen-Gruppen, kein auffälliges Konto-Muster.",
      },
      {
        id: "post", name: "Augenzeugen-Post", icon: "👁️", medium: "post",
        author: "Thorsten M.", source: "Kurznachrichtendienst", reach: "128.000 geteilt",
        forensik_dirty: null,  // Text-Post: Forensik ohnehin nicht anwendbar
        forensik_clean: null,
        quelle_dirty: "Keine einzige überprüfbare Angabe – kein Ort, keine Zeit, keine Belege, nur „ich habe es selbst gesehen“.",
        quelle_clean: "Der Post nennt scheinbar prüfbare Details (Ort, Uhrzeit), die sich aber nur mit großem Aufwand widerlegen lassen.",
        account_dirty: "Das Konto ist 9 Tage alt, folgt niemandem und hat ein KI-generiertes Profilbild (asymmetrische Ohrringe).",
        account_clean: "Gekaufter, 8 Jahre alter Account mit echter (fremder) Vergangenheit – die Analyse zeigt nur bei der Sprachhistorie einen feinen Bruch.",
      },
      {
        id: "audio", name: "Sprachnachricht", icon: "🎙️", medium: "video",
        author: "Weitergeleitet", source: "Messenger-Kettenpost", reach: "kursiert in 60+ Gruppen",
        forensik_dirty: "Die Stimme hat unnatürlich gleichmäßige Betonung, keinerlei Atemgeräusche und sterile Raumakustik – typisch für KI-Stimmklone.",
        forensik_clean: "Der Klon ist mit Störgeräuschen und „Handy-Qualität“ kaschiert – die Audio-Analyse bleibt ergebnislos.",
        quelle_dirty: "Die Nachricht kursiert ohne jeden Absender über Weiterleitungsketten – Ursprung nicht feststellbar, keine Originalquelle benannt.",
        quelle_clean: "Die Kette nennt einen scheinbar konkreten Ursprung („aus der Elterngruppe der Grundschule“), der sich kaum überprüfen lässt.",
        account_dirty: "Die ersten Verbreiter-Konten wurden alle am selben Tag erstellt und posten im Minutentakt in Dutzende Gruppen.",
        account_clean: "Die Verbreitung läuft über echte Privatpersonen, die die Nachricht gutgläubig weiterleiten – kein Kampagnenmuster erkennbar.",
      },
    ],

    cloaks: [
      { id: "retusche", name: "Detail-Retusche", icon: "🎨", channel: "forensik", cost: 2,
        desc: "Ein zweites KI-Modell entfernt alle visuellen Artefakte des ersten – die Medienforensik läuft ins Leere." },
      { id: "altdomain", name: "Gekaufte Historie", icon: "🏚️", channel: "quelle", cost: 3,
        desc: "Alte Domain bzw. gewachsener Kanal wird aufgekauft – der Quellen-Check zeigt eine saubere Vergangenheit." },
      { id: "seeding", name: "Organisches Seeding", icon: "🌱", channel: "account", cost: 2,
        desc: "Der Inhalt wird langsam über echte, unauffällige Konten gestreut – die Account-Analyse findet kein Botnetz." },
      { id: "halbwahrheit", name: "Kern-Wahrheit einweben", icon: "🧵", channel: "fakten", cost: 3,
        desc: "Die Lüge wird um ein echtes, überprüfbares Detail gebaut – der Fakten-Abgleich wird uneindeutig statt vernichtend." },
    ],
  },

  /* =======================================================================
     FALL-GENERATOR – Bausteine für automatisch erzeugte Fälle
     (Endlosmodus ab Schicht 3; kombiniert mit dem Showdown-Baukasten)
     ======================================================================= */
  gen: {
    cities: ["Falkenau", "Neustadt", "Grünberg", "Westhagen", "Birkenfeld", "Seedorf", "Altmark", "Lindau-Ost"],
    parties: ["Bündnis Morgen", "Soziale Mitte", "Freie Zukunftspartei", "Heimatliste"],
    people: ["Elif Kaya", "Dr. Robert Sandmann", "Carla Vogt", "Jonas Brenner"],
    numbers: ["23", "40", "58", "72", "85"],
    /* Echte generierte Beiträge (immer freizugeben) */
    realTemplates: [
      {
        title: "„{stadt}: Rathaus verlängert Öffnungszeiten für Briefwahl“",
        text: "Die Stadt {stadt} verlängert die Öffnungszeiten des Briefwahlbüros: Diese Woche täglich bis 19 Uhr, samstags bis 14 Uhr. Alle Infos auf der Website der Stadt.",
        medium: "post", author: "Stadt {stadt}", source: "Kurznachrichtendienst", reach: "8.200 Erreichte", category: "Echte Behördeninfo",
        evidence: {
          forensik: "Grafik im offiziellen Stadt-Design, identisch mit der Website.",
          quelle: "Verifiziertes Behördenkonto; die Information steht auch im Amtsblatt.",
          account: "Langjähriges Stadtkonto mit Bürgerinfos.",
          fakten: "Die Öffnungszeiten sind auf der offiziellen Website bestätigt; die Lokalzeitung berichtet ebenfalls.",
        },
        resolution: "ECHT. Eine überprüfbare Behördeninformation mit Bestätigung auf offiziellen Kanälen – Freigeben und weiter.",
      },
      {
        title: "„Podiumsdiskussion in {stadt}: Alle Kandidaten am Donnerstag“",
        text: "Der Bürgerverein {stadt} lädt zur Diskussionsrunde mit allen vier Direktkandidat:innen. Donnerstag, 19 Uhr, Stadthalle. Eintritt frei, Fragen willkommen.",
        medium: "post", author: "Bürgerverein {stadt}", source: "Kurznachrichtendienst", reach: "2.100 Likes", category: "Echter Vereins-Post",
        evidence: {
          forensik: "Das Veranstaltungsplakat entspricht früheren Plakaten des Vereins.",
          quelle: "Eingetragener Verein; die Veranstaltung steht im offiziellen Stadtkalender.",
          account: "Vereinskonto seit Jahren mit lokalen Terminen aktiv.",
          fakten: "Stadthalle bestätigt die Buchung; die Lokalpresse kündigt den Termin an.",
        },
        resolution: "ECHT. Zivilgesellschaftliche Einladung, mehrfach verifizierbar – demokratische Teilhabe in Reinform.",
      },
      {
        title: "„{person} besucht Berufsschule in {stadt}“",
        text: "Beim Besuch der Berufsschule {stadt} diskutierte {person} eine Stunde mit Auszubildenden über Wohnkosten und Ausbildungsvergütung. Die Schule veröffentlichte Fotos des Termins.",
        medium: "artikel", author: "Falkenauer Anzeiger", source: "Nachrichtenportal", reach: "6.900 Leser", category: "Echte Lokalmeldung",
        evidence: {
          forensik: "Die Fotos zeigen den Termin aus mehreren Blickwinkeln, Metadaten konsistent.",
          quelle: "Etablierte Lokalzeitung mit Impressum; der Termin stand im öffentlichen Wahlkampfkalender.",
          account: "Normales Redaktionskonto.",
          fakten: "Schule und Parteibüro bestätigen den Besuch unabhängig voneinander.",
        },
        resolution: "ECHT. Ein gewöhnlicher Wahlkampftermin mit mehreren unabhängigen Belegen.",
      },
      {
        title: "„Umfrage: {zahl} % der Jugendlichen in {stadt} wollen wählen gehen“",
        text: "Eine Befragung des Jugendrings unter 500 Jugendlichen in {stadt} zeigt: {zahl} % wollen sicher wählen gehen. Methodik und Fragebogen sind auf der Website des Jugendrings einsehbar.",
        medium: "artikel", author: "Nachrichten24", source: "Nachrichtenportal", reach: "31.000 Leser", category: "Echte Umfrage (lokal)",
        evidence: {
          forensik: "Die Grafiken stammen nachvollziehbar aus dem veröffentlichten Bericht.",
          quelle: "Der Jugendring existiert und legt Methodik samt Stichprobe offen.",
          account: "Etabliertes Portal, normales Verhalten.",
          fakten: "Der Bericht ist abrufbar; die Zahlen im Artikel stimmen mit ihm überein.",
        },
        resolution: "ECHT. Kleine Stichprobe, aber transparent dokumentiert und korrekt wiedergegeben – legitime Berichterstattung.",
      },
      {
        title: "„Plakat-Streit in {stadt}: Verein hängt zerstörte Wahlplakate nach“",
        text: "Nachdem in {stadt} erneut Wahlplakate mehrerer Parteien zerstört wurden, hat ein überparteilicher Verein eine Nachhäng-Aktion organisiert – „egal für welche Partei, Zerstörung ist keine Meinung“.",
        medium: "post", source: "Kurznachrichtendienst", author: "Demokratie-Werkstatt {stadt}", reach: "12.700 Likes", category: "Echter Bürgerbeitrag",
        evidence: {
          forensik: "Fotos der Aktion mit erkennbaren Straßenzügen aus {stadt}.",
          quelle: "Der Verein ist im Register eingetragen; die Polizei bestätigt die Sachbeschädigungen.",
          account: "Vereinskonto mit überparteilicher Historie.",
          fakten: "Lokalmedien berichten über beide Ereignisse – Zerstörung und Nachhäng-Aktion.",
        },
        resolution: "ECHT. Überparteiliches Engagement, unabhängig belegt. Achtung Bauchgefühl: Auch Beiträge über Straftaten können völlig legitim sein.",
      },
    ],
  },

  /* =======================================================================
     ECHTE MINI-FEED-BEITRÄGE für Boss-Feed & Showdown
     (kompakter als Fall-Dossiers, aber mit allen 4 Kanälen)
     ======================================================================= */
  feedReals: [
    {
      id: "fr_bahn", medium: "post", author: "VerkehrsverbundRheintal", source: "Kurznachrichtendienst", reach: "12.000 Likes",
      title: "„Zusätzliche Busse am Wahlsonntag“",
      text: "Am Wahlsonntag verstärken wir die Linien 3, 7 und 12 im 20-Minuten-Takt, damit alle bequem ihr Wahllokal erreichen. Fahrplan im Link.",
      evidence: {
        forensik: "Grafik im bekannten Verbund-Design, konsistent mit früheren Fahrplan-Ankündigungen.",
        quelle: "Verifiziertes Konto des Verkehrsverbunds; die Info steht auch auf der offiziellen Website.",
        account: "Behördenkonto, seit Jahren aktive Fahrgastinfo.",
        fakten: "Der verlinkte Fahrplan existiert; Lokalmedien berichten ebenfalls.",
      },
    },
    {
      id: "fr_azubi", medium: "post", author: "Jana", source: "Kurznachrichtendienst", reach: "3.900 Likes",
      title: "Erststimme erklärt – von einer Azubine",
      text: "Hab heute in der Berufsschule gelernt, wie Erst- und Zweitstimme funktionieren, und es als Thread aufgeschrieben, weil ich es selbst nie verstanden hatte. Vielleicht hilft's wem! 🧵",
      evidence: {
        forensik: "Die angehängten Skizzen sind handgezeichnet und fotografiert; Metadaten unauffällig.",
        quelle: "Der Thread deckt sich inhaltlich mit den Infos der Bundeszentrale für politische Bildung.",
        account: "Konto seit 2 Jahren, Alltag + Ausbildung, echtes Umfeld.",
        fakten: "Alle Aussagen im Thread sind sachlich korrekt (Erststimme Person, Zweitstimme Partei).",
      },
    },
    {
      id: "fr_kirche", medium: "artikel", author: "Falkenauer Anzeiger", source: "Nachrichtenportal", reach: "8.700 Leser",
      title: "„Kirchengemeinde bietet Fahrdienst ins Wahllokal“",
      text: "Die evangelische Gemeinde organisiert am Wahlsonntag einen kostenlosen Fahrdienst für Menschen mit eingeschränkter Mobilität. Anmeldung im Gemeindebüro.",
      evidence: {
        forensik: "Foto zeigt den echten Gemeindebus, Kennzeichen zur Region passend.",
        quelle: "Etablierte Lokalzeitung (seit 1921), vollständiges Impressum.",
        account: "Redaktionskonto mit normaler Lokalberichterstattung.",
        fakten: "Die Gemeinde bestätigt das Angebot auf ihrer Website.",
      },
    },
    {
      id: "fr_debatte", medium: "video", author: "Landesrundfunk", source: "Video-Plattform", reach: "290.000 Aufrufe",
      title: "Zusammenschnitt der TV-Debatte",
      text: "Die wichtigsten 4 Minuten der gestrigen Debatte: Rente, Mieten, Digitalisierung. Ungekürzte Fassung in der Mediathek.",
      evidence: {
        forensik: "Studiomaterial in Sendequalität, Ton und Bild konsistent, Sender-Wasserzeichen durchgängig.",
        quelle: "Offizieller Kanal des öffentlich-rechtlichen Landesrundfunks.",
        account: "Verifizierter Senderkanal.",
        fakten: "Die Ausschnitte decken sich mit der vollständigen Aufzeichnung in der Mediathek; keine sinnentstellenden Schnitte dokumentiert.",
      },
    },
    {
      id: "fr_briefwahl", medium: "post", author: "Stadt Falkenau", source: "Kurznachrichtendienst", reach: "22.000 Erreichte",
      title: "„Briefwahl: Unterlagen bis Freitag beantragen“",
      text: "Erinnerung: Briefwahlunterlagen können noch bis Freitag, 18 Uhr, online oder im Rathaus beantragt werden. Rücksendung ist portofrei. ℹ️ Alle Infos: stadt-falkenau.de/wahl",
      evidence: {
        forensik: "Kachel im offiziellen Stadt-Design mit Wappen; identisch mit der Website-Grafik.",
        quelle: "Verifiziertes Stadtkonto; der Link führt auf die offizielle Stadt-Domain.",
        account: "Behördenkonto, langjährige Historie mit Bürgerinfos.",
        fakten: "Die Frist entspricht der offiziellen Bekanntmachung im Amtsblatt.",
      },
    },
    {
      id: "fr_forscherin", medium: "artikel", author: "Wissenschaft Heute", source: "Nachrichtenportal", reach: "95.000 Leser",
      title: "„Wie erkenne ich Deepfakes? Forscherin gibt 5 Tipps“",
      text: "Eine Medienforensikerin erklärt, worauf man vor der Wahl achten sollte: Quelle prüfen, Rückwärtssuche nutzen, auf Kontext achten, Emotionen misstrauen, Zweitquelle suchen.",
      evidence: {
        forensik: "Porträtfoto der Forscherin mit Agentur-Nachweis; Person tritt auch in TV-Interviews auf.",
        quelle: "Etabliertes Wissenschaftsportal mit Redaktion und Impressum.",
        account: "Normales Redaktionsverhalten.",
        fakten: "Die Tipps decken sich mit Empfehlungen von Faktencheck-Organisationen; die Forscherin ist an einer echten Universität gelistet.",
      },
    },
    {
      id: "fr_azubi2", medium: "bild", author: "Malte", source: "Foto-Plattform", reach: "1.100 Likes",
      title: "Foto vom Plakate-Aufhängen",
      text: "„3 Stunden, 40 Plakate, 2 kaputte Kabelbinder-Packungen später… Demokratie ist auch Handarbeit 😅 Egal für welche Partei ihr hängt: Respekt an alle Ehrenamtlichen da draußen!“",
      evidence: {
        forensik: "Handyfoto mit konsistenten Schatten; Straßenzug per Kartendienst dem Wohnort zuordenbar.",
        quelle: "Persönlicher Beitrag ohne Tatsachenbehauptungen über Dritte.",
        account: "Privatkonto seit 2028, Fußballverein, Ausbildung, lokale Inhalte.",
        fakten: "Plakatierung ist in der Kommune ab diesem Datum genehmigt (Amtsblatt).",
      },
    },
    {
      id: "fr_rollstuhl", medium: "post", author: "Inklusion Falkenau e.V.", source: "Kurznachrichtendienst", reach: "6.500 geteilt",
      title: "„Barrierefreiheit der Wahllokale – unsere Karte“",
      text: "Wir haben alle 34 Wahllokale der Stadt auf Barrierefreiheit geprüft: 29 voll zugänglich, 5 mit Einschränkungen (Karte im Link). Bei Problemen: Wahlschein beantragen und barrierefreies Lokal wählen – das geht!",
      evidence: {
        forensik: "Die Karte ist eine selbst erstellte, saubere Datenvisualisierung mit Quellenangabe.",
        quelle: "Eingetragener Verein, im Register auffindbar, kooperiert laut Website mit der Stadt.",
        account: "Vereinskonto mit langjähriger Inklusions-Arbeit.",
        fakten: "Stichprobe: Die Angaben zu zwei Wahllokalen stimmen mit den offiziellen Angaben der Stadt überein. Der Hinweis zum Wahlschein ist korrekt.",
      },
    },
  ],
};

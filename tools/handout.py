#!/usr/bin/env python3
"""
Erzeugt ANLEITUNG.pdf – die gedruckte Anleitung zum Spiel.

Anders als die frühere Fassung ist das kein Infoblatt mehr, sondern eine
Schritt-für-Schritt-Anleitung im Aufbau der interaktiven Einweisung:
Man liest sie von vorne nach hinten und weiß danach, wie man spielt.
Alle Abbildungen sind echte Screenshots aus dem Spiel (tools/shots.mjs).

Aufruf:
    python -m http.server 8123     # in einem zweiten Fenster
    node tools/shots.mjs
    python tools/handout.py

WICHTIG: Niemals den Tc-Operator (Zeichenabstand) verwenden – er überlebt
Textobjekte und wird von manchen PDF-Betrachtern nicht zurückgesetzt.
Gesperrte Überschriften werden deshalb Zeichen für Zeichen gezeichnet.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

HIER = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HIER, "shots")
ZIEL = os.path.join(os.path.dirname(HIER), "ANLEITUNG.pdf")
URL = "lassetoenjann.github.io/wahlwaechter"

W, H = A4
RAND = 17 * mm
SPALTE = W - 2 * RAND

# Farben aus dem Spiel („Lagezentrum")
BG      = (0.027, 0.043, 0.078)
PANEL   = (0.067, 0.102, 0.180)
LINIE   = (0.141, 0.200, 0.322)
TEXT    = (0.859, 0.902, 0.969)
MUTED   = (0.518, 0.588, 0.722)
CYAN    = (0.216, 0.839, 0.878)
AMBER   = (1.000, 0.714, 0.282)
RED     = (1.000, 0.365, 0.424)
GREEN   = (0.263, 0.851, 0.545)
WEISS   = (1, 1, 1)


def _bild_laden(pfad, max_breite=1150):
    """Screenshots kommen in doppelter Auflösung aus dem Browser. Für den Druck
       reicht rund 200 dpi – ungeskaliert wäre das Handout dreimal so groß."""
    try:
        from io import BytesIO
        from PIL import Image
        bild = Image.open(pfad).convert("RGB")
        if bild.width > max_breite:
            hoehe = round(bild.height * max_breite / bild.width)
            bild = bild.resize((max_breite, hoehe), Image.LANCZOS)
        # Als JPEG in den Speicher: ReportLab übernimmt die Kompression sonst
        # nicht und legt das Bild unkomprimiert ins PDF.
        puffer = BytesIO()
        bild.save(puffer, format="JPEG", quality=82, optimize=True)
        puffer.seek(0)
        return ImageReader(puffer)
    except Exception:
        return ImageReader(pfad)


class Blatt:
    def __init__(self, pfad):
        self.c = canvas.Canvas(pfad, pagesize=A4)
        self.c.setTitle("WAHLWÄCHTER – Anleitung")
        self.c.setAuthor("Projektkurs „KI meets Democracy“")
        self.c.setSubject("Spielanleitung zum Browser-Spiel WAHLWÄCHTER")
        self.seite = 0
        self.y = 0
        self._neue_seite()

    # ---------- Seitengerüst ----------
    def _neue_seite(self):
        if self.seite:
            self._fusszeile()
            self.c.showPage()
        self.seite += 1
        self.c.setFillColorRGB(*BG)
        self.c.rect(0, 0, W, H, fill=1, stroke=0)
        # feines Raster wie im Spiel
        self.c.setStrokeColorRGB(0.216, 0.839, 0.878, alpha=0.05)
        self.c.setLineWidth(0.3)
        for x in range(0, int(W), 24):
            self.c.line(x, 0, x, H)
        for yy in range(0, int(H), 24):
            self.c.line(0, yy, W, yy)
        self.y = H - RAND

    def _fusszeile(self):
        self.c.setFont("Helvetica", 7.5)
        self.c.setFillColorRGB(*MUTED)
        self.c.drawString(RAND, 10 * mm, "WAHLWÄCHTER · " + URL)
        self.c.drawRightString(W - RAND, 10 * mm, "Seite %d" % self.seite)

    def platz(self, hoehe):
        """Sorgt dafür, dass `hoehe` noch auf die Seite passt."""
        if self.y - hoehe < 18 * mm:
            self._neue_seite()

    # ---------- Bausteine ----------
    def gesperrt(self, text, x, y, size, farbe, spacing=1.6):
        """Gesperrte Schrift Zeichen für Zeichen – NIE über den Tc-Operator."""
        self.c.setFont("Helvetica-Bold", size)
        self.c.setFillColorRGB(*farbe)
        for ch in text:
            self.c.drawString(x, y, ch)
            x += self.c.stringWidth(ch, "Helvetica-Bold", size) + spacing
        return x

    def kapitel(self, nummer, titel):
        self.platz(42 * mm)   # Überschrift nie allein am Seitenende
        self.y -= 4 * mm
        self.c.setFillColorRGB(*CYAN)
        self.c.circle(RAND + 3.6 * mm, self.y - 2.4 * mm, 3.6 * mm, fill=1, stroke=0)
        self.c.setFillColorRGB(*BG)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawCentredString(RAND + 3.6 * mm, self.y - 4 * mm, str(nummer))
        self.c.setFillColorRGB(*WEISS)
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawString(RAND + 10 * mm, self.y - 4 * mm, titel)
        self.y -= 11 * mm

    def absatz(self, text, size=9.4, farbe=TEXT, einzug=0, fett_start=None):
        breite = SPALTE - einzug
        self.c.setFont("Helvetica", size)
        zeilen, akt = [], ""
        for wort in text.split():
            probe = (akt + " " + wort).strip()
            if self.c.stringWidth(probe, "Helvetica", size) <= breite:
                akt = probe
            else:
                zeilen.append(akt)
                akt = wort
        if akt:
            zeilen.append(akt)
        self.platz(len(zeilen) * (size + 3.4) + 2 * mm)
        for i, z in enumerate(zeilen):
            if i == 0 and fett_start:
                self.c.setFont("Helvetica-Bold", size)
                self.c.setFillColorRGB(*AMBER)
                self.c.drawString(RAND + einzug, self.y, fett_start)
                versatz = self.c.stringWidth(fett_start + " ", "Helvetica-Bold", size)
                self.c.setFont("Helvetica", size)
                self.c.setFillColorRGB(*farbe)
                self.c.drawString(RAND + einzug + versatz, self.y, z)
            else:
                self.c.setFont("Helvetica", size)
                self.c.setFillColorRGB(*farbe)
                self.c.drawString(RAND + einzug, self.y, z)
            self.y -= size + 3.4
        self.y -= 2 * mm

    def merksatz(self, text, farbe=AMBER):
        self.c.setFont("Helvetica-Bold", 9.4)
        zeilen, akt = [], ""
        for wort in text.split():
            probe = (akt + " " + wort).strip()
            if self.c.stringWidth(probe, "Helvetica-Bold", 9.4) <= SPALTE - 12 * mm:
                akt = probe
            else:
                zeilen.append(akt); akt = wort
        if akt:
            zeilen.append(akt)
        hoehe = len(zeilen) * 13 + 8 * mm
        self.platz(hoehe)
        self.c.setFillColorRGB(*PANEL)
        self.c.rect(RAND, self.y - hoehe + 12, SPALTE, hoehe - 6, fill=1, stroke=0)
        self.c.setFillColorRGB(*farbe)
        self.c.rect(RAND, self.y - hoehe + 12, 1.4 * mm, hoehe - 6, fill=1, stroke=0)
        yy = self.y - 3 * mm
        for z in zeilen:
            self.c.setFillColorRGB(*farbe)
            self.c.setFont("Helvetica-Bold", 9.4)
            self.c.drawString(RAND + 6 * mm, yy, z)
            yy -= 13
        self.y -= hoehe

    def bild(self, name, anteil=1.0, unterschrift=None, max_hoehe_mm=118):
        """Breite steuert die Größe (nicht die Höhe): Screenshots sind hoch,
           über die Höhe skaliert würden sie unlesbar schmal."""
        pfad = os.path.join(SHOTS, name + ".png")
        if not os.path.exists(pfad):
            return
        img = _bild_laden(pfad)
        iw, ih = img.getSize()
        w = SPALTE * anteil
        h = w * ih / iw
        if h > max_hoehe_mm * mm:
            h = max_hoehe_mm * mm
            w = h * iw / ih
        self.platz(h + (8 * mm if unterschrift else 4 * mm))
        x = RAND + (SPALTE - w) / 2
        self.c.setStrokeColorRGB(*LINIE)
        self.c.setLineWidth(0.7)
        self.c.roundRect(x - 1.2, self.y - h - 1.2, w + 2.4, h + 2.4, 3, fill=0, stroke=1)
        self.c.drawImage(img, x, self.y - h, width=w, height=h, mask="auto")
        self.y -= h + 3 * mm
        if unterschrift:
            self.c.setFont("Helvetica-Oblique", 7.8)
            self.c.setFillColorRGB(*MUTED)
            self.c.drawCentredString(W / 2, self.y, unterschrift)
            self.y -= 5 * mm

    def tabelle(self, zeilen, farben=None):
        self.platz(len(zeilen) * 12 + 4 * mm)
        for i, (links, rechts) in enumerate(zeilen):
            f = (farben or {}).get(i, CYAN)
            self.c.setFont("Helvetica", 9)
            self.c.setFillColorRGB(*TEXT)
            self.c.drawString(RAND + 2 * mm, self.y, links)
            self.c.setFont("Helvetica-Bold", 9)
            self.c.setFillColorRGB(*f)
            self.c.drawRightString(W - RAND - 2 * mm, self.y, rechts)
            self.c.setStrokeColorRGB(*LINIE)
            self.c.setLineWidth(0.4)
            self.c.line(RAND, self.y - 3.5, W - RAND, self.y - 3.5)
            self.y -= 12
        self.y -= 3 * mm

    def speichern(self):
        self._fusszeile()
        self.c.save()


def qr_zeichnen(c, x, y, groesse, text):
    """QR-Code als Vektor – bleibt in jeder Druckgröße scharf."""
    try:
        from reportlab.graphics.barcode import qr
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics import renderPDF
        code = qr.QrCodeWidget(text, barLevel="M")
        b = code.getBounds()
        d = Drawing(groesse, groesse, transform=[groesse / (b[2] - b[0]), 0, 0, groesse / (b[3] - b[1]), 0, 0])
        d.add(code)
        c.setFillColorRGB(1, 1, 1)
        c.roundRect(x - 3 * mm, y - 3 * mm, groesse + 6 * mm, groesse + 6 * mm, 2 * mm, fill=1, stroke=0)
        renderPDF.draw(d, c, x, y)
        return True
    except Exception:
        return False


def bauen():
    b = Blatt(ZIEL)
    c = b.c

    # ================= TITELSEITE =================
    b.y = H - 34 * mm
    c.setFont("Helvetica", 8.4)
    c.setFillColorRGB(*CYAN)
    c.drawCentredString(W / 2, b.y, "BUNDESZENTRALE FÜR DIGITALE WAHLINTEGRITÄT · PRÜFSTELLE 7")
    b.y -= 16 * mm

    titel_size = 30
    breite = sum(c.stringWidth(ch, "Helvetica-Bold", titel_size) + 2.2 for ch in "WAHLWÄCHTER")
    x = (W - breite) / 2
    x = b.gesperrt("WAHL", x, b.y, titel_size, WEISS, 2.2)
    b.gesperrt("WÄCHTER", x, b.y, titel_size, CYAN, 2.2)
    b.y -= 9 * mm
    c.setFont("Helvetica", 11)
    c.setFillColorRGB(*MUTED)
    c.drawCentredString(W / 2, b.y, "Duell der Algorithmen – die Anleitung")
    b.y -= 14 * mm

    b.absatz("Drei Wochen vor der Wahl 2032 flutet das KI-Netzwerk HYDRA die Netze mit "
             "Fälschungen, die niemand mehr auf den ersten Blick erkennt. Du leitest die "
             "Prüfstelle: Ermittle, entscheide – und opfere dabei nicht die Freiheit, die "
             "du schützen sollst.", size=10.4)

    b.bild("start", 0.42, "So sieht der Start aus: Namen eintippen, Modus wählen.")

    # QR + Adresse
    b.platz(46 * mm)
    qr_groesse = 30 * mm
    qr_x = (W - qr_groesse) / 2
    b.y -= 4 * mm
    if qr_zeichnen(c, qr_x, b.y - qr_groesse, qr_groesse, "https://" + URL):
        b.y -= qr_groesse + 8 * mm
    c.setFont("Helvetica-Bold", 11)
    c.setFillColorRGB(*CYAN)
    c.drawCentredString(W / 2, b.y, URL)
    b.y -= 6 * mm
    c.setFont("Helvetica", 8.6)
    c.setFillColorRGB(*MUTED)
    c.drawCentredString(W / 2, b.y, "Nichts installieren, nichts anmelden. Seite öffnen und loslegen.")
    b.y -= 10 * mm

    b.merksatz("Am schnellsten geht es mit der Einweisung im Spiel: 12 Schritte, ca. 5 Minuten, "
               "alles einmal selbst ausprobiert. Dieses Heft ist die Fassung zum Nachlesen.", CYAN)

    # ================= 1 · WORUM ES GEHT =================
    b._neue_seite()
    b.kapitel(1, "Worum es geht")
    b.absatz("Dein Auftrag hat zwei Teile – und der zweite wird gern vergessen:")
    b.absatz("Desinformation stoppen.", einzug=6 * mm, fett_start="1.")
    b.absatz("Dabei keine legitimen Beiträge zensieren – nicht Satire, nicht harte "
             "Wahlwerbung, nicht unbequeme Wahrheiten.", einzug=6 * mm, fett_start="2.")
    b.absatz("Wer nur den ersten Teil erfüllt, verliert. Das ist die zentrale Spielidee: "
             "Man gewinnt nicht, indem man die Demokratie opfert.")
    b.merksatz("Alle Beiträge, Parteien, Personen und Medien im Spiel sind frei erfunden. "
               "Die Manipulationstechniken dagegen sind real und dokumentiert – die Auflösung "
               "jedes Falls nennt das Vorbild samt Quelle.")

    b.kapitel(2, "Ein Fall kommt herein")
    b.absatz("Pro Fall siehst du ein Dossier: Absender, Reichweite, Beitragstext, Medium. "
             "Mehr nicht. Echte und gefälschte Beiträge sehen an der Oberfläche gleich "
             "glaubwürdig aus – es gibt keine Fakes mit Rechtschreibfehlern. Raten hilft nicht.")
    b.bild("fall", 1.0, "Links das Dossier, rechts die Prüfwerkzeuge. Oben läuft die Uhr.")
    b.absatz("Oben im Kopf stehen die vier Werte, auf die es ankommt: Woche und Fall-Nummer, "
             "deine Punkte, die Prüf-Energie und der Demokratie-Index. Ändert sich einer, "
             "blinkt er kurz auf.")

    # ================= 3 · WERKZEUGE =================
    b.kapitel(3, "Die vier Prüfwerkzeuge")
    b.absatz("Die Wahrheit findest du nur durch aktives Ermitteln. Alle vier Werkzeuge "
             "entsprechen realen Methoden der Verifikation:")
    b.tabelle([
        ("Medienforensik – Artefakte, Schatten, Lippen, Metadaten", "1 Energie"),
        ("Quellen-Check – Domain-Alter, Impressum, Redaktion?", "1 Energie"),
        ("Account-Analyse – Kontoalter, Muster, Follower", "1 Energie"),
        ("Fakten-Abgleich – berichten andere dasselbe?", "1 Energie"),
    ])
    b.bild("werkzeuge", 0.52, "Jede Prüfung schaltet einen Beweis frei – und kostet Energie.")
    b.merksatz("Ein Indiz ist kein Beweis. Ein zwei Wochen alter Account kann ein Bot sein "
               "oder ein echter Erstwähler. Erst das Muster aus mehreren Kanälen trägt.")
    b.absatz("Steht bei einem Werkzeug „n. a.“, gibt es kein passendes Material – bei einem "
             "reinen Textbeitrag zum Beispiel keine Medienforensik.")
    b.absatz("Die Energie ist knapp: Das Budget einer Woche (14 / 12 / 10) reicht bewusst "
             "nicht, um alle sechs Fälle vollständig zu prüfen. Was übrig bleibt, wird am "
             "Wochenende in Punkte umgewandelt – sparen lohnt sich doppelt.")

    # ================= 4 · URTEIL =================
    b.kapitel(4, "Das Urteil")
    b.absatz("Vor Ablauf der Uhr entscheidest du: FREIGEBEN (echt und legitim) oder "
             "KENNZEICHNEN (KI-Desinformation). Läuft die Zeit ab, zählt das als Fehlurteil – "
             "keine Entscheidung ist auch eine Entscheidung.")
    b.absatz("Nach jedem Urteil kommt die Auflösung: was der Beitrag wirklich war, welche "
             "Indizien es verraten haben und welcher reale Fall dahintersteckt.")
    b.bild("aufloesung", 0.78, "Die Auflösung nennt immer auch das reale Vorbild.")
    b.tabelle([
        ("Richtiges Urteil", "+100"),
        ("Zeitbonus je Restsekunde", "+4"),
        ("Spürnasen-Bonus (höchstens 1 Energie)", "+40"),
        ("Serie (zählt bis 5)", "+20 je Stufe"),
        ("Restenergie am Wochenende", "+10 je Punkt"),
        ("Fake freigegeben", "Index −12"),
        ("Echtes gekennzeichnet", "Index −6"),
        ("Zeit abgelaufen", "Index −8"),
    ], farben={5: RED, 6: RED, 7: RED})

    b.kapitel(5, "Der Demokratie-Index")
    b.absatz("Der Index startet bei 100 und misst das Vertrauen in eine freie, faire Wahl. "
             "Er ist keine Deko, sondern dein Multiplikator:")
    b.merksatz("Endpunktzahl = Rohpunkte × (0,5 + Index / 200)", CYAN)
    b.absatz("Bei Index 100 behältst du den vollen Wert, bei 50 nur drei Viertel. Fällt er "
             "auf 0, ist sofort Schluss: Vertrauenskrise, die Wahl wird angefochten, die "
             "Punkte werden halbiert.")

    # ================= 6 · DILEMMA =================
    b.kapitel(6, "Aufrüsten – aber zu welchem Preis?")
    b.absatz("In der Solo-Kampagne bietet das Ministerium nach Woche 1 und 2 eine Aufrüstung "
             "an. Jede hat einen echten Nutzen und einen echten Preis. Der Verzicht ist immer "
             "wählbar und gibt Index zurück.")
    b.bild("dilemma", 1.0, "Effizienz durch KI gegen demokratische Grundrechte – als Spielzug.")
    b.merksatz("Manchmal ist die stärkste Entscheidung, keine Macht anzunehmen.")

    b.kapitel(7, "Der Showdown: selbst einen Fake bauen")
    b.absatz("Im Finale, im Duell und im Klassenraum wechselst du die Seiten. Du wählst "
             "1 Thema, 1 Format und genau 2 Tarnungen. Jede Tarnung löscht eine Beweisspur – "
             "aber das Budget reicht nicht für die zwei stärksten zusammen.")
    b.bild("werkstatt", 0.92, "Die Fake-Werkstatt: Was verwischst du, was lässt du offen?")
    b.merksatz("Perfekte Tarnung ist unmöglich – irgendein Kanal bleibt immer offen. "
               "Genau darum lohnt sich Prüfen immer.")

    # ================= 8 · JAGD =================
    b.kapitel(8, "Die Jagd")
    b.absatz("Dein Fake landet im Feed einer anderen Person, deren Fake in deinem. Vier "
             "Beiträge, genau einer ist gefälscht, eine einzige Markierung. Bleibt dein Fake "
             "unentdeckt, gibt es Bonuspunkte.")
    b.bild("jagd", 1.0, "Vier Beiträge, sechs Energie, eine Markierung.")

    b.kapitel(9, "Zusammen spielen")
    b.absatz("Wer den Raum erstellt, ist Host und bekommt einen Code aus fünf Zeichen. Alle "
             "anderen tippen ihn ein. In der Lobby sieht man, wer schon da ist; der Host "
             "stellt die Regeln ein und startet.")
    b.bild("lobby", 0.62, "Die Lobby: Code an die Tafel, Regeln beim Host, Start beim Host.")

    # ================= 10 · MODI =================
    b.kapitel(10, "Die Spielarten")
    b.tabelle([
        ("Solo klassisch – 3 Wochen, Dilemmas, Boss-Finale", "15–20 Min"),
        ("Endlos – wird Schicht für Schicht härter", "bis zum Ende"),
        ("Tages-Challenge – täglich neu, für alle gleich", "1 Versuch/Tag"),
        ("Online-Duell – 1 gegen 1 mit Raum-Code", "zu zweit"),
        ("Klassenraum – alle gleichzeitig, Podium am Ende", "bis 30 Geräte"),
    ])
    b.absatz("Die Tages-Challenge wechselt um Mitternacht deutscher Zeit. Ein Teil ihrer "
             "Fälle wird täglich neu erzeugt – zwei Tage sind nie gleich.")
    b.bild("rangliste", 0.82, "Jeder Modus hat seine eigene Rangliste – die Regeln sind zu verschieden.")

    b.kapitel(11, "Für den Unterricht")
    b.absatz("Alle starten die Einweisung (10 Min).", einzug=6 * mm, fett_start="1.")
    b.absatz("Jede:r spielt einmal Solo klassisch (20 Min). Gute Frage danach: Wer hat "
             "Index verloren – durch Fakes oder durch Übersperren?", einzug=6 * mm, fett_start="2.")
    b.absatz("Eine Klassenraum-Runde mit Showdown (20 Min), Code an den Beamer.",
             einzug=6 * mm, fett_start="3.")
    b.absatz("Auswertung (20 Min): Podium ansehen, dann die Fall-Auswertung durchgehen. "
             "Dort steht bei jedem Fall das reale Vorbild – das ist das eigentliche "
             "Unterrichtsmaterial.", einzug=6 * mm, fett_start="4.")
    b.bild("einweisung", 0.86, "Die Einweisung erklärt nichts – sie lässt alles einmal ausprobieren.")
    b.merksatz("Bitte Pseudonyme verwenden: Name, Punktzahl und Statistik landen in einer "
               "öffentlich einsehbaren Online-Rangliste.", AMBER)

    # ================= ABSCHLUSS =================
    b.kapitel(12, "Fünf Sätze, die dich durchbringen")
    for nr, satz in enumerate([
        "Die Oberfläche verrät nichts. Prüfen statt raten – immer.",
        "Ein Indiz ist kein Beweis. Erst das Muster aus mehreren Kanälen trägt.",
        "Nicht alles Empörende ist falsch. Übersperren ist Zensur und kostet Index.",
        "Energie ist Strategie. Was du sparst, wird am Ende zu Punkten.",
        "Der Index ist dein Multiplikator. Man gewinnt nicht, indem man die Demokratie opfert.",
    ], 1):
        b.absatz(satz, size=10.2, einzug=6 * mm, fett_start="%d." % nr)

    b.y -= 6 * mm
    b.merksatz("Viel Erfolg in der Prüfstelle 7.", GREEN)

    b.y -= 4 * mm
    b.absatz("Nicht-kommerzielles Schulprojekt aus dem Projektkurs „KI meets Democracy“. "
             "Sämtliche Spielinhalte sind frei erfunden; Ähnlichkeiten mit realen Personen "
             "oder Organisationen sind unbeabsichtigt. Das Spiel verwendet keine Cookies, "
             "kein Tracking und keine Werbung. Für Rangliste, Duell und Klassenraum werden "
             "Name und Punktzahl an einen externen Speicherdienst übertragen und sind dort "
             "öffentlich einsehbar – bitte ein Pseudonym verwenden. Ausführlich im Spiel "
             "unter „Rechtliches & Datenschutz“.", size=7.8, farbe=MUTED)

    b.speichern()
    print("ANLEITUNG.pdf geschrieben:", ZIEL)


if __name__ == "__main__":
    bauen()

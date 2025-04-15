# Smart Home Dashboard - Projektspezifikation

## 1. Projektübersicht
Das Smart Home Dashboard ist eine webbasierte Anwendung zur Steuerung und Überwachung von Räumen, Temperatur, Heizung und Beleuchtung.

## 2. Technische Anforderungen
- Technologiestack: HTML5, CSS3, JavaScript
- Responsive Design
- Lokale Speicherung der Raumdaten
- Benutzerfreundliche Steuerungsoberfläche

## 3. Funktionale Anforderungen

### 3.1 Raumverwaltung
- Räume individuell hinzufügen, bearbeiten und löschen
- Jedem Raum zuordnen:
  * Name
  * Aktuelle Temperatur
  * Heizungsstatus
  * Lichtstatus
  * Temperaturgrenzwerte

### 3.2 Temperatursteuerung
- Einstellbare Temperaturparameter pro Raum:
  * Minimale Aktivierungstemperatur
  * Gewünschte Zieltemperatur
  * Heizungsstufen (z.B. 1-5)

### 3.3 Heizungssteuerung
- Ein-/Ausschalten der Heizung
- Automatische Aktivierung bei Unterschreiten der Mindesttemperatur
- Manuelle Steuerung der Heizungsstufe

### 3.4 Beleuchtungssteuerung
- Ein-/Ausschalten des Lichts
- Status der Beleuchtung pro Raum

## 4. Benutzeroberfläche

### 4.1 Hauptansicht
- Übersicht aller Räume
- Temperaturanzeige für jeden Raum
- Heizungs- und Lichtstatus
- Schnellzugriff auf Steuerungselemente

### 4.2 Testbereich
- Kleines Fenster unten links
- Manuelle Temperaturanpassung
- Direkte Steuerung von Heizung und Licht

## 5. Technische Implementierung

### 5.1 Datenstruktur
```javascript
class Raum {
    constructor(name) {
        this.name = name;
        this.temperatur = 20;
        this.heizungAktiv = false;
        this.heizungStufe = 0;
        this.lichtAktiv = false;
        this.mindestTemperatur = 18;
        this.zielTemperatur = 22;
    }

    heizungSteuern(aktiv, stufe) {
        this.heizungAktiv = aktiv;
        this.heizungStufe = stufe;
    }

    lichtSteuern(aktiv) {
        this.lichtAktiv = aktiv;
    }

    temperaturAktualisieren(neuTemperatur) {
        this.temperatur = neuTemperatur;
    }
}
```

### 5.2 Lokale Speicherung
- Verwendung von `localStorage`
- Automatische Speicherung der Raumkonfigurationen
- Persistenz der Einstellungen zwischen Sitzungen

## 6. Entwicklungshinweise
- Modular aufgebauter Code
- Klare Trennung von Logik und Darstellung
- Fehlerbehandlung und Validierung
- Responsive Design für verschiedene Bildschirmgrößen

## 7. To-Do Liste
- [ ] HTML-Grundgerüst erstellen
- [ ] CSS-Styling entwickeln
- [ ] JavaScript-Logik implementieren
- [ ] Lokale Speicherung integrieren
- [ ] Testszenarien entwickeln
- [ ] Benutzeroberfläche optimieren

## 8. Empfohlene Erweiterungen
- Mehrbenutzer-Unterstützung
- Cloud-Synchronisation
- Sprachsteuerung
- Energieverbrauchsanalyse

## 9. Sicherheitshinweise
- Keine sensiblen Daten speichern
- Lokale Verarbeitung bevorzugen
- Eingabevalidierung implementieren

class Room {
    constructor(name) {
        this.name = name;
        this.temperatur = 20;
        this.heizungAktiv = false;
        this.heizungStufe = 0;
        this.lichtAktiv = false;
        this.mindestTemperatur = 18;
        this.zielTemperatur = 22;
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        // Neue Eigenschaften für Nachtmodus
        this.nachtmodusAktiv = false;
        this.nachtmodusStart = "23:00";
        this.nachtmodusEnde = "07:00";
        this.nachtmodusMindestTemp = 16;
    }

    heizungSteuern(aktiv, stufe) {
        this.heizungAktiv = aktiv;
        this.heizungStufe = stufe;
        if (!aktiv) {
            this.heizungStufe = 0;
        }
    }

    istNachtmodus() {
        if (!this.nachtmodusAktiv) return false;
        
        const jetzt = new Date();
        const aktuelleStunde = jetzt.getHours();
        const aktuelleMinuten = jetzt.getMinutes();
        
        const [startStunde, startMinuten] = this.nachtmodusStart.split(":").map(Number);
        const [endeStunde, endeMinuten] = this.nachtmodusEnde.split(":").map(Number);
        
        const aktuelleZeit = aktuelleStunde * 60 + aktuelleMinuten;
        const startZeit = startStunde * 60 + startMinuten;
        const endeZeit = endeStunde * 60 + endeMinuten;
        
        if (startZeit > endeZeit) {
            // Nachtmodus geht über Mitternacht
            return aktuelleZeit >= startZeit || aktuelleZeit <= endeZeit;
        } else {
            // Nachtmodus innerhalb eines Tages
            return aktuelleZeit >= startZeit && aktuelleZeit <= endeZeit;
        }
    }

    berechneHeizungsstufe() {
        if (this.istNachtmodus()) {
            return Math.min(this.nachtmodusStufe, this.berechneNormaleStufe());
        }
        return this.berechneNormaleStufe();
    }

    berechneNormaleStufe() {
        const differenz = this.zielTemperatur - this.temperatur;
        if (differenz <= 0) return 0;
        if (differenz < 2) return 1;
        if (differenz < 4) return 2;
        if (differenz < 6) return 3;
        if (differenz < 8) return 4;
        return 5;
    }

    lichtSteuern(aktiv) {
        this.lichtAktiv = aktiv;
    }

    temperaturAktualisieren(neuTemperatur) {
        this.temperatur = parseFloat(neuTemperatur);
        
        // Automatische Heizungssteuerung
        const aktuelleMinTemp = this.istNachtmodus() ? this.nachtmodusMindestTemp : this.mindestTemperatur;
        
        if (this.temperatur < aktuelleMinTemp) {
            this.heizungSteuern(true, this.berechneHeizungsstufe());
        } else if (this.temperatur >= this.zielTemperatur) {
            this.heizungSteuern(false, 0);
        }
    }

    setzeZieltemperatur(temperatur) {
        this.zielTemperatur = parseFloat(temperatur);
        this.temperaturAktualisieren(this.temperatur);
    }

    setzeMindesttemperatur(temperatur) {
        this.mindestTemperatur = parseFloat(temperatur);
        this.temperaturAktualisieren(this.temperatur);
    }

    setzeNachtmodusEinstellungen(aktiv, start, ende, mindestTemp) {
        this.nachtmodusAktiv = aktiv;
        this.nachtmodusStart = start;
        this.nachtmodusEnde = ende;
        this.nachtmodusMindestTemp = parseFloat(mindestTemp);
        this.temperaturAktualisieren(this.temperatur);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            temperatur: this.temperatur,
            heizungAktiv: this.heizungAktiv,
            heizungStufe: this.heizungStufe,
            lichtAktiv: this.lichtAktiv,
            mindestTemperatur: this.mindestTemperatur,
            zielTemperatur: this.zielTemperatur,
            nachtmodusAktiv: this.nachtmodusAktiv,
            nachtmodusStart: this.nachtmodusStart,
            nachtmodusEnde: this.nachtmodusEnde,
            nachtmodusMindestTemp: this.nachtmodusMindestTemp
        };
    }

    static fromJSON(data) {
        const room = new Room(data.name);
        Object.assign(room, data);
        return room;
    }
} 
class SmartHomeDashboard {
    constructor() {
        this.rooms = [];
        this.selectedRoomId = null;
        this.securityStatus = {
            alarm: true,
            door: 'locked' // Mögliche Werte: 'locked', 'closed', 'open'
        };
        this.selectedCamera = 1;
        this.initializeDefaultRooms();
        this.setupWelcomeScreen();
        this.renderRooms();
        this.setupTestArea();
        this.setupClock();
        this.setupSecurityControls();
        
        // Timer für regelmäßige Aktualisierung der Heizungsstufen
        setInterval(() => this.aktualisiereAlleRaeume(), 60000); // Jede Minute

        // Stelle den letzten Zustand des Testpanels wieder her
        const isCollapsed = localStorage.getItem('testPanelCollapsed') === 'true';
        if (isCollapsed) {
            this.toggleTestPanel();
        }

        const energySimulation = new EnergySimulation();
    }

    initializeDefaultRooms() {
        const defaultRooms = [
            'Wohnzimmer',
            'Schlafzimmer',
            'Büro',
            'Küche',
            'Bad',
            'Flur'
        ];

        // Lade gespeicherte Raumdaten
        const savedRooms = JSON.parse(localStorage.getItem('smartHomeRooms') || '[]');
        const savedRoomsMap = new Map(savedRooms.map(room => [room.name, room]));

        // Erstelle oder aktualisiere Räume
        this.rooms = defaultRooms.map(roomName => {
            const savedRoom = savedRoomsMap.get(roomName);
            if (savedRoom) {
                return Room.fromJSON(savedRoom);
            }
            return new Room(roomName);
        });

        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        localStorage.setItem('smartHomeRooms', JSON.stringify(this.rooms));
    }

    initializeEventListeners() {
        // Entferne den alten Button-Listener, da wir jetzt die leere Room-Card verwenden
    }

    addRoom(name) {
        const room = new Room(name);
        this.rooms.push(room);
        this.saveToLocalStorage();
        this.renderRooms();
        this.setupTestArea();
    }

    deleteRoom(roomId) {
        this.rooms = this.rooms.filter(room => room.id !== roomId);
        this.saveToLocalStorage();
        this.schliesseEinstellungen();
        this.renderRooms();
        this.setupTestArea();
    }

    renderRooms() {
        const container = document.getElementById('rooms-container');
        container.innerHTML = '';

        this.rooms.forEach((room, index) => {
            const roomElement = this.createRoomElement(room);
            container.appendChild(roomElement);
        });
    }

    createRoomElement(room) {
        const div = document.createElement('div');
        div.className = 'room-card';
        div.innerHTML = `
            <h2>${room.name}</h2>
            <div class="room-controls">
                <div class="temperature-display">${room.temperatur.toFixed(1)}°C</div>
                <div class="temperature-info">
                    <h3>Zieltemperatur: ${room.zielTemperatur}°C</h3>
                    <h3>Nachtmodus Min.: ${room.nachtmodusMindestTemp || 16}°C</h3>
                    <h3 class="heating-level ${room.heizungAktiv ? 'active' : ''}">
                        Heizstufe: ${room.heizungAktiv ? room.heizungStufe : '0'}
                    </h3>
                </div>
            </div>
            <div class="room-buttons">
                <button class="btn light-btn ${room.lichtAktiv ? 'light-on' : ''}" 
                    onclick="dashboard.toggleLight('${room.id}')">
                    <img src="resources/icons/${room.lichtAktiv ? 'bulb-on' : 'bulb-off'}.svg" alt="Licht ${room.lichtAktiv ? 'aus' : 'ein'}">
                </button>
                <button class="btn heating-btn ${room.heizungAktiv ? 'heating-on' : ''}" 
                    onclick="dashboard.toggleHeating('${room.id}')">
                    <img src="resources/icons/${room.heizungAktiv ? 'heat-on' : 'heat-off'}.svg" alt="Heizung ${room.heizungAktiv ? 'aus' : 'ein'}">
                </button>
                ${this.createSmartDeviceButtons(room)}
                <button class="btn settings-btn" onclick="dashboard.zeigeEinstellungen('${room.id}')">
                    <img src="resources/icons/settings.svg" alt="Einstellungen">
                </button>
            </div>
        `;
        return div;
    }

    createSmartDeviceButtons(room) {
        if (!room.smartDevices || !room.smartDeviceStates) return '';
        
        return room.smartDevices.map(deviceId => `
            <button class="btn smart-device-btn ${room.smartDeviceStates[deviceId] ? 'active' : 'inactive'}" 
                onclick="dashboard.toggleSmartDevice('${room.id}', '${deviceId}')">
                <img src="resources/icons/${deviceId}.svg" alt="${deviceId}">
            </button>
        `).join('');
    }

    zeigeEinstellungen(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Einstellungen für ${room.name}</h2>
                <div class="settings-group">
                    <h3>Temperatur</h3>
                    <div class="setting-item">
                        <label>Zieltemperatur:</label>
                        <input type="number" id="zieltemp" 
                            value="${room.zielTemperatur}" 
                            min="15" max="30" step="0.5">°C
                    </div>
                </div>
                <div class="settings-group">
                    <h3>Smart-Geräte</h3>
                    <div class="smart-devices-list">
                        ${this.getAvailableDevicesHTML(room)}
                    </div>
                </div>
                <div class="settings-group">
                    <h3>Nachtmodus</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="nachtmodus-aktiv" 
                                ${room.nachtmodusAktiv ? 'checked' : ''}>
                            Nachtmodus aktivieren
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>Start:</label>
                        <input type="time" id="nachtmodus-start" 
                            value="${room.nachtmodusStart}">
                    </div>
                    <div class="setting-item">
                        <label>Ende:</label>
                        <input type="time" id="nachtmodus-ende" 
                            value="${room.nachtmodusEnde}">
                    </div>
                    <div class="setting-item">
                        <label>Mindesttemperatur:</label>
                        <input type="number" id="nachtmodus-mindesttemp" 
                            value="${room.nachtmodusMindestTemp || 16}" 
                            min="15" max="30" step="0.5">°C
                    </div>
                </div>
                <div class="modal-buttons">
                    <div class="modal-action-buttons">
                        <button class="btn" onclick="dashboard.schliesseEinstellungen()">Abbrechen</button>
                        <button class="btn primary" onclick="dashboard.speichereEinstellungen('${room.id}')">Speichern</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    schliesseEinstellungen() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }

    speichereEinstellungen(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) return;

        const zieltemp = document.getElementById('zieltemp').value;
        const nachtmodusAktiv = document.getElementById('nachtmodus-aktiv').checked;
        const nachtmodusStart = document.getElementById('nachtmodus-start').value;
        const nachtmodusEnde = document.getElementById('nachtmodus-ende').value;
        const nachtmodusMindestTemp = document.getElementById('nachtmodus-mindesttemp').value;

        // Sammle ausgewählte Smart-Geräte
        const smartDevices = Array.from(document.querySelectorAll('.device-item input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.dataset.deviceId);

        // Initialisiere Gerätezustände für neue Geräte
        if (!room.smartDeviceStates) {
            room.smartDeviceStates = {};
        }
        smartDevices.forEach(deviceId => {
            if (!(deviceId in room.smartDeviceStates)) {
                room.smartDeviceStates[deviceId] = false;
            }
        });

        room.smartDevices = smartDevices;
        room.setzeZieltemperatur(zieltemp);
        room.setzeNachtmodusEinstellungen(
            nachtmodusAktiv,
            nachtmodusStart,
            nachtmodusEnde,
            nachtmodusMindestTemp
        );

        this.saveToLocalStorage();
        this.renderRooms();
        this.schliesseEinstellungen();
    }

    aktualisiereAlleRaeume() {
        this.rooms.forEach(room => {
            room.temperaturAktualisieren(room.temperatur);
        });
        this.renderRooms();
    }

    setupTestArea() {
        const testControls = document.getElementById('test-controls');
        const roomSelector = testControls.querySelector('.test-room-selector');
        const temperatureControl = testControls.querySelector('.test-temperature-control');

        // Füge Toggle-Button hinzu
        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn test-panel-toggle';
        toggleButton.innerHTML = '▼';
        toggleButton.onclick = () => this.toggleTestPanel();
        document.querySelector('.test-panel').prepend(toggleButton);

        roomSelector.innerHTML = `
            <h4>Testmodus</h4>
            <div class="test-mode-control">
                <input type="checkbox" id="auto-test-mode" class="customCheckBoxInput">
                <div class="customCheckBoxWrapper">
                    <label for="auto-test-mode">
                        <div class="customCheckBox">
                            <div class="inner">✓</div>
                        </div>
                        Automatischer Testmodus (alle Räume)
                    </label>
                </div>
            </div>
        `;

        temperatureControl.innerHTML = `
            <h4>Temperaturbereich:</h4>
            <div class="test-temperature-range">
                <span>15°C</span>
                <span>30°C</span>
            </div>
        `;

        this.setupTestAreaEventListeners();
    }

    toggleTestPanel() {
        const panel = document.querySelector('.test-panel');
        const toggleButton = panel.querySelector('.test-panel-toggle');
        const isCollapsed = panel.classList.toggle('collapsed');
        
        // Ändere den Pfeil je nach Zustand
        toggleButton.innerHTML = isCollapsed ? '▲' : '▼';
        
        // Speichere den Zustand
        localStorage.setItem('testPanelCollapsed', isCollapsed);
    }

    setupTestAreaEventListeners() {
        const autoTestMode = document.getElementById('auto-test-mode');
        let testInterval;
        const cooldownTimers = new Map(); // Speichert die Abkühlzeiten für jeden Raum

        // Automatischer Testmodus
        autoTestMode.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Reduziere sofort die Temperatur aller Räume um 4 Grad
                this.rooms.forEach(room => {
                    const newTemp = Math.max(15, room.temperatur - 4);
                    room.temperaturAktualisieren(newTemp);
                });
                this.saveToLocalStorage();
                this.renderRooms();

                // Starte automatischen Test für alle Räume
                testInterval = setInterval(() => {
                    this.rooms.forEach(room => {
                        const now = Date.now();
                        const cooldownEnd = cooldownTimers.get(room.id);
                        
                        // Prüfe, ob der Raum sich in der Abkühlphase befindet
                        if (cooldownEnd && now < cooldownEnd) {
                            // Während der Abkühlphase sinkt die Temperatur
                            const newTemp = Math.max(15, room.temperatur - 0.1);
                            room.temperaturAktualisieren(newTemp);
                            room.heizungSteuern(false, 0); // Heizung aus während Abkühlphase
                        } else if (cooldownEnd && now >= cooldownEnd) {
                            // Abkühlphase ist vorbei
                            cooldownTimers.delete(room.id);
                        } else {
                            // Normale Temperaturänderung basierend auf Heizungsstatus
                            if (room.heizungAktiv) {
                                // Temperatur steigt nur wenn Heizung aktiv
                                const newTemp = Math.min(30, room.temperatur + 0.2);
                                room.temperaturAktualisieren(newTemp);

                                // Prüfe, ob Zieltemperatur erreicht wurde
                                if (newTemp >= room.zielTemperatur) {
                                    // Starte 30-Sekunden-Abkühlphase
                                    cooldownTimers.set(room.id, now + 30000);
                                    room.heizungSteuern(false, 0); // Heizung aus
                                }
                            } else {
                                // Wenn Heizung aus, leichtes Abkühlen
                                const newTemp = Math.max(15, room.temperatur - 0.05);
                                room.temperaturAktualisieren(newTemp);
                                
                                // Prüfe, ob Heizung eingeschaltet werden soll
                                if (newTemp < room.zielTemperatur) {
                                    const stufe = this.berechneHeizungsstufe(newTemp, room.zielTemperatur);
                                    room.heizungSteuern(true, stufe);
                                }
                            }
                        }
                    });
                    
                    this.saveToLocalStorage();
                    this.renderRooms();
                }, 2000); // Alle 2 Sekunden
            } else {
                // Stoppe automatischen Test
                if (testInterval) {
                    clearInterval(testInterval);
                }
                // Lösche alle Abkühlzeiten
                cooldownTimers.clear();
            }
        });
    }

    berechneHeizungsstufe(istTemp, zielTemp) {
        const differenz = zielTemp - istTemp;
        
        // Stufen basierend auf der Temperaturdifferenz
        if (differenz <= 2) return 1;        // bis 1°C Differenz
        if (differenz <= 4) return 2;        // bis 2°C Differenz
        if (differenz <= 5.5) return 3;        // bis 3°C Differenz
        if (differenz <= 6) return 4;        // bis 4°C Differenz
        return 5;                            // über 4°C Differenz
    }

    updateTargetTemp(roomId, value) {
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            room.setzeZieltemperatur(value);
            this.saveToLocalStorage();
            this.renderRooms();
        }
    }

    updateMinTemp(roomId, value) {
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            room.setzeMindesttemperatur(value);
            this.saveToLocalStorage();
            this.renderRooms();
        }
    }

    toggleLight(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            room.lichtSteuern(!room.lichtAktiv);
            this.saveToLocalStorage();
            this.renderRooms();
        }
    }

    toggleHeating(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            if (!room.heizungAktiv) {
                // Wenn Heizung eingeschaltet wird, berechne passende Stufe
                const stufe = this.berechneHeizungsstufe(room.temperatur, room.zielTemperatur);
                room.heizungSteuern(true, stufe);
            } else {
                room.heizungSteuern(false, 0);
            }
            this.saveToLocalStorage();
            this.renderRooms();
        }
    }

    getAvailableDevicesHTML(room) {
        const devices = [
            { id: 'ac', name: 'Klimaanlage', icon: 'ac.svg' },
            { id: 'speaker', name: 'Lautsprecher', icon: 'speaker.svg' },
            { id: 'router', name: 'Router', icon: 'router.svg' },
            { id: 'refrigerator', name: 'Kühlschrank', icon: 'refrigerator.svg' }
        ];

        const activeDevices = room.smartDevices || [];

        return devices.map(device => `
            <div class="device-item">
                <input type="checkbox" 
                       id="device-${device.id}"
                       data-device-id="${device.id}" 
                       class="customCheckBoxInput"
                       ${activeDevices.includes(device.id) ? 'checked' : ''}>
                <div class="customCheckBoxWrapper">
                    <label for="device-${device.id}">
                        <div class="customCheckBox">
                            <div class="inner">✓</div>
                        </div>
                        <img src="resources/icons/${device.icon}" alt="${device.name}">
                        ${device.name}
                    </label>
                </div>
            </div>
        `).join('');
    }

    toggleSmartDevice(roomId, deviceId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) return;

        if (!room.smartDeviceStates) {
            room.smartDeviceStates = {};
        }

        room.smartDeviceStates[deviceId] = !room.smartDeviceStates[deviceId];
        this.saveToLocalStorage();
        this.renderRooms();
    }

    setupClock() {
        // Füge das Clock-Element zum Header hinzu
        const header = document.querySelector('header');
        const clockDiv = document.createElement('div');
        clockDiv.className = 'clock';
        clockDiv.innerHTML = `
            <div class="time"></div>
            <div class="date"></div>
        `;
        header.appendChild(clockDiv);

        // Aktualisiere die Uhrzeit und das Datum jede Sekunde
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            // Formatiere das Datum
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            const dateString = now.toLocaleDateString('de-DE', options);
            
            clockDiv.querySelector('.time').textContent = `${hours}:${minutes}`;
            clockDiv.querySelector('.date').textContent = dateString;
        };

        updateClock(); // Initial ausführen
        setInterval(updateClock, 1000); // Jede Sekunde aktualisieren
    }

    setupWelcomeScreen() {
        // Erstelle Willkommensbildschirm
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen';
        welcomeScreen.innerHTML = `
            <div class="welcome-content">
                <h1>Welcome Home</h1>
            </div>
        `;

        // Erstelle den Header mit der korrekten Struktur
        const header = document.createElement('header');
        header.innerHTML = `
            <h1 class="header-title">
                <span class="highlight">S</span>
                <span class="letter">m</span>
                <span class="letter">a</span>
                <span class="letter">r</span>
                <span class="letter">t</span>
                <span class="highlight">H</span>
                <span class="letter">o</span>
                <span class="letter">m</span>
                <span class="letter">e</span>
            </h1>
        `;

        // Wickle den bestehenden Inhalt in einen Dashboard-Container
        const dashboardContent = document.createElement('div');
        dashboardContent.className = 'dashboard-content';
        
        // Verschiebe allen bestehenden Body-Inhalt in den Dashboard-Container
        while (document.body.firstChild) {
            const child = document.body.firstChild;
            // Überspringe den Header, falls er bereits existiert
            if (child.tagName === 'HEADER') {
                document.body.removeChild(child);
                continue;
            }
            dashboardContent.appendChild(child);
        }
        
        // Füge den Header zum Body hinzu
        document.body.appendChild(header);
        
        // Füge Dashboard und Willkommensbildschirm zum Body hinzu
        document.body.appendChild(dashboardContent);
        document.body.appendChild(welcomeScreen);

        // Füge Klick-Event hinzu
        welcomeScreen.addEventListener('click', () => {
            // Starte Fade-out Animation für den Welcome-Content
            const welcomeContent = welcomeScreen.querySelector('.welcome-content');
            welcomeContent.classList.add('fade-out');

            // Blende Welcome Screen nach der Content-Animation aus
            setTimeout(() => {
                welcomeScreen.classList.add('hidden');
                welcomeScreen.remove();
                // Blende Dashboard ein
                dashboardContent.classList.add('visible');
                
                // Warte einen Moment, bis der DOM aktualisiert ist
                requestAnimationFrame(() => {
                    // Starte die Animation nach einer kurzen Verzögerung
                    setTimeout(animateHeaderTitle, 100);
                });
            }, 500);
        });
    }

    setupSecurityControls() {
        // Alarmsystem Button
        document.getElementById('alarmSystem').addEventListener('click', () => {
            this.securityStatus.alarm = !this.securityStatus.alarm;
            this.updateSecurityStatus();
        });

        // Tür Button
        document.getElementById('doorLock').addEventListener('click', () => {
            switch(this.securityStatus.door) {
                case 'locked':
                    this.securityStatus.door = 'closed';
                    break;
                case 'closed':
                    this.securityStatus.door = 'open';
                    break;
                case 'open':
                    this.securityStatus.door = 'locked';
                    break;
            }
            this.updateSecurityStatus();
        });

        this.updateSecurityStatus();
    }

    updateSecurityStatus() {
        // Aktualisiere Alarmsystem Status
        const alarmStatus = document.querySelector('.security-status .status-item:first-child .value');
        alarmStatus.className = 'value ' + (this.securityStatus.alarm ? 'active' : 'inactive');
        alarmStatus.textContent = this.securityStatus.alarm ? 'Aktiviert' : 'Deaktiviert';

        // Aktualisiere Tür Status
        const doorStatus = document.querySelector('.security-status .status-item:last-child .value');
        doorStatus.className = 'value ' + this.securityStatus.door;
        switch(this.securityStatus.door) {
            case 'locked':
                doorStatus.textContent = 'Verriegelt';
                break;
            case 'closed':
                doorStatus.textContent = 'Geschlossen';
                break;
            case 'open':
                doorStatus.textContent = 'Offen';
                break;
        }
    }

    openCameraView() {
        const modal = document.getElementById('cameraModal');
        modal.style.display = 'flex';
        this.setupCameraControls();
    }

    closeCameraView() {
        const modal = document.getElementById('cameraModal');
        modal.style.display = 'none';
    }

    setupCameraControls() {
        const cameraBtns = document.querySelectorAll('.camera-btn');
        const closeBtn = document.querySelector('#cameraModal .close-btn');
        
        // Event-Listener für Kamera-Buttons
        cameraBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cameraNumber = e.target.dataset.camera;
                this.switchCamera(cameraNumber);
            });
        });

        // Event-Listener für Schließen-Button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCameraView());
        }

        // Schließen bei Klick außerhalb des Modals
        const modal = document.getElementById('cameraModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCameraView();
            }
        });
    }

    switchCamera(cameraNumber) {
        // Aktualisiere aktiven Button
        document.querySelectorAll('.camera-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.camera === cameraNumber) {
                btn.classList.add('active');
            }
        });

        // Aktualisiere Kamera-Label
        const cameraLabel = document.querySelector('.camera-label');
        cameraLabel.textContent = `Kamera ${cameraNumber}`;
    }
}

class EnergyChart {
    constructor() {
        this.ctx = document.getElementById('energyChart').getContext('2d');
        this.dailyEnergyDisplay = document.getElementById('dailyEnergy');
        this.weeklyEnergyDisplay = document.getElementById('weeklyEnergy');
        this.data = {
            labels: [],
            values: []
        };
        this.initChart();
    }

    initChart() {
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: this.data.labels,
                datasets: [{
                    label: 'Energieverbrauch (kWh/h)',
                    data: this.data.values,
                    borderColor: '#000000',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Verbrauch (kWh/h)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Zeit'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateChart(consumption) {
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');

        this.data.labels.push(timeString);
        this.data.values.push(consumption);

        // Behalte nur die letzten 20 Datenpunkte
        if (this.data.labels.length > 20) {
            this.data.labels.shift();
            this.data.values.shift();
        }

        this.chart.data.labels = this.data.labels;
        this.chart.data.datasets[0].data = this.data.values;
        this.chart.update();
    }

    updateEnergyStats(dailyConsumption, weeklyConsumption) {
        this.dailyEnergyDisplay.textContent = dailyConsumption.toFixed(2);
        this.weeklyEnergyDisplay.textContent = weeklyConsumption.toFixed(2);
    }
}

class EnergySimulation {
    constructor() {
        this.baseConsumption = 0.2; // Grundverbrauch pro Raum
        this.lightConsumption = 0.1; // Verbrauch pro Licht
        this.heatingConsumption = [0, 0.3, 0.6, 0.9, 1.2, 1.5]; // Verbrauch pro Heizstufe
        this.deviceConsumption = {
            'ac': 0.8,
            'speaker': 0.1,
            'router': 0.05,
            'refrigerator': 0.4
        };
        this.currentConsumption = 0;
        this.totalConsumption = 0;
        this.weeklyConsumption = 0;
        this.lastUpdate = new Date();
        this.chart = new EnergyChart();
        
        this.startSimulation();
    }

    startSimulation() {
        setInterval(() => this.updateConsumption(), 1000);
    }

    updateConsumption() {
        const now = new Date();
        
        // Berechne den aktuellen Verbrauch basierend auf allen aktiven Geräten
        this.currentConsumption = this.calculateTotalConsumption();
        
        // Aktualisiere den Gesamtverbrauch
        const hoursSinceLastUpdate = (now - this.lastUpdate) / (1000 * 60 * 60);
        this.totalConsumption += this.currentConsumption * hoursSinceLastUpdate;
        this.weeklyConsumption += this.currentConsumption * hoursSinceLastUpdate;
        
        // Aktualisiere Chart und Statistiken
        this.chart.updateChart(this.currentConsumption);
        this.chart.updateEnergyStats(this.totalConsumption, this.weeklyConsumption);
        
        this.lastUpdate = now;

        // Reset täglich um Mitternacht
        if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
            this.totalConsumption = 0;
        }
        
        // Reset wöchentlich am Sonntag um Mitternacht
        if (now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
            this.weeklyConsumption = 0;
        }
    }

    calculateTotalConsumption() {
        let totalConsumption = 0;

        // Iteriere über alle Räume aus dem Dashboard
        dashboard.rooms.forEach(room => {
            // Grundverbrauch pro Raum
            totalConsumption += this.baseConsumption;

            // Verbrauch für Licht
            if (room.lichtAktiv) {
                totalConsumption += this.lightConsumption;
            }

            // Verbrauch für Heizung basierend auf Heizstufe
            if (room.heizungAktiv) {
                totalConsumption += this.heatingConsumption[room.heizungStufe];
            }

            // Verbrauch für Smart Devices
            if (room.smartDevices && room.smartDeviceStates) {
                room.smartDevices.forEach(deviceId => {
                    if (room.smartDeviceStates[deviceId] && this.deviceConsumption[deviceId]) {
                        totalConsumption += this.deviceConsumption[deviceId];
                    }
                });
            }

            // Zusätzlicher Verbrauch basierend auf Temperaturdifferenz
            const tempDiff = Math.abs(room.zielTemperatur - room.temperatur);
            if (room.heizungAktiv) {
                totalConsumption += tempDiff * 0.1; // Mehr Verbrauch bei größerer Temperaturdifferenz
            }
        });

        return totalConsumption;
    }
}

// Initialisiere die Anwendung
const dashboard = new SmartHomeDashboard();

// Globale Funktionen für die Animation
function moveLetterBehindHighlight(letter, highlight) {
    if (!letter || !highlight) return;
    
    // Positionen berechnen
    const letterRect = letter.getBoundingClientRect();
    const highlightRect = highlight.getBoundingClientRect();
    
    // Animation einstellen
    letter.style.transition = 'transform 0.8s ease-in-out, opacity 0.8s ease-in-out';
    
    // Buchstabe zum Highlight bewegen und ausblenden
    const xDistance = highlightRect.left - letterRect.left;
    letter.style.transform = `translateX(${xDistance}px)`;
    letter.style.opacity = '0';
}

function animateHeaderTitle() {
    console.log("Animation startet...");
    
    // Warte einen Moment, bis der DOM vollständig aktualisiert ist
    requestAnimationFrame(() => {
        const headerTitle = document.querySelector('.header-title');
        if (!headerTitle) {
            console.error("Header-Title nicht gefunden!");
            return;
        }
        
        const highlights = headerTitle.querySelectorAll('.highlight');
        if (!highlights || highlights.length < 2) {
            console.error("Highlights nicht gefunden!");
            return;
        }
        
        const highlightS = highlights[0];
        const highlightH = highlights[1];
        
        // Buchstaben "mart"
        const letterM = headerTitle.querySelector('.letter:nth-child(2)');
        const letterA = headerTitle.querySelector('.letter:nth-child(3)');
        const letterR = headerTitle.querySelector('.letter:nth-child(4)');
        const letterT = headerTitle.querySelector('.letter:nth-child(5)');
        
        // Buchstaben "ome"
        const letterO = headerTitle.querySelector('.letter:nth-child(7)');
        const letterM2 = headerTitle.querySelector('.letter:nth-child(8)');
        const letterE = headerTitle.querySelector('.letter:nth-child(9)');
        
        if (!letterM || !letterA || !letterR || !letterT || !letterO || !letterM2 || !letterE) {
            console.error("Einige Buchstaben wurden nicht gefunden!");
            return;
        }
        
        // Positionen für die Animation berechnen
        const sRect = highlightS.getBoundingClientRect();
        const hRect = highlightH.getBoundingClientRect();
        
        console.log("Buchstaben gefunden, starte Animation...");
        
        // Buchstaben "mart" nacheinander zum S bewegen
        setTimeout(() => moveLetterBehindHighlight(letterM, highlightS), 500);
        setTimeout(() => moveLetterBehindHighlight(letterA, highlightS), 700);
        setTimeout(() => moveLetterBehindHighlight(letterR, highlightS), 900);
        setTimeout(() => moveLetterBehindHighlight(letterT, highlightS), 1100);
        
        // Buchstaben "ome" nacheinander zum H bewegen
        setTimeout(() => moveLetterBehindHighlight(letterO, highlightH), 500);
        setTimeout(() => moveLetterBehindHighlight(letterM2, highlightH), 700);
        setTimeout(() => moveLetterBehindHighlight(letterE, highlightH), 900);
        
        // Nach allen Buchstaben-Animationen das H zum S bewegen
        setTimeout(() => {
            console.log("H bewegt sich zum S...");
            // H zum S bewegen mit 30px Abstand
            highlightH.style.transition = 'transform 2s ease-in-out';
            
            // Berechne die Distanz zwischen H und S
            const distance = hRect.left - sRect.right - 30;
            highlightH.style.transform = `translateX(-${distance}px)`;
            
            // Header nach links bewegen
            headerTitle.classList.add('animation-complete');
        }, 2500);
    });
} 
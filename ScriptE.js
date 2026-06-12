// ==========================================================================
// CORE GIS ENGINE LOGIC - YOGYAKARTA AREA
// ==========================================================================

// 1. Mock Database Spasial Awal Titik Kondisi Emosi di Yogyakarta
let spatialDataset = [
    { name: "Andi", emotion: "Senang", desc: "Suasana pedestrian Malioboro sore ini bersih dan nyaman", lat: -7.7924, lng: 110.3658, cls: "senang", icon: "😊", hour: 16 },
    { name: "Rina", emotion: "Emosi", desc: "Macet parah merayap di Simpang Tugu Pal Putih", lat: -7.7829, lng: 110.3671, cls: "emosi", icon: "😡", hour: 18 },
    { name: "Joko", emotion: "Sedih", desc: "Turun hujan gerimis syahdu di kawasan Titik Nol Km", lat: -7.8012, lng: 110.3647, cls: "sedih", icon: "😢", hour: 18 },
    { name: "Siti", emotion: "Khawatir", desc: "Antrean kendaraan padat di Jalan Solo", lat: -7.7834, lng: 110.3904, cls: "khawatir", icon: "😟", hour: 12 },
    { name: "Yunus", emotion: "Senang", desc: "Udara segar sejuk di sekitar Alun-alun Kidul", lat: -7.8118, lng: 110.3632, cls: "senang", icon: "😊", hour: 18 }
];

let mapObject;
let markerLayerGroup;
let heatmapLayer; 
let activeFilter = "all";
let mapMode = "heatmap"; // Default mode render utama
let timelineInterval;
let isRealtimeActive = true;

// DOM Elements Selector
const sliderElement = document.getElementById('time-slider');
const sliderTipElement = document.getElementById('slider-tip');
const liveIndicatorElement = document.getElementById('toggle-live');
const liveText = document.getElementById('live-text');

// 2. Initial Map Setup (Fokus Pusat Koordinat Yogyakarta)
if (document.getElementById('map-gis')) {
    mapObject = L.map('map-gis', { zoomControl: false }).setView([-7.7970, 110.3705], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapObject);

    // Inisialisasi Group Layer spasial
    markerLayerGroup = L.layerGroup().addTo(mapObject);
    heatmapLayer = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 17 }).addTo(mapObject);

    // Jalankan sistem waktu real-time komputer saat pertama dijalankan
    initTimelineEngine();
}

// 3. Fungsi Rendering Titik Map Berdasarkan Mode (Heatmap ATAU Cluster/Marker)
function renderSpatialLayers() {
    if (!mapObject) return;
    
    // Bersihkan peta dari rendering sisa sebelumnya
    markerLayerGroup.clearLayers();
    heatmapLayer.setLatLngs([]);

    let selectedHour = parseInt(sliderElement.value);
    let heatPoints = [];

    spatialDataset.forEach(point => {
        // A. Filter Berdasarkan Kategori Tombol Atas Peta
        if (activeFilter !== "all" && point.emotion !== activeFilter) return;
        
        // B. Filter Logika Waktu
        if (isRealtimeActive) {
            if (point.hour > selectedHour) return; 
        } else {
            if (point.hour !== selectedHour) return;
        }

        if (mapMode === "cluster") {
            // RENDERING JIKA USER MEMILIH MODE CLUSTER MARKER RADAR (EMOJI EMOSI)
            let customMarkerIcon = `
                <div class="glow-marker-container">
                    <div class="glow-radar radar-${point.cls}"></div>
                    <div class="glow-core core-${point.cls}">${point.icon}</div>
                </div>`;

            let leafletDivIcon = L.divIcon({ html: customMarkerIcon, className: '', iconSize: [40, 40] });

            L.marker([point.lat, point.lng], { icon: leafletDivIcon })
                .addTo(markerLayerGroup)
                .bindPopup(`
                    <div style="font-family:'Inter', sans-serif; padding:2px;">
                        <b style="font-size:13px; color:#3b82f6;">${point.name} (${point.emotion})</b>
                        <p style="margin-top:6px; font-size:11.5px; color:#b9bbbe; line-height:1.4;">"${point.desc}"</p>
                        <span style="font-size:10px; color:#737b9e; display:block; margin-top:6px;"><i class="fa-regular fa-clock"></i> ${point.hour}:00 WIB</span>
                    </div>
                `);
        } else {
            // RENDERING JIKA USER MEMILIH MODE HEATMAP INTENSITAS
            let intensity = 0.5;
            if (point.emotion === "Emosi") intensity = 0.9;
            if (point.emotion === "Khawatir") intensity = 0.7;
            
            heatPoints.push([point.lat, point.lng, intensity]);
        }
    });

    if (mapMode === "heatmap") {
        heatmapLayer.setLatLngs(heatPoints);
    }
}

// 4. Logika Toggle Penggantian Layer (Heatmap vs Cluster)
const btnHeatmap = document.getElementById('btn-heatmap');
const btnCluster = document.getElementById('btn-cluster');

if (btnHeatmap && btnCluster) {
    btnHeatmap.addEventListener('click', function() {
        btnCluster.classList.remove('active');
        this.classList.add('active');
        mapMode = "heatmap";
        renderSpatialLayers();
    });

    btnCluster.addEventListener('click', function() {
        btnHeatmap.classList.remove('active');
        this.classList.add('active');
        mapMode = "cluster";
        renderSpatialLayers();
    });
}

// 5. Logika Filter Tombol Atas Peta
document.querySelectorAll('.emotion-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.emotion-filters .filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.getAttribute('data-filter');
        renderSpatialLayers();
    });
});

// 6. Logika Sinkronisasi Engine Waktu Nyata (Mengikuti Jam & Menit Perangkat Laptop/PC)
function initTimelineEngine() {
    if (isRealtimeActive) {
        let now = new Date();
        let currentHour = now.getHours();
        let currentMinute = now.getMinutes();
        
        sliderElement.value = currentHour;
        updateSliderVisualRealtime(currentHour, currentMinute);
        renderSpatialLayers();
    }

    // Interval diperbarui setiap detik untuk mendeteksi pergeseran menit riil
    clearInterval(timelineInterval);
    timelineInterval = setInterval(() => {
        if (isRealtimeActive) {
            let now = new Date();
            let currentHour = now.getHours();
            let currentMinute = now.getMinutes();
            
            // Perbarui visualisasi teks agar jam dan menit terus berjalan dinamis
            sliderElement.value = currentHour;
            updateSliderVisualRealtime(currentHour, currentMinute);
            
            // Peta otomatis melakukan render ulang jika jam perangkat bergeser
            if (parseInt(sliderElement.value) !== currentHour) {
                renderSpatialLayers();
            }
        }
    }, 1000);
}

// Fungsi visualisasi khusus mode Realtime (Menampilkan Menit Aktif)
function updateSliderVisualRealtime(hour, minute) {
    if (!sliderTipElement) return;
    let displayHH = hour < 10 ? "0" + hour : hour;
    let displayMM = minute < 10 ? "0" + minute : minute;
    
    sliderTipElement.innerText = `${displayHH}:${displayMM}`;
    sliderTipElement.style.left = `calc(${(hour / 23) * 100}% - 12px)`;
}

// Fungsi visualisasi standar mode Manual (Dibulatkan ke jam :00)
function updateSliderVisualManual(hour) {
    if (!sliderTipElement) return;
    sliderTipElement.innerText = (hour < 10 ? "0" + hour : hour) + ":00";
    sliderTipElement.style.left = `calc(${(hour / 23) * 100}% - 12px)`;
}

// Deteksi input manual geser slider timeline
if (sliderElement) {
    sliderElement.addEventListener('input', function() {
        isRealtimeActive = false;
        if (liveIndicatorElement) {
            liveIndicatorElement.classList.remove('active');
            liveText.innerText = "Manual";
        }
        clearInterval(timelineInterval); 
        updateSliderVisualManual(parseInt(this.value));
        renderSpatialLayers();
    });
}

// Klik tombol status indikator "Realtime" di pojok kanan bawah
if (liveIndicatorElement) {
    liveIndicatorElement.addEventListener('click', function() {
        isRealtimeActive = !isRealtimeActive;
        if (isRealtimeActive) {
            this.classList.add('active');
            liveText.innerText = "Realtime";
            initTimelineEngine(); 
        } else {
            this.classList.remove('active');
            liveText.innerText = "Manual";
            clearInterval(timelineInterval);
            updateSliderVisualManual(parseInt(sliderElement.value));
        }
    });
}

// ==========================================================================
// 7. SINKRONISASI GEOLOCATION & FORM SUBMISSION (EMOJI PLOTTING)
// ==========================================================================
const emotionForm = document.getElementById('submission-form');
const btnGps = document.getElementById('btn-trigger-gps');

if (emotionForm && btnGps) {
    
    // Fungsi Mengambil Lokasi Riil via Geolocation API Perangkat
    btnGps.addEventListener('click', () => {
        btnGps.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mencari Satelit...`;
        btnGps.disabled = true;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    let deviceLat = position.coords.latitude;
                    let deviceLng = position.coords.longitude;

                    document.getElementById('inp-lat').value = deviceLat.toFixed(6);
                    document.getElementById('inp-lng').value = deviceLng.toFixed(6);
                    
                    btnGps.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Lokasi Device Terkunci!`;
                    btnGps.style.borderColor = "#10b981";
                    btnGps.style.color = "#10b981";
                    btnGps.disabled = false;
                },
                (error) => {
                    console.warn("Akses Geolocation ditolak, menggunakan acuan koordinat Yogyakarta.");
                    
                    let fallbackLat = -7.7970 + (Math.random() - 0.5) * 0.02;
                    let fallbackLng = 110.3705 + (Math.random() - 0.5) * 0.02;
                    
                    document.getElementById('inp-lat').value = fallbackLat.toFixed(4);
                    document.getElementById('inp-lng').value = fallbackLng.toFixed(4);
                    
                    btnGps.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> GPS Off (Simulasi Aktif)`;
                    btnGps.style.borderColor = "#f59e0b";
                    btnGps.style.color = "#f59e0b";
                    btnGps.disabled = false;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 0
                }
            );
        } else {
            alert("Browser Anda tidak mendukung deteksi lokasi Geolocation.");
            btnGps.disabled = false;
        }
    });

    // Proses Submit data spasial emosi baru
    emotionForm.addEventListener('submit', function(e) {
        e.preventDefault();

        let name = document.getElementById('inp-name').value;
        let emotion = document.getElementById('inp-emotion').value;
        let lat = parseFloat(document.getElementById('inp-lat').value);
        let lng = parseFloat(document.getElementById('inp-lng').value);
        let desc = document.getElementById('inp-desc').value;

        if (isNaN(lat) || isNaN(lng)) {
            alert("Harap isi koordinat Latitude dan Longitude dengan benar!");
            return;
        }

        let cls = "senang"; let icon = "😊";
        if (emotion === "Sedih") { cls = "sedih"; icon = "😢"; }
        else if (emotion === "Emosi") { cls = "emosi"; icon = "😡"; }
        else if (emotion === "Khawatir") { cls = "khawatir"; icon = "😟"; }

        // Ambil waktu riil saat form dikirim
        let now = new Date();
        let currentHour = now.getHours();
        let currentMinute = now.getMinutes();

        // Menyisipkan data input baru ke dalam database peta
        spatialDataset.push({ name, emotion, desc, lat, lng, cls, icon, hour: currentHour });

        // Ubah visualisasi ke mode "Cluster" secara otomatis agar representasi bentuk Emoji langsung terlihat
        mapMode = "cluster";
        btnHeatmap.classList.remove('active');
        btnCluster.classList.add('active');

        // Kembalikan slider waktu ke jam saat ini
        isRealtimeActive = true;
        if (liveIndicatorElement) {
            liveIndicatorElement.classList.add('active');
            liveText.innerText = "Realtime";
        }
        sliderElement.value = currentHour;
        updateSliderVisualRealtime(currentHour, currentMinute);

        // Render ulang lapisan peta & arahkan pandangan kamera langsung ke koordinat baru tersebut
        renderSpatialLayers();
        mapObject.setView([lat, lng], 15);

        // Reset komponen Form ke kondisi awal
        emotionForm.reset();
        
        btnGps.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Ambil Koordinat Jogja (GPS)`;
        btnGps.style.borderColor = "#3b82f6";
        btnGps.style.color = "#3b82f6";
        
        let displayMM = currentMinute < 10 ? "0" + currentMinute : currentMinute;
        alert(`Sukses! Kondisi emosi ${name} berhasil di-plot ke dalam peta pada pukul ${currentHour}:${displayMM} WIB.`);
    });
}
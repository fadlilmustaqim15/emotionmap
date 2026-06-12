document.addEventListener("DOMContentLoaded", function () {
    // 0. KONFIGURASI FIREBASE
    // Silakan ganti dengan config dari Firebase Console milikmu (Project Settings > Web App)
    const firebaseConfig = {
        apiKey: "AIzaSyCgJUfDUlqhmRCrvIdZOx0ZELzPqLxE5So",
        authDomain: "emotionmap1172300.firebaseapp.com",
        databaseURL: "https://emotionmap1172300-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "emotionmap1172300",
        storageBucket: "emotionmap1172300.firebasestorage.app",
        messagingSenderId: "844653226562",
        appId: "1:844653226562:web:77a1c46600d8e1e3929bdb"
    };

    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const emotionsRef = database.ref('emotions');

    // 1. INISIALISASI ENGINE SPASIAL PETA
    const map = L.map('map', {
        zoomControl: true 
    }).setView([-7.7956, 110.3695], 13); // Fokus default di Yogyakarta

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    const markerLayerGroup = L.layerGroup().addTo(map);

    // 2. BASIS DATA AWAL (Ditambahkan properti 'waktuDibuat' menggunakan Timestamp)
    let allDataFromFirebase = []; // Menampung semua data mentah dari DB
    let initialData = [];         // Menampung data yang sudah difilter (aktif)

    // KONFIGURASI DURASI (10 Menit = 10 * 60 * 1000 milidetik)
    const DURASI_MASA_AKTIF = 10 * 60 * 1000; 
    // 💡 TIPS LIVE TEST: Ubah ke (5 * 1000) jika ingin mengetes emot hilang dalam 5 detik!

    // 3. FUNGSI UNTUK MERENDER MARKER EMOJI
    function renderMarkers(dataArray) {
        markerLayerGroup.clearLayers(); 

        dataArray.forEach(item => {
            let color = "#f59e0b"; 
            let emoji = "😐";
            let className = "marker-neutral";

            if (item.emosi === "Positif") {
                color = "#10b981"; 
                emoji = "😊";
                className = "marker-positive";
            } else if (item.emosi === "Negatif") {
                color = "#ef4444"; 
                emoji = "😢";
                className = "marker-negative";
            }

            const customIcon = L.divIcon({
                html: `<div class="custom-emoji-marker ${className}">${emoji}</div>`,
                className: '', 
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([item.lat, item.lng], { icon: customIcon });

            // Menghitung sisa waktu aktif untuk ditampilkan di popup
            const sisaWaktuMenit = Math.ceil((DURASI_MASA_AKTIF - (Date.now() - item.waktuDibuat)) / 60000);

            marker.bindPopup(`
                <div style="color: #fff; background: #0e1026; font-family: 'Inter', sans-serif; font-size:12px;">
                    <b style="font-size:14px;">${item.nama} ${emoji}</b><br>
                    <span style="color: ${color}; font-weight:bold;">Status: ${item.emosi}</span><br>
                    <p style="margin-top:5px; color:#94a3b8;">${item.desc}</p>
                    <hr style="border-color: #1e2246; margin: 8px 0;">
                    <span style="color: #f59e0b; font-size: 10px;"><i class="fa-solid fa-clock"></i> Aktif ±${sisaWaktuMenit > 0 ? sisaWaktuMenit : 1} mnt lagi</span>
                </div>
            `);

            markerLayerGroup.addLayer(marker);
        });
    }

    // 4. FUNGSI UPDATE STATISTIK DASHBOARD
    function updateDashboardStats(dataArray) {
        const total = dataArray.length;
        
        if (total === 0) {
            // Jika data habis karena kedaluwarsa, setel ulang ke 0%
            document.querySelectorAll('.card-value, .sentiment-labels span:last-child').forEach(el => el.innerText = "0%");
            document.getElementById('idx-total').innerText = "0";
            document.querySelectorAll('.progress').forEach(bar => bar.style.width = "0%");
            return;
        }

        const positifCount = dataArray.filter(d => d.emosi === "Positif").length;
        const negatifCount = dataArray.filter(d => d.emosi === "Negatif").length;
        const netralCount = dataArray.filter(d => d.emosi === "Netral").length;

        const pctPositif = Math.round((positifCount / total) * 100) || 0;
        const pctNegatif = Math.round((negatifCount / total) * 100) || 0;
        const pctNetral = Math.round((netralCount / total) * 100) || 0;

        document.getElementById('pct-positif').innerText = `${pctPositif}%`;
        document.getElementById('pct-negatif').innerText = `${pctNegatif}%`;
        document.getElementById('pct-neutral').innerText = `${pctNetral}%`;

        document.getElementById('bar-positif').style.width = `${pctPositif}%`;
        document.getElementById('bar-negatif').style.width = `${pctNegatif}%`;
        document.getElementById('bar-netral').style.width = `${pctNetral}%`;

        document.getElementById('idx-emotional').innerText = `${pctPositif}%`;
        document.getElementById('idx-total').innerText = total;
        document.getElementById('idx-stress').innerText = `${pctNegatif}%`;
        document.getElementById('idx-neutral').innerText = `${pctNetral}%`;
    }

    // 4.5. FUNGSI FILTER & REFRESH TAMPILAN
    function refreshDisplay() {
        const waktuSekarang = Date.now();
        // Hanya ambil data yang belum melewati durasi masa aktif
        initialData = allDataFromFirebase.filter(item => {
            return (waktuSekarang - item.waktuDibuat) < DURASI_MASA_AKTIF;
        });

        renderMarkers(initialData);
        updateDashboardStats(initialData);
    }

    // 4.6. LISTENER REAL-TIME FIREBASE
    // Fungsi ini terpanggil otomatis setiap ada data baru di database
    emotionsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        allDataFromFirebase = [];
        if (data) {
            Object.keys(data).forEach(key => {
                allDataFromFirebase.push(data[key]);
            });
        }
        refreshDisplay();
    }, (error) => {
        console.error("Firebase Error:", error);
    });

    // ⏳ AGENT PEMBERSIH AUTOMATIS (BACKGROUND JOB)
    setInterval(function() {
        refreshDisplay();
    }, 5000); // Check setiap 5000 ms (5 detik)


    // 5. GEOLOCATION GPS SENSOR
    const btnGps = document.getElementById('btn-gps');
    const gpsStatus = document.getElementById('gps-status');
    const inputLat = document.getElementById('input-lat');
    const inputLng = document.getElementById('input-lng');

    btnGps.addEventListener('click', function() {
        if (!navigator.geolocation) {
            gpsStatus.innerText = "❌ Browser tidak mendukung sensor GPS.";
            gpsStatus.style.color = "#ef4444";
            return;
        }

        gpsStatus.innerText = "⏳ Menghubungkan ke GPS...";
        gpsStatus.style.color = "#f59e0b";

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const currentLat = position.coords.latitude;
                const currentLng = position.coords.longitude;
                inputLat.value = currentLat.toFixed(6);
                inputLng.value = currentLng.toFixed(6);
                gpsStatus.innerText = "🔒 GPS Berhasil Terkunci! ✔";
                gpsStatus.style.color = "#10b981";
                map.setView([currentLat, currentLng], 15);
            },
            function(error) {
                gpsStatus.style.color = "#ef4444";
                gpsStatus.innerText = "❌ Gagal mengunci koordinat GPS.";
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });

    // 6. EVENT LISTENER FORM SUBMIT
    const form = document.getElementById('emotion-form');
    form.addEventListener('submit', function (e) {
        e.preventDefault(); 

        const nama = document.getElementById('input-nama').value;
        const emosi = document.getElementById('input-emosi').value;
        const lat = parseFloat(inputLat.value);
        const lng = parseFloat(inputLng.value);
        const desc = document.getElementById('input-desc').value;

        if (isNaN(lat) || isNaN(lng)) {
            alert("Harap kunci lokasi Anda terlebih dahulu menggunakan GPS!");
            return;
        }

        // Masukkan objek data baru + stamp waktu saat tombol kirim diklik
        const newDataItem = { 
            nama, 
            emosi, 
            lat, 
            lng, 
            desc, 
            waktuDibuat: Date.now() // Waktu pembuatan data
        };
        
        // SIMPAN KE FIREBASE (Ganti push lokal ke push database)
        emotionsRef.push(newDataItem)
            .then(() => console.log("Data berhasil terkirim"))
            .catch((err) => {
                alert("Gagal mengirim data: " + err.message);
            });

        // Fokuskan peta ke lokasi baru
        map.setView([lat, lng], 14);

        form.reset();
        gpsStatus.innerText = "Lokasi belum terdeteksi";
        gpsStatus.style.color = "#64748b";
    });

});
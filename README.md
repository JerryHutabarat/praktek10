# 🌦️ WeatherFinder

Aplikasi cuaca real-time berbasis React Native (Expo SDK 54) yang menggunakan Open-Meteo API — **gratis, tanpa API key, tanpa registrasi**.

---

## 📋 Daftar Fitur

### 🟢 Level 1 — Core (Wajib)
- [x] `TextInput` controlled component (`value` + `onChangeText`)
- [x] Debounce **500ms** (`setTimeout` + `clearTimeout`) — 1 kota = 1 request
- [x] `useEffect` dengan dependency array `[searchInput]`
- [x] Fetch **2 langkah**: Geocoding API → Forecast API (Open-Meteo)
- [x] **4 kondisi UI**: Kosong (hint + saran kota) · Loading (spinner) · Error (pesan merah) · Sukses (kartu cuaca)
- [x] `AbortController` di cleanup function untuk batalkan request lama
- [x] Mapping **20+ kode WMO** → label Indonesia + emoji
- [x] Tampilkan: nama kota, provinsi, negara, suhu, kondisi cuaca

### 🟡 Level 2 — Pengembangan (Semua 6 Fitur)
- [x] 🧭 **Arah & Kecepatan Angin** — `windspeed` (km/j) + konversi derajat → U/TL/T/TG/S/BD/B/BL
- [x] 🌙 **Indikator Siang/Malam** — field `is_day` (0/1) mengubah ikon header + badge kartu
- [x] 🌡️ **Suhu Min/Maks Harian** — parameter `daily=temperature_2m_max,temperature_2m_min` + tampilan kartu khusus
- [x] 🕘 **Riwayat 5 Kota Terakhir** — disimpan di state array, tampil sebagai chip yang bisa di-tap
- [x] 🔄 **Tombol Refresh** — tombol ↻ di header untuk fetch ulang kota yang sama
- [x] 🎨 **Background Dinamis** — warna background berubah per kondisi cuaca (cerah/mendung/hujan/badai/malam)

### 🔴 Level 3 — Bonus
- [x] ✨ **Animasi fade-in** — kartu cuaca muncul dengan `Animated.parallel` (opacity + translateY)
- [x] 🔃 **Pull-to-refresh** — tarik layar ke bawah untuk refresh data (`RefreshControl`)

---

## 📱 Screenshot

> Ambil screenshot dari Expo Go dan tambahkan ke folder `screenshots/`

| Kosong | Loading | Sukses | Home |
|--------|---------|--------|-------|
| *(weather-finder\Screenshot\home.jpeg)* | *(weather-finder\Screenshot\Kosong.jpeg)* | *(weather-finder\Screenshot\Loading.jpeg)* | *(weather-finder\Screenshot\SuksesMenemukan.jpeg)* |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Aplikasi **Expo Go** di HP (iOS / Android)

### Langkah

```bash
# 1. Clone repo
git clone https://github.com/<username>/weather-finder.git
cd weather-finder

# 2. Install dependencies
npm install

# 3. Jalankan development server
npx expo start

# 4. Scan QR code dengan Expo Go di HP
```

---

## 🌐 API yang Digunakan

Semua dari **Open-Meteo** — 100% gratis, tanpa registrasi, tanpa API key.

| API | Fungsi | Endpoint |
|-----|--------|----------|
| Geocoding | Nama kota → koordinat | `geocoding-api.open-meteo.com/v1/search` |
| Forecast | Koordinat → data cuaca | `api.open-meteo.com/v1/forecast` |

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|---------|
| React Native | 0.76 | Framework UI |
| Expo SDK | 54 | Runtime & tooling |
| Open-Meteo API | — | Data cuaca (gratis) |
| React Hooks | — | `useState`, `useEffect`, `useRef`, `useCallback` |
| Animated API | — | Animasi fade-in kartu cuaca |
| AbortController | — | Batalkan request lama saat debounce |

---

## 🔗 Link

- **Expo Snack**: [https://snack.expo.dev/@jerryhutabarat/ramalan-cuaca]
- **GitHub**: [https://github.com/JerryHutabarat/praktek10.git]

---

## 📝 Catatan Teknis

- Debounce 500ms: input berhenti 0,5 detik → baru fetch. Mencegah spam request tiap huruf.
- `AbortController`: setiap kali `searchInput` berubah, request sebelumnya dibatalkan via `signal`.
- Riwayat kota disimpan di React state (non-persistent). Untuk persistent, gunakan `AsyncStorage` (Pertemuan 12).
- Background dinamis dihitung dari kode WMO + field `is_day` setiap data baru masuk.

---

*Praktikum Pertemuan 10 · React Native · Open-Meteo API*
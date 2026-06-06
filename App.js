import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");

// ── Weather code mapping ──────────────────────────────────────────────────────
const WMO_CODES = {
  0: { label: "Cerah", emoji: "☀️" },
  1: { label: "Sebagian Cerah", emoji: "🌤️" },
  2: { label: "Berawan Sebagian", emoji: "⛅" },
  3: { label: "Mendung", emoji: "☁️" },
  45: { label: "Berkabut", emoji: "🌫️" },
  48: { label: "Kabut Beku", emoji: "🌫️" },
  51: { label: "Gerimis Ringan", emoji: "🌦️" },
  53: { label: "Gerimis Sedang", emoji: "🌦️" },
  55: { label: "Gerimis Lebat", emoji: "🌧️" },
  61: { label: "Hujan Ringan", emoji: "🌧️" },
  63: { label: "Hujan Sedang", emoji: "🌧️" },
  65: { label: "Hujan Lebat", emoji: "⛈️" },
  71: { label: "Salju Ringan", emoji: "🌨️" },
  73: { label: "Salju Sedang", emoji: "❄️" },
  75: { label: "Salju Lebat", emoji: "❄️" },
  80: { label: "Hujan Deras", emoji: "🌧️" },
  85: { label: "Hujan Salju", emoji: "🌨️" },
  95: { label: "Badai Petir", emoji: "⛈️" },
  99: { label: "Badai + Hujan Es", emoji: "⛈️" },
};

const getWeatherInfo = (code) =>
  WMO_CODES[code] ?? { label: "Tidak Diketahui", emoji: "🌡️" };

// ── Geocoding ─────────────────────────────────────────────────────────────────
const geocodeCity = async (city) => {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`,
  );
  const data = await res.json();
  if (!data.results?.length) throw new Error("Kota tidak ditemukan");
  const { latitude, longitude, name, country, admin1 } = data.results[0];
  return { latitude, longitude, name, country, admin1 };
};

// ── Fetch weather ─────────────────────────────────────────────────────────────
const fetchWeather = async (lat, lon) => {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,` +
    `weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,uv_index` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  return res.json();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const windDir = (deg) => {
  const dirs = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];
  return dirs[Math.round(deg / 45) % 8];
};

const fmtHour = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
};

const fmtDay = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const uvLabel = (uv) => {
  if (uv <= 2) return { text: "Rendah", color: "#00b894" };
  if (uv <= 5) return { text: "Sedang", color: "#fdcb6e" };
  if (uv <= 7) return { text: "Tinggi", color: "#e17055" };
  if (uv <= 10) return { text: "Sangat Tinggi", color: "#d63031" };
  return { text: "Ekstrem", color: "#6c5ce7" };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const backAnim = useRef(new Animated.Value(0)).current;

  // Pulse tombol search
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Fade-in hasil cuaca + animasi tombol back
  useEffect(() => {
    if (weather) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      backAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(backAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]).start();
    }
  }, [weather]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const city = query.trim();
    if (!city) return;
    setLoading(true);
    setError("");
    setWeather(null);
    try {
      const loc = await geocodeCity(city);
      const data = await fetchWeather(loc.latitude, loc.longitude);
      setLocation(loc);
      setWeather(data);
    } catch (e) {
      setError(e.message || "Gagal mengambil data cuaca");
    } finally {
      setLoading(false);
    }
  };

  // ── Back ke Home ────────────────────────────────────────────────────────────
  const handleBackToHome = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setWeather(null);
      setLocation(null);
      setQuery("");
      setError("");
    });
  };

  const cur = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const info = cur ? getWeatherInfo(cur.weather_code) : null;

  const hourSlice = hourly
    ? hourly.time.slice(1, 13).map((t, i) => ({
        time: t,
        temp: hourly.temperature_2m[i + 1],
        code: hourly.weather_code[i + 1],
      }))
    : [];

  // Interpolasi animasi back button
  const backTranslateX = backAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0],
  });
  const backOpacity = backAnim;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="light-content" backgroundColor="#050d1a" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Tombol Back — muncul dengan animasi slide saat ada hasil cuaca */}
        {weather && (
          <Animated.View
            style={{
              opacity: backOpacity,
              transform: [{ translateX: backTranslateX }],
              marginRight: 12,
            }}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackToHome}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backLabel}>Home</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Ikon app — tampil hanya saat di home */}
        {!weather && <Text style={styles.appIcon}>🌦️</Text>}

        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>WeatherFinder</Text>
          <Text style={styles.appTagline}>Cuaca real-time seluruh dunia</Text>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Cari kota... (contoh: Medan, Tokyo)"
          placeholderTextColor="#4a6a8a"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>🔍</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Error ── */}
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* ── Skeleton loading ── */}
      {loading && (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonBar,
                { opacity: 1 - i * 0.2, width: `${100 - i * 12}%` },
              ]}
            />
          ))}
        </View>
      )}

      {/* ── Hasil Cuaca ── */}
      {weather && cur && (
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.cityName}>
                  {location?.name}
                  {location?.admin1 ? `, ${location.admin1}` : ""}
                </Text>
                <Text style={styles.countryName}>{location?.country}</Text>
                <Text style={styles.weatherLabel}>{info.label}</Text>
              </View>
              <Text style={styles.weatherEmoji}>{info.emoji}</Text>
            </View>

            <Text style={styles.tempMain}>
              {Math.round(cur.temperature_2m)}°
            </Text>
            <Text style={styles.feelsLike}>
              Terasa seperti {Math.round(cur.apparent_temperature)}°C
            </Text>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <StatChip
                icon="💧"
                label="Kelembaban"
                value={`${cur.relative_humidity_2m}%`}
              />
              <StatChip
                icon="🌬️"
                label="Angin"
                value={`${Math.round(cur.wind_speed_10m)} km/j`}
              />
              <StatChip
                icon="🧭"
                label="Arah"
                value={windDir(cur.wind_direction_10m)}
              />
            </View>
            <View style={styles.statsRow}>
              <StatChip
                icon="🌡️"
                label="Tekanan"
                value={`${Math.round(cur.surface_pressure)} hPa`}
              />
              <StatChip
                icon="☔"
                label="Presipitasi"
                value={`${cur.precipitation} mm`}
              />
              <StatChip
                icon="🕶️"
                label="UV Index"
                value={`${cur.uv_index ?? "—"}`}
                extra={cur.uv_index != null ? uvLabel(cur.uv_index) : null}
              />
            </View>
          </View>

          {/* Prakiraan per Jam */}
          <SectionTitle title="⏱  Prakiraan per Jam" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyScroll}
          >
            {hourSlice.map((h, i) => {
              const hi = getWeatherInfo(h.code);
              return (
                <View key={i} style={styles.hourCard}>
                  <Text style={styles.hourTime}>{fmtHour(h.time)}</Text>
                  <Text style={styles.hourEmoji}>{hi.emoji}</Text>
                  <Text style={styles.hourTemp}>{Math.round(h.temp)}°</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* 7 Hari */}
          <SectionTitle title="📅  7 Hari ke Depan" />
          {daily &&
            daily.time.map((day, i) => {
              const di = getWeatherInfo(daily.weather_code[i]);
              const probStr =
                daily.precipitation_probability_max[i] != null
                  ? `☔ ${daily.precipitation_probability_max[i]}%`
                  : "";
              return (
                <View key={i} style={styles.dailyRow}>
                  <Text style={styles.dailyEmoji}>{di.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dailyDay}>
                      {i === 0 ? "Hari ini" : fmtDay(day)}
                    </Text>
                    <Text style={styles.dailyLabel}>{di.label}</Text>
                  </View>
                  <Text style={styles.dailyRain}>{probStr}</Text>
                  <View style={styles.dailyTemps}>
                    <Text style={styles.dailyMax}>
                      {Math.round(daily.temperature_2m_max[i])}°
                    </Text>
                    <Text style={styles.dailyMin}>
                      {Math.round(daily.temperature_2m_min[i])}°
                    </Text>
                  </View>
                </View>
              );
            })}

          {/* Matahari */}
          {daily && (
            <>
              <SectionTitle title="🌅  Matahari Hari Ini" />
              <View style={styles.sunRow}>
                <SunCard icon="🌅" label="Terbit" time={daily.sunrise[0]} />
                <View style={styles.sunDivider} />
                <SunCard icon="🌇" label="Terbenam" time={daily.sunset[0]} />
              </View>
            </>
          )}

          <Text style={styles.footer}>
            Sumber: Open-Meteo • Diperbarui otomatis
          </Text>
        </Animated.View>
      )}

      {/* ── Empty State ── */}
      {!weather && !loading && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌍</Text>
          <Text style={styles.emptyTitle}>Temukan cuaca kotamu</Text>
          <Text style={styles.emptyText}>
            Ketik nama kota di kolom pencarian,{"\n"}lalu tekan tombol 🔍 atau
            Enter.
          </Text>
          <View style={styles.suggestionRow}>
            {["Medan", "Jakarta", "Surabaya", "Bali", "Tokyo", "London"].map(
              (c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.suggestionChip}
                  onPress={() => setQuery(c)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{c}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function StatChip({ icon, label, value, extra }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, extra && { color: extra.color }]}>
        {value}
      </Text>
      {extra && (
        <Text style={[styles.statExtra, { color: extra.color }]}>
          {extra.text}
        </Text>
      )}
    </View>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SunCard({ icon, label, time }) {
  const t = new Date(time);
  const formatted = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  return (
    <View style={styles.sunCard}>
      <Text style={styles.sunIcon}>{icon}</Text>
      <Text style={styles.sunLabel}>{label}</Text>
      <Text style={styles.sunTime}>{formatted}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050d1a" },
  content: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingBottom: 48,
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  appIcon: { fontSize: 40, marginRight: 14 },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#e0f2fe",
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    color: "#4a7fa5",
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // ── Back button
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1f35",
    borderWidth: 1.5,
    borderColor: "#1a4a72",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  backArrow: {
    fontSize: 18,
    color: "#7dd3fc",
    fontWeight: "700",
    lineHeight: 22,
  },
  backLabel: {
    fontSize: 13,
    color: "#7dd3fc",
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Search
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: "#0d1f35",
    borderWidth: 1.5,
    borderColor: "#1a3a5c",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: "#e0f2fe",
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: "#0284c7",
    borderRadius: 14,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { fontSize: 22 },

  // ── Error
  errorBox: {
    backgroundColor: "#2d0a0a",
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { color: "#fca5a5", fontSize: 14 },

  // ── Skeleton
  skeletonWrap: { marginTop: 16, gap: 10 },
  skeletonBar: {
    height: 18,
    borderRadius: 8,
    backgroundColor: "#0d1f35",
    alignSelf: "flex-start",
  },

  // ── Hero card
  heroCard: {
    backgroundColor: "#091929",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#0e2a45",
    marginBottom: 24,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cityName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e0f2fe",
    maxWidth: width * 0.52,
  },
  countryName: { fontSize: 13, color: "#4a7fa5", marginTop: 2 },
  weatherLabel: {
    fontSize: 14,
    color: "#7dd3fc",
    marginTop: 6,
    fontWeight: "600",
  },
  weatherEmoji: { fontSize: 64, lineHeight: 70 },
  tempMain: {
    fontSize: 80,
    fontWeight: "900",
    color: "#e0f2fe",
    lineHeight: 88,
    marginTop: 4,
  },
  feelsLike: { fontSize: 14, color: "#4a7fa5", marginBottom: 16 },
  divider: { height: 1, backgroundColor: "#0e2a45", marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statChip: {
    flex: 1,
    backgroundColor: "#0d2035",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0e2a45",
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statLabel: {
    fontSize: 10,
    color: "#4a7fa5",
    marginBottom: 2,
    textAlign: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7dd3fc",
    textAlign: "center",
  },
  statExtra: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },

  // ── Section title
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4a7fa5",
    marginBottom: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // ── Hourly
  hourlyScroll: { marginBottom: 26 },
  hourCard: {
    backgroundColor: "#091929",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginRight: 10,
    width: 72,
    borderWidth: 1,
    borderColor: "#0e2a45",
  },
  hourTime: {
    fontSize: 11,
    color: "#4a7fa5",
    marginBottom: 6,
    fontWeight: "600",
  },
  hourEmoji: { fontSize: 26, marginBottom: 6 },
  hourTemp: { fontSize: 16, fontWeight: "700", color: "#e0f2fe" },

  // ── Daily
  dailyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#091929",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#0e2a45",
    gap: 12,
  },
  dailyEmoji: { fontSize: 28, width: 36, textAlign: "center" },
  dailyDay: { fontSize: 14, fontWeight: "700", color: "#e0f2fe" },
  dailyLabel: { fontSize: 12, color: "#4a7fa5", marginTop: 2 },
  dailyRain: { fontSize: 12, color: "#60a5fa", width: 52, textAlign: "center" },
  dailyTemps: { alignItems: "flex-end", gap: 2 },
  dailyMax: { fontSize: 16, fontWeight: "800", color: "#fbbf24" },
  dailyMin: { fontSize: 13, color: "#4a7fa5", fontWeight: "600" },

  // ── Sun
  sunRow: {
    flexDirection: "row",
    backgroundColor: "#091929",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0e2a45",
    marginBottom: 28,
    overflow: "hidden",
  },
  sunCard: { flex: 1, alignItems: "center", paddingVertical: 20, gap: 4 },
  sunDivider: { width: 1, backgroundColor: "#0e2a45" },
  sunIcon: { fontSize: 32 },
  sunLabel: { fontSize: 12, color: "#4a7fa5", fontWeight: "600" },
  sunTime: { fontSize: 22, fontWeight: "800", color: "#fbbf24" },

  // ── Footer
  footer: { textAlign: "center", fontSize: 11, color: "#1e3a52", marginTop: 8 },

  // ── Empty state
  emptyState: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyEmoji: { fontSize: 72, marginBottom: 6 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#e0f2fe",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#4a7fa5",
    textAlign: "center",
    lineHeight: 22,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  suggestionChip: {
    backgroundColor: "#091929",
    borderWidth: 1,
    borderColor: "#1a3a5c",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionText: { color: "#7dd3fc", fontSize: 13, fontWeight: "600" },
});

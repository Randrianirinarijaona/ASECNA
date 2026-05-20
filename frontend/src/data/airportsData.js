export const AIRPORTS = {
  ivato: {
    name: "Aéroport d'Ivato",
    iata: "TNR — Antananarivo Ivato",
    coords: [-18.7969, 47.4788],
    markerClass: "marker-ivato",
    details: [
      { icon: "📍", label: "Localisation",  value: "Ivato, Antananarivo" },
      { icon: "🛫", label: "Type",           value: "International & National" },
      { icon: "🏢", label: "Terminal",       value: "Terminal unique rénové" },
      { icon: "📏", label: "Piste principale", value: "3 100 m (piste 11/29)" },
      { icon: "📅", label: "Fondé en",      value: "1938" },
    ],
    flights: [
      { route: "TNR → MJN", code: "MD 301", heure: "06:45", duree: "1h 10min" },
      { route: "TNR → DIE", code: "MD 205", heure: "08:20", duree: "1h 40min" },
      { route: "TNR → FTU", code: "MD 412", heure: "10:05", duree: "1h 55min" },
      { route: "TNR → WTS", code: "MD 119", heure: "13:30", duree: "55 min" },
      { route: "TNR → MXM", code: "MD 524", heure: "16:15", duree: "1h 25min" },
    ],
  },
  antamavy: {
    name: "Aéroport d'Antanambe",
    iata: "ANM — Antanambe",
    coords: [-16.0364, 49.8618],
    markerClass: "marker-antamavy",
    details: [
      { icon: "📍", label: "Localisation",  value: "Antanambe, région Analanjirofo" },
      { icon: "🛫", label: "Type",           value: "National" },
      { icon: "🏢", label: "Terminal",       value: "Terminal régional" },
      { icon: "📏", label: "Piste principale", value: "1 200 m" },
      { icon: "📅", label: "Fondé en",      value: "1972" },
    ],
    flights: [
      { route: "ANM → TNR", code: "MD 302", heure: "07:30", duree: "1h 10min" },
      { route: "ANM → TMM", code: "MD 618", heure: "11:00", duree: "45 min" },
      { route: "ANM → MJN", code: "MD 701", heure: "14:45", duree: "1h 30min" },
    ],
  },
};
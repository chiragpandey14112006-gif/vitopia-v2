export const LOCDATA = {
  gate: {
    n: "MAIN_GATE",
    d: "Primary entry/exit. Security checkpoint active 24/7. Student ID mandatory.",
    coords: "23.2613°N 77.4101°E",
    tag: "TRANSPORT",
    nav: "https://www.google.com/maps/dir//VIT+Bhopal+University+Main+Gate,Sehore,MP",
  },
  ab1: {
    n: "MAIN_BUILDING (VIT BHOPAL)",
    d: "Primary campus building. CS/IT labs, classrooms, faculty offices. Elevator available. Open 7AM–10PM.",
    coords: "23.2607°N 77.4112°E",
    tag: "ACADEMIC",
    nav: "https://www.google.com/maps/place/VIT+Bhopal+University",
  },
  ab2: {
    n: "ACADEMIC_BLOCK_2",
    d: "Admin block, exam cell, conference halls. Restricted after 6PM.",
    coords: "23.2590°N 77.4138°E",
    tag: "ACADEMIC",
    nav: "https://www.google.com/maps/dir//Academic+Block+2+VIT+Bhopal",
  },
  lab: {
    n: "LAB_COMPLEX",
    d: "Multi-floor research hub. Advanced labs, digital section. Strict silent zone on upper floors.",
    coords: "23.2618°N 77.4098°E",
    tag: "RESEARCH",
    nav: "https://www.google.com/maps/dir//Lab+Complex+VIT+Bhopal+University",
  },
  audi: {
    n: "OPEN_AUDITORIUM",
    d: "Open-air amphitheatre with 1200 capacity. Full AV systems. Booking required 48hrs in advance.",
    coords: "23.2582°N 77.4105°E",
    tag: "EVENTS",
    nav: "https://www.google.com/maps/dir//Open+Auditorium+VIT+Bhopal+University",
  },
  hostel: {
    n: "GIRLS_HOSTEL",
    d: "Girls residential block. WiFi enabled. Curfew 9PM weekdays, 10PM weekends. Separate entrance.",
    coords: "23.2597°N 77.4122°E",
    tag: "RESIDENTIAL",
    nav: "https://www.google.com/maps/dir//Girls+Hostel+VIT+Bhopal+University",
  },
  bhostel: {
    n: "BOYS_HOSTEL",
    d: "Boys residential block. WiFi enabled. Curfew 9PM weekdays, 10PM weekends.",
    coords: "23.2595°N 77.4142°E",
    tag: "RESIDENTIAL",
    nav: "https://www.google.com/maps/dir//VIT+Bhopal+Boys+Hostel",
  },
  mess: {
    n: "SPECIAL_BLOCK",
    d: "Special Block — houses the campus mess/dining facility. Multi-cuisine menu. Timings: 7–9AM · 12–2PM · 7–9PM.",
    coords: "23.2593°N 77.4155°E",
    tag: "DINING",
    nav: "https://www.google.com/maps/dir//Special+Block+VIT+Bhopal+University",
  },
  food: {
    n: "MAYURI_FAST_FOOD",
    d: "Campus canteen near main building. Quick bites, tea, snacks. Open 8AM–9PM.",
    coords: "23.2605°N 77.4108°E",
    tag: "FOOD",
    nav: "https://www.google.com/maps/dir//Mayuri+Fast+Food+VIT+Bhopal+University",
  },
  sports: {
    n: "SPORTS_COMPLEX",
    d: "Cricket, badminton courts, gym, football ground. Open 5AM–9PM. Inter-college events hosted here.",
    coords: "23.2585°N 77.4160°E",
    tag: "SPORTS",
    nav: "https://www.google.com/maps/dir//Sports+Complex+VIT+Bhopal+University",
  },
};

export const TIME_SLOTS = [
  "08:30–10:00",
  "10:05–11:35",
  "11:40–13:10",
  "13:15–14:45",
  "14:50–16:20",
  "16:25–17:55",
  "18:00–19:30",
];

export const FREE_SLOTS_MATRIX = {
  MON: ["A11", "B11", "C11", "D11", "E12", "B21", "F21"],
  TUE: ["D11", "E11", "F11", "D21", "E14", "E21", "F22"],
  WED: ["A12", "B12", "C12", "G12", "E13", "B22", "F23"],
  THU: ["A13", "L11", "L12", "D21", "B13", "B23", "F24"],
  FRI: ["A14", "B14", "C13", "G13", "C14", "E22", "B24"],
};

export const SUBJECT_COLORS = {
  csa: { border: "#00f3ff", bg: "rgba(0,243,255,0.08)", text: "#00f3ff" },
  phy: { border: "#bc13fe", bg: "rgba(188,19,254,0.09)", text: "#bc13fe" },
  chy: { border: "#00ff88", bg: "rgba(0,255,136,0.08)", text: "#00ff88" },
  sst: { border: "#ff6600", bg: "rgba(255,102,0,0.08)", text: "#ff6600" },
  cse: { border: "#ff00ff", bg: "rgba(255,0,255,0.08)", text: "#ff00ff" },
  uhv: { border: "#ffff00", bg: "rgba(255,255,0,0.07)", text: "#ffff00" },
  eng: { border: "#ff0040", bg: "rgba(255,0,64,0.08)", text: "#ff0040" },
  lab: { border: "#00ff88", bg: "rgba(0,255,136,0.12)", text: "#00ff88" },
};

export const BOOKING_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00",
];

export const RES_ICONS = {
  lab: "[CPU]",
  lib: "[DB]",
  audi: "[AMP]",
  sport: "[NET]",
};

export const XP_TABLE = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

export function getLevel(xp) {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) return i;
  }
  return 0;
}

export function getLevelProgress(xp) {
  const lvl = getLevel(xp);
  const base = XP_TABLE[lvl] || 0;
  const next = XP_TABLE[lvl + 1] || base * 2 || 100;
  return Math.min(100, Math.max(0, Math.round(((xp - base) / (next - base)) * 100)));
}

import type { Doctor } from "../context/AppContext";
import { getRegionCoords, haversineKm, type GeoPoint } from "./geo";

type SpecialtyRule = {
  specialty: string;
  keywords: string[];
};

const SPECIALTY_RULES: SpecialtyRule[] = [
  {
    specialty: "Kardiolog",
    keywords: [
      "yurak",
      "qon bosimi",
      "gipertoniya",
      "aritmiya",
      "ko'krak og'riq",
      "ko'krak",
      "qon tomir",
      "xolesterin",
      "heart",
      "chest pain",
      "pressure",
    ],
  },
  {
    specialty: "Terapevt",
    keywords: [
      "isitma",
      "tushlik",
      "tomoq",
      "shamollash",
      "gripp",
      "umumiy",
      "charchoq",
      "bosh og'riq",
      "kasal",
      "fever",
      "cough",
      "cold",
      "flu",
      "temperatura",
    ],
  },
  {
    specialty: "Ortoped",
    keywords: [
      "bo'g'im",
      "umurtqa",
      "bel",
      "oyoq",
      "qo'l",
      "sinish",
      "jarohat",
      "reabilitatsiya",
      "joint",
      "back pain",
      "fracture",
      "sport",
    ],
  },
  {
    specialty: "Nevrolog",
    keywords: ["bosh aylanish", "epilepsiya", "migren", "asab", "nevrolog", "dizziness", "migraine"],
  },
  {
    specialty: "Dermatolog",
    keywords: ["teri", "siydik", "allergiya", "qichish", "chiray", "skin", "rash", "acne"],
  },
  {
    specialty: "Ginekolog",
    keywords: ["homilador", "ayol", "ginekolog", "menstruatsiya", "pregnancy", "gynecologist"],
  },
  {
    specialty: "Pediatr",
    keywords: ["bola", "chaqaloq", "yosh bolalar", "pediatr", "child", "baby", "infant"],
  },
  {
    specialty: "Oftalmolog",
    keywords: ["ko'z", "qorong'u", "ko'rish", "eye", "vision", "glasses"],
  },
  {
    specialty: "LOR",
    keywords: ["quloq", "burun", "tomoq", "lor", "ent", "sinus", "otitis"],
  },
  {
    specialty: "Endokrinolog",
    keywords: ["qand", "diabet", "gormon", "shamol", "diabetes", "thyroid", "insulin"],
  },
];

export const inferSpecialtiesFromText = (text: string, limit = 3) => {
  const normalized = text.toLowerCase().replace(/['`’ʻ]/g, "'");
  const scores = SPECIALTY_RULES.map((rule) => ({
    specialty: rule.specialty,
    score: rule.keywords.reduce(
      (sum, keyword) => sum + (normalized.includes(keyword.toLowerCase()) ? 1 : 0),
      0,
    ),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return ["Terapevt"];
  }

  return scores.slice(0, limit).map((entry) => entry.specialty);
};

export type RankedDoctor = {
  doctor: Doctor;
  distanceKm: number | null;
  matchScore: number;
};

export const rankDoctorsForSymptoms = (
  doctors: Doctor[],
  symptoms: string,
  userLocation?: GeoPoint | null,
) => {
  const specialties = inferSpecialtiesFromText(symptoms);

  return doctors
    .map((doctor) => {
      const specialtyIndex = specialties.indexOf(doctor.specialty);
      const matchScore = specialtyIndex === -1 ? 0 : specialties.length - specialtyIndex;
      const regionCoords = getRegionCoords(doctor.region);
      const distanceKm =
        userLocation && regionCoords ? haversineKm(userLocation, regionCoords) : null;

      return { doctor, distanceKm, matchScore };
    })
    .filter((entry) => entry.matchScore > 0 || specialties.includes("Terapevt"))
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      if (a.distanceKm === null && b.distanceKm === null) {
        return b.doctor.rating - a.doctor.rating;
      }
      if (a.distanceKm === null) {
        return 1;
      }
      if (b.distanceKm === null) {
        return -1;
      }
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return b.doctor.rating - a.doctor.rating;
    });
};

export const findNearestDoctors = (doctors: Doctor[], userLocation: GeoPoint, limit = 5) =>
  doctors
    .map((doctor) => {
      const regionCoords = getRegionCoords(doctor.region);
      const distanceKm = regionCoords ? haversineKm(userLocation, regionCoords) : null;
      return { doctor, distanceKm, matchScore: 0 };
    })
    .filter((entry) => entry.distanceKm !== null)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, limit);

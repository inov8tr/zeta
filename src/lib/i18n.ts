import enCommon from "../../public/locales/en/common.json";
import enHome from "../../public/locales/en/home.json";
import enProgram from "../../public/locales/en/program.json";
import enProgramOverview from "../../public/locales/en/program-overview.json";
import enAbout from "../../public/locales/en/about.json";
import enEnrollment from "../../public/locales/en/enrollment.json";
import enLogin from "../../public/locales/en/login.json";
import koCommon from "../../public/locales/ko/common.json";
import koHome from "../../public/locales/ko/home.json";
import koProgram from "../../public/locales/ko/program.json";
import koProgramOverview from "../../public/locales/ko/program-overview.json";
import koAbout from "../../public/locales/ko/about.json";
import koEnrollment from "../../public/locales/ko/enrollment.json";
import koLogin from "../../public/locales/ko/login.json";

export const SUPPORTED_LANGUAGES = ["en", "ko"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const dictionaries = {
  en: {
    common: enCommon,
    home: enHome,
    program: enProgram,
    programOverview: enProgramOverview,
    about: enAbout,
    enrollment: enEnrollment,
    login: enLogin,
  },
  ko: {
    common: koCommon,
    home: koHome,
    program: koProgram,
    programOverview: koProgramOverview,
    about: koAbout,
    enrollment: koEnrollment,
    login: koLogin,
  },
} as const;

export type CommonDictionary = typeof enCommon;
export type HomeDictionary = typeof enHome;
export type ProgramDictionary = typeof enProgram;
export type ProgramOverviewDictionary = typeof enProgramOverview;
export type AboutDictionary = typeof enAbout;
export type EnrollmentDictionary = typeof enEnrollment;
export type LoginDictionary = typeof enLogin;

export function normalizeLanguage(lng?: string | null): SupportedLanguage {
  if (!lng) {
    return "en";
  }
  const candidate = lng.slice(0, 2).toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(candidate)
    ? (candidate as SupportedLanguage)
    : "en";
}

export function getDictionaries(lng: SupportedLanguage) {
  return dictionaries[lng] ?? dictionaries.en;
}

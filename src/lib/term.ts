import { fromZonedTime } from "date-fns-tz";
import {
  CURR_ACADEMIC_YEAR_DATE,
  CURR_ACADEMIC_YEAR_RANGE,
  TIMEZONE,
} from "./constants";
import { t, Language, I18nKey } from "./i18n";
import { mockTermNames } from "./mock";

export const getCurrentYearTermName = (lang: Language = Language.EN) => {
  return mockTermNames(CURR_ACADEMIC_YEAR_RANGE, 0, "", lang, true);
};

export const getCurrentTerm = () => {
  const now = fromZonedTime(new Date(), TIMEZONE);
  const termNames = mockTermNames(
    CURR_ACADEMIC_YEAR_RANGE,
    0,
    "",
    Language.EN,
    true,
  );

  if (now < CURR_ACADEMIC_YEAR_DATE.START)
    return {
      term: ["Past"],
      adDDL: null,
    };
  if (now <= CURR_ACADEMIC_YEAR_DATE.Summer.END)
    return {
      term: Object.values(Language).map((l) => termNames[l][0]),
      adDDL: CURR_ACADEMIC_YEAR_DATE.Summer.AD_DDL,
    };
  if (now <= CURR_ACADEMIC_YEAR_DATE.Fall.END)
    return {
      term: Object.values(Language).map((l) => termNames[l][1]),
      adDDL: CURR_ACADEMIC_YEAR_DATE.Fall.AD_DDL,
    };
  if (now <= CURR_ACADEMIC_YEAR_DATE.Winter.END)
    return {
      term: Object.values(Language).map((l) => termNames[l][2]),
      adDDL: CURR_ACADEMIC_YEAR_DATE.Winter.AD_DDL,
    };

  return {
    term: ["Future"],
    adDDL: null,
  };
};

export const isCurrentTerm = (termName: string) => {
  const currentTerm = getCurrentTerm().term;
  const normalizedTermName = termName.replaceAll(" ", "").toLowerCase();
  return currentTerm.some((term) =>
    normalizedTermName.includes(term.replaceAll(" ", "").toLowerCase()),
  );
};

export const isThisYearTerm = (termName: string) => {
  const termNames = mockTermNames(
    CURR_ACADEMIC_YEAR_RANGE,
    0,
    "",
    Language.EN,
    true,
  );
  const normalizedTermName = termName.replaceAll(" ", "").toLowerCase();

  return Object.values(Language).some((lang) =>
    termNames[lang].some((term) =>
      normalizedTermName.includes(term.replaceAll(" ", "").toLowerCase()),
    ),
  );
};

export const extractSeasonAndYear = (termName: string) => {
  const normalizedTermName = termName.replaceAll(" ", "").toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, season, year] =
    normalizedTermName.match(
      /^(summer|fall|winter|été|automne|hiver)(20\d{2})$/,
    ) || [];
  return { season, year };
};

export const getNewTermName = (
  termName: string,
  isAfter: boolean = true,
  lang: Language,
) => {
  const SEASONS = [
    t([I18nKey.WINTER], lang),
    t([I18nKey.SUMMER], lang),
    t([I18nKey.FALL], lang),
  ].map((s) => s.toLowerCase());
  const { season, year } = extractSeasonAndYear(termName);

  if (!season || !year) {
    return t([I18nKey.NEW_M, I18nKey.SEMESTER], lang);
  }

  const thisSeasonIdx = SEASONS.indexOf(season);
  let newSeasonIdx =
    (thisSeasonIdx + (isAfter ? 1 : -1 + SEASONS.length)) % SEASONS.length;

  // summer can only be added through name picker
  if (newSeasonIdx === 1) {
    newSeasonIdx = isAfter ? 2 : 0;
  }
  const newSeason = SEASONS[newSeasonIdx];

  let newYear: string;
  if (isAfter) {
    newYear =
      newSeasonIdx < thisSeasonIdx ? (parseInt(year) + 1).toString() : year;
  } else {
    newYear =
      newSeasonIdx > thisSeasonIdx ? (parseInt(year) - 1).toString() : year;
  }
  return `${newSeason.charAt(0).toUpperCase() + newSeason.slice(1)} ${newYear}`;
};

const SEASON_MAP = {
  fall: "09",
  summer: "05",
  winter: "01",
  été: "05",
  automne: "09",
  hiver: "01",
};

export const openInVSB = (termName: string, courseIds: string[]) => {
  const { season, year } = extractSeasonAndYear(termName);

  const seasonIdx = SEASON_MAP[season as keyof typeof SEASON_MAP];
  const vsbUrlBase = "https://vsb.mcgill.ca/vsb/criteria.jsp?";
  const formattedCourseIds = courseIds.map(
    (id) => id.slice(0, 4) + "-" + id.slice(4),
  );
  const vsbUrl = `${vsbUrlBase}term=${year}${seasonIdx}&courses=${formattedCourseIds.join(",")}`;
  window.open(vsbUrl, "_blank");
};

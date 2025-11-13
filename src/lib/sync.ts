import { fullSync } from "@/store/thunks";
import { SYNC_CONFIG } from "./constants";
import type { SyncMethod } from "./enums";
import type { AppDispatch } from "@/store";
import { throttledDebounce } from "./utils";
import type { GuestUserData } from "@/types/db";
import { SavingData } from "@/types/local";
import { I18nKey, Language, t } from "./i18n";

let debouncedSync: (() => void) | undefined;

// get the debounced sync function
export const getDebouncedSync = (dispatch: AppDispatch) => {
  if (!debouncedSync) {
    debouncedSync = throttledDebounce(
      async () => {
        dispatch(fullSync(false));
      },
      SYNC_CONFIG.DEBOUNCE_DELAY,
      SYNC_CONFIG.THROTTLE_WINDOW,
    );
  }
  return debouncedSync;
};

// map stringify replacer, to handle restoring Map objects from localStorage
export const mapStringfyReplacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Object.fromEntries(value.entries()),
    };
  }
  return value;
};

// map stringify reviver, to handle restoring Map objects from localStorage
export const mapStringfyReviver = (key: string, value: any) => {
  if (value && typeof value === "object" && value.dataType === "Map") {
    if (typeof value.value === "object") {
      return new Map(Object.entries(value.value));
    }
    return new Map(JSON.parse(value.value));
  }
  return value;
};

/* session storage */
export const getSessionData = (key: string) => {
  const item = sessionStorage.getItem(key);
  if (!item) return null;
  return JSON.parse(item);
};

export const setSessionData = (key: string, data: string) => {
  sessionStorage.setItem(key, JSON.stringify(data));
};

export const clearSessionData = (key: string) => {
  sessionStorage.removeItem(key);
};

/* local storage */
export const setLocalData = (key: string, data: any) => {
  localStorage.setItem(
    key,
    JSON.stringify(
      {
        data,
        timestamp: Date.now(),
      } as SavingData,
      mapStringfyReplacer,
    ),
  );
};

export const clearLocalData = (key: string) => {
  localStorage.removeItem(key);
};

export const getLocalData = (key: string, lang: Language) => {
  const item = localStorage.getItem(key);
  if (!item) return null;

  const { data, timestamp } = JSON.parse(item, mapStringfyReviver);
  // console.log(data, timestamp);

  if (!data || !timestamp) {
    throw new Error(
      t([I18nKey.INVALID], lang, { item1: t([I18nKey.LOCAL_DATA], lang) }),
    );
  }

  return {
    data: data!,
    timestamp: timestamp!,
  };
};

/* all these functions attach the session cookie automatically */
export const createRemoteUserData = async (
  data: GuestUserData | null,
  lang: Language,
) => {
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        data,
      },
      mapStringfyReplacer,
    ),
  });

  if (!response.ok) {
    throw new Error(
      t([I18nKey.FAILED_TO_CREATE], lang, {
        item1: t([I18nKey.REMOTE_USER], lang),
      }),
    );
  }

  return response.json();
};

export const updateRemoteUserData = async (
  savingData: SavingData,
  method: SyncMethod,
  lang: Language,
) => {
  const { data, timestamp } = savingData;
  const response = await fetch("/api/sync", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        data,
        timestamp,
        method,
      },
      mapStringfyReplacer,
    ),
  });

  if (!response.ok) {
    throw new Error(
      t([I18nKey.FAILED_TO_UPDATE], lang, { item1: t([I18nKey.USER], lang) }),
    );
  }

  return response.json();
};

export const getRemoteUserData = async () => {
  // this automatically attaches the session cookie
  const response = await fetch("/api/sync", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const { data, createdAt } = await response.json();

  return {
    data,
    createdAt,
  };
};

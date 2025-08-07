import { useAppDispatch, useAppSelector } from "@/store/hooks";
import SyncIcon from "@/public/icons/sync-2.svg";
import clsx from "clsx";
import { TooltipId } from "@/lib/enums";
import { useCallback, useMemo, useRef } from "react";
import { getDebouncedSync } from "@/lib/sync";
import { setSyncStatus } from "@/store/slices/localDataSlice";
import { useSession } from "next-auth/react";
import { I18nKey, Language, t } from "@/lib/i18n";

const Sync = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const { isSyncing, lastSyncedAt, syncError } = useAppSelector(
    (state) => state.localData.syncStatus,
  );
  const { data: session } = useSession();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const syncRef = useRef<HTMLImageElement>(null);

  const dispatch = useAppDispatch();
  const debouncedSync = useCallback(() => {
    dispatch(setSyncStatus({ isSyncing: true }));
    getDebouncedSync(dispatch)();
  }, [dispatch]);

  const lastSyncedAtStr = useMemo(() => {
    if (session) {
      return t([I18nKey.LAST_SYNCED_AT], lang, {
        item1: new Date(lastSyncedAt).toLocaleString(),
      });
    }
    return t([I18nKey.LAST_SAVED_LOCALLY_AT], lang, {
      item1: new Date(lastSyncedAt).toLocaleString(),
    });
  }, [lastSyncedAt, session, lang]);

  const tooltipHtml = useMemo(() => {
    if (isSyncing) return `<span>${t([I18nKey.SYNCING], lang)}...</span>`;
    if (syncError) {
      return `
      <div class="sync-message-container">
        <span class="sync-error">${syncError}, ${t([I18nKey.TRY_AGAIN_LATER], lang)}</span>
        <span class="sync-time">${lastSyncedAtStr}</span>
      </div>
      `;
    }
    return `
    <div class="sync-message-container">
      <span>${t([I18nKey.CLICK_TO_SYNC], lang)}</span>
      <span class="sync-time">${lastSyncedAtStr}</span>
    </div>
    `;
  }, [isSyncing, syncError, lastSyncedAtStr, lang]);

  return (
    <section
      className={clsx({
        "sync-container": true,
        clickable: isInitialized && !isDragging && !isSyncing,
        syncing: isSyncing,
        error: !isSyncing && syncError !== null,
      })}
      data-tooltip-id={TooltipId.SYNC}
      data-tooltip-html={tooltipHtml}
      data-tooltip-place="bottom"
      onClick={debouncedSync}
      ref={syncRef}
    >
      <SyncIcon className="sync-icon" />
    </section>
  );
};

export default Sync;

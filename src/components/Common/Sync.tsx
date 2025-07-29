import { useAppDispatch, useAppSelector } from "@/store/hooks";
import SyncIcon from "@/public/icons/sync-2.svg";
import clsx from "clsx";
import { TooltipId } from "@/lib/enums";
import { useCallback, useMemo } from "react";
import { getDebouncedSync } from "@/lib/sync";
import { setSyncStatus } from "@/store/slices/localDataSlice";
import { useSession } from "next-auth/react";

const Sync = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const { isSyncing, lastSyncedAt, syncError } = useAppSelector(
    (state) => state.localData.syncStatus,
  );
  const { data: session } = useSession();

  const dispatch = useAppDispatch();
  const debouncedSync = useCallback(() => {
    dispatch(setSyncStatus({ isSyncing: true }));
    getDebouncedSync(dispatch)();
  }, [dispatch]);

  const lastSyncedAtStr = useMemo(() => {
    if (session) {
      return `Last synced at ${new Date(lastSyncedAt).toLocaleString()}`;
    }
    return `Last saved locally at ${new Date(lastSyncedAt).toLocaleString()}`;
  }, [lastSyncedAt, session]);

  const tooltipHtml = useMemo(() => {
    if (isSyncing) return `<span>Syncing...</span>`;
    if (syncError) {
      return `
      <div class="sync-message-container">
        <span class="sync-error">${syncError}, please try again later.</span>
        <span class="sync-time">${lastSyncedAtStr}</span>
      </div>
      `;
    }
    return `
    <div class="sync-message-container">
      <span>Click to sync</span>
      <span class="sync-time">${lastSyncedAtStr}</span>
    </div>
    `;
  }, [isSyncing, syncError, lastSyncedAtStr]);

  return (
    <section
      className={clsx(
        "sync-container",
        isInitialized && !isDragging && !isSyncing && "clickable",
      )}
      data-tooltip-id={TooltipId.SYNC}
      data-tooltip-html={tooltipHtml}
      onClick={debouncedSync}
    >
      <SyncIcon
        className={clsx(
          "sync-icon",
          isSyncing && "syncing",
          syncError && "error",
        )}
      />
    </section>
  );
};

export default Sync;

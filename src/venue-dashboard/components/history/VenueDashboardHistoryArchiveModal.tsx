import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MouseEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import { LiveyDashboardDropdown } from "../../tabs/account/LiveyDashboardDropdown";
import { VenueDashboardHistoryList } from "./VenueDashboardHistoryList";
import {
  groupHistoryEventsByDate,
  type HistorySortOrder,
} from "./historyGroupingUtils";
import {
  getHistoryEventTimestamp,
} from "./historyUtils";
import "../../tabs/account/accountBase.css";
import "./VenueDashboardHistoryArchiveModal.css";

type VenueDashboardHistoryArchiveModalProps = {
  historyEvents: VenueDashboardEvent[];
  onClose: () => void;
  onOpenEvent: (
    event: VenueDashboardEvent
  ) => void;
};

type ArchiveStatusFilter =
  | "all"
  | "removed"
  | "expired";

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "removed",
    label: "Removed",
  },
  {
    value: "expired",
    label: "Expired",
  },
];

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "oldest",
    label: "Oldest",
  },
];

export function VenueDashboardHistoryArchiveModal({
  historyEvents,
  onClose,
  onOpenEvent,
}: VenueDashboardHistoryArchiveModalProps) {
  useModalBehaviour(onClose);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<ArchiveStatusFilter>("all");

  const [sortOrder, setSortOrder] =
    useState<HistorySortOrder>("newest");

  const removedEvents = useMemo(
    () =>
      historyEvents.filter((event) =>
        Boolean(event.deleted_at)
      ),
    [historyEvents]
  );

  const expiredEvents = useMemo(
    () =>
      historyEvents.filter(
        (event) => !event.deleted_at
      ),
    [historyEvents]
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return historyEvents
      .filter((event) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          (event.title || "")
            .toLowerCase()
            .includes(normalizedSearch);

        if (!matchesSearch) {
          return false;
        }

        if (statusFilter === "removed") {
          return Boolean(event.deleted_at);
        }

        if (statusFilter === "expired") {
          return !event.deleted_at;
        }

        return true;
      })
      .slice()
      .sort((firstEvent, secondEvent) => {
        const firstTimestamp =
          getHistoryEventTimestamp(
            firstEvent
          );

        const secondTimestamp =
          getHistoryEventTimestamp(
            secondEvent
          );

        return sortOrder === "newest"
          ? secondTimestamp -
              firstTimestamp
          : firstTimestamp -
              secondTimestamp;
      });
  }, [
    historyEvents,
    searchQuery,
    statusFilter,
    sortOrder,
  ]);

  const groupedHistoryEvents =
    useMemo(() => {
      return groupHistoryEventsByDate(
        filteredEvents,
        sortOrder
      );
    }, [
      filteredEvents,
      sortOrder,
    ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    sortOrder !== "newest";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOrder("newest");
  }

  return (
    <div
      className="venue-dashboard-history-modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        handleBackdropClick(
          event,
          onClose
        )
      }
    >
      <section
        className="venue-dashboard-history-archive-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-history-archive-title"
      >
        <header className="venue-dashboard-history-modal-heading">
          <div>
            <p className="venue-dashboard-eyebrow">
              Full archive
            </p>

            <h2 id="venue-dashboard-history-archive-title">
              All past activity
            </h2>

            <p>
              Review every activity that
              expired naturally or was
              removed from Livey.
            </p>
          </div>

          <button
            className="venue-dashboard-history-modal-close"
            type="button"
            aria-label="Close activity archive"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="venue-dashboard-history-archive-toolbar">
          <label className="venue-dashboard-history-archive-search">
            <span className="venue-dashboard-history-archive-search-icon">
              <SearchIcon />
            </span>

            <input
              type="search"
              value={searchQuery}
              placeholder="Search activities"
              aria-label="Search archived activities"
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />
          </label>

          <div className="venue-dashboard-history-archive-filter">
            <LiveyDashboardDropdown
              value={statusFilter}
              options={STATUS_OPTIONS}
              triggerMode="arrow"
              onChange={(value) =>
                setStatusFilter(
                  value as ArchiveStatusFilter
                )
              }
            />
          </div>

          <div className="venue-dashboard-history-archive-filter">
            <LiveyDashboardDropdown
              value={sortOrder}
              options={SORT_OPTIONS}
              triggerMode="arrow"
              onChange={(value) =>
                setSortOrder(
                  value as HistorySortOrder
                )
              }
            />
          </div>

          {hasActiveFilters ? (
            <div className="venue-dashboard-history-archive-toolbar-meta">
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>

        <div className="venue-dashboard-history-summary venue-dashboard-history-archive-summary">
          <article className="venue-dashboard-history-summary-item">
            <span>
              Total activity
            </span>

            <strong>
              {historyEvents.length}
            </strong>

            <small>
              All archived activity
            </small>
          </article>

          <article className="venue-dashboard-history-summary-item is-removed">
            <span>Removed</span>

            <strong>
              {removedEvents.length}
            </strong>

            <small>
              Manually removed
            </small>
          </article>

          <article className="venue-dashboard-history-summary-item is-expired">
            <span>Expired</span>

            <strong>
              {expiredEvents.length}
            </strong>

            <small>
              Ended automatically
            </small>
          </article>
        </div>

        <div className="venue-dashboard-history-archive-scroll">
          {filteredEvents.length > 0 ? (
            <div className="venue-dashboard-history-groups">
              {groupedHistoryEvents.map(
                (group) => (
                  <section
                    className="venue-dashboard-history-group"
                    key={group.key}
                    aria-labelledby={`venue-dashboard-history-group-${group.key}`}
                  >
                    <header className="venue-dashboard-history-group-heading">
                      <div>
                        <h3
                          id={`venue-dashboard-history-group-${group.key}`}
                        >
                          {group.label}
                        </h3>

                        <span>
                          {
                            group.events
                              .length
                          }
                          {group.events
                            .length === 1
                            ? " activity"
                            : " activities"}
                        </span>
                      </div>
                    </header>

                    <VenueDashboardHistoryList
                      events={
                        group.events
                      }
                      onOpenEvent={
                        onOpenEvent
                      }
                      variant="archive"
                    />
                  </section>
                )
              )}
            </div>
          ) : (
            <div className="venue-dashboard-history-archive-no-results">
              <div aria-hidden="true">
                <SearchIcon />
              </div>

              <strong>
                No matching activity
              </strong>

              <p>
                Try a different search or
                clear the current filters.
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function useModalBehaviour(
  onClose: () => void
) {
  useEffect(() => {
    const body = document.body;

    const currentLockCount = Number(
      body.dataset
        .liveyModalScrollLockCount ?? "0"
    );

    if (currentLockCount === 0) {
      body.dataset
        .liveyPreviousBodyOverflow =
        body.style.overflow;

      body.style.overflow = "hidden";
    }

    body.dataset
      .liveyModalScrollLockCount = String(
      currentLockCount + 1
    );

    function handleKeyDown(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      const activeLockCount = Number(
        body.dataset
          .liveyModalScrollLockCount ?? "1"
      );

      const remainingLockCount = Math.max(
        0,
        activeLockCount - 1
      );

      if (remainingLockCount > 0) {
        body.dataset
          .liveyModalScrollLockCount =
          String(remainingLockCount);

        return;
      }

      body.style.overflow =
        body.dataset
          .liveyPreviousBodyOverflow ?? "";

      delete body.dataset
        .liveyModalScrollLockCount;

      delete body.dataset
        .liveyPreviousBodyOverflow;
    };
  }, [onClose]);
}

function handleBackdropClick(
  event: MouseEvent<HTMLDivElement>,
  onClose: () => void
) {
  if (
    event.target ===
    event.currentTarget
  ) {
    onClose();
  }
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.75"
        cy="10.75"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m15.5 15.5 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
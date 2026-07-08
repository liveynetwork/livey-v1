import type { ReactNode } from "react";

export type DashboardSection =
  | "home"
  | "activity"
  | "analytics"
  | "history"
  | "account";

type VenueDashboardSidebarProps = {
  activeSection: DashboardSection;
  venueName: string;
  venueLogoUrl?: string | null;
  onSectionChange: (section: DashboardSection) => void;
};

const MAIN_NAV_ITEMS: Array<{
  id: Exclude<DashboardSection, "account">;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "home",
    label: "Home",
    description: "Overview",
    icon: <ControlCenterIcon />,
  },
  {
    id: "activity",
    label: "Activity",
    description: "Livey app display",
    icon: <ActivityIcon />,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Insights",
    icon: <AnalyticsIcon />,
  },
  {
    id: "history",
    label: "History",
    description: "Removed activity",
    icon: <HistoryIcon />,
  },
];

const ACCOUNT_NAV_ITEM: {
  id: Extract<DashboardSection, "account">;
  label: string;
  description: string;
  icon: ReactNode;
} = {
  id: "account",
  label: "Account Settings",
  description: "Profile and owner",
  icon: <AccountSettingsIcon />,
};

export function VenueDashboardSidebar({
  activeSection,
  venueName,
  venueLogoUrl,
  onSectionChange,
}: VenueDashboardSidebarProps) {
  const venueInitial = venueName?.trim()?.charAt(0)?.toUpperCase() || "L";

  return (
    <aside className="venue-dashboard-sidebar">
      <div className="venue-dashboard-brand">
        <div className="venue-dashboard-brand-icon">
          {venueLogoUrl ? (
            <img src={venueLogoUrl} alt={venueName || "Venue logo"} />
          ) : (
            <span>{venueInitial}</span>
          )}
        </div>

        <div className="venue-dashboard-brand-copy">
          <strong>{venueName || "Venue owner"}</strong>
          <span>Venue Console</span>
        </div>
      </div>

      <nav className="venue-dashboard-nav" aria-label="Venue dashboard">
        {MAIN_NAV_ITEMS.map((item) => (
          <DashboardNavButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onSectionChange={onSectionChange}
          />
        ))}
      </nav>

      <nav
        className="venue-dashboard-nav venue-dashboard-nav-bottom"
        aria-label="Venue account settings"
      >
        <DashboardNavButton
          item={ACCOUNT_NAV_ITEM}
          isActive={activeSection === ACCOUNT_NAV_ITEM.id}
          onSectionChange={onSectionChange}
        />
      </nav>

      <div className="venue-dashboard-sidebar-footer">
        <span>Signed in</span>
        <strong>{venueName || "Venue owner"}</strong>
      </div>
    </aside>
  );
}

function DashboardNavButton({
  item,
  isActive,
  onSectionChange,
}: {
  item: {
    id: DashboardSection;
    label: string;
    description: string;
    icon: ReactNode;
  };
  isActive: boolean;
  onSectionChange: (section: DashboardSection) => void;
}) {
  return (
    <button
      className={
        isActive
          ? "venue-dashboard-nav-item is-active"
          : "venue-dashboard-nav-item"
      }
      type="button"
      onClick={() => onSectionChange(item.id)}
      title={item.label}
    >
      <span className="venue-dashboard-nav-icon" aria-hidden="true">
        {item.icon}
      </span>

      <span className="venue-dashboard-nav-copy">
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </span>
    </button>
  );
}

function ControlCenterIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <rect x="4.5" y="4.5" width="5.6" height="5.6" rx="1.8" />
      <rect x="13.9" y="4.5" width="5.6" height="5.6" rx="1.8" />
      <rect x="4.5" y="13.9" width="5.6" height="5.6" rx="1.8" />
      <rect x="13.9" y="13.9" width="5.6" height="5.6" rx="1.8" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M3.6 12h4.05l2.85-6.4 3.25 12.8L16.65 12h3.75" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M5.2 18.7V12.8" />
      <path d="M9.75 18.7V9.9" />
      <path d="M14.3 18.7v-6.9" />
      <path d="M18.85 18.7V7.1" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 8.25v4.05l2.45 1.85" />
    </svg>
  );
}

function AccountSettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <circle cx="12" cy="8.25" r="3.55" />
      <path d="M5.15 19.15c.75-3.35 3.15-5.15 6.85-5.15s6.1 1.8 6.85 5.15" />
    </svg>
  );
}
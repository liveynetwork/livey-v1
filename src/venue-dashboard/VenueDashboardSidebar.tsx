import type { ReactNode } from "react";

export type DashboardSection =
  | "home"
  | "activity"
  | "analytics"
  | "history"
  | "settings"
  | "account";

type VenueDashboardSidebarProps = {
  activeSection: DashboardSection;
  venueName: string;
  onSectionChange: (section: DashboardSection) => void;
};

const DASHBOARD_NAV_ITEMS: Array<{
  id: DashboardSection;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "home",
    label: "Home",
    description: "Overview",
    icon: <HomeIcon />,
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
    description: "Coming soon",
    icon: <AnalyticsIcon />,
  },
  {
    id: "history",
    label: "History",
    description: "Coming soon",
    icon: <HistoryIcon />,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Coming soon",
    icon: <SettingsIcon />,
  },
  {
    id: "account",
    label: "Account",
    description: "Owner profile",
    icon: <AccountIcon />,
  },
];

export function VenueDashboardSidebar({
  activeSection,
  venueName,
  onSectionChange,
}: VenueDashboardSidebarProps) {
  return (
    <aside className="venue-dashboard-sidebar">
      <div className="venue-dashboard-brand">
        <div className="venue-dashboard-brand-icon">
          <img src="/Livey - Logo.png" alt="Livey" />
        </div>

        <div className="venue-dashboard-brand-copy">
          <strong>Livey</strong>
          <span>Venue Console</span>
        </div>
      </div>

      <nav className="venue-dashboard-nav" aria-label="Venue dashboard">
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={
              activeSection === item.id
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
        ))}
      </nav>

      <div className="venue-dashboard-sidebar-footer">
        <span>Signed in</span>
        <strong>{venueName || "Venue owner"}</strong>
      </div>
    </aside>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M4.75 11.2 12 5.25l7.25 5.95" />
      <path d="M6.5 10.65v7.1c0 .8.45 1.25 1.25 1.25h8.5c.8 0 1.25-.45 1.25-1.25v-7.1" />
      <path d="M10 19v-4.25c0-.55.35-.9.9-.9h2.2c.55 0 .9.35.9.9V19" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7.25v5.15l3.35 2.05" />
      <path d="M7.55 12h1.7" />
      <path d="M14.75 12h1.7" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M5.5 18.5V14" />
      <path d="M10 18.5V9.5" />
      <path d="M14.5 18.5v-6" />
      <path d="M19 18.5V6" />
      <path d="M4.5 18.75h15" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M5.65 8.1A7.75 7.75 0 1 1 4.25 12" />
      <path d="M5.65 8.1H3.25V5.7" />
      <path d="M12 7.75v4.7l3.05 1.85" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M12 15.15a3.15 3.15 0 1 0 0-6.3 3.15 3.15 0 0 0 0 6.3Z" />
      <path d="M18.2 13.15c.08-.38.12-.76.12-1.15s-.04-.77-.12-1.15l1.6-1.25-1.55-2.68-1.9.76a7.05 7.05 0 0 0-1.98-1.15L14.1 4.5h-3.2l-.27 2.03c-.72.27-1.38.66-1.98 1.15l-1.9-.76L5.2 9.6l1.6 1.25c-.08.38-.12.76-.12 1.15s.04.77.12 1.15L5.2 14.4l1.55 2.68 1.9-.76c.6.5 1.26.88 1.98 1.15l.27 2.03h3.2l.27-2.03c.72-.27 1.38-.66 1.98-1.15l1.9.76 1.55-2.68-1.6-1.25Z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img">
      <path d="M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M5.25 19.5c.65-3.05 3.05-4.85 6.75-4.85s6.1 1.8 6.75 4.85" />
    </svg>
  );
}
import type { ReactNode } from "react";
import {
  AccountSettingsIcon,
  ActivityIcon,
  AnalyticsIcon,
  ControlCenterIcon,
  HistoryIcon,
  type DashboardSection,
} from "../../VenueDashboardSidebar";
import "./VenueDashboardMobileNav.css";

type VenueDashboardMobileNavProps = {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
};

const MOBILE_NAV_ITEMS: Array<{
  id: DashboardSection;
  label: string;
  icon: ReactNode;
}> = [
  {
    id: "home",
    label: "Home",
    icon: <ControlCenterIcon />,
  },
  {
    id: "activity",
    label: "Activity",
    icon: <ActivityIcon />,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <AnalyticsIcon />,
  },
  {
    id: "history",
    label: "History",
    icon: <HistoryIcon />,
  },
  {
    id: "account",
    label: "Account",
    icon: <AccountSettingsIcon />,
  },
];

export function VenueDashboardMobileNav({
  activeSection,
  onSectionChange,
}: VenueDashboardMobileNavProps) {
  return (
    <nav
      className="venue-dashboard-mobile-nav"
      aria-label="Venue dashboard mobile navigation"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive =
          activeSection === item.id;

        return (
          <button
            key={item.id}
            className={
              isActive
                ? "venue-dashboard-mobile-nav-item is-active"
                : "venue-dashboard-mobile-nav-item"
            }
            type="button"
            aria-label={item.label}
            aria-current={
              isActive ? "page" : undefined
            }
            onClick={() =>
              onSectionChange(item.id)
            }
          >
            <span
              className="venue-dashboard-mobile-nav-icon"
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <span className="venue-dashboard-mobile-nav-label">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
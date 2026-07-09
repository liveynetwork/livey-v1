import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LiveyImageCropper } from "../../components/image-crop/LiveyImageCropper";
import type { DashboardSection } from "../VenueDashboardSidebar";
import type { VenueDashboardVenue } from "../venueDashboardService";
import { AccountLockedDetailsCard } from "./account/AccountLockedDetailsCard";
import { AccountOpeningHoursModal } from "./account/AccountOpeningHoursModal";
import { AccountSupportSessionCard } from "./account/AccountSupportSessionCard";
import { AccountVenueIdentityCard } from "./account/AccountVenueIdentityCard";
import { AccountVenueProfileCard } from "./account/AccountVenueProfileCard";
import type { DayHours } from "./account/accountTypes";
import {
  buildOpeningHoursDraft,
  formatOpeningHours,
  getTodayOpeningHoursPreview,
} from "./account/accountHoursUtils";

type VenueDashboardAccountProps = {
  currentUser: User | null;
  activeVenue: VenueDashboardVenue | null;
  isRefreshing: boolean;
  isUpdatingVenueProfile: boolean;
  onUpdateVenueProfile: (input: {
    name: string;
    description: string;
    area: string;
    address: string;
    openStatus: string;
    openingHours: string;
    logoFile: File | null;
  }) => void;
  onRefreshDashboard: () => void;
  onSectionChange: (section: DashboardSection) => void;
  onSignOut: () => void;
};

export function VenueDashboardAccount({
  activeVenue,
  isUpdatingVenueProfile,
  onUpdateVenueProfile,
  onSignOut,
}: VenueDashboardAccountProps) {
  const [name, setName] = useState(activeVenue?.name ?? "");
  const [description, setDescription] = useState(activeVenue?.description ?? "");
  const [area, setArea] = useState(activeVenue?.area ?? "");
  const [address, setAddress] = useState(activeVenue?.address ?? "");
  const [openStatus, setOpenStatus] = useState(
    activeVenue?.open_status ?? "Open now"
  );
  const [openingHours, setOpeningHours] = useState(
    activeVenue?.opening_hours ?? ""
  );

  const [openingHoursDraft, setOpeningHoursDraft] = useState<DayHours[]>(
    buildOpeningHoursDraft(activeVenue?.opening_hours ?? "")
  );
  const [isOpeningHoursEditorOpen, setIsOpeningHoursEditorOpen] =
    useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);
  const [imageToCropName, setImageToCropName] = useState("");

  const visibleLogoUrl = logoPreviewUrl || activeVenue?.logo_url || "";

  const todayOpeningHours = useMemo(
    () => getTodayOpeningHoursPreview(openingHours),
    [openingHours]
  );

  useEffect(() => {
    const nextOpeningHours = activeVenue?.opening_hours ?? "";

    setName(activeVenue?.name ?? "");
    setDescription(activeVenue?.description ?? "");
    setArea(activeVenue?.area ?? "");
    setAddress(activeVenue?.address ?? "");
    setOpenStatus(activeVenue?.open_status ?? "Open now");
    setOpeningHours(nextOpeningHours);
    setOpeningHoursDraft(buildOpeningHoursDraft(nextOpeningHours));
    setLogoFile(null);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }, [activeVenue]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      if (imageToCropSrc) {
        URL.revokeObjectURL(imageToCropSrc);
      }
    };
  }, [logoPreviewUrl, imageToCropSrc]);

  function handleLogoChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const cropUrl = URL.createObjectURL(file);

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return cropUrl;
    });

    setImageToCropName(file.name);
  }

  function handleCancelCrop() {
    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }

  function handleSaveCrop(file: File, previewUrl: string) {
    setLogoFile(file);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return previewUrl;
    });

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }

  function handleStatusChange(nextStatus: string) {
    if (nextStatus === openStatus) return;

    const confirmed = window.confirm(
      `Are you sure you want to change your venue status to "${nextStatus}"? This should only be used for urgent or manual situations.`
    );

    if (!confirmed) return;

    setOpenStatus(nextStatus);
  }

  function updateOpeningHoursDay(
    dayIndex: number,
    updates: Partial<DayHours>
  ) {
    setOpeningHoursDraft((current) =>
      current.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              ...updates,
            }
          : day
      )
    );
  }

  function handleOpenOpeningHoursEditor() {
    setOpeningHoursDraft(buildOpeningHoursDraft(openingHours));
    setIsOpeningHoursEditorOpen(true);
  }

  function handleApplyOpeningHours() {
    setOpeningHours(formatOpeningHours(openingHoursDraft));
    setIsOpeningHoursEditorOpen(false);
  }

  function handleSaveProfile() {
    onUpdateVenueProfile({
      name,
      description,
      area,
      address,
      openStatus,
      openingHours,
      logoFile,
    });
  }

  return (
    <>
      {imageToCropSrc ? (
        <LiveyImageCropper
          imageSrc={imageToCropSrc}
          fileName={imageToCropName || "venue-logo.png"}
          title="Crop venue logo"
          description="Center your venue logo inside the square. This is what people will see on Livey."
          onCancel={handleCancelCrop}
          onSave={handleSaveCrop}
        />
      ) : null}

      <section className="venue-dashboard-account-settings">
        <AccountVenueIdentityCard
          activeVenue={activeVenue}
          visibleLogoUrl={visibleLogoUrl}
          venueName={name}
          onLogoChange={handleLogoChange}
        />

        <div className="venue-dashboard-account-main-grid">
          <AccountVenueProfileCard
            description={description}
            openStatus={openStatus}
            todayOpeningHours={todayOpeningHours}
            isUpdatingVenueProfile={isUpdatingVenueProfile}
            onDescriptionChange={setDescription}
            onStatusChange={handleStatusChange}
            onOpenOpeningHoursEditor={handleOpenOpeningHoursEditor}
            onSaveProfile={handleSaveProfile}
          />

          <AccountLockedDetailsCard
            activeVenue={activeVenue}
            venueName={name}
            area={area}
            address={address}
          />
        </div>

        <AccountSupportSessionCard onSignOut={onSignOut} />
      </section>

      {isOpeningHoursEditorOpen ? (
        <AccountOpeningHoursModal
          openingHoursDraft={openingHoursDraft}
          onUpdateOpeningHoursDay={updateOpeningHoursDay}
          onClose={() => setIsOpeningHoursEditorOpen(false)}
          onApply={handleApplyOpeningHours}
        />
      ) : null}
    </>
  );
}
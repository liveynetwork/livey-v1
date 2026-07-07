import { supabase } from "../lib/supabase";

export type LiveyProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string;
  friends_count: number;
  following_count: number;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_city: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveyUserSettings = {
  user_id: string;
  city: string;
  notifications_enabled: boolean;
  personalized_venues_enabled: boolean;
  location_enabled: boolean;
  personalization_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type LiveyFollowedVenue = {
  follow_id: string;
  followed_at: string;
  venue: {
    id: string;
    name: string;
    category: string;
    area: string;
    logo_url: string | null;
    verified: boolean;
    open_status: string;
  } | null;
};

export type LiveyProfileData = {
  userEmail: string | null;
  profile: LiveyProfile | null;
  settings: LiveyUserSettings | null;
  followedVenues: LiveyFollowedVenue[];
};

function getAvatarFileExtension(file: File) {
  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();

  if (
    fileNameExtension &&
    ["jpg", "jpeg", "png", "webp"].includes(fileNameExtension)
  ) {
    return fileNameExtension === "jpg" ? "jpeg" : fileNameExtension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpeg";
}

export async function uploadCurrentUserAvatar(
  file: File
): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photo must be 5MB or less.");
  }

  const extension = getAvatarFileExtension(file);
  const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || `image/${extension}`,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return data.publicUrl;
}

export async function fetchCurrentUserProfile(): Promise<LiveyProfileData> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return {
      userEmail: null,
      profile: null,
      settings: null,
      followedVenues: [],
    };
  }

  const [profileResult, settingsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),

    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  const profile = profileResult.data ?? (await createProfileForCurrentUser());

  const settings =
    settingsResult.data ??
    (await createSettingsForCurrentUser(profile?.city ?? "Limassol"));

  const followsResult = await supabase
    .from("venue_follows")
    .select(
      `
      id,
      created_at,
      venues (
        id,
        name,
        category,
        area,
        logo_url,
        verified,
        open_status
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (followsResult.error) {
    throw followsResult.error;
  }

  return {
    userEmail: user.email ?? null,
    profile,
    settings,
    followedVenues:
      followsResult.data?.map((follow) => ({
        follow_id: follow.id,
        followed_at: follow.created_at,
        venue: Array.isArray(follow.venues)
          ? follow.venues[0] ?? null
          : follow.venues ?? null,
      })) ?? [],
  };
}

export async function createProfileForCurrentUser(): Promise<LiveyProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Livey User";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        city: "Limassol",
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSettingsForCurrentUser(
  city = "Limassol"
): Promise<LiveyUserSettings | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const cleanedCity = city.trim() || "Limassol";

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        city: cleanedCity,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function checkVenueFollowed(venueId: string): Promise<boolean> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("venue_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", venueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export type LiveyUserSettingsUpdate = Partial<
  Pick<
    LiveyUserSettings,
    | "city"
    | "notifications_enabled"
    | "personalized_venues_enabled"
    | "location_enabled"
    | "personalization_enabled"
  >
>;

export async function updateCurrentUserSettings(
  updates: LiveyUserSettingsUpdate
): Promise<LiveyUserSettings | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        ...updates,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  window.dispatchEvent(new Event("livey:user-settings-changed"));

  return data;
}

export type LiveyProfileUpdate = Partial<
  Pick<LiveyProfile, "display_name" | "avatar_url" | "city">
>;

export async function updateCurrentUserProfile(
  updates: LiveyProfileUpdate
): Promise<LiveyProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        ...updates,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  window.dispatchEvent(new Event("livey:user-profile-changed"));

  return data;
}

export async function completeCurrentUserOnboarding({
  displayName,
  username,
  city,
  avatarFile,
}: {
  displayName: string;
  username: string;
  city: string;
  avatarFile?: File | null;
}): Promise<LiveyProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const cleanedDisplayName = displayName.trim();
  const cleanedUsername = username.trim().toLowerCase().replace(/^@/, "");
  const cleanedCity = city.trim() || "Limassol";

  if (cleanedUsername.length < 3) {
    throw new Error("Livey ID must be at least 3 characters.");
  }

  if (cleanedUsername.length > 24) {
    throw new Error("Livey ID must be 24 characters or less.");
  }

  if (!/^[a-z0-9._]+$/.test(cleanedUsername)) {
    throw new Error(
      "Livey ID can only use lowercase letters, numbers, dots, and underscores."
    );
  }

  const avatarUrl = avatarFile
    ? await uploadCurrentUserAvatar(avatarFile)
    : null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name:
          cleanedDisplayName ||
          user.user_metadata?.display_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Livey User",
        username: cleanedUsername,
        avatar_url: avatarUrl,
        city: cleanedCity,
        onboarding_city: cleanedCity,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This Livey ID is already taken.");
    }

    throw error;
  }

  await createSettingsForCurrentUser(cleanedCity);

  window.dispatchEvent(new Event("livey:onboarding-completed"));

  return data;
}

export async function followVenue(venueId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("venue_follows")
    .upsert(
      {
        user_id: user.id,
        venue_id: venueId,
      },
      { onConflict: "user_id,venue_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function unfollowVenue(venueId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("venue_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("venue_id", venueId);

  if (error) {
    throw error;
  }
}
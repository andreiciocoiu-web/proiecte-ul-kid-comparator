import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PROFILE, type Profile } from "@/lib/scoring";

type ProfileState = {
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
  reset: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      setProfile: (patch) =>
        set((state) => ({ profile: { ...state.profile, ...patch } })),
      reset: () => set({ profile: DEFAULT_PROFILE }),
    }),
    { name: "atlas-kid-profile-v1" },
  ),
);

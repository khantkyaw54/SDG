import { useSyncExternalStore } from "react";
import { readProfile } from "../data/onboarding_storage";
import { getFavorites } from "../data/favorites_storage";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("inside-town-account-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("inside-town-account-change", callback);
  };
}

function snapshot() {
  const profile = readProfile();
  return JSON.stringify({ profile, favorites: getFavorites(profile?.id) });
}

export function useAccountFavorites() {
  return JSON.parse(useSyncExternalStore(subscribe, snapshot));
}

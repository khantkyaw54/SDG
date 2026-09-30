const draftKey = "machiguru_registration_draft";
const profileKey = "machiguru_demo_profile";

export function readDraft() {
  try {
    const value = JSON.parse(sessionStorage.getItem(draftKey) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function saveDraft(values) {
  sessionStorage.setItem(draftKey, JSON.stringify({ ...readDraft(), ...values }));
}

export function readProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(profileKey) || "null");
    if (typeof value?.nickname !== "string") return null;
    // Give existing demo profiles a stable account identity without changing their fields.
    if (typeof value.id !== "string" || !value.id) {
      value.id = crypto.randomUUID();
      localStorage.setItem(profileKey, JSON.stringify(value));
    }
    return value;
  } catch { return null; }
}

export function completeRegistration(draft) {
  // This is a local demo profile, never an authentication or identity credential.
  localStorage.setItem(profileKey, JSON.stringify({
    id: crypto.randomUUID(),
    nickname: draft.nickname,
    role: draft.role,
    prefecture: draft.prefecture,
    city: draft.city,
    demo: true,
  }));
  window.dispatchEvent(new Event("inside-town-account-change"));
}

export function destination(role) {
  return role === "shop" ? "/shop" : role === "government" ? "/government" : "/map";
}

const SELF_VERIFICATION_STORAGE_KEY = "wolf-den:self-verified";
const SELF_VERIFICATION_EVENT = "wolf-den:self-verified-change";

type SelfVerificationEventDetail = {
  verified: boolean;
};

export function setSelfVerification(value: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value) {
      window.sessionStorage.setItem(SELF_VERIFICATION_STORAGE_KEY, "true");
    } else {
      window.sessionStorage.removeItem(SELF_VERIFICATION_STORAGE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent<SelfVerificationEventDetail>(SELF_VERIFICATION_EVENT, {
        detail: { verified: value },
      }),
    );
  } catch (error) {
    console.warn("Unable to persist Self verification status.", error);
  }
}

export function getSelfVerification() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return (
      window.sessionStorage.getItem(SELF_VERIFICATION_STORAGE_KEY) === "true"
    );
  } catch (error) {
    console.warn("Unable to read Self verification status.", error);
    return false;
  }
}

export function subscribeToSelfVerification(
  listener: (verified: boolean) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<SelfVerificationEventDetail>;
    if (typeof customEvent.detail?.verified === "boolean") {
      listener(customEvent.detail.verified);
    } else {
      listener(getSelfVerification());
    }
  };

  window.addEventListener(SELF_VERIFICATION_EVENT, handleChange);

  const storageHandler = (event: StorageEvent) => {
    if (event.storageArea !== window.sessionStorage) {
      return;
    }
    if (event.key === SELF_VERIFICATION_STORAGE_KEY) {
      listener(getSelfVerification());
    }
  };

  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(SELF_VERIFICATION_EVENT, handleChange);
    window.removeEventListener("storage", storageHandler);
  };
}

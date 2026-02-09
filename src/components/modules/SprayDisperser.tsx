"use client";

import SprayLayout from "@/modules/spray/SprayLayout";
import { SprayProvider } from "@/modules/spray/SprayProvider";

export default function SprayDisperser() {
  return (
    <SprayProvider>
      <SprayLayout />
    </SprayProvider>
  );
}

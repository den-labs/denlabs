"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SUPPORTED_SPRAY_NETWORKS } from "@/lib/sprayNetworks";
import { DEFAULT_TOKEN_ICON, NATIVE_TOKEN_ICONS } from "../constants";

type NetworkSelectorProps = {
  selectedNetworkKey: string;
  selectedNetworkName: string;
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onSelect: (key: string) => void;
  label: string;
  badgeIcon: string;
};

export function NetworkSelector({
  selectedNetworkKey,
  selectedNetworkName,
  isOpen,
  setIsOpen,
  onSelect,
  label,
  badgeIcon,
}: NetworkSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (
        dropdownRef.current &&
        target &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative mt-4 w-full ${isOpen ? "z-50" : "z-30"}`}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="network-selector-options"
        onClick={() => setIsOpen((prev: boolean) => !prev)}
        className="flex w-full items-center gap-3 rounded-xl border border-wolf-border bg-[#0f141d] px-4 py-3 text-left text-sm text-white/80 transition hover:border-wolf-emerald focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wolf-emerald"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Image
            src={badgeIcon}
            alt={`${selectedNetworkName} badge`}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="flex-1 text-left leading-tight">
          <p className="text-[10px] uppercase text-white/50">{label}</p>
          <p className="text-base font-semibold text-white">
            {selectedNetworkName}
          </p>
        </div>
        <svg
          className={`h-5 w-5 text-white/70 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 rounded-2xl border border-wolf-border-soft bg-wolf-panel p-2 shadow-2xl">
          <ul id="network-selector-options" className="space-y-1">
            {SUPPORTED_SPRAY_NETWORKS.map((net) => {
              const isActive = net.key === selectedNetworkKey;
              const iconSrc = NATIVE_TOKEN_ICONS[net.key] ?? DEFAULT_TOKEN_ICON;
              return (
                <li key={net.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => onSelect(net.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${isActive ? "bg-wolf-emerald-soft text-wolf-emerald" : "text-white/80 hover:bg-white/5"}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Image
                        src={iconSrc}
                        alt={`${net.name} icon`}
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{net.name}</span>
                      <span className="text-[10px] uppercase text-white/50">
                        {net.nativeCurrency.symbol}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

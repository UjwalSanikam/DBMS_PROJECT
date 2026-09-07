"use client";

import { useState } from "react";

interface PlayerAvatarProps {
  playerId: number;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
  className?: string;
}

const ATLAS_COLUMNS = 5;
const ATLAS_ROWS = 8;
const ATLAS_SIZE = ATLAS_COLUMNS * ATLAS_ROWS;

export default function PlayerAvatar({
  playerId,
  firstName,
  lastName,
  photoUrl,
  className = "w-12",
}: PlayerAvatarProps) {
  const [externalPhotoFailed, setExternalPhotoFailed] = useState(false);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Player";

  if (photoUrl && !externalPhotoFailed) {
    return (
      // Imported datasets may provide arbitrary source domains, so a normal
      // image keeps the component compatible without a broad remote allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${fullName} portrait`}
        onError={() => setExternalPhotoFailed(true)}
        className={`aspect-[16/15] shrink-0 rounded-xl object-cover bg-pitch-950 ${className}`}
      />
    );
  }

  const index = ((playerId - 1) % ATLAS_SIZE + ATLAS_SIZE) % ATLAS_SIZE;
  const column = index % ATLAS_COLUMNS;
  const row = Math.floor(index / ATLAS_COLUMNS);
  const x = (column / (ATLAS_COLUMNS - 1)) * 100;
  const y = (row / (ATLAS_ROWS - 1)) * 100;

  return (
    <div
      role="img"
      aria-label={`${fullName} fictional portrait`}
      className={`aspect-[16/15] shrink-0 rounded-xl bg-pitch-950 bg-no-repeat shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ${className}`}
      style={{
        backgroundImage: "url('/images/player-portraits.png')",
        backgroundSize: `${ATLAS_COLUMNS * 100}% ${ATLAS_ROWS * 100}%`,
        backgroundPosition: `${x}% ${y}%`,
      }}
    />
  );
}

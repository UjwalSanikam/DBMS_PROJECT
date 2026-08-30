"use client";

import { useState } from "react";

interface PlayerPhotoProps {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
}

export default function PlayerPhoto({
  photoUrl,
  firstName,
  lastName,
}: PlayerPhotoProps) {
  // Starts true only when there's a URL to try; any load failure (missing
  // file, hotlink blocked, network error) flips this false and we fall
  // back to a generated initials avatar instead of a broken-image icon.
  const [showPhoto, setShowPhoto] = useState(Boolean(photoUrl));

  if (showPhoto && photoUrl) {
    // External, arbitrary-domain source photos aren't suited to next/image's
    // remote-pattern allowlist for this use case.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        onError={() => setShowPhoto(false)}
        className="h-20 w-20 rounded-full object-cover border border-border-soft bg-surface"
      />
    );
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div
      className="h-20 w-20 rounded-full border border-border-soft bg-surface-raised flex items-center justify-center"
      aria-label={`${firstName} ${lastName}`}
    >
      <span className="font-display text-xl font-semibold text-accent">
        {initials}
      </span>
    </div>
  );
}

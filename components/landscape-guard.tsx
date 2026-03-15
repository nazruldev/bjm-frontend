"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
};

function isTabletViewport(width: number, height: number) {
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  // Heuristik tablet: sisi pendek >= 600px dan sisi panjang <= 1400px
  return minSide >= 600 && maxSide <= 1400;
}

export function LandscapeGuard({ children }: Props) {
  const [showOverlay, setShowOverlay] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTablet = isTabletViewport(width, height);
      const isPortrait = height > width;

      setShowOverlay(isTablet && isPortrait);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (showOverlay) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
        <div className="max-w-xs">
          <p className="mb-2 text-lg font-semibold">
            Putar perangkat ke posisi landscape
          </p>
          <p className="text-sm text-white/80">
            Aplikasi ini dioptimalkan untuk tampilan horizontal saat digunakan di tablet.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


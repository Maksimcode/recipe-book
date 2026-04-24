"use client";

import { useMemo, useState } from "react";

type PhotoCarouselProps = {
  photos: Array<{ id: string; photoUrl: string }>;
  alt: string;
};

export function PhotoCarousel({ photos, alt }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const hasMany = photos.length > 1;
  const safeIndex = useMemo(() => {
    if (photos.length === 0) return 0;
    return Math.min(index, photos.length - 1);
  }, [index, photos.length]);

  if (photos.length === 0) {
    return <div className="card-media card-media-empty">Нет фото</div>;
  }

  function prev(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIndex((current) => (current - 1 + photos.length) % photos.length);
  }

  function next(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIndex((current) => (current + 1) % photos.length);
  }

  return (
    <div className="carousel card-media-bleed">
      <img className="card-media" src={photos[safeIndex].photoUrl} alt={alt} />
      {hasMany ? (
        <>
          <button className="carousel-btn carousel-btn-left" type="button" onClick={prev}>
            ‹
          </button>
          <button className="carousel-btn carousel-btn-right" type="button" onClick={next}>
            ›
          </button>
          <div className="carousel-counter">
            {safeIndex + 1} / {photos.length}
          </div>
        </>
      ) : null}
    </div>
  );
}

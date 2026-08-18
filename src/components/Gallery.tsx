"use client";

import { useState } from "react";
import styles from "@/app/page.module.css";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

interface GalleryProps {
  images: GalleryImage[];
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800",
];

export default function Gallery({ images }: GalleryProps) {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  // If no database images, use BRL fallbacks
  const hasImages = images && images.length > 0;
  
  const getImageSrc = (index: number) => {
    if (hasImages) {
      return images[index].url;
    }
    return FALLBACK_IMAGES[index];
  };

  const getImagesLength = () => {
    return hasImages ? images.length : FALLBACK_IMAGES.length;
  };

  const getCaption = (index: number) => {
    if (hasImages) {
      return images[index].caption;
    }
    return null;
  };

  const openLightbox = (index: number) => {
    setPhotoIndex(index);
    document.body.style.overflow = "hidden"; // Disable scroll when modal open
  };

  const closeLightbox = () => {
    setPhotoIndex(null);
    document.body.style.overflow = "unset";
  };

  const navigatePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex === null) return;
    const len = getImagesLength();
    setPhotoIndex((photoIndex - 1 + len) % len);
  };

  const navigateNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex === null) return;
    const len = getImagesLength();
    setPhotoIndex((photoIndex + 1) % len);
  };

  return (
    <div>
      <div className={styles.galleryGrid}>
        {hasImages
          ? images.map((img, index) => (
              <div
                key={img.id}
                className={styles.galleryItem}
                onClick={() => openLightbox(index)}
              >
                <img
                  src={img.url}
                  alt={img.caption || `Foto do casal ${index + 1}`}
                  className={styles.galleryImg}
                  loading="lazy"
                />
              </div>
            ))
          : FALLBACK_IMAGES.map((src, index) => (
              <div
                key={index}
                className={styles.galleryItem}
                onClick={() => openLightbox(index)}
              >
                <img
                  src={src}
                  alt={`Foto do casal ${index + 1}`}
                  className={styles.galleryImg}
                  loading="lazy"
                />
              </div>
            ))}
      </div>

      {photoIndex !== null && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <span className={styles.lightboxClose} onClick={closeLightbox}>
            &times;
          </span>
          <span className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={navigatePrev}>
            &#10094;
          </span>
          
          <div style={{ position: "relative", textAlign: "center" }}>
            <img
              src={getImageSrc(photoIndex)}
              alt="Foto ampliada"
              className={styles.lightboxContent}
            />
            {getCaption(photoIndex) && (
              <div style={{
                color: "var(--color-white)",
                marginTop: "1rem",
                fontSize: "1rem",
                fontStyle: "italic",
                fontFamily: "var(--font-serif)"
              }}>
                {getCaption(photoIndex)}
              </div>
            )}
          </div>
          
          <span className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={navigateNext}>
            &#10095;
          </span>
        </div>
      )}
    </div>
  );
}

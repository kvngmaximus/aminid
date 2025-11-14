import React, { useState, ImgHTMLAttributes } from "react";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "onError"> & {
  fallbackSrc?: string;
};

export default function SafeImage({
  src,
  alt,
  className,
  fallbackSrc = "/placeholder.svg",
  ...rest
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc as string}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      {...rest}
    />
  );
}
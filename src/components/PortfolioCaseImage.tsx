import Image from "next/image";

export function PortfolioCaseImage({
  src,
  alt,
  className = ""
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex aspect-[4/3] items-center justify-center rounded-lg border border-line bg-ivory text-center text-sm font-semibold leading-6 text-neutral-500 ${className}`}
      >
        패키지 제작 사례 이미지
      </div>
    );
  }

  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-white ${className}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" unoptimized />
    </div>
  );
}

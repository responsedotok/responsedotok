import Image from 'next/image';

export default function LogoImage({ className, src }: { className?: string, src: string }) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      priority
      width={800}
      height={800}
      className={className}
    />
  );
}

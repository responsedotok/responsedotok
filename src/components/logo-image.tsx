import Image from 'next/image';

export default function LogoImage({ className }: { className?: string }) {
  return (
    <Image
      src="/resdotok.svg"
      alt=""
      aria-hidden
      priority
      width={800}
      height={800}
      className={className}
    />
  );
}

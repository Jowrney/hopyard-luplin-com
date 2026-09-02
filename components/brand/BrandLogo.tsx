import Image from 'next/image'

interface BrandLogoProps {
  width?: number
  variant?: 'dark' | 'light'
  className?: string
}

export function BrandLogo({ width = 190, variant = 'dark', className }: BrandLogoProps) {
  return (
    <Image
      src="/brand/hopyard-designer.svg"
      alt="Hopyard Designer"
      width={width}
      height={Math.round(width * 20.72 / 190.73)}
      unoptimized
      className={className}
      style={{
        display: 'block',
        width,
        maxWidth: '100%',
        height: 'auto',
        filter: variant === 'light' ? 'brightness(0) invert(1)' : undefined,
      }}
    />
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Las imágenes del catálogo son URLs externas pegadas por el admin
  // (o SVG locales). Usamos <img> directamente, no next/image.
  images: { unoptimized: true },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Las imágenes del catálogo son URLs externas pegadas por el admin
  // (o SVG locales). Usamos <img> directamente, no next/image.
  images: { unoptimized: true },
  // En Vercel (serverless, fs de solo lectura) el almacén trabaja
  // sobre /tmp; el JSON semilla viaja DENTRO del bundle para que las
  // funciones puedan auto-siembra:
  outputFileTracingIncludes: {
    "/**": ["./data/demo-seed.json"],
  },
};

export default nextConfig;

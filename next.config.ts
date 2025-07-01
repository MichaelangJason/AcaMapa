import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    dangerouslyAllowSVG: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"], // https://stackoverflow.com/questions/65676689/next-js-how-can-i-change-the-color-of-svg-in-next-image
    });
    return config;
  },
};

export default nextConfig;

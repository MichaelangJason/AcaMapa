import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // globalNotFound: true
  },
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    qualities: [100]
  },
  outputFileTracingRoot: './',
  turbopack: {
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#configuring-webpack-loaders
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },
  cacheComponents: false
  
  // webpack: (config) => {
  //   config.module.rules.push({
  //     test: /\.svg$/,
  //     use: ["@svgr/webpack"], // https://stackoverflow.com/questions/65676689/next-js-how-can-i-change-the-color-of-svg-in-next-image
  //   });
  //   return config;
  // },
};

// Add bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);


import type { NextConfig } from "next";
import path from "path";

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
  // outputFileTracingRoot: './',
  turbopack: {
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#configuring-webpack-loaders
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    },
    root: path.join(__dirname, '..'),
  },
  cacheComponents: false,
  
  webpack: (config: any) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"], // https://stackoverflow.com/questions/65676689/next-js-how-can-i-change-the-color-of-svg-in-next-image
    });
    // config.module.rules.push({
    //   test: /\.s?css$/,
    //   use: ['style-loader', 'css-loader', 'sass-loader'],
    // });
    return config;
  },
  // sassOptions: {
  //   includePaths: ['./src/styles'], // Adjust path as needed
  // },
};

// Add bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);


export default {
  "src/**/*.{js,ts,tsx,jsx,css,scss}": (stagedFiles) => [
    `gitleaks git --staged`,
    `eslint ${stagedFiles.join(" ")}`,
    // `pnpm build`,
    `prettier --write ${stagedFiles.join(" ")}`,
    `git add ${stagedFiles.join(" ")}`,
  ],
};

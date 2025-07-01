export default {
  "src/**/*.{js,ts,tsx,jsx,css,scss}": (stagedFiles) => [
    `gitleaks git --staged`,
    `next lint --file ${stagedFiles.join(" ")}`,
    `prettier --write ${stagedFiles.join(" ")}`,
    `git add ${stagedFiles.join(" ")}`,
  ],
};

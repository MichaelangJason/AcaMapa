
export default {
    "src/**/*.{js,ts,tsx,jsx}": (stagedFiles) => [
        `gitleaks git --staged`,
        `npx eslint ${stagedFiles.join(' ')}`,
        `prettier --check ${stagedFiles.join(' ')}`
    ]
}

/* eslint-disable @typescript-eslint/no-require-imports */
// import { readFileSync, writeFileSync } from 'fs'
const fs = require('fs')
const readFileSync = fs.readFileSync
const writeFileSync = fs.writeFileSync

const processCourseCodes = () => {
    try {
        // Read the original CSV file
        const content = readFileSync('./courses.csv', 'utf-8')
        
        // Regex pattern for valid course codes
        // Matches: XXXX 123 or XXXX 123D1 format
        const courseCodePattern = /^[A-Z]{3,4}\s\d{3}(?:D[1-2])?$/

        // Skip header and process each line
        const lines = content.split('\n')
        const header = lines[0]
        const processedCodes = lines
            .slice(1) // Skip header
            .map((line: string) => {
                const parts = line.split(' ')
                if (parts.length >= 2) {
                    const courseCode = `${parts[0]} ${parts[1]}`
                    return courseCodePattern.test(courseCode) ? courseCode : ''
                }
                return ''
            })
            .filter((code: string) => code) // Remove empty lines
        
        // Write to a new file
        const newContent = [header, ...processedCodes].join('\n')
        writeFileSync('./courses_processed.csv', newContent)
        
        console.log('Course codes have been processed successfully')
        console.log(`Processed ${processedCodes.length} course codes`)
        console.log('Results saved to courses_processed.csv')
    } catch (error) {
        console.error('Error processing course codes:', error)
    }
}

// Run the processing
processCourseCodes()

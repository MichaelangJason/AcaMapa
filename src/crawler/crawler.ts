// import { load } from 'cheerio'
// import { writeFileSync } from 'fs'
const cheerio = require('cheerio')
const fs = require('fs')
const cliProgress = require('cli-progress')

const load = cheerio.load
const writeFileSync = fs.writeFileSync


const domain = "https://www.mcgill.ca"
const baseUrl = `${domain}/study/2024-2025/courses`

const getLastPageNumber = async (): Promise<number> => {
  try {
    const response = await fetch(`${baseUrl}/search`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const html = await response.text()
    const $ = load(html)
    
    const lastPageHref = $('.pager-last a').attr('href')
    if (!lastPageHref) return 1
    
    const pageMatch = lastPageHref.match(/page=(\d+)/)
    return pageMatch ? parseInt(pageMatch[1]) : 1
  } catch (error) {
    console.error('Error getting last page:', error)
    return 1
  }
}

const getCoursesFromPage = async (pageNum: number): Promise<string[]> => {
  try {
    const response = await fetch(`${baseUrl}/search?page=${pageNum}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const html = await response.text()
    const $ = load(html)
    
    const courseCodes: string[] = []
    
    $('.views-field-field-course-title-long').each((_: number, element: any) => {
      const fullText = $(element).find('a').text().trim()
      const parts = fullText.split(' ')
      if (parts.length >= 2) {
        const courseCode = `${parts[0]} ${parts[1]}`
        courseCodes.push(courseCode)
      }
    })
    
    return courseCodes
  } catch (error) {
    console.error(`Error processing page ${pageNum}:`, error)
    return []
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getAllCourses = async () => {
  try {
    const lastPage = await getLastPageNumber()
    const allCourseCodes: string[] = []
    
    // Create a progress bar
    const progressBar = new cliProgress.SingleBar({
      format: 'Crawling |{bar}| {percentage}% | {value}/{total} Pages',
      barCompleteChar: '=',
      barIncompleteChar: ' ',
    })
    
    // Start the progress bar
    progressBar.start(lastPage + 1, 0)
    
    for (let page = 0; page <= lastPage; page++) {
      const courseCodes = await getCoursesFromPage(page)
      allCourseCodes.push(...courseCodes)
      await sleep(500)
      progressBar.update(page + 1)
    }
    
    // Stop the progress bar
    progressBar.stop()
    
    writeFileSync('courses.csv', 'Course Code\n' + allCourseCodes.join('\n'))
    console.log(`\nSaved ${allCourseCodes.length} course codes to courses.csv`)
  } catch (error) {
    console.error('Error in main process:', error)
  }
}

// Execute the main function
getAllCourses()
# AcaMapa (updated to year 2025-2026)

_A Web App that helps McGill students plan their degree_

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white"/>
  <img src="https://img.shields.io/badge/Auth.js-000000?style=for-the-badge&logo=auth0&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-APACHE-blue?style=for-the-badge"/>
</p>


> a HUGE THANK to [@EvEnzyme](https://github.com/EvEnzyme) for ideation, UX, writups and mental supports :)

---


## 📌 Motivation  

As a McGill student, I often find it frustrating to plan my degree:  

- I had to jump between different webpages (course descriptions, program requirements) and keep my own notes in Google Docs or text files, which I would eventually lose the following year.  
- It was hard to figure out which electives I could take based on the courses I had already completed.  
- Finding courses and programs that actually matched my interests was even harder.  
- Existing tools like **myProgress** and **VSB** serve different purposes, but neither made long-term planning easy.  

**AcaMapa** addresses these issues by crawling and parsing program/course information and offering a **visual, drag-and-drop planning experience** that’s both simple and flexible.  

---

## ✨ Features  

1. **Find & pin your program(s)**  
   - Add required and complementary courses directly from the parsed results.  
2. **Plan your degree semester by semester**  
   - Reorder and organize terms and courses with simple drag-and-drop.  
   - Add extra or missing courses into terms through search.  
   - Explore future electives directly from course cards and dive deeper into areas of interest.  
3. **Validate your plan with requirement checks**  
   - Courses are shown in <strong><span style="color:#b2e026">green</span></strong> if all requirements are satisfied and <strong><span style="color:#ed7155">red</span></strong> if not. 
   - Requirements are validated against pre-, co-, and anti-requisites.  
   - Supported requirement types include:  
     1. **AND:** `COMP 206 AND COMP 302`  
     2. **OR:** `COMP 202 OR COMP 250`  
     3. **Select two from a list:** `Two from COMP 206, COMP 302, COMP 250, COMP 330`  
     4. **Credit-based:** `12 credits from COMP at 300-level or higher`  
   - You can overwrite a course’s requirements to mark it as satisfied.  
   - **Equivalent checks** (e.g. `COMP 252` vs `COMP 251`) are supported by custom rules, they count towards pre-requisites, co-requisites, and restrictions.
   - Add completed courses to **Courses Taken** to provide context for prerequisite checks across all plans.  
   - Create multiple plans aiming at different programs or degrees.  
   - Inspect plan statistics, including **total credits** and **average credits per term**, to better evaluate your workload.
4. **Validate in VSB**
   - Terms indicated with red triangle (current term) or red circle (term in current academic year) can be checked in VSB
5. **Share with others**  
   - Export plans as **PNG images**, including stats and courses taken, to share with academic advisors or fellow students.  
   - Import exported plans from the embedded QR codes, plan based on previous experiances!
6. **Save your plans**  
   - Plans are stored locally and persist across page refreshes.  
   - Plans can be stored as the exported image.
7. **Localization**  
   - English is fully supported.  
   - French support is included but still needs refinement — contributions are welcome! Open an issue if you’d like to help.  
8. ~~**AI (Deprecated)**~~
   - ~~Semantic search (RAG) for programs and courses based on your interests.~~  
   - ~~Automated plan generation tailored to your workload preferences.~~  
   - ~~**Enhanced subsequent course search**: recommendations based on your entire plan, not just a single course.~~  

---

📣 **Note:** AcaMapa might be useful for students at other schools too! If you’d like to adapt this tool to your university, it mainly requires preparing a MongoDB database with your school’s program and course information. Open an issue to get in touch!  

---

## 🛠️ Tech Stack  

- **Frontend & Backend:** Next.js, MongoDB, Redux Toolkit, Hello-pangea/dnd  
- **Auth & Email:** Auth.js, Resend  
- **AI (incoming):** MongoDB Atlas, LangGraph  

---

## ⚙️ Environment Variables  

Add the following to your `.env`:  

```bash
ANALYZE="false"
APP_HOST="0.0.0.0"
APP_PORT="3030"
DOMAIN="your.domain"
MONGODB_DATABASE_NAME="a MongoDB Database that implements the interface"
MONGODB_URI="URI to your MongoDB Database"
USE_DIFF_SYNC="0"
# I used upstash redis, optional for yours
UPSTASH_KV_REST_API_READ_ONLY_TOKEN=
UPSTASH_KV_REST_API_TOKEN=
UPSTASH_KV_REST_API_URL=
UPSTASH_KV_URL=
UPSTASH_REDIS_URL=
USER_DATABASE_NAME="auth"

````

> MongoDB files: open an issue to contact me, and I’ll share the parsed results.

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/MichaelangJason/AcaMapa.git

# Install dependencies
pnpm install   # or npm install

# Setup Husky & lint-staged
pnpm prepare   # or npm prepare

# Run in dev mode
pnpm dev

# Build & start
pnpm build
pnpm start
```

---

## 🗺️ Roadmap

* [x] Local degree planning with drag & drop
* [x] Current Academic Year + Check viability in VSB 
* [x] Import from JSON/image (exported by this app)
* [x] Equivalent course check
* [x] UI refinement
* [ ] Automatic updater(crawler) of Courses and Programs
* [ ] ~~Remote plan saving with McGill login~~
* [ ] ~~AI-powered program & course search~~
* [ ] ~~Automated plan generation (workload-based)~~

---

## 📄 License

[Apache 2.0](./LICENSE)

# 
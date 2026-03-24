# PRODUCT CONTEXT - GitMatch (Tinder for Open Source)

## 1. Project Vision
GitMatch is a web platform designed to help student and junior developers find Open Source projects that match their skill level. It uses a "Tinder-like" interface (Swipe Right to Like/Save, Swipe Left to Pass) to make the discovery process engaging and simple.

## 2. Target Audience
* **Users:** Students, Junior Developers, Contributors looking for "Good First Issues".
* **Needs:** Gamified discovery of projects by language and difficulty.

## 3. Core Features (MVP)

### A. Authentication
* **GitHub OAuth:** Users login via GitHub.
* **Session:** Secure Opaque Access Token stored in HTTP-Only Cookies.

### B. User Onboarding
* **Profiling:** Auto-detection of languages based on the user's GitHub profile.
* **Preferences:** User selects difficulty (Beginner/Expert) and confirms stack.

### C. The Matching Engine (Lazy-Loading Strategy)
We do not rely on a nightly Cron job. We use a **Reactive/Lazy Ingestion** strategy.

1.  **User Trigger:** The user looks for projects (e.g., "JavaScript" + "Beginner").
2.  **Cache First:** The Backend queries the **Local PostgresSQL Database**.
3.  **Lazy Load (The Switch):**
  * If local results are sufficient: Return them immediately.
  * If local results are insufficient (Cache Miss): **Call the GitHub API in real-time**.
  * **Batching:** Fetch a batch of **100 repositories** matching the criteria.
  * **Upsert:** Store these 100 repos in the DB immediately.
  * **Return:** Serve the newly fetched data to the user.

### D. Interface
* **Swipe Mode:** Main view displays one Project Card at a time.
* **Actions:** Like (Save to Favorites), Pass (Hide), View Details.
* **Dark Mode:** Default.

## 4. Data Entities
* **User:** GitHub ID, Preferences, Opaque Token Session.
* **Project:** GitHub Repo ID, Name, Description, Stars, Language, Topics.
* **Match/Favorite:** Relation between User and Project (Swiped Right).

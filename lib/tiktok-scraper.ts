/**
 * TikTok Playwright Scraper
 *
 * Native browser automation that replaces Claude in Chrome dependency.
 * Uses Playwright to control a real Chromium browser and intercept
 * TikTok's internal API responses for clean structured data.
 *
 * Strategy:
 * 1. Launch persistent Chromium (saves cookies/session)
 * 2. Navigate to TikTok pages
 * 3. Intercept fetch() responses to TikTok APIs (comment/list, item/detail, etc.)
 * 4. Scroll to trigger lazy-loading of more data
 * 5. Return structured JSON data
 */

import { chromium, type Browser, type BrowserContext, type Page, type Response } from 'playwright'
import path from 'path'
import os from 'os'

// ============================================================
// Types
// ============================================================

export interface ExtractedComment {
  username: string
  commentText: string
  likes: number
  timestamp: string
  replyTo: string | null
  videoUrl: string | null
}

export interface ExtractedVideo {
  videoUrl: string
  description: string
  hashtags: string[]
  creator: string
  views: number
  likes: number
  shares: number
  commentsCount: number
  thumbnailUrl: string
  musicTitle: string
}

export interface CreatorProfile {
  username: string
  displayName: string
  bio: string
  followers: number
  following: number
  totalLikes: number
  videoCount: number
  verified: boolean
  avatarUrl: string
}

export interface ScrapeProgress {
  phase: string
  message: string
  count?: number
}

type ProgressCallback = (progress: ScrapeProgress) => void

// ============================================================
// Constants
// ============================================================

const USER_DATA_DIR = path.join(os.homedir(), '.tiktok-scraper-data')
const DEFAULT_TIMEOUT = 60000
const API_RESPONSE_TIMEOUT = 45000
const SCROLL_DELAY_MIN = 1000
const SCROLL_DELAY_MAX = 2500
const ACTION_DELAY_MIN = 500
const ACTION_DELAY_MAX = 1500

// TikTok API URL patterns to intercept (comprehensive from api-mapper research)
const API_PATTERNS = {
  comments: /\/api\/comment\/list/,
  commentReplies: /\/api\/comment\/list\/reply/,
  videoDetail: /\/api\/item\/detail/,
  userVideos: /\/api\/post\/item_list/,
  searchGeneral: /\/api\/search\/general\/full/,
  searchUser: /\/api\/search\/user/,
  userDetail: /\/api\/user\/detail/,
  recommend: /\/api\/recommend\/item_list/,
  // New endpoints from api-mapper research
  challengeVideos: /\/api\/challenge\/item_list/,
  musicVideos: /\/api\/music\/item_list/,
  relatedVideos: /\/api\/related\/item_list/,
  discoverUser: /\/api\/discover\/user/,
  discoverMusic: /\/api\/discover\/music/,
  discoverChallenge: /\/api\/discover\/challenge/,
}

// ============================================================
// Helper functions
// ============================================================

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseEngagementCount(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const str = value.toLowerCase().replace(/,/g, '')
    if (str.includes('k')) return Math.round(parseFloat(str) * 1000)
    if (str.includes('m')) return Math.round(parseFloat(str) * 1000000)
    return parseInt(str) || 0
  }
  return 0
}

// ============================================================
// TikTok Scraper Class
// ============================================================

export class TikTokScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private fastModeEnabled = false

  // Captured API data
  private capturedComments: ExtractedComment[] = []
  private capturedVideos: ExtractedVideo[] = []
  private capturedProfile: CreatorProfile | null = null

  /**
   * Initialize the browser with persistent context
   */
  async init(onProgress?: ProgressCallback): Promise<void> {
    onProgress?.({ phase: 'init', message: 'Abriendo navegador...' })

    this.browser = await chromium.launch({
      headless: false, // Real browser to avoid detection
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    })

    // Persistent context saves cookies across sessions
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'es-ES',
      storageState: await this.loadStorageState(),
    })

    // Remove automation indicators (from chrome-reverser analysis:
    // the Chrome extension avoids detection because it uses the user's real browser.
    // For Playwright, we need to actively hide automation signals)
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      // Hide Playwright-specific indicators
      Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'en'] })
      // Mask chrome.runtime detection (sites check for automation extensions)
      const win = window as unknown as Record<string, unknown>
      if (win.chrome) {
        const chr = win.chrome as Record<string, unknown>
        const originalRuntime = chr.runtime
        Object.defineProperty(chr, 'runtime', {
          get: () => originalRuntime || { id: undefined },
        })
      }
    })

    this.page = await this.context.newPage()

    // Set up API response interception
    this.setupInterceptors()

    onProgress?.({ phase: 'init', message: 'Navegador listo' })
  }

  /**
   * Load saved storage state (cookies/localStorage) if it exists
   */
  private async loadStorageState(): Promise<string | undefined> {
    try {
      const fs = await import('fs')
      const statePath = path.join(USER_DATA_DIR, 'storage-state.json')
      if (fs.existsSync(statePath)) {
        return statePath
      }
    } catch { /* no saved state */ }
    return undefined
  }

  /**
   * Save current storage state for session reuse
   */
  async saveSession(): Promise<void> {
    if (!this.context) return
    try {
      const fs = await import('fs')
      if (!fs.existsSync(USER_DATA_DIR)) {
        fs.mkdirSync(USER_DATA_DIR, { recursive: true })
      }
      const state = await this.context.storageState()
      fs.writeFileSync(
        path.join(USER_DATA_DIR, 'storage-state.json'),
        JSON.stringify(state, null, 2)
      )
    } catch (e) {
      console.error('Failed to save session:', e)
    }
  }

  /**
   * Get cookies and tokens for the direct API client
   */
  async getAuthTokens(): Promise<{ cookies: string; msToken: string }> {
    if (!this.context) throw new Error('Browser not initialized')

    const cookies = await this.context.cookies('https://www.tiktok.com')
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
    const msToken = cookies.find(c => c.name === 'msToken')?.value || ''

    return { cookies: cookieStr, msToken }
  }

  /**
   * Set up network response interceptors to capture TikTok API data
   */
  private setupInterceptors(): void {
    if (!this.page) return

    this.page.on('response', async (response: Response) => {
      const url = response.url()

      try {
        // Capture comment list responses
        if (API_PATTERNS.comments.test(url) && !API_PATTERNS.commentReplies.test(url)) {
          const data = await response.json()
          const comments = data?.comments || []
          for (const c of comments) {
            this.capturedComments.push({
              username: '@' + (c.user?.unique_id || c.user?.uniqueId || 'unknown'),
              commentText: c.text || '',
              likes: c.digg_count || c.diggCount || 0,
              timestamp: c.create_time
                ? new Date(c.create_time * 1000).toISOString()
                : '',
              replyTo: c.reply_id && c.reply_id !== '0' ? 'reply' : null,
              videoUrl: null,
            })
          }
        }

        // Capture comment reply responses
        if (API_PATTERNS.commentReplies.test(url)) {
          const data = await response.json()
          const replies = data?.comments || []
          for (const r of replies) {
            this.capturedComments.push({
              username: '@' + (r.user?.unique_id || r.user?.uniqueId || 'unknown'),
              commentText: r.text || '',
              likes: r.digg_count || r.diggCount || 0,
              timestamp: r.create_time
                ? new Date(r.create_time * 1000).toISOString()
                : '',
              replyTo: r.reply_to_reply_id || 'reply',
              videoUrl: null,
            })
          }
        }

        // Capture video detail
        if (API_PATTERNS.videoDetail.test(url)) {
          const data = await response.json()
          const item = data?.itemInfo?.itemStruct || data?.item
          if (item) {
            this.capturedVideos.push(this.parseVideoItem(item))
          }
        }

        // Capture user video list
        if (API_PATTERNS.userVideos.test(url)) {
          const data = await response.json()
          const items = data?.itemList || []
          for (const item of items) {
            this.capturedVideos.push(this.parseVideoItem(item))
          }
        }

        // Capture search results
        if (API_PATTERNS.searchGeneral.test(url)) {
          const data = await response.json()
          const items = data?.data || []
          for (const result of items) {
            const item = result?.item
            if (item) {
              this.capturedVideos.push(this.parseVideoItem(item))
            }
          }
        }

        // Capture user profile
        if (API_PATTERNS.userDetail.test(url)) {
          const data = await response.json()
          const user = data?.userInfo?.user
          const stats = data?.userInfo?.stats
          if (user) {
            this.capturedProfile = {
              username: '@' + (user.uniqueId || ''),
              displayName: user.nickname || '',
              bio: user.signature || '',
              followers: stats?.followerCount || 0,
              following: stats?.followingCount || 0,
              totalLikes: stats?.heartCount || stats?.heart || 0,
              videoCount: stats?.videoCount || 0,
              verified: user.verified || false,
              avatarUrl: user.avatarLarger || user.avatarMedium || '',
            }
          }
        }

        // Capture hashtag/challenge videos (from api-mapper)
        if (API_PATTERNS.challengeVideos.test(url)) {
          const data = await response.json()
          const items = data?.itemList || []
          for (const item of items) {
            this.capturedVideos.push(this.parseVideoItem(item))
          }
        }

        // Capture music/sound videos (from api-mapper)
        if (API_PATTERNS.musicVideos.test(url)) {
          const data = await response.json()
          const items = data?.itemList || []
          for (const item of items) {
            this.capturedVideos.push(this.parseVideoItem(item))
          }
        }

        // Capture related/recommended videos (from api-mapper)
        if (API_PATTERNS.relatedVideos.test(url)) {
          const data = await response.json()
          const items = data?.itemList || []
          for (const item of items) {
            this.capturedVideos.push(this.parseVideoItem(item))
          }
        }
      } catch {
        // Response might not be JSON, ignore
      }
    })
  }

  /**
   * Wait for a specific API response pattern to be received.
   * Returns a promise that resolves when the matching response arrives,
   * or rejects after timeout.
   */
  private waitForApiResponse(
    pattern: RegExp,
    timeout: number = API_RESPONSE_TIMEOUT,
  ): Promise<void> {
    if (!this.page) return Promise.reject(new Error('Browser not initialized'))

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.page?.removeListener('response', handler)
        reject(new Error(`Timeout waiting for API response matching ${pattern}`))
      }, timeout)

      const handler = (response: Response) => {
        if (pattern.test(response.url())) {
          clearTimeout(timer)
          this.page?.removeListener('response', handler)
          // Small delay to let the interceptor process the response first
          setTimeout(resolve, 500)
        }
      }

      this.page!.on('response', handler)
    })
  }

  /**
   * Parse a TikTok video item object into our format
   */
  private parseVideoItem(item: Record<string, unknown>): ExtractedVideo {
    const stats = (item.stats || {}) as Record<string, unknown>
    const music = (item.music || {}) as Record<string, unknown>
    const author = (item.author || {}) as Record<string, unknown>
    const challenges = (item.challenges || []) as Array<Record<string, unknown>>
    const textExtra = (item.textExtra || []) as Array<Record<string, unknown>>

    const hashtags = [
      ...challenges.map(c => String(c.title || '')),
      ...textExtra.filter(t => t.hashtagName).map(t => String(t.hashtagName)),
    ].filter(Boolean)

    return {
      videoUrl: item.id
        ? `https://www.tiktok.com/@${author.uniqueId || ''}/video/${item.id}`
        : '',
      description: String(item.desc || ''),
      hashtags,
      creator: '@' + String(author.uniqueId || item.authorUniqueId || ''),
      views: parseEngagementCount(stats.playCount || item.playCount),
      likes: parseEngagementCount(stats.diggCount || item.diggCount),
      shares: parseEngagementCount(stats.shareCount || item.shareCount),
      commentsCount: parseEngagementCount(stats.commentCount || item.commentCount),
      thumbnailUrl: String((item.video as Record<string, unknown>)?.cover || ''),
      musicTitle: String(music.title || ''),
    }
  }

  /**
   * Navigate to a URL and wait for it to load
   */
  async goto(url: string, onProgress?: ProgressCallback): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized')

    onProgress?.({ phase: 'navigate', message: `Navegando a ${url.substring(0, 60)}...` })

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: DEFAULT_TIMEOUT,
    })

    // Wait for TikTok to fully render
    await randomDelay(2000, 3000)

    // Check for CAPTCHA or login wall - only check VISIBLE captcha elements,
    // not the word "captcha" in HTML (TikTok JS bundles contain the word)
    const hasCaptcha = await this.page.evaluate(`
      (function() {
        var captchaContainer = document.querySelector('#captcha-verify-container');
        var captchaIframe = document.querySelector('iframe[src*="captcha"]');
        var captchaOverlay = document.querySelector('[class*="captcha-verify"]');
        // Only true if a visible captcha element exists
        if (captchaContainer && captchaContainer.offsetHeight > 0) return true;
        if (captchaIframe) return true;
        if (captchaOverlay && captchaOverlay.offsetHeight > 0) return true;
        return false;
      })()
    `)

    if (hasCaptcha) {
      onProgress?.({ phase: 'warning', message: 'Detectado CAPTCHA - resuelvelo manualmente en el navegador' })
      await this.page.waitForFunction(
        `!document.querySelector('#captcha-verify-container') &&
         !document.querySelector('iframe[src*="captcha"]') &&
         !document.querySelector('[class*="captcha-verify"]')`,
        { timeout: 120000 },
      ).catch(() => {
        onProgress?.({ phase: 'warning', message: 'Timeout esperando CAPTCHA - continuando...' })
      })
      await randomDelay(2000, 3000)
    }
  }

  // ============================================================
  // COMMENT EXTRACTION
  // ============================================================

  /**
   * Extract comments from a TikTok video page.
   * Scrolls through comments and captures API responses.
   */
  async extractComments(
    videoUrl: string,
    maxComments: number = 500,
    onProgress?: ProgressCallback,
  ): Promise<ExtractedComment[]> {
    if (!this.page) throw new Error('Browser not initialized')

    // Reset captured data
    this.capturedComments = []

    // Start waiting for comment API response before navigating
    const apiWait = this.waitForApiResponse(
      API_PATTERNS.comments,
      API_RESPONSE_TIMEOUT,
    ).catch(() => {})

    await this.goto(videoUrl, onProgress)
    onProgress?.({ phase: 'extract', message: 'Cargando comentarios...' })

    // Wait for comments section to appear
    await this.page.waitForSelector(
      '[data-e2e="comment-level-1"], [class*="CommentListContainer"]',
      { timeout: 15000 },
    ).catch(() => {
      onProgress?.({ phase: 'extract', message: 'Buscando seccion de comentarios...' })
    })

    // Wait for first comment API response
    await apiWait

    // Scroll through comments to trigger more API calls
    let previousCount = this.capturedComments.length
    let staleScrolls = 0
    const maxStaleScrolls = 5

    for (let scroll = 0; scroll < 50; scroll++) {
      if (this.capturedComments.length >= maxComments) break
      if (staleScrolls >= maxStaleScrolls) break

      // Scroll the comments container
      await this.page.evaluate(() => {
        const containers = [
          document.querySelector('[data-e2e="comment-list"]'),
          document.querySelector('[class*="DivCommentListContainer"]'),
          document.querySelector('[class*="comment-list"]'),
        ].filter(Boolean)

        if (containers.length > 0) {
          containers[0]!.scrollTop = containers[0]!.scrollHeight
        } else {
          window.scrollBy(0, 600)
        }
      })

      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)

      // Check if new comments were loaded
      const currentCount = this.capturedComments.length
      if (currentCount === previousCount) {
        staleScrolls++
      } else {
        staleScrolls = 0
      }
      previousCount = currentCount

      onProgress?.({
        phase: 'scrolling',
        message: `Scrolleando... ${currentCount} comentarios capturados`,
        count: currentCount,
      })
    }

    // Deduplicate
    const seen = new Set<string>()
    const unique = this.capturedComments.filter(c => {
      const key = c.username + ':' + c.commentText.substring(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Set video URL on all comments
    unique.forEach(c => { c.videoUrl = videoUrl })

    onProgress?.({
      phase: 'complete',
      message: `Extraccion completa! ${unique.length} comentarios unicos`,
      count: unique.length,
    })

    // Save session cookies for reuse
    await this.saveSession()

    return unique.slice(0, maxComments)
  }

  // ============================================================
  // SEARCH EXTRACTION
  // ============================================================

  /**
   * Extract videos from TikTok search results
   */
  async extractSearchResults(
    query: string,
    maxResults: number = 50,
    onProgress?: ProgressCallback,
  ): Promise<ExtractedVideo[]> {
    if (!this.page) throw new Error('Browser not initialized')

    this.capturedVideos = []

    const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`

    // Start waiting for the search API response BEFORE navigating.
    // The API call fires during page load (client-side rendered),
    // so we must be listening before goto completes.
    const apiWait = this.waitForApiResponse(
      /\/api\/search\/general\/full\//,
      API_RESPONSE_TIMEOUT,
    ).catch(() => {
      // Timeout is non-fatal; we'll fall back to DOM extraction
    })

    await this.goto(searchUrl, onProgress)

    onProgress?.({ phase: 'extract', message: `Esperando resultados de "${query}"...` })

    // Wait for the first search API response to arrive
    await apiWait

    onProgress?.({
      phase: 'extract',
      message: `${this.capturedVideos.length} resultados iniciales capturados`,
      count: this.capturedVideos.length,
    })

    // If we got initial results from API, scroll for more
    // If not, still try scrolling (the API call may be delayed)
    let staleScrolls = 0
    let previousCount = this.capturedVideos.length

    for (let scroll = 0; scroll < 20; scroll++) {
      if (this.capturedVideos.length >= maxResults) break
      if (staleScrolls >= 4) break

      await this.page.evaluate(() => window.scrollBy(0, 1000))
      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)

      const currentCount = this.capturedVideos.length
      if (currentCount === previousCount) {
        staleScrolls++
      } else {
        staleScrolls = 0
      }
      previousCount = currentCount

      onProgress?.({
        phase: 'scrolling',
        message: `${currentCount} videos encontrados...`,
        count: currentCount,
      })
    }

    // If API interception didn't capture enough, fall back to DOM
    if (this.capturedVideos.length === 0) {
      onProgress?.({ phase: 'fallback', message: 'Extrayendo del DOM...' })
      const domVideos = await this.extractVideosFromDOM()
      this.capturedVideos.push(...domVideos)
    }

    const unique = this.deduplicateVideos(this.capturedVideos)

    onProgress?.({
      phase: 'complete',
      message: `${unique.length} videos encontrados para "${query}"`,
      count: unique.length,
    })

    await this.saveSession()
    return unique.slice(0, maxResults)
  }

  // ============================================================
  // PROFILE EXTRACTION
  // ============================================================

  /**
   * Extract creator profile and their videos
   */
  async extractCreatorProfile(
    profileUrl: string,
    maxVideos: number = 30,
    onProgress?: ProgressCallback,
  ): Promise<{ profile: CreatorProfile; videos: ExtractedVideo[] }> {
    if (!this.page) throw new Error('Browser not initialized')

    this.capturedVideos = []
    this.capturedProfile = null

    // Start waiting for user detail API before navigating
    const apiWait = this.waitForApiResponse(
      /\/api\/user\/detail/,
      API_RESPONSE_TIMEOUT,
    ).catch(() => {})

    await this.goto(profileUrl, onProgress)
    onProgress?.({ phase: 'extract', message: 'Extrayendo perfil...' })

    // Wait for user detail API response
    await apiWait

    // Wait for profile to load in DOM
    await this.page.waitForSelector(
      '[data-e2e="user-title"], [data-e2e="user-post-item"]',
      { timeout: 10000 },
    ).catch(() => {})

    // Try SSR extraction from __UNIVERSAL_DATA_FOR_REHYDRATION__
    // Profile data IS available in SSR (unlike search results)
    if (!this.capturedProfile) {
      this.capturedProfile = await this.extractProfileFromSSR()
    }

    // If still no profile, extract from DOM
    if (!this.capturedProfile) {
      this.capturedProfile = await this.extractProfileFromDOM()
    }

    // Scroll to load more videos
    let staleScrolls = 0
    let previousCount = this.capturedVideos.length

    for (let scroll = 0; scroll < 15; scroll++) {
      if (this.capturedVideos.length >= maxVideos) break
      if (staleScrolls >= 3) break

      await this.page.evaluate(() => window.scrollBy(0, 1000))
      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)

      const currentCount = this.capturedVideos.length
      if (currentCount === previousCount) staleScrolls++
      else staleScrolls = 0
      previousCount = currentCount

      onProgress?.({
        phase: 'scrolling',
        message: `${currentCount} videos del creador...`,
        count: currentCount,
      })
    }

    // Fallback to DOM extraction for videos
    if (this.capturedVideos.length === 0) {
      const domVideos = await this.extractVideosFromDOM()
      this.capturedVideos.push(...domVideos)
    }

    const unique = this.deduplicateVideos(this.capturedVideos)

    onProgress?.({
      phase: 'complete',
      message: `Perfil + ${unique.length} videos extraidos`,
      count: unique.length,
    })

    await this.saveSession()

    return {
      profile: this.capturedProfile || {
        username: profileUrl,
        displayName: '',
        bio: '',
        followers: 0,
        following: 0,
        totalLikes: 0,
        videoCount: 0,
        verified: false,
        avatarUrl: '',
      },
      videos: unique.slice(0, maxVideos),
    }
  }

  // ============================================================
  // FEED EXTRACTION
  // ============================================================

  /**
   * Extract videos from the For You feed
   */
  async extractFeedVideos(
    maxVideos: number = 30,
    onProgress?: ProgressCallback,
  ): Promise<ExtractedVideo[]> {
    if (!this.page) throw new Error('Browser not initialized')

    this.capturedVideos = []

    await this.goto('https://www.tiktok.com/foryou', onProgress)
    onProgress?.({ phase: 'extract', message: 'Capturando feed...' })

    await randomDelay(2000, 3000)

    for (let scroll = 0; scroll < maxVideos; scroll++) {
      if (this.capturedVideos.length >= maxVideos) break

      // Scroll to next video
      await this.page.evaluate(() => window.scrollBy(0, window.innerHeight))
      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)

      onProgress?.({
        phase: 'scrolling',
        message: `${this.capturedVideos.length} videos capturados del feed...`,
        count: this.capturedVideos.length,
      })
    }

    const unique = this.deduplicateVideos(this.capturedVideos)
    onProgress?.({
      phase: 'complete',
      message: `${unique.length} videos del feed capturados`,
      count: unique.length,
    })

    await this.saveSession()
    return unique.slice(0, maxVideos)
  }

  // ============================================================
  // HASHTAG / CHALLENGE EXTRACTION (from api-mapper)
  // ============================================================

  /**
   * Extract videos from a hashtag/challenge page.
   * TikTok loads these via /api/challenge/item_list/ which we intercept.
   */
  async extractHashtagVideos(
    hashtag: string,
    maxVideos: number = 50,
    onProgress?: ProgressCallback,
  ): Promise<ExtractedVideo[]> {
    if (!this.page) throw new Error('Browser not initialized')

    this.capturedVideos = []

    // Navigate to hashtag page
    const cleanTag = hashtag.replace(/^#/, '')
    const hashtagUrl = `https://www.tiktok.com/tag/${encodeURIComponent(cleanTag)}`

    // Wait for challenge API response before navigating
    const apiWait = this.waitForApiResponse(
      API_PATTERNS.challengeVideos,
      API_RESPONSE_TIMEOUT,
    ).catch(() => {})

    await this.goto(hashtagUrl, onProgress)

    onProgress?.({ phase: 'extract', message: `Extrayendo videos de #${cleanTag}...` })

    await apiWait

    await this.page.waitForSelector(
      '[data-e2e="challenge-item"], [data-e2e="search_top-item"]',
      { timeout: 10000 },
    ).catch(() => {})

    // Scroll to load more
    let staleScrolls = 0
    let previousCount = 0

    for (let scroll = 0; scroll < 20; scroll++) {
      if (this.capturedVideos.length >= maxVideos) break
      if (staleScrolls >= 3) break

      await this.page.evaluate(() => window.scrollBy(0, 1000))
      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)

      const currentCount = this.capturedVideos.length
      if (currentCount === previousCount) staleScrolls++
      else staleScrolls = 0
      previousCount = currentCount

      onProgress?.({
        phase: 'scrolling',
        message: `${currentCount} videos de #${cleanTag}...`,
        count: currentCount,
      })
    }

    if (this.capturedVideos.length === 0) {
      const domVideos = await this.extractVideosFromDOM()
      this.capturedVideos.push(...domVideos)
    }

    const unique = this.deduplicateVideos(this.capturedVideos)

    onProgress?.({
      phase: 'complete',
      message: `${unique.length} videos de #${cleanTag} extraidos`,
      count: unique.length,
    })

    await this.saveSession()
    return unique.slice(0, maxVideos)
  }

  // ============================================================
  // MUSIC / SOUND EXTRACTION (from api-mapper)
  // ============================================================

  /**
   * Extract videos using a specific sound/music.
   * TikTok loads these via /api/music/item_list/ which we intercept.
   */
  async extractMusicVideos(
    musicUrl: string,
    maxVideos: number = 50,
    onProgress?: ProgressCallback,
  ): Promise<ExtractedVideo[]> {
    if (!this.page) throw new Error('Browser not initialized')

    this.capturedVideos = []

    await this.goto(musicUrl, onProgress)
    onProgress?.({ phase: 'extract', message: 'Extrayendo videos del sonido...' })

    await this.page.waitForSelector(
      '[data-e2e="music-item"], [data-e2e="search_top-item"]',
      { timeout: 10000 },
    ).catch(() => {})

    let staleScrolls = 0
    let previousCount = 0

    for (let scroll = 0; scroll < 20; scroll++) {
      if (this.capturedVideos.length >= maxVideos) break
      if (staleScrolls >= 3) break

      await this.page.evaluate(() => window.scrollBy(0, 1000))
      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)

      const currentCount = this.capturedVideos.length
      if (currentCount === previousCount) staleScrolls++
      else staleScrolls = 0
      previousCount = currentCount

      onProgress?.({
        phase: 'scrolling',
        message: `${currentCount} videos del sonido...`,
        count: currentCount,
      })
    }

    if (this.capturedVideos.length === 0) {
      const domVideos = await this.extractVideosFromDOM()
      this.capturedVideos.push(...domVideos)
    }

    const unique = this.deduplicateVideos(this.capturedVideos)

    onProgress?.({
      phase: 'complete',
      message: `${unique.length} videos del sonido extraidos`,
      count: unique.length,
    })

    await this.saveSession()
    return unique.slice(0, maxVideos)
  }

  // ============================================================
  // RELATED VIDEOS EXTRACTION (from api-mapper)
  // ============================================================

  /**
   * Extract related/recommended videos for a specific video.
   * Navigates to the video page and captures /api/related/item_list/ responses.
   */
  async extractRelatedVideos(
    videoUrl: string,
    maxVideos: number = 30,
    onProgress?: ProgressCallback,
  ): Promise<ExtractedVideo[]> {
    if (!this.page) throw new Error('Browser not initialized')

    this.capturedVideos = []

    await this.goto(videoUrl, onProgress)
    onProgress?.({ phase: 'extract', message: 'Extrayendo videos relacionados...' })

    // Wait for related/recommended section to load
    await randomDelay(2000, 3000)

    // Scroll to trigger related videos loading
    for (let scroll = 0; scroll < 5; scroll++) {
      await this.page.evaluate(() => window.scrollBy(0, 800))
      await randomDelay(SCROLL_DELAY_MIN, SCROLL_DELAY_MAX)
    }

    const unique = this.deduplicateVideos(this.capturedVideos)

    onProgress?.({
      phase: 'complete',
      message: `${unique.length} videos relacionados extraidos`,
      count: unique.length,
    })

    await this.saveSession()
    return unique.slice(0, maxVideos)
  }

  // ============================================================
  // DOM FALLBACK EXTRACTION
  // ============================================================

  /**
   * Extract videos from DOM when API interception doesn't capture data
   */
  private async extractVideosFromDOM(): Promise<ExtractedVideo[]> {
    if (!this.page) return []

    // Use a string script to avoid tsx/esbuild injecting __name helper
    // which doesn't exist in the browser's page.evaluate() context
    const domItems = await this.page.evaluate(`
      (function() {
        var videos = [];
        function parseCount(str) {
          if (!str) return 0;
          str = str.toLowerCase().replace(/,/g, '');
          if (str.includes('k')) return Math.round(parseFloat(str) * 1000);
          if (str.includes('m')) return Math.round(parseFloat(str) * 1000000);
          return parseInt(str) || 0;
        }

        var items = document.querySelectorAll(
          '[data-e2e="search_top-item"], [data-e2e="user-post-item"], ' +
          '[class*="DivItemContainerV2"]'
        );

        items.forEach(function(item) {
          try {
            var linkEl = item.querySelector('a[href*="/video/"]');
            var descEl = item.querySelector('[data-e2e="search-card-desc"], a[title]');
            var creatorEl = item.querySelector('[data-e2e="search-card-user-unique-id"]');
            var viewsEl = item.querySelector('[data-e2e="video-views"]');
            var imgEl = item.querySelector('img[src*="tiktok"]');

            videos.push({
              videoUrl: linkEl ? linkEl.getAttribute('href') : '',
              description: (descEl ? descEl.textContent || descEl.getAttribute('title') : '') || '',
              creator: '@' + ((creatorEl ? creatorEl.textContent : '') || '').trim(),
              views: parseCount(viewsEl ? viewsEl.textContent : ''),
              thumbnailUrl: imgEl ? imgEl.getAttribute('src') : '',
            });
          } catch(e) {}
        });

        return videos;
      })()
    `) as Array<Record<string, unknown>>

    return domItems.map(item => ({
      videoUrl: String(item.videoUrl || ''),
      description: String(item.description || ''),
      hashtags: [],
      creator: String(item.creator || ''),
      views: Number(item.views) || 0,
      likes: 0,
      shares: 0,
      commentsCount: 0,
      thumbnailUrl: String(item.thumbnailUrl || ''),
      musicTitle: '',
    }))
  }

  /**
   * Extract profile info from DOM
   */
  private async extractProfileFromDOM(): Promise<CreatorProfile | null> {
    if (!this.page) return null

    // Use string eval to avoid tsx __name injection issue
    return this.page.evaluate(`
      (function() {
        function parseCount(str) {
          if (!str) return 0;
          str = str.toLowerCase().replace(/,/g, '');
          if (str.includes('k')) return Math.round(parseFloat(str) * 1000);
          if (str.includes('m')) return Math.round(parseFloat(str) * 1000000);
          if (str.includes('b')) return Math.round(parseFloat(str) * 1000000000);
          return parseInt(str) || 0;
        }

        var nameEl = document.querySelector('[data-e2e="user-title"]');
        var usernameEl = document.querySelector('[data-e2e="user-subtitle"]');
        var bioEl = document.querySelector('[data-e2e="user-bio"]');
        var followerEl = document.querySelector('[data-e2e="followers-count"]');
        var followingEl = document.querySelector('[data-e2e="following-count"]');
        var likesEl = document.querySelector('[data-e2e="likes-count"]');

        return {
          username: (usernameEl ? usernameEl.textContent : window.location.pathname) || '',
          displayName: (nameEl ? nameEl.textContent : '') || '',
          bio: (bioEl ? bioEl.textContent : '') || '',
          followers: parseCount(followerEl ? followerEl.textContent : ''),
          following: parseCount(followingEl ? followingEl.textContent : ''),
          totalLikes: parseCount(likesEl ? likesEl.textContent : ''),
          videoCount: 0,
          verified: false,
          avatarUrl: '',
        };
      })()
    `) as Promise<CreatorProfile | null>
  }

  /**
   * Extract profile info from SSR data (__UNIVERSAL_DATA_FOR_REHYDRATION__).
   * Profile basic info (username, stats, bio) IS available in SSR HTML
   * under the webapp.user-detail key. Video list is NOT (itemList is empty).
   */
  private async extractProfileFromSSR(): Promise<CreatorProfile | null> {
    if (!this.page) return null

    // Use string eval to avoid tsx __name injection issue
    return this.page.evaluate(`
      (function() {
        try {
          var scriptEl = document.querySelector('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
          if (!scriptEl || !scriptEl.textContent) return null;

          var data = JSON.parse(scriptEl.textContent);
          var scope = data && data.__DEFAULT_SCOPE__;
          var userDetail = scope && scope['webapp.user-detail'];
          if (!userDetail || !userDetail.userInfo) return null;

          var user = userDetail.userInfo.user;
          var stats = userDetail.userInfo.stats || userDetail.userInfo.statsV2 || {};

          return {
            username: '@' + (user.uniqueId || ''),
            displayName: user.nickname || '',
            bio: user.signature || '',
            followers: Number(stats.followerCount) || 0,
            following: Number(stats.followingCount) || 0,
            totalLikes: Number(stats.heartCount || stats.heart) || 0,
            videoCount: Number(stats.videoCount) || 0,
            verified: user.verified || false,
            avatarUrl: user.avatarLarger || user.avatarMedium || '',
          };
        } catch(e) {
          return null;
        }
      })()
    `) as Promise<CreatorProfile | null>
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  /**
   * Deduplicate videos by URL
   */
  private deduplicateVideos(videos: ExtractedVideo[]): ExtractedVideo[] {
    const seen = new Set<string>()
    return videos.filter(v => {
      const key = v.videoUrl || v.description.substring(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Block unnecessary resources to speed up scraping.
   * Uses targeted URL patterns instead of a catch-all route handler
   * to avoid interfering with page.on('response') API interception.
   *
   * IMPORTANT: page.route('**\/*') with a catch-all can delay or interfere
   * with response events. We use specific patterns for resources to block.
   */
  async enableFastMode(): Promise<void> {
    if (!this.page) return
    this.fastModeEnabled = true
    // Block specific resource patterns instead of using a catch-all **/*
    // This avoids interfering with API response interception
    await this.page.route(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|m3u8)(\?.*)?$/i, (route) => {
      return route.abort()
    })
    // Block known heavy tracking/telemetry domains
    await this.page.route(/mcs-sg\.tiktokv\.com/, (route) => route.abort())
    await this.page.route(/mon\.tiktokv\.com/, (route) => route.abort())
    await this.page.route(/mssdk-sg\.tiktok\.com/, (route) => route.abort())
  }

  /**
   * Disable fast mode (re-enable all resources)
   */
  async disableFastMode(): Promise<void> {
    if (!this.page) return
    this.fastModeEnabled = false
    await this.page.unrouteAll()
  }

  /**
   * Take a screenshot (useful for debugging)
   */
  async screenshot(filePath: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized')
    await this.page.screenshot({ path: filePath, fullPage: false })
  }

  /**
   * Monitor console for errors/warnings (from chrome-reverser:
   * extension uses Runtime.enable + Runtime.consoleAPICalled,
   * Playwright uses page.on('console') natively).
   * Useful for detecting TikTok blocking or API errors.
   */
  onConsoleError(callback: (message: string) => void): void {
    if (!this.page) return
    this.page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        callback(`[${msg.type()}] ${msg.text()}`)
      }
    })
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.saveSession()
      await this.context.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
    this.browser = null
    this.context = null
    this.page = null
  }
}

// ============================================================
// Singleton factory
// ============================================================

let scraperInstance: TikTokScraper | null = null

/**
 * Get or create a TikTok scraper instance.
 * Reuses the same browser session across requests.
 */
export async function getTikTokScraper(onProgress?: ProgressCallback): Promise<TikTokScraper> {
  if (!scraperInstance) {
    scraperInstance = new TikTokScraper()
    await scraperInstance.init(onProgress)
  }
  return scraperInstance
}

/**
 * Close the global scraper instance
 */
export async function closeTikTokScraper(): Promise<void> {
  if (scraperInstance) {
    await scraperInstance.close()
    scraperInstance = null
  }
}

/**
 * TikTok Direct API Client
 *
 * Calls TikTok's internal web APIs directly without a browser.
 * Requires auth tokens (cookies, msToken) obtained from a Playwright session.
 *
 * This is the "fast path" for bulk extraction once we have valid auth.
 * Can make hundreds of API calls per minute vs slow browser scrolling.
 *
 * Usage:
 *   const client = new TikTokAPIClient()
 *   client.setAuth(cookies, msToken)  // from Playwright session
 *   const comments = await client.getAllComments(videoId, 1000)
 */

// ============================================================
// Types
// ============================================================

export interface TikTokCommentRaw {
  cid: string
  text: string
  create_time: number
  digg_count: number
  reply_comment_total: number
  user: {
    unique_id: string
    nickname: string
    avatar_thumb: { url_list: string[] }
  }
  reply_id: string
  reply_to_reply_id: string
}

export interface TikTokVideoRaw {
  id: string
  desc: string
  createTime: number
  author: {
    uniqueId: string
    nickname: string
  }
  stats: {
    playCount: number
    diggCount: number
    shareCount: number
    commentCount: number
  }
  music: {
    title: string
    authorName: string
  }
  video: {
    cover: string
    dynamicCover: string
  }
  challenges?: Array<{ title: string }>
  textExtra?: Array<{ hashtagName?: string }>
}

export interface CommentListResponse {
  comments: TikTokCommentRaw[]
  cursor: number
  has_more: boolean | number
  total: number
}

export interface VideoListResponse {
  itemList: TikTokVideoRaw[]
  cursor: string
  hasMore: boolean
}

export interface SearchResponse {
  data: Array<{
    type: number
    item?: TikTokVideoRaw
  }>
  cursor: string
  has_more: number
}

export interface UserDetailResponse {
  userInfo: {
    user: {
      uniqueId: string
      nickname: string
      signature: string
      verified: boolean
      avatarLarger: string
    }
    stats: {
      followerCount: number
      followingCount: number
      heartCount: number
      videoCount: number
    }
  }
}

export interface HashtagVideoResponse {
  itemList: TikTokVideoRaw[]
  cursor: string
  hasMore: boolean
}

export interface MusicVideoResponse {
  itemList: TikTokVideoRaw[]
  cursor: string
  hasMore: boolean
}

export interface RelatedVideoResponse {
  itemList: TikTokVideoRaw[]
}

export interface DiscoverResponse {
  userInfoList?: Array<{
    user: { uniqueId: string; nickname: string; signature: string; avatarLarger: string }
    stats: { followerCount: number; videoCount: number }
  }>
  musicInfoList?: Array<{
    music: { id: string; title: string; authorName: string }
    stats: { videoCount: number }
  }>
  challengeInfoList?: Array<{
    challenge: { id: string; title: string; desc: string }
    stats: { videoCount: number; viewCount: number }
  }>
}

// ============================================================
// Constants
// ============================================================

const BASE_URL = 'https://www.tiktok.com'
const API_BASE = `${BASE_URL}/api`

const DEFAULT_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': 'https://www.tiktok.com/',
  'Origin': 'https://www.tiktok.com',
}

// Common TikTok API params (from api-mapper research)
const COMMON_PARAMS = {
  aid: '1988',
  app_name: 'tiktok_web',
  device_platform: 'web_pc',
}

// Rate limiting
const REQUEST_DELAY_MS = 300  // Min delay between requests
const MAX_RETRIES = 3
const BACKOFF_MULTIPLIER = 2
const MAX_PAGINATION_RESULTS = 5000  // TikTok enforces this limit

// ============================================================
// Client
// ============================================================

export class TikTokAPIClient {
  private cookies: string = ''
  private msToken: string = ''
  private verifyFp: string = ''
  private lastRequestTime: number = 0

  /**
   * Set authentication from a Playwright browser session
   */
  setAuth(cookies: string, msToken: string): void {
    this.cookies = cookies
    this.msToken = msToken
    // Extract verifyFp from cookies if present
    const fpMatch = cookies.match(/s_v_web_id=([^;]+)/)
    if (fpMatch) this.verifyFp = fpMatch[1]
  }

  /**
   * Check if the client has auth tokens set
   */
  get isAuthenticated(): boolean {
    return this.cookies.length > 0 && this.msToken.length > 0
  }

  /**
   * Generate search_id for search API calls
   * Format: YYYYMMDDHHMMSS + random hex (16 chars total suffix)
   */
  private static generateSearchId(): string {
    const now = new Date()
    const ts = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    const hex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    return ts + hex
  }

  /**
   * Build URLSearchParams with common TikTok params included
   */
  private buildParams(specific: Record<string, string>): URLSearchParams {
    return new URLSearchParams({
      ...COMMON_PARAMS,
      ...specific,
      msToken: this.msToken,
    })
  }

  /**
   * Rate-limited fetch with retries and exponential backoff
   */
  private async apiFetch<T>(url: string): Promise<T> {
    // Rate limiting
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    if (elapsed < REQUEST_DELAY_MS) {
      await new Promise(r => setTimeout(r, REQUEST_DELAY_MS - elapsed))
    }
    this.lastRequestTime = Date.now()

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            ...DEFAULT_HEADERS,
            'Cookie': this.cookies,
          },
        })

        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitMs = 1000 * Math.pow(BACKOFF_MULTIPLIER, attempt + 1)
          await new Promise(r => setTimeout(r, waitMs))
          continue
        }

        if (!response.ok) {
          throw new Error(`TikTok API error: ${response.status} ${response.statusText}`)
        }

        return await response.json() as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < MAX_RETRIES - 1) {
          const waitMs = 500 * Math.pow(BACKOFF_MULTIPLIER, attempt)
          await new Promise(r => setTimeout(r, waitMs))
        }
      }
    }

    throw lastError || new Error('API request failed after retries')
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  /**
   * Get a page of comments for a video
   */
  async getComments(
    videoId: string,
    cursor: number = 0,
    count: number = 50,
  ): Promise<CommentListResponse> {
    const params = this.buildParams({
      aweme_id: videoId,
      cursor: cursor.toString(),
      count: count.toString(),
    })

    return this.apiFetch<CommentListResponse>(
      `${API_BASE}/comment/list/?${params.toString()}`
    )
  }

  /**
   * Get ALL comments for a video (paginated).
   * Respects TikTok's 5000 result pagination limit.
   */
  async getAllComments(
    videoId: string,
    maxComments: number = 1000,
    onProgress?: (count: number) => void,
  ): Promise<TikTokCommentRaw[]> {
    const allComments: TikTokCommentRaw[] = []
    let cursor = 0
    let hasMore = true
    const limit = Math.min(maxComments, MAX_PAGINATION_RESULTS)

    while (hasMore && allComments.length < limit) {
      const response = await this.getComments(videoId, cursor, 50)

      if (response.comments && response.comments.length > 0) {
        allComments.push(...response.comments)
        cursor = response.cursor
        hasMore = !!response.has_more
        onProgress?.(allComments.length)
      } else {
        hasMore = false
      }
    }

    return allComments.slice(0, limit)
  }

  /**
   * Get replies to a specific comment.
   * Uses item_id + comment_id params per api-mapper findings.
   */
  async getCommentReplies(
    videoId: string,
    commentId: string,
    cursor: number = 0,
    count: number = 20,
  ): Promise<CommentListResponse> {
    const params = this.buildParams({
      item_id: videoId,
      comment_id: commentId,
      cursor: cursor.toString(),
      count: count.toString(),
    })

    return this.apiFetch<CommentListResponse>(
      `${API_BASE}/comment/list/reply/?${params.toString()}`
    )
  }

  // ============================================================
  // VIDEOS
  // ============================================================

  /**
   * Get video detail
   */
  async getVideoDetail(videoId: string): Promise<TikTokVideoRaw | null> {
    const params = this.buildParams({
      itemId: videoId,
    })

    const response = await this.apiFetch<{ itemInfo?: { itemStruct?: TikTokVideoRaw } }>(
      `${API_BASE}/item/detail/?${params.toString()}`
    )

    return response.itemInfo?.itemStruct || null
  }

  /**
   * Get a user's videos.
   * Per api-mapper: requires secUid, sourceType=12, verifyFp, uses minCursor/maxCursor.
   */
  async getUserVideos(
    secUid: string,
    cursor: string = '0',
    count: number = 30,
  ): Promise<VideoListResponse> {
    const params = this.buildParams({
      secUid,
      cursor,
      count: count.toString(),
      sourceType: '12',
      ...(this.verifyFp ? { verifyFp: this.verifyFp } : {}),
    })

    return this.apiFetch<VideoListResponse>(
      `${API_BASE}/post/item_list/?${params.toString()}`
    )
  }

  /**
   * Get all videos from a user (paginated).
   * Respects 5000 pagination limit.
   */
  async getAllUserVideos(
    secUid: string,
    maxVideos: number = 200,
    onProgress?: (count: number) => void,
  ): Promise<TikTokVideoRaw[]> {
    const allVideos: TikTokVideoRaw[] = []
    let cursor = '0'
    let hasMore = true
    const limit = Math.min(maxVideos, MAX_PAGINATION_RESULTS)

    while (hasMore && allVideos.length < limit) {
      const response = await this.getUserVideos(secUid, cursor, 30)

      if (response.itemList && response.itemList.length > 0) {
        allVideos.push(...response.itemList)
        cursor = response.cursor
        hasMore = response.hasMore
        onProgress?.(allVideos.length)
      } else {
        hasMore = false
      }
    }

    return allVideos.slice(0, limit)
  }

  // ============================================================
  // HASHTAG / CHALLENGE VIDEOS
  // ============================================================

  /**
   * Get videos for a hashtag/challenge.
   * Endpoint: /api/challenge/item_list/ with challengeID.
   */
  async getHashtagVideos(
    challengeId: string,
    cursor: string = '0',
    count: number = 30,
  ): Promise<HashtagVideoResponse> {
    const params = this.buildParams({
      challengeID: challengeId,
      cursor,
      count: count.toString(),
    })

    return this.apiFetch<HashtagVideoResponse>(
      `${API_BASE}/challenge/item_list/?${params.toString()}`
    )
  }

  /**
   * Get all videos for a hashtag (paginated)
   */
  async getAllHashtagVideos(
    challengeId: string,
    maxVideos: number = 200,
    onProgress?: (count: number) => void,
  ): Promise<TikTokVideoRaw[]> {
    const allVideos: TikTokVideoRaw[] = []
    let cursor = '0'
    let hasMore = true
    const limit = Math.min(maxVideos, MAX_PAGINATION_RESULTS)

    while (hasMore && allVideos.length < limit) {
      const response = await this.getHashtagVideos(challengeId, cursor, 30)

      if (response.itemList && response.itemList.length > 0) {
        allVideos.push(...response.itemList)
        cursor = response.cursor
        hasMore = response.hasMore
        onProgress?.(allVideos.length)
      } else {
        hasMore = false
      }
    }

    return allVideos.slice(0, limit)
  }

  // ============================================================
  // MUSIC VIDEOS
  // ============================================================

  /**
   * Get videos using a specific sound/music.
   * Endpoint: /api/music/item_list/ with musicID.
   */
  async getMusicVideos(
    musicId: string,
    cursor: string = '0',
    count: number = 30,
  ): Promise<MusicVideoResponse> {
    const params = this.buildParams({
      musicID: musicId,
      cursor,
      count: count.toString(),
    })

    return this.apiFetch<MusicVideoResponse>(
      `${API_BASE}/music/item_list/?${params.toString()}`
    )
  }

  /**
   * Get all videos for a music/sound (paginated)
   */
  async getAllMusicVideos(
    musicId: string,
    maxVideos: number = 200,
    onProgress?: (count: number) => void,
  ): Promise<TikTokVideoRaw[]> {
    const allVideos: TikTokVideoRaw[] = []
    let cursor = '0'
    let hasMore = true
    const limit = Math.min(maxVideos, MAX_PAGINATION_RESULTS)

    while (hasMore && allVideos.length < limit) {
      const response = await this.getMusicVideos(musicId, cursor, 30)

      if (response.itemList && response.itemList.length > 0) {
        allVideos.push(...response.itemList)
        cursor = response.cursor
        hasMore = response.hasMore
        onProgress?.(allVideos.length)
      } else {
        hasMore = false
      }
    }

    return allVideos.slice(0, limit)
  }

  // ============================================================
  // RELATED VIDEOS
  // ============================================================

  /**
   * Get related/recommended videos for a specific video.
   * Endpoint: /api/related/item_list/ with itemID, count=16.
   */
  async getRelatedVideos(
    videoId: string,
    count: number = 16,
  ): Promise<TikTokVideoRaw[]> {
    const params = this.buildParams({
      itemID: videoId,
      count: count.toString(),
    })

    const response = await this.apiFetch<RelatedVideoResponse>(
      `${API_BASE}/related/item_list/?${params.toString()}`
    )

    return response.itemList || []
  }

  // ============================================================
  // SEARCH
  // ============================================================

  /**
   * Search for videos.
   * Per api-mapper: requires search_id (timestamp + random hex), search_source param.
   */
  async searchVideos(
    query: string,
    cursor: string = '0',
    count: number = 20,
  ): Promise<SearchResponse> {
    const params = this.buildParams({
      keyword: query,
      cursor,
      count: count.toString(),
      search_source: 'normal_search',
      search_id: TikTokAPIClient.generateSearchId(),
    })

    return this.apiFetch<SearchResponse>(
      `${API_BASE}/search/general/full/?${params.toString()}`
    )
  }

  /**
   * Search all videos (paginated).
   * Respects 5000 pagination limit.
   */
  async searchAllVideos(
    query: string,
    maxResults: number = 100,
    onProgress?: (count: number) => void,
  ): Promise<TikTokVideoRaw[]> {
    const allVideos: TikTokVideoRaw[] = []
    let cursor = '0'
    let hasMore = true
    const limit = Math.min(maxResults, MAX_PAGINATION_RESULTS)

    while (hasMore && allVideos.length < limit) {
      const response = await this.searchVideos(query, cursor, 20)

      const videos = (response.data || [])
        .filter(d => d.item)
        .map(d => d.item!)

      if (videos.length > 0) {
        allVideos.push(...videos)
        cursor = response.cursor
        hasMore = !!response.has_more
        onProgress?.(allVideos.length)
      } else {
        hasMore = false
      }
    }

    return allVideos.slice(0, limit)
  }

  // ============================================================
  // USER
  // ============================================================

  /**
   * Get user profile detail
   */
  async getUserDetail(uniqueId: string): Promise<UserDetailResponse | null> {
    const params = this.buildParams({
      uniqueId,
    })

    try {
      return await this.apiFetch<UserDetailResponse>(
        `${API_BASE}/user/detail/?${params.toString()}`
      )
    } catch {
      return null
    }
  }

  // ============================================================
  // DISCOVER / TRENDING
  // ============================================================

  /**
   * Discover trending users
   */
  async discoverUsers(
    count: number = 30,
    cursor: string = '0',
  ): Promise<DiscoverResponse> {
    const params = this.buildParams({
      count: count.toString(),
      cursor,
      discoverType: '0',
    })

    return this.apiFetch<DiscoverResponse>(
      `${API_BASE}/discover/user/?${params.toString()}`
    )
  }

  /**
   * Discover trending music/sounds
   */
  async discoverMusic(
    count: number = 30,
    cursor: string = '0',
  ): Promise<DiscoverResponse> {
    const params = this.buildParams({
      count: count.toString(),
      cursor,
      discoverType: '0',
    })

    return this.apiFetch<DiscoverResponse>(
      `${API_BASE}/discover/music/?${params.toString()}`
    )
  }

  /**
   * Discover trending hashtags/challenges
   */
  async discoverHashtags(
    count: number = 30,
    cursor: string = '0',
  ): Promise<DiscoverResponse> {
    const params = this.buildParams({
      count: count.toString(),
      cursor,
      discoverType: '0',
    })

    return this.apiFetch<DiscoverResponse>(
      `${API_BASE}/discover/challenge/?${params.toString()}`
    )
  }

  /**
   * Get trending feed videos.
   * Endpoint: /api/recommend/item_list/ with id=1, type=5.
   */
  async getTrendingFeed(count: number = 30): Promise<TikTokVideoRaw[]> {
    const params = this.buildParams({
      id: '1',
      type: '5',
      count: count.toString(),
    })

    const response = await this.apiFetch<{ itemList?: TikTokVideoRaw[] }>(
      `${API_BASE}/recommend/item_list/?${params.toString()}`
    )

    return response.itemList || []
  }

  // ============================================================
  // HTML EXTRACTION (NO AUTH NEEDED)
  // ============================================================

  /**
   * Extract video data from page HTML without authentication.
   * TikTok embeds data in __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag.
   *
   * IMPORTANT limitations from diagnostics:
   * - Video pages (/@user/video/ID) return WAF challenge ("Please wait...")
   *   and cannot be fetched with simple HTTP requests. Returns null.
   * - Search pages do NOT contain search results in SSR (client-side only).
   * - Profile pages DO contain user info in SSR under webapp.user-detail,
   *   but video list (itemList) is always empty.
   * - SIGI_STATE is deprecated and no longer present in any page type.
   */
  static async extractFromHTML(url: string): Promise<TikTokVideoRaw | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9',
        },
      })

      if (!response.ok) return null
      const html = await response.text()

      // Check for WAF challenge page (video pages return this)
      if (html.includes('Please wait...') && html.length < 5000) {
        return null
      }

      // __UNIVERSAL_DATA_FOR_REHYDRATION__ is the only active data source
      const universalMatch = html.match(
        /<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
      )
      if (universalMatch) {
        try {
          const data = JSON.parse(universalMatch[1])
          const scope = data?.__DEFAULT_SCOPE__

          // Video detail (may not be available due to WAF)
          const videoData = scope?.['webapp.video-detail']?.itemInfo?.itemStruct
          if (videoData) return videoData as TikTokVideoRaw
        } catch { /* parse error */ }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Extract profile data from page HTML without authentication.
   * Profile basic info (username, stats, bio, avatar) IS available in SSR
   * under webapp.user-detail in __UNIVERSAL_DATA_FOR_REHYDRATION__.
   * Video list is NOT available (itemList is always empty).
   */
  static async extractProfileFromHTML(profileUrl: string): Promise<UserDetailResponse | null> {
    try {
      const response = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9',
        },
      })

      if (!response.ok) return null
      const html = await response.text()

      const universalMatch = html.match(
        /<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
      )
      if (!universalMatch) return null

      const data = JSON.parse(universalMatch[1])
      const userDetail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']
      if (!userDetail?.userInfo) return null

      return userDetail as UserDetailResponse
    } catch {
      return null
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Extract video ID from a TikTok URL
   */
  static extractVideoId(url: string): string | null {
    // https://www.tiktok.com/@user/video/7123456789
    const match = url.match(/\/video\/(\d+)/)
    return match ? match[1] : null
  }

  /**
   * Extract username from a TikTok URL
   */
  static extractUsername(url: string): string | null {
    // https://www.tiktok.com/@username
    const match = url.match(/@([^/?]+)/)
    return match ? match[1] : null
  }

  /**
   * Convert raw comment to our ExtractedComment format
   */
  static normalizeComment(raw: TikTokCommentRaw): {
    username: string
    commentText: string
    likes: number
    timestamp: string
    replyTo: string | null
  } {
    return {
      username: '@' + raw.user.unique_id,
      commentText: raw.text,
      likes: raw.digg_count,
      timestamp: new Date(raw.create_time * 1000).toISOString(),
      replyTo: raw.reply_id && raw.reply_id !== '0' ? 'reply' : null,
    }
  }

  /**
   * Convert raw video to our ExtractedVideo format
   */
  static normalizeVideo(raw: TikTokVideoRaw): {
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
  } {
    return {
      videoUrl: `https://www.tiktok.com/@${raw.author.uniqueId}/video/${raw.id}`,
      description: raw.desc,
      hashtags: [
        ...(raw.challenges || []).map(c => c.title),
        ...(raw.textExtra || []).filter(t => t.hashtagName).map(t => t.hashtagName!),
      ],
      creator: '@' + raw.author.uniqueId,
      views: raw.stats.playCount,
      likes: raw.stats.diggCount,
      shares: raw.stats.shareCount,
      commentsCount: raw.stats.commentCount,
      thumbnailUrl: raw.video?.cover || '',
      musicTitle: raw.music?.title || '',
    }
  }
}

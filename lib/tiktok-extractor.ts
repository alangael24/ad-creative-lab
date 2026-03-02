/**
 * TikTok Extraction Library
 *
 * JavaScript snippets designed to run inside TikTok's browser context
 * via Claude in Chrome's javascript_tool.
 *
 * Strategy hierarchy:
 * 1. SIGI_STATE / window state objects (most reliable, structured data)
 * 2. data-e2e attribute selectors (TikTok's test attributes)
 * 3. Generic DOM parsing (fallback)
 *
 * All scripts return JSON strings for easy parsing.
 */

// ============================================================
// COMMENTS EXTRACTION
// ============================================================

/**
 * Extract all visible comments from a TikTok video page.
 * Run this on a video page (/@user/video/id or video modal).
 *
 * Returns: JSON string with array of comments
 */
export const EXTRACT_COMMENTS = `
(function() {
  const comments = [];

  // Strategy 1: Try data-e2e selectors (most common)
  const commentItems = document.querySelectorAll(
    '[data-e2e="comment-level-1"], [data-e2e="comment-item"], [class*="CommentItemWrapper"], [class*="CommentListContainer"] > div > div'
  );

  if (commentItems.length > 0) {
    commentItems.forEach(item => {
      try {
        // Username - look for profile links
        const userLink = item.querySelector('a[href*="/@"]');
        const username = userLink
          ? userLink.getAttribute('href')?.replace('/', '')?.replace(/\\?.*/, '') || ''
          : '';

        // Comment text - look for spans within comment content area
        const textEl = item.querySelector(
          '[data-e2e="comment-level-1"] span, ' +
          '[class*="CommentText"] span, ' +
          'p[class*="comment-text"], ' +
          'span[class*="SpanComment"]'
        ) || item.querySelector('p span, div > span:not([class*="UserName"])');

        const commentText = textEl?.textContent?.trim() || '';

        // Likes count
        const likesEl = item.querySelector(
          '[data-e2e="comment-like-count"], ' +
          'span[class*="SpanCount"], ' +
          '[class*="like-count"]'
        );
        const likesText = likesEl?.textContent?.trim() || '0';
        const likes = parseCount(likesText);

        // Timestamp
        const timeEl = item.querySelector(
          '[data-e2e="comment-time-1"], ' +
          'span[class*="SpanCreatedTime"], ' +
          '[class*="comment-time"]'
        );
        const timestamp = timeEl?.textContent?.trim() || '';

        // Check if it's a reply
        const isReply = item.closest('[data-e2e="comment-level-2"]') !== null ||
                        item.closest('[class*="ReplyContainer"]') !== null;

        if (commentText && commentText.length > 1) {
          comments.push({
            username: username,
            commentText: commentText,
            likes: likes,
            timestamp: timestamp,
            replyTo: isReply ? 'reply' : null
          });
        }
      } catch(e) { /* skip malformed comment */ }
    });
  }

  // Strategy 2: Broader selector if Strategy 1 found nothing
  if (comments.length === 0) {
    const allTextNodes = document.querySelectorAll(
      '[class*="Comment"] [class*="Text"] span, ' +
      '[class*="comment"] [class*="text"] span'
    );
    allTextNodes.forEach(node => {
      const text = node.textContent?.trim();
      if (text && text.length > 3 && text.length < 500) {
        // Try to find parent comment container for context
        const container = node.closest('[class*="Comment"], [class*="comment"]');
        const userEl = container?.querySelector('a[href*="/@"]');
        comments.push({
          username: userEl?.getAttribute('href')?.replace('/', '') || 'unknown',
          commentText: text,
          likes: 0,
          timestamp: '',
          replyTo: null
        });
      }
    });
  }

  function parseCount(str) {
    if (!str || str === '') return 0;
    str = str.toLowerCase().replace(/,/g, '');
    if (str.includes('k')) return Math.round(parseFloat(str) * 1000);
    if (str.includes('m')) return Math.round(parseFloat(str) * 1000000);
    return parseInt(str) || 0;
  }

  // Deduplicate by comment text
  const seen = new Set();
  const unique = comments.filter(c => {
    const key = c.commentText.substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  JSON.stringify({ comments: unique, count: unique.length, strategy: commentItems.length > 0 ? 'data-e2e' : 'fallback' });
})()
`;

/**
 * Scroll the comments section to load more comments.
 * Run this, then wait 2s, then run EXTRACT_COMMENTS again.
 */
export const SCROLL_COMMENTS = `
(function() {
  // Find the comments container and scroll it
  const containers = [
    document.querySelector('[data-e2e="comment-list"]'),
    document.querySelector('[class*="CommentListContainer"]'),
    document.querySelector('[class*="DivCommentListContainer"]'),
    // For modal/overlay video view
    document.querySelector('[class*="DivContentContainer"]'),
    document.querySelector('[class*="comment-list"]'),
  ].filter(Boolean);

  if (containers.length > 0) {
    const container = containers[0];
    container.scrollTop = container.scrollHeight;
    JSON.stringify({ scrolled: true, container: container.className?.substring(0, 50) || 'found' });
  } else {
    // Try scrolling the main page
    window.scrollBy(0, 800);
    JSON.stringify({ scrolled: true, container: 'window-fallback' });
  }
})()
`;

/**
 * Click "View more replies" buttons to expand reply threads.
 */
export const EXPAND_REPLIES = `
(function() {
  let clicked = 0;
  const buttons = document.querySelectorAll(
    '[data-e2e="view-more-1"], [data-e2e="view-more-2"], ' +
    'p[class*="ReplyActionText"], [class*="view-more"]'
  );
  buttons.forEach(btn => {
    try { btn.click(); clicked++; } catch(e) {}
  });
  JSON.stringify({ expandedReplies: clicked });
})()
`;


// ============================================================
// VIDEO METADATA EXTRACTION
// ============================================================

/**
 * Extract metadata from the currently visible/playing TikTok video.
 * Works on both individual video pages and the feed view.
 */
export const EXTRACT_VIDEO_METADATA = `
(function() {
  const video = {};

  // Strategy 1: Try SIGI_STATE (most complete data)
  try {
    const state = window['SIGI_STATE'] || window['__NEXT_DATA__']?.props?.pageProps;
    if (state) {
      const itemModule = state.ItemModule || state.itemInfo?.itemStruct;
      if (itemModule) {
        const keys = Object.keys(itemModule);
        if (keys.length > 0) {
          const item = itemModule[keys[0]] || itemModule;
          video.description = item.desc || item.description || '';
          video.creator = item.author || item.authorUniqueId || '';
          video.views = item.stats?.playCount || item.playCount || 0;
          video.likes = item.stats?.diggCount || item.diggCount || 0;
          video.shares = item.stats?.shareCount || item.shareCount || 0;
          video.commentsCount = item.stats?.commentCount || item.commentCount || 0;
          video.musicTitle = item.music?.title || '';
          video.hashtags = (item.challenges || item.textExtra || [])
            .filter(t => t.hashtagName || t.hashtagId)
            .map(t => t.hashtagName || t.title || '');
          video.videoUrl = window.location.href;
          video.source = 'SIGI_STATE';
        }
      }
    }
  } catch(e) {}

  // Strategy 2: DOM parsing
  if (!video.source) {
    try {
      // Description
      const descEl = document.querySelector(
        '[data-e2e="browse-video-desc"], [data-e2e="video-desc"], ' +
        '[class*="DivVideoInfoContainer"] [class*="SpanText"], ' +
        'h1[data-e2e="video-desc"]'
      );
      video.description = descEl?.textContent?.trim() || '';

      // Creator
      const authorEl = document.querySelector(
        '[data-e2e="browse-username"], [data-e2e="video-author-uniqueid"], ' +
        'a[class*="StyledAuthorAnchor"], [class*="author-uniqueId"]'
      );
      video.creator = authorEl?.textContent?.trim() ||
        window.location.pathname.split('/')[1] || '';

      // Engagement counts
      const parseCount = (str) => {
        if (!str) return 0;
        str = str.toLowerCase().replace(/,/g, '');
        if (str.includes('k')) return Math.round(parseFloat(str) * 1000);
        if (str.includes('m')) return Math.round(parseFloat(str) * 1000000);
        return parseInt(str) || 0;
      };

      const likeEl = document.querySelector(
        '[data-e2e="like-count"], [data-e2e="browse-like-count"], ' +
        'strong[data-e2e="like-count"]'
      );
      video.likes = parseCount(likeEl?.textContent);

      const commentEl = document.querySelector(
        '[data-e2e="comment-count"], [data-e2e="browse-comment-count"], ' +
        'strong[data-e2e="comment-count"]'
      );
      video.commentsCount = parseCount(commentEl?.textContent);

      const shareEl = document.querySelector(
        '[data-e2e="share-count"], [data-e2e="browse-share-count"], ' +
        'strong[data-e2e="share-count"]'
      );
      video.shares = parseCount(shareEl?.textContent);

      // Views (often not visible on video page, try meta or page)
      const viewsEl = document.querySelector(
        '[data-e2e="video-views"], strong[data-e2e="video-views"]'
      );
      video.views = parseCount(viewsEl?.textContent);

      // Hashtags from description
      const hashtagEls = document.querySelectorAll(
        '[data-e2e="browse-video-desc"] a[href*="/tag/"], ' +
        'a[class*="StyledTagAnchor"], a[href*="/tag/"]'
      );
      video.hashtags = Array.from(hashtagEls).map(
        a => a.textContent?.replace('#', '').trim()
      ).filter(Boolean);

      // Music
      const musicEl = document.querySelector(
        '[data-e2e="browse-music"], [data-e2e="video-music"], ' +
        'a[class*="StyledMusicAnchor"], h4[data-e2e="browse-music"]'
      );
      video.musicTitle = musicEl?.textContent?.trim() || '';

      video.videoUrl = window.location.href;
      video.source = 'DOM';
    } catch(e) {
      video.error = e.message;
    }
  }

  JSON.stringify(video);
})()
`;


// ============================================================
// CREATOR PROFILE EXTRACTION
// ============================================================

/**
 * Extract creator profile information from a TikTok profile page.
 * Run this on /@username pages.
 */
export const EXTRACT_CREATOR_PROFILE = `
(function() {
  const profile = {};

  const parseCount = (str) => {
    if (!str) return 0;
    str = str.toLowerCase().replace(/,/g, '');
    if (str.includes('k')) return Math.round(parseFloat(str) * 1000);
    if (str.includes('m')) return Math.round(parseFloat(str) * 1000000);
    if (str.includes('b')) return Math.round(parseFloat(str) * 1000000000);
    return parseInt(str) || 0;
  };

  // Strategy 1: SIGI_STATE
  try {
    const state = window['SIGI_STATE'];
    if (state?.UserModule) {
      const users = state.UserModule.users || {};
      const stats = state.UserModule.stats || {};
      const key = Object.keys(users)[0];
      if (key) {
        const user = users[key];
        const userStats = stats[key];
        profile.username = '@' + (user.uniqueId || key);
        profile.displayName = user.nickname || '';
        profile.bio = user.signature || '';
        profile.followers = userStats?.followerCount || 0;
        profile.following = userStats?.followingCount || 0;
        profile.totalLikes = userStats?.heartCount || userStats?.heart || 0;
        profile.videoCount = userStats?.videoCount || 0;
        profile.verified = user.verified || false;
        profile.avatarUrl = user.avatarLarger || user.avatarMedium || '';
        profile.source = 'SIGI_STATE';
      }
    }
  } catch(e) {}

  // Strategy 2: DOM
  if (!profile.source) {
    try {
      const nameEl = document.querySelector(
        '[data-e2e="user-title"], h1[data-e2e="user-title"], ' +
        'h2[class*="ShareTitle"]'
      );
      profile.displayName = nameEl?.textContent?.trim() || '';

      const usernameEl = document.querySelector(
        '[data-e2e="user-subtitle"], h2[data-e2e="user-subtitle"]'
      );
      profile.username = usernameEl?.textContent?.trim() || window.location.pathname;

      const bioEl = document.querySelector(
        '[data-e2e="user-bio"], h2[data-e2e="user-bio"]'
      );
      profile.bio = bioEl?.textContent?.trim() || '';

      // Stats: followers, following, likes
      const followerEl = document.querySelector(
        '[data-e2e="followers-count"], strong[data-e2e="followers-count"]'
      );
      profile.followers = parseCount(followerEl?.textContent);

      const followingEl = document.querySelector(
        '[data-e2e="following-count"], strong[data-e2e="following-count"]'
      );
      profile.following = parseCount(followingEl?.textContent);

      const likesEl = document.querySelector(
        '[data-e2e="likes-count"], strong[data-e2e="likes-count"]'
      );
      profile.totalLikes = parseCount(likesEl?.textContent);

      profile.source = 'DOM';
    } catch(e) {
      profile.error = e.message;
    }
  }

  JSON.stringify(profile);
})()
`;


// ============================================================
// FEED / SEARCH EXTRACTION
// ============================================================

/**
 * Extract video cards from TikTok search results or feed.
 * Works on search pages, hashtag pages, and the For You feed.
 */
export const EXTRACT_FEED_VIDEOS = `
(function() {
  const videos = [];

  const parseCount = (str) => {
    if (!str) return 0;
    str = str.toLowerCase().replace(/,/g, '');
    if (str.includes('k')) return Math.round(parseFloat(str) * 1000);
    if (str.includes('m')) return Math.round(parseFloat(str) * 1000000);
    return parseInt(str) || 0;
  };

  // Strategy 1: Search result items
  const searchItems = document.querySelectorAll(
    '[data-e2e="search_top-item"], [data-e2e="search-card-desc"], ' +
    '[class*="DivItemContainerV2"], [class*="DivItemContainerForSearch"]'
  );

  // Strategy 2: User profile video grid
  const profileItems = document.querySelectorAll(
    '[data-e2e="user-post-item"], [class*="DivItemContainerV2"]'
  );

  // Strategy 3: For You / Following feed items
  const feedItems = document.querySelectorAll(
    '[data-e2e="recommend-list-item-container"], ' +
    '[class*="DivItemContainer"]:not([class*="Search"])'
  );

  const items = searchItems.length > 0 ? searchItems :
                profileItems.length > 0 ? profileItems : feedItems;

  items.forEach(item => {
    try {
      // Video link
      const linkEl = item.querySelector('a[href*="/video/"], a[href*="/@"]');
      const videoUrl = linkEl?.href || '';

      // Description / caption
      const descEl = item.querySelector(
        '[data-e2e="search-card-desc"], [class*="DivVideoTitle"], ' +
        'a[title], [class*="video-desc"]'
      );
      const description = descEl?.textContent?.trim() || descEl?.getAttribute('title') || '';

      // Creator
      const creatorEl = item.querySelector(
        '[data-e2e="search-card-user-unique-id"], a[href*="/@"] [class*="SpanUniqueId"], ' +
        '[class*="author-uniqueId"], [class*="AuthorTitle"]'
      );
      const creator = creatorEl?.textContent?.trim() || '';

      // Views (often shown on thumbnails)
      const viewsEl = item.querySelector(
        '[data-e2e="video-views"], strong[data-e2e="video-views"], ' +
        '[class*="SpanCount"], [class*="video-count"]'
      );
      const views = parseCount(viewsEl?.textContent);

      // Thumbnail
      const imgEl = item.querySelector('img[src*="tiktok"], img[class*="ImgPoster"]');
      const thumbnailUrl = imgEl?.src || '';

      // Likes (if visible)
      const likesEl = item.querySelector(
        '[data-e2e="like-count"], strong[data-e2e="like-count"]'
      );
      const likes = parseCount(likesEl?.textContent);

      if (videoUrl || description) {
        videos.push({
          videoUrl: videoUrl,
          description: description.substring(0, 300),
          creator: creator,
          views: views,
          likes: likes,
          thumbnailUrl: thumbnailUrl,
        });
      }
    } catch(e) { /* skip */ }
  });

  // Deduplicate by URL
  const seen = new Set();
  const unique = videos.filter(v => {
    const key = v.videoUrl || v.description?.substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  JSON.stringify({
    videos: unique,
    count: unique.length,
    source: searchItems.length > 0 ? 'search' :
            profileItems.length > 0 ? 'profile' : 'feed'
  });
})()
`;

/**
 * Scroll the feed/search page to load more videos.
 */
export const SCROLL_FEED = `
(function() {
  window.scrollBy(0, 1200);
  JSON.stringify({ scrolled: true });
})()
`;


// ============================================================
// PAGE STATE DETECTION
// ============================================================

/**
 * Detect what type of TikTok page we're on and what data is available.
 * Run this first to determine which extraction scripts to use.
 */
export const DETECT_PAGE_TYPE = `
(function() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  let pageType = 'unknown';
  let hasComments = false;
  let hasSIGIState = false;
  let videoCount = 0;
  let commentCount = 0;

  // Detect page type
  if (pathname.includes('/video/')) {
    pageType = 'video';
  } else if (pathname.startsWith('/@') && !pathname.includes('/video/')) {
    pageType = 'profile';
  } else if (pathname.includes('/search') || url.includes('q=')) {
    pageType = 'search';
  } else if (pathname.includes('/tag/')) {
    pageType = 'hashtag';
  } else if (pathname === '/foryou' || pathname === '/' || pathname === '/following') {
    pageType = 'feed';
  } else if (pathname.includes('/explore')) {
    pageType = 'explore';
  }

  // Check for SIGI_STATE
  try {
    hasSIGIState = !!window['SIGI_STATE'];
  } catch(e) {}

  // Count visible elements
  const commentEls = document.querySelectorAll(
    '[data-e2e="comment-level-1"], [class*="CommentItemWrapper"]'
  );
  commentCount = commentEls.length;
  hasComments = commentCount > 0;

  const videoEls = document.querySelectorAll(
    '[data-e2e="user-post-item"], [data-e2e="search_top-item"], ' +
    '[data-e2e="recommend-list-item-container"], [class*="DivItemContainerV2"]'
  );
  videoCount = videoEls.length;

  // Check if there's a comment input (means comments are enabled)
  const hasCommentInput = !!document.querySelector(
    '[data-e2e="comment-input"], [class*="DivCommentInputContainer"]'
  );

  // Check for "View more comments" button
  const hasMoreComments = !!document.querySelector(
    '[data-e2e="comment-list"] + button, [class*="ViewMoreButton"]'
  );

  JSON.stringify({
    pageType,
    url,
    hasSIGIState,
    hasComments,
    commentCount,
    videoCount,
    hasCommentInput,
    hasMoreComments,
    title: document.title
  });
})()
`;


// ============================================================
// NETWORK API INTERCEPTION
// ============================================================

/**
 * Set up a network interceptor to capture TikTok API responses.
 * Run this BEFORE navigating/scrolling. Then retrieve captured data later.
 *
 * This intercepts fetch/XHR calls to TikTok's API endpoints for comments,
 * video details, and search results.
 */
export const SETUP_NETWORK_INTERCEPTOR = `
(function() {
  if (window.__tiktokInterceptor) {
    JSON.stringify({ status: 'already_active', captured: window.__tiktokCaptured?.length || 0 });
    return;
  }

  window.__tiktokCaptured = [];
  window.__tiktokInterceptor = true;

  // Intercept fetch
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // Capture interesting API calls
    if (url.includes('/comment/list') ||
        url.includes('/item/detail') ||
        url.includes('/search/') ||
        url.includes('/recommend/') ||
        url.includes('/user/detail')) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        window.__tiktokCaptured.push({
          url: url.substring(0, 200),
          type: url.includes('comment') ? 'comments' :
                url.includes('item') ? 'video' :
                url.includes('search') ? 'search' :
                url.includes('recommend') ? 'feed' :
                url.includes('user') ? 'user' : 'other',
          data: data,
          timestamp: Date.now()
        });
      } catch(e) {}
    }
    return response;
  };

  JSON.stringify({ status: 'interceptor_active' });
})()
`;

/**
 * Retrieve captured network data from the interceptor.
 */
export const GET_CAPTURED_DATA = `
(function() {
  const captured = window.__tiktokCaptured || [];
  const result = {
    count: captured.length,
    types: {},
    data: captured.slice(-20) // Last 20 captures
  };

  captured.forEach(c => {
    result.types[c.type] = (result.types[c.type] || 0) + 1;
  });

  JSON.stringify(result);
})()
`;

/**
 * Extract comments from captured network data (most reliable method).
 * Use after SETUP_NETWORK_INTERCEPTOR + scrolling through comments.
 */
export const EXTRACT_COMMENTS_FROM_NETWORK = `
(function() {
  const captured = window.__tiktokCaptured || [];
  const commentCaptures = captured.filter(c => c.type === 'comments');

  const allComments = [];

  commentCaptures.forEach(capture => {
    const comments = capture.data?.comments || [];
    comments.forEach(c => {
      allComments.push({
        username: '@' + (c.user?.unique_id || c.user?.uniqueId || 'unknown'),
        commentText: c.text || '',
        likes: c.digg_count || c.diggCount || 0,
        timestamp: c.create_time ? new Date(c.create_time * 1000).toISOString() : '',
        replyTo: c.reply_id ? 'reply' : null
      });
    });
  });

  // Deduplicate
  const seen = new Set();
  const unique = allComments.filter(c => {
    const key = c.username + ':' + c.commentText.substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  JSON.stringify({
    comments: unique,
    count: unique.length,
    source: 'network_intercept',
    captureCount: commentCaptures.length
  });
})()
`;


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Clean up the network interceptor.
 */
export const CLEANUP_INTERCEPTOR = `
(function() {
  window.__tiktokCaptured = [];
  window.__tiktokInterceptor = false;
  JSON.stringify({ status: 'cleaned' });
})()
`;

/**
 * Get the current page URL (useful for tracking what we're looking at).
 */
export const GET_CURRENT_URL = `
(function() {
  JSON.stringify({
    url: window.location.href,
    pathname: window.location.pathname,
    title: document.title
  });
})()
`;

/**
 * Check if TikTok has loaded (useful after navigation).
 */
export const CHECK_TIKTOK_LOADED = `
(function() {
  const hasVideo = !!document.querySelector('video');
  const hasContent = !!document.querySelector('[data-e2e], [class*="DivItem"]');
  const hasSIGI = !!window['SIGI_STATE'];
  const isLoading = !!document.querySelector('[class*="Loading"], [class*="Spinner"]');

  JSON.stringify({
    loaded: hasContent || hasSIGI,
    hasVideo,
    hasContent,
    hasSIGI,
    isLoading,
    readyState: document.readyState
  });
})()
`;


// ============================================================
// SCAN ORCHESTRATION HELPERS
// ============================================================

/**
 * Types for scan session management
 */
export type ScanType = 'comments' | 'feed' | 'search' | 'profile';

export interface TikTokScanConfig {
  scanType: ScanType;
  url: string;
  avatarId?: string;
  query?: string;
  maxScrolls?: number;
}

/**
 * Get the recommended extraction sequence for a given scan type.
 * Returns an ordered list of steps to execute.
 */
export function getScanSequence(scanType: ScanType): string[] {
  switch (scanType) {
    case 'comments':
      return [
        'DETECT_PAGE_TYPE',       // Verify we're on a video page
        'SETUP_NETWORK_INTERCEPTOR', // Start capturing API calls
        'EXTRACT_VIDEO_METADATA', // Get video context
        'EXPAND_REPLIES',         // Expand reply threads
        'SCROLL_COMMENTS',        // Load more comments (repeat 3-5x)
        'EXTRACT_COMMENTS',       // DOM-based extraction
        'EXTRACT_COMMENTS_FROM_NETWORK', // Network-based extraction (usually better)
        'CLEANUP_INTERCEPTOR',    // Clean up
      ];

    case 'feed':
    case 'search':
      return [
        'DETECT_PAGE_TYPE',       // Verify page type
        'EXTRACT_FEED_VIDEOS',    // Get visible videos
        'SCROLL_FEED',            // Load more (repeat 3-5x)
        'EXTRACT_FEED_VIDEOS',    // Get all loaded videos
      ];

    case 'profile':
      return [
        'DETECT_PAGE_TYPE',       // Verify we're on a profile
        'EXTRACT_CREATOR_PROFILE', // Get profile data
        'EXTRACT_FEED_VIDEOS',    // Get their videos
        'SCROLL_FEED',            // Load more videos
        'EXTRACT_FEED_VIDEOS',    // Get all videos
      ];

    default:
      return ['DETECT_PAGE_TYPE'];
  }
}

/**
 * Map of script name to actual JavaScript code.
 * Used by the scan orchestrator to look up scripts by name.
 */
export const SCRIPTS: Record<string, string> = {
  DETECT_PAGE_TYPE,
  SETUP_NETWORK_INTERCEPTOR,
  EXTRACT_VIDEO_METADATA,
  EXTRACT_COMMENTS,
  SCROLL_COMMENTS,
  EXPAND_REPLIES,
  EXTRACT_COMMENTS_FROM_NETWORK,
  EXTRACT_FEED_VIDEOS,
  SCROLL_FEED,
  EXTRACT_CREATOR_PROFILE,
  GET_CAPTURED_DATA,
  CLEANUP_INTERCEPTOR,
  GET_CURRENT_URL,
  CHECK_TIKTOK_LOADED,
};

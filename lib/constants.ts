export const ANGLES = [
  { value: 'fear', label: 'Miedo', color: 'bg-red-500' },
  { value: 'desire', label: 'Deseo', color: 'bg-pink-500' },
  { value: 'curiosity', label: 'Curiosidad', color: 'bg-purple-500' },
  { value: 'offer', label: 'Oferta', color: 'bg-green-500' },
  { value: 'tutorial', label: 'Tutorial', color: 'bg-blue-500' },
  { value: 'testimonial', label: 'Testimonio', color: 'bg-yellow-500' },
] as const

export const FORMATS = [
  { value: 'static', label: 'Estático' },
  { value: 'video', label: 'Video' },
  { value: 'ugc', label: 'UGC' },
  { value: 'carousel', label: 'Carrusel' },
] as const

export const FUNNEL_STAGES = [
  { value: 'cold', label: 'Tráfico Frío' },
  { value: 'retargeting', label: 'Retargeting' },
] as const

export const SOURCE_TYPES = [
  { value: 'original', label: 'Original' },
  { value: 'competitor', label: 'Competencia' },
  { value: 'iteration', label: 'Iteración' },
] as const

export const STATUSES = [
  { value: 'idea', label: 'Banco de Ideas', color: 'bg-idea' },
  { value: 'development', label: 'Desarrollo', color: 'bg-cyan-500' },
  { value: 'production', label: 'Producción', color: 'bg-production' },
  { value: 'testing', label: 'Testeo Activo', color: 'bg-testing' },
  { value: 'analysis', label: 'Análisis Pendiente', color: 'bg-analysis' },
  { value: 'completed', label: 'Completado', color: 'bg-gray-500' },
] as const

export const RESULTS = [
  { value: 'winner', label: 'Winner', icon: '🏆', color: 'text-winner' },
  { value: 'loser', label: 'Loser', icon: '💀', color: 'text-loser' },
] as const

export const ACTIONS = [
  { value: 'iterate', label: 'Iterar (hacer v2.0)' },
  { value: 'kill', label: 'Matar (no repetir)' },
  { value: 'scale', label: 'Escalar (más presupuesto)' },
] as const

export const LEARNING_TYPES = [
  { value: 'insight', label: 'Insight' },
  { value: 'rule', label: 'Regla' },
  { value: 'warning', label: 'Advertencia' },
] as const

// Etiquetas predefinidas para análisis cuantitativo
export const FAIL_REASONS = [
  { value: 'bad_hook', label: 'Hook débil', icon: '🎣' },
  { value: 'boring_script', label: 'Guion aburrido', icon: '📝' },
  { value: 'confusing_offer', label: 'Oferta confusa', icon: '❓' },
  { value: 'weak_cta', label: 'CTA débil', icon: '👆' },
  { value: 'bad_avatar', label: 'Avatar incorrecto', icon: '👤' },
  { value: 'poor_visual', label: 'Visual pobre', icon: '🎨' },
  { value: 'wrong_audience', label: 'Audiencia incorrecta', icon: '🎯' },
  { value: 'too_long', label: 'Demasiado largo', icon: '⏱️' },
  { value: 'no_credibility', label: 'Falta credibilidad', icon: '🏅' },
  { value: 'bad_audio', label: 'Audio malo', icon: '🔊' },
] as const

export const SUCCESS_FACTORS = [
  { value: 'strong_hook', label: 'Hook potente', icon: '🎣' },
  { value: 'urgency', label: 'Urgencia', icon: '⚡' },
  { value: 'high_contrast', label: 'Alto contraste', icon: '🎨' },
  { value: 'social_proof', label: 'Prueba social', icon: '👥' },
  { value: 'clear_offer', label: 'Oferta clara', icon: '💰' },
  { value: 'relatable_avatar', label: 'Avatar relatable', icon: '👤' },
  { value: 'trending_audio', label: 'Audio trending', icon: '🎵' },
  { value: 'controversy', label: 'Controversia', icon: '🔥' },
  { value: 'storytelling', label: 'Storytelling', icon: '📖' },
  { value: 'transformation', label: 'Transformación', icon: '✨' },
] as const

// === MÓDULO DE RESEARCH ===

export const RESEARCH_SOURCES = [
  { value: 'reddit', label: 'Reddit', icon: '🔴' },
  { value: 'tiktok_comments', label: 'TikTok Comments', icon: '🎵' },
  { value: 'youtube_comments', label: 'YouTube Comments', icon: '▶️' },
  { value: 'facebook_group', label: 'Facebook Group', icon: '👥' },
  { value: 'amazon_reviews', label: 'Amazon Reviews', icon: '📦' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'quora', label: 'Quora', icon: '❓' },
  { value: 'forum', label: 'Foro especializado', icon: '💬' },
  { value: 'customer_support', label: 'Soporte al cliente', icon: '🎧' },
  { value: 'survey', label: 'Encuesta propia', icon: '📋' },
  { value: 'interview', label: 'Entrevista', icon: '🎤' },
  { value: 'competitor_comments', label: 'Comentarios competencia', icon: '👀' },
] as const

export const RESEARCH_CATEGORIES = [
  { value: 'pain_point', label: 'Pain Point', icon: '😫', color: 'bg-red-500', description: 'Problema o frustración específica' },
  { value: 'desire', label: 'Deseo', icon: '✨', color: 'bg-green-500', description: 'Lo que quieren lograr' },
  { value: 'objection', label: 'Objeción', icon: '🚫', color: 'bg-amber-500', description: 'Por qué no comprarían' },
  { value: 'language', label: 'Lenguaje', icon: '💬', color: 'bg-blue-500', description: 'Cómo hablan del problema' },
  { value: 'insight', label: 'Insight', icon: '💡', color: 'bg-purple-500', description: 'Observación valiosa' },
] as const

export const ORGANIC_STYLES = [
  { value: 'talking_head', label: 'Talking head (yapping)', description: 'Persona hablando a cámara 1-3 min' },
  { value: 'raw_tiktok', label: 'TikTok raw', description: 'Videos casuales sin mucha edición' },
  { value: 'transformation', label: 'Transformación', description: 'Antes/después, journey' },
  { value: 'tutorial', label: 'Tutorial/How-to', description: 'Paso a paso educativo' },
  { value: 'storytime', label: 'Storytime', description: 'Contando una historia personal' },
  { value: 'review', label: 'Reviews/Unboxing', description: 'Opiniones de productos' },
  { value: 'infomercial', label: 'Infomercial', description: 'Estilo TV shopping, largo' },
  { value: 'meme', label: 'Memes/Humor', description: 'Contenido de humor relatable' },
  { value: 'aesthetic', label: 'Aesthetic/ASMR', description: 'Visual satisfactorio, poco texto' },
  { value: 'news', label: 'Noticias/Trends', description: 'Contenido informativo actual' },
] as const

// === COMPETIDORES ===

export const COMPETITOR_PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'meta_library', label: 'Meta Ad Library', icon: '📚' },
  { value: 'other', label: 'Otro', icon: '🔗' },
] as const

export const COMPETITOR_AD_TAGS = [
  { value: 'ugc', label: 'UGC', color: 'bg-pink-500' },
  { value: 'testimonial', label: 'Testimonio', color: 'bg-purple-500' },
  { value: 'product_demo', label: 'Demo Producto', color: 'bg-blue-500' },
  { value: 'before_after', label: 'Antes/Después', color: 'bg-green-500' },
  { value: 'offer', label: 'Oferta', color: 'bg-yellow-500' },
  { value: 'educational', label: 'Educativo', color: 'bg-cyan-500' },
  { value: 'storytelling', label: 'Storytelling', color: 'bg-orange-500' },
  { value: 'reaction', label: 'Reacción', color: 'bg-red-500' },
  { value: 'unboxing', label: 'Unboxing', color: 'bg-amber-500' },
  { value: 'trending_sound', label: 'Sonido Trending', color: 'bg-violet-500' },
] as const

export type Angle = typeof ANGLES[number]['value']
export type Format = typeof FORMATS[number]['value']
export type FunnelStage = typeof FUNNEL_STAGES[number]['value']
export type SourceType = typeof SOURCE_TYPES[number]['value']
export type Status = typeof STATUSES[number]['value']
export type Result = typeof RESULTS[number]['value']
export type Action = typeof ACTIONS[number]['value']
export type LearningType = typeof LEARNING_TYPES[number]['value']

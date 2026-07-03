export const ACTIVITY_RECOMMENDATIONS = [
  { minSpeed: 0, maxSpeed: 1, label: 'Basic Browsing & WhatsApp', labelUr: 'بیسک براؤزنگ اور واٹس ایپ', color: '#ef4444' },
  { minSpeed: 1, maxSpeed: 3, label: 'SD YouTube, Music Streaming', labelUr: 'ایس ڈی یوٹیوب، میوزک', color: '#f97316' },
  { minSpeed: 3, maxSpeed: 5, label: 'HD YouTube, Zoom Calls', labelUr: 'ایچ ڈی یوٹیوب، زوم کالز', color: '#eab308' },
  { minSpeed: 5, maxSpeed: 10, label: '1080p Streaming, Google Meet HD', labelUr: '1080p سٹریمنگ، گوگل میٹ', color: '#84cc16' },
  { minSpeed: 10, maxSpeed: 25, label: '4K Streaming, Live Streaming', labelUr: '4K سٹریمنگ، لائیو سٹریمنگ', color: '#22c55e' },
  { minSpeed: 25, maxSpeed: 50, label: 'Multiple 4K Streams, Heavy Work', labelUr: 'متعدد 4K سٹریمز، بھاری کام', color: '#14b8a6' },
  { minSpeed: 50, maxSpeed: Infinity, label: 'Pro Streaming + Gaming + Downloads', labelUr: 'پرو سٹریمنگ + گیمنگ + ڈاؤن لوڈ', color: '#06b6d4' },
]

export const GAME_RECOMMENDATIONS = [
  { minSpeed: 0, maxSpeed: 1, games: [], gamesUr: [] },
  { minSpeed: 1, maxSpeed: 3, games: ['Minecraft'], gamesUr: ['مائن کرافٹ'] },
  { minSpeed: 3, maxSpeed: 5, games: ['PUBG Mobile Lite', 'Free Fire', 'Among Us'], gamesUr: ['PUBG موبائل لائٹ', 'فری فائر', 'امینگ اَس'] },
  { minSpeed: 5, maxSpeed: 10, games: ['Valorant', 'COD Mobile', 'Fortnite', 'CS:GO'], gamesUr: ['ویلورینٹ', 'COD موبائل', 'فورٹ نائٹ', 'CS:GO'] },
  { minSpeed: 10, maxSpeed: 25, games: ['GTA Online', 'Apex Legends', 'Rocket League', 'Dota 2'], gamesUr: ['GTA آن لائن', 'ایپیکس لیجنڈز', 'راکٹ لیگ', 'Dota 2'] },
  { minSpeed: 25, maxSpeed: 50, games: ['All Games Smooth', 'Competitive Play'], gamesUr: ['تمام گیمز بہترین', 'مسابقتی کھیل'] },
  { minSpeed: 50, maxSpeed: Infinity, games: ['Pro Gaming + Streaming', 'Ultra Settings'], gamesUr: ['پرو گیمنگ + سٹریمنگ', 'الٹرا سیٹنگز'] },
]

export function getRecommendations(speedMbps) {
  const activity = ACTIVITY_RECOMMENDATIONS.find(
    r => speedMbps >= r.minSpeed && speedMbps < r.maxSpeed
  ) || ACTIVITY_RECOMMENDATIONS[ACTIVITY_RECOMMENDATIONS.length - 1]

  const games = GAME_RECOMMENDATIONS.find(
    r => speedMbps >= r.minSpeed && speedMbps < r.maxSpeed
  ) || GAME_RECOMMENDATIONS[GAME_RECOMMENDATIONS.length - 1]

  return { activity, games }
}

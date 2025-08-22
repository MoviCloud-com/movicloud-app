export default defineEventHandler(async (event) => {
  // 模拟电影数据
  const movies = [
    {
      id: 1,
      title: '阿凡达：水之道',
      year: 2022,
      genre: ['科幻', '动作'],
      rating: 8.5,
      poster: '/images/avatar2.jpg'
    },
    {
      id: 2,
      title: '流浪地球2',
      year: 2023,
      genre: ['科幻', '灾难'],
      rating: 8.8,
      poster: '/images/wandering-earth2.jpg'
    },
    {
      id: 3,
      title: '满江红',
      year: 2023,
      genre: ['剧情', '悬疑'],
      rating: 8.0,
      poster: '/images/full-river-red.jpg'
    }
  ]
  
  return {
    success: true,
    data: movies,
    total: movies.length,
    message: 'get_movies_success'
  }
})
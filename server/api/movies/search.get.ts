export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = (query.q as string) || ''
  
  const searchResults = [
    { id: 1, title: `搜索结果: ${keyword}`, year: 2023, genre: ['搜索'], rating: 7.5, matchScore: 0.95 }
  ]
  
  return {
    success: true,
    data: searchResults,
    keyword,
    total: searchResults.length,
    message: 'search_complete'
  }
})
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url, method = 'GET', headers = {}, data } = body

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL is required'
      })
    }

    const requestHeaders: Record<string, string> = {
      ...headers
    }

    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: requestHeaders,
      redirect: 'manual'
    }

    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      requestOptions.body = typeof data === 'string' ? data : JSON.stringify(data)
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json'
      }
    }

    console.log('Proxying request to:', url)
    console.log('Request method:', method)
    console.log('Has cookie:', !!requestHeaders['cookie'] || !!requestHeaders['Cookie'])

    const response = await fetch(url, requestOptions)
    const responseText = await response.text()

    console.log('Response status:', response.status)
    console.log('Response content type:', response.headers.get('content-type'))

    return {
      success: true,
      status: response.status,
      data: responseText
    }
  } catch (error: any) {
    console.error('Cloud drive proxy error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Proxy request failed'
    })
  }
})

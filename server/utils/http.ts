import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent'

export type FetchOptionsLike = {
  headers: Record<string, string>
  signal: AbortSignal
  agent?: any
}

export const createFetchOptions = (): FetchOptionsLike => {
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'MoviCloud/1.0'
  }

  // @ts-ignore
  const signal = AbortSignal.timeout(15000)

  if (httpsProxy || httpProxy) {
    const proxyUrl = httpsProxy || httpProxy!
    try {
      const url = new URL(proxyUrl)
      const agent = url.protocol === 'http:'
        ? new HttpProxyAgent({ proxy: proxyUrl })
        : new HttpsProxyAgent({ proxy: proxyUrl })
      return { headers, agent, signal }
    } catch {
      return { headers, signal }
    }
  }

  return { headers, signal }
} 
export type FetchOptionsLike = {
  headers: Record<string, string>
  signal: AbortSignal
}

export const createFetchOptions = (): FetchOptionsLike => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'MoviCloud/1.0'
  }

  // @ts-ignore
  const signal = AbortSignal.timeout(15000)

  return { headers, signal }
} 
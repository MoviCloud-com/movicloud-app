import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const env = {
      http_proxy: process.env.HTTP_PROXY || process.env.http_proxy,
      https_proxy: process.env.HTTPS_PROXY || process.env.https_proxy,
      no_proxy: process.env.NO_PROXY || process.env.no_proxy,
      node_env: process.env.NODE_ENV,
      platform: process.platform,
      arch: process.arch
    }

    devLog('env_vars', env)

    return {
      success: true,
      data: {
        env,
        message: 'env_check_done'
      }
    }
  } catch (error) {
    devError('env_check_failed', error)
    return { success: false, message: 'env_check_failed' }
  }
}) 
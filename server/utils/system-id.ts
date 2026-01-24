import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

// 获取操作系统类型
function getOsType(): string {
  const osName = process.platform.toLowerCase()
  if (osName.startsWith('linux')) return 'linux'
  if (osName.startsWith('darwin')) return 'darwin'
  if (osName.includes('bsd')) return 'bsd'
  return 'unknown'
}

// 获取架构类型
function getArchType(): string {
  const arch = process.arch.toLowerCase()
  if (arch === 'x64' || arch === 'amd64') return 'x64'
  if (arch.startsWith('x86') || arch === 'ia32') return 'x86'
  if (arch === 'arm64' || arch === 'aarch64') return 'arm64'
  if (arch.startsWith('arm')) return 'arm'
  return arch
}

// 验证 IP 地址格式
function isValidIp(ip: string): boolean {
  // IPv4 验证
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  // IPv6 验证（简化）
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/
  return ipv6Regex.test(ip)
}

// 获取 MAC 地址
function getMacAddress(): string {
  let mac = 'unknown'
  const osType = getOsType()
  
  try {
    if (osType === 'darwin') {
      // 优先使用 en0 接口
      const en0Mac = execSync('ifconfig en0 2>/dev/null | grep -o -E "([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}" | head -1', { encoding: 'utf8' }).trim()
      if (en0Mac) {
        mac = en0Mac.replace(/:/g, '')
      } else {
        // 备用：从所有接口获取
        const allMac = execSync('ifconfig 2>/dev/null | grep -A 1 "ether " | grep -o -E "([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}" | head -1', { encoding: 'utf8' }).trim()
        if (allMac) {
          mac = allMac.replace(/:/g, '')
        }
      }
    } else if (osType === 'linux') {
      // 优先使用默认路由接口
      const defaultInterface = execSync('ip route | grep default | awk \'{print $5}\' | head -1', { encoding: 'utf8' }).trim()
      if (defaultInterface) {
        try {
          mac = readFileSync(`/sys/class/net/${defaultInterface}/address`, 'utf-8').trim().replace(/:/g, '')
        } catch (e) {
          // 如果读取失败，尝试其他方法
        }
      }
      
      if (!mac || mac === 'unknown') {
        // 备用方法
        const linkMac = execSync('ip link show 2>/dev/null | grep -A 1 "link/ether " | grep -o -E "([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}" | head -1', { encoding: 'utf8' }).trim()
        if (linkMac) {
          mac = linkMac.replace(/:/g, '')
        }
      }
    }
  } catch (error) {
    // 忽略错误
  }
  
  return mac || 'unknown'
}

// 获取外部 IP 地址
function getExternalIp(): string {
  const ipApiUrls = [
    'https://httpbin.org/ip',
    'https://api.ipify.org?format=json',
    'https://jsonip.com'
  ]
  const timeout = 10000 // 10秒
  
  for (const url of ipApiUrls) {
    try {
      // 使用 curl 获取外部 IP
      const response = execSync(`curl -s --max-time 10 "${url}" 2>/dev/null || echo ""`, { encoding: 'utf8', timeout }).trim()
      
      if (response) {
        // 尝试从 JSON 中提取 IP
        let extractedIp = response.match(/"origin":"([^"]+)"/)?.[1] || 
                         response.match(/"ip":"([^"]+)"/)?.[1]
        
        // 如果没有 JSON 格式，尝试直接匹配 IP
        if (!extractedIp) {
          const ipv4Match = response.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/)
          if (ipv4Match && isValidIp(ipv4Match[1])) {
            extractedIp = ipv4Match[1]
          } else {
            const ipv6Match = response.match(/([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}/)
            if (ipv6Match && isValidIp(ipv6Match[0])) {
              extractedIp = ipv6Match[0]
            }
          }
        }
        
        if (extractedIp && isValidIp(extractedIp)) {
          return extractedIp
        }
      }
    } catch (error) {
      // 继续尝试下一个 URL
      continue
    }
  }
  
  return 'unknown'
}

// 生成系统ID（参考 update-schema.js）
export function generateSystemId(): string {
  const osType = getOsType()
  const archType = getArchType()
  const macAddress = getMacAddress()
  const externalIp = getExternalIp()
  
  const dataToHash = `${osType}#${archType}#${externalIp}#${macAddress}`
  
  const fullHash = createHash('sha256').update(dataToHash).digest('hex')
  const encodedData = Buffer.from(dataToHash).toString('base64')
  
  const hashPart = fullHash.substring(0, 16)
  const encodedPart = encodedData.substring(0, 52)
  const uniqueId = `${hashPart}-${encodedPart}`
  
  return uniqueId
}

 
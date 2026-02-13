import { createHash } from 'crypto'
import { networkInterfaces } from 'os'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// 获取操作系统类型
function getOsType(): string {
  const osName = process.platform.toLowerCase()
  if (osName === 'linux') return 'linux'
  if (osName === 'darwin') return 'darwin'
  if (osName === 'win32') return 'windows'
  if (osName.includes('bsd')) return 'bsd'
  return osName || 'unknown'
}

// 获取架构类型
function getArchType(): string {
  const arch = process.arch.toLowerCase()
  if (arch === 'x64' || arch === 'amd64') return 'x64'
  if (arch.startsWith('x86') || arch === 'ia32') return 'x86'
  if (arch === 'arm64' || arch === 'aarch64') return 'arm64'
  if (arch.startsWith('arm')) return 'arm'
  return arch || 'unknown'
}

// 验证 IP 地址格式
function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false
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

// 获取本地 IP 地址
function getLocalIp(): string {
  try {
    const interfaces = networkInterfaces()
    
    for (const [name, iface] of Object.entries(interfaces)) {
      if (!iface) continue
      
      for (const info of iface) {
        if (!info.internal && info.family === 'IPv4' && isValidIp(info.address)) {
          return info.address
        }
      }
    }
  } catch (error) {
    // 忽略错误
  }
  
  return '127.0.0.1'
}

// 使用外部命令获取 MAC 地址（macOS/Linux优先）
function getMacAddressByCommand(): string {
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
  
  // 验证获取到的 MAC 是否有效
  if (mac && mac.length === 12 && /^[0-9a-f]{12}$/i.test(mac)) {
    return mac.toLowerCase()
  }
  
  return 'unknown'
}

// 使用 Node.js 原生 API 获取 MAC 地址（Windows/备用）
function getMacAddressByNative(): string {
  try {
    const interfaces = networkInterfaces()
    let firstMac = ''
    
    for (const [name, iface] of Object.entries(interfaces)) {
      if (!iface) continue
      
      for (const info of iface) {
        if (info.mac && info.mac !== '00:00:00:00:00:00') {
          // 移除冒号、连字符等分隔符
          const cleanMac = info.mac.replace(/[:-]/g, '').toLowerCase()
          
          // 检查长度是否正确（12位十六进制）
          if (cleanMac && cleanMac.length === 12 && /^[0-9a-f]{12}$/.test(cleanMac)) {
            // 优先选择非内部接口的 MAC 地址
            if (!info.internal) {
              return cleanMac
            }
            // 保存第一个有效的 MAC
            if (!firstMac) {
              firstMac = cleanMac
            }
          }
        }
      }
    }
    
    // 如果找到第一个有效的 MAC，返回它
    if (firstMac) {
      return firstMac
    }
  } catch (error) {
    // 忽略错误
  }
  
  return 'unknown'
}

// 获取 MAC 地址（综合方法）
function getMacAddress(): string {
  // 1. 优先使用外部命令（macOS/Linux能获取完整MAC）
  const commandMac = getMacAddressByCommand()
  if (commandMac !== 'unknown') {
    return commandMac
  }
  
  // 2. 备用：使用 Node.js 原生 API（Windows/Docker）
  const nativeMac = getMacAddressByNative()
  if (nativeMac !== 'unknown') {
    return nativeMac
  }
  
  // 3. 都失败，返回 unknown
  return 'unknown'
}

// 获取机器ID（作为备选方案）
function getMachineId(): string {
  try {
    const hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || 'unknown'
    const nodeVersion = process.version
    const cwd = process.cwd()
    const pid = process.pid
    
    return `${hostname}#${nodeVersion}#${cwd}#${pid}`
  } catch (error) {
    return 'unknown'
  }
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

// 同步版本的获取外部IP（快速失败，与上面保持一致）
function getExternalIpSync(): string {
  return getExternalIp()
}

// 生成系统ID（改进版，多重备选方案）
export function generateSystemId(): string {
  const osType = getOsType()
  const archType = getArchType()
  const macAddress = getMacAddress()
  
  // 尝试获取公网IP，但不等待太久
  let externalIp = 'unknown'
  try {
    externalIp = getExternalIpSync()
  } catch (error) {
    // 忽略错误
  }
  
  // 构建用于哈希的数据 - 保持原来的顺序
  const dataParts: string[] = []
  dataParts.push(osType || 'unknown')
  dataParts.push(archType || 'unknown')
  
  // 外部IP（公网IP，如果有）
  if (externalIp !== 'unknown') {
    dataParts.push(externalIp)
  } else {
    // 如果没有公网IP，使用本地IP
    const localIp = getLocalIp()
    dataParts.push(localIp)
  }
  
  // MAC地址
  if (macAddress !== 'unknown' && macAddress.length === 12) {
    dataParts.push(macAddress)
  } else {
    // 如果没有MAC，使用机器ID
    const machineId = getMachineId()
    dataParts.push(createHash('md5').update(machineId).digest('hex').substring(0, 12))
  }
  
  const dataToHash = dataParts.join('#')
  
  const fullHash = createHash('sha256').update(dataToHash).digest('hex')
  const encodedData = Buffer.from(dataToHash).toString('base64')
  
  const hashPart = fullHash.substring(0, 16)
  const encodedPart = encodedData.substring(0,80).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const uniqueId = `${hashPart}-${encodedPart}`
  
  return uniqueId
}

 
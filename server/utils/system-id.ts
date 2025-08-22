import { execSync } from 'child_process'
import { createHash } from 'crypto'

interface SystemInfo {
  os: string
  platform: string
  arch: string
  ip: string
  mac: string
  timestamp: number
}

export function getSystemInfo(): SystemInfo {
  const os = process.platform
  const platform = process.platform
  const arch = process.arch
  
  let ip = ''
  let mac = ''
  
  try {
    if (os === 'darwin') {
      const ipResult = execSync('ifconfig | grep "inet " | grep -v 127.0.0.1 | awk \'{print $2}\' | head -1', { encoding: 'utf8' }).trim()
      const macResult = execSync('ifconfig | grep "ether" | awk \'{print $2}\' | head -1', { encoding: 'utf8' }).trim()
      ip = ipResult || 'unknown'
      mac = macResult || 'unknown'
    } else if (os === 'linux') {
      const ipResult = execSync('hostname -I | awk \'{print $1}\'', { encoding: 'utf8' }).trim()
      const macResult = execSync('ip link show | grep link/ether | awk \'{print $2}\' | head -1', { encoding: 'utf8' }).trim()
      ip = ipResult || 'unknown'
      mac = macResult || 'unknown'
    } else if (os === 'win32') {
      const ipResult = execSync('ipconfig | findstr "IPv4" | findstr /v "127.0.0.1" | findstr /v "169.254" | awk \'{print $NF}\' | head -1', { encoding: 'utf8' }).trim()
      const macResult = execSync('getmac /fo csv /nh | findstr /v "VMware" | findstr /v "VirtualBox" | awk -F"," \'{print $1}\' | head -1', { encoding: 'utf8' }).trim()
      ip = ipResult || 'unknown'
      mac = macResult || 'unknown'
    } else {
      ip = 'unknown'
      mac = 'unknown'
    }
  } catch (error) {
    ip = 'unknown'
    mac = 'unknown'
  }
  
  return {
    os,
    platform,
    arch,
    ip,
    mac,
    timestamp: Date.now()
  }
}

export function generateSystemId(): string {
  const systemInfo = getSystemInfo()
  const data = `${systemInfo.os}|${systemInfo.platform}|${systemInfo.arch}|${systemInfo.ip}|${systemInfo.mac}|${systemInfo.timestamp}`
  const hash = createHash('sha256').update(data).digest('hex')
  const base64 = Buffer.from(data).toString('base64')
  return `${hash.substring(0, 16)}-${base64.substring(0, 32)}`
}

 
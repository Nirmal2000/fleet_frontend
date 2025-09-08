import { useState, useEffect } from 'react'

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null)

  const generateDeviceId = () => {
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem('device_id', newDeviceId)
    setDeviceId(newDeviceId)
    return newDeviceId
  }

  const getDeviceId = () => {
    return deviceId || localStorage.getItem('device_id') || generateDeviceId()
  }

  useEffect(() => {
    const existingDeviceId = localStorage.getItem('device_id')
    if (existingDeviceId) {
      setDeviceId(existingDeviceId)
    } else {
      generateDeviceId()
    }
  }, [])

  return {
    deviceId: getDeviceId(),
    generateDeviceId,
    getDeviceId
  }
}
export function useVisibilityChange(callback) {
  const handleVisibilityChange = () => {
    callback(!document.hidden)
  }

  return {
    addVisibilityListener: () => {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    },
    removeVisibilityListener: () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
}
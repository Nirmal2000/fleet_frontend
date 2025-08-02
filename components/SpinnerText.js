import { useState, useEffect } from 'react'

const SPINNER_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export default function SpinnerText() {
  const [index, setIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % SPINNER_CHARS.length)
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  return <span>{SPINNER_CHARS[index]}</span>
}
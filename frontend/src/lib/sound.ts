// Page-flip sound — plays the recorded MP3 asset.
//
// Browsers block autoplay until a user gesture occurs. We resume the
// AudioContext on click / keydown / touchstart the same way the previous
// synthesized version did; the first flip may still be silent if no
// gesture happened yet, but every subsequent flip will be audible.

let audioCtx: AudioContext | null = null

function ensureCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    try {
      audioCtx.resume()
    } catch {
      // still blocked — sound will be silent until next gesture
    }
  }
  return audioCtx
}

const resumeHandler = () => {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
}
document.addEventListener('click', resumeHandler, { once: false })
document.addEventListener('keydown', resumeHandler, { once: false })
document.addEventListener('touchstart', resumeHandler, { once: false })

export function playPageFlip(volume = 0.3) {
  try {
    const c = ensureCtx()
    if (!c) return

    // Create a fresh audio node each call so rapid flips overlap naturally.
    const audio = new Audio('/sounds/sound-flip-book.mp3')
    audio.volume = volume
    audio.preload = 'auto'
    // Play and forget — errors are non-critical
    audio.play().catch(() => {})
  } catch {
    // Silent fail — sound is non-critical
  }
}

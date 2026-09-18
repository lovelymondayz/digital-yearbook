// Synthesized page-turn sound using Web Audio API
// Short filtered noise burst = realistic paper flip — no asset file needed

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    // Resume on user gesture (required by browser autoplay policy)
    const resume = () => {
      if (ctx && ctx.state === 'suspended') {
        ctx.resume()
      }
    }
    document.addEventListener('click', resume, { once: false })
    document.addEventListener('keydown', resume, { once: false })
    document.addEventListener('touchstart', resume, { once: false })
  }
  return ctx
}

export function playPageFlip(volume = 0.3) {
  try {
    const c = getCtx()
    // If still suspended, try to resume (may fail if no user gesture yet)
    if (c.state === 'suspended') {
      c.resume()
    }
    const dur = 0.15
    const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      // White noise with fast decay = paper crackle
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5)
    }
    const src = c.createBufferSource()
    src.buffer = buffer
    // Bandpass filter to shape the "paper" sound
    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3000
    filter.Q.value = 1.2
    const gain = c.createGain()
    gain.gain.value = volume
    src.connect(filter).connect(gain).connect(c.destination)
    src.start()
    src.stop(c.currentTime + dur)
  } catch {
    // Silent fail — sound is non-critical
  }
}

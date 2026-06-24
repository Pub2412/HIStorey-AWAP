document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bg-audio')
  const muteBtn = document.getElementById('mute')

  // Try to play (modern browsers may block autoplay with sound)
  function tryPlay() {
    if (!audio) return
    audio.muted = false
    const p = audio.play()
    if (p && p.then) {
      p.catch(() => {
        // Autoplay failed; start muted instead
        audio.muted = true
        muteBtn.textContent = '🔇'
        muteBtn.setAttribute('aria-pressed', 'true')
      })
    }
  }

  // Load previous mute preference
  const mutedPref = localStorage.getItem('landing-muted')
  if (mutedPref === 'true') {
    audio.muted = true
    muteBtn.textContent = '🔇'
    muteBtn.setAttribute('aria-pressed', 'true')
  } else {
    tryPlay()
  }

  muteBtn.addEventListener('click', async () => {
    // If audio is paused, try to play (user initiated)
    if (audio.paused) {
      try {
        await audio.play()
      } catch (e) {
        // ignore
      }
    }
    const muted = !(audio.muted)
    audio.muted = muted
    // If audio was paused and now unmuted, ensure it's playing
    if (!muted && audio.paused) {
      try { await audio.play() } catch (e) {}
    }
    muteBtn.textContent = muted ? '🔇' : '🔊'
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false')
    localStorage.setItem('landing-muted', muted ? 'true' : 'false')
  })
})

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bg-audio')
  const muteBtn = document.getElementById('audioToggleBtn')
  const iconVolOn = document.getElementById('icon-vol-on')
  const iconVolOff = document.getElementById('icon-vol-off')

  if (!audio || !muteBtn) return

  function setMuteState(muted) {
    audio.muted = muted
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false')
    if (iconVolOn) iconVolOn.style.display = muted ? 'none' : 'block'
    if (iconVolOff) iconVolOff.style.display = muted ? 'block' : 'none'
  }

  // Try to play (modern browsers may block autoplay with sound)
  function tryPlay() {
    audio.muted = false
    const p = audio.play()
    if (p && p.then) {
      p.catch(() => {
        // Autoplay failed; start muted instead
        setMuteState(true)
      })
    }
  }

  // Load previous mute preference
  const mutedPref = localStorage.getItem('landing-muted')
  if (mutedPref === 'true') {
    setMuteState(true)
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
    const muted = !audio.muted
    setMuteState(muted)
    // If audio was paused and now unmuted, ensure it's playing
    if (!muted && audio.paused) {
      try { await audio.play() } catch (e) {}
    }
    localStorage.setItem('landing-muted', muted ? 'true' : 'false')
  })
})

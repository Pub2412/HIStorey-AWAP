(function(){
  const apiBase = '/api/v1'

  function showToast(message, isError = false) {
    let toast = document.querySelector('.toast')
    if (toast) toast.remove()
    
    toast = document.createElement('div')
    toast.className = 'toast'
    toast.style.cssText = `
      position: fixed;
      right: 16px;
      bottom: 16px;
      background: ${isError ? '#c0392b' : '#2e7d32'};
      color: #fff;
      padding: 12px 20px;
      border-radius: 999px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.18);
      z-index: 1100;
      font-family: inherit;
      font-size: 15px;
      font-weight: 500;
      transition: opacity 0.25s ease-out;
    `
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => toast.remove(), 250)
    }, 1800)
  }

  function getAuthToken() {
    try {
      const raw = localStorage.getItem('historey.session')
      if (!raw) return null
      const s = JSON.parse(raw)
      return s && s.token ? s.token : null
    } catch (e) { return null }
  }

  async function fetchMe() {
    const token = getAuthToken()
    if (!token) return
    const res = await fetch(`${apiBase}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
    if (!res.ok) return
    const data = await res.json()
    return data.user
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function renderAuthActions() {
    const actions = document.getElementById('authActions')
    if (!actions) return
    actions.innerHTML = ''

    const cartButton = document.createElement('a')
    cartButton.href = '/cart'
    cartButton.className = 'cart-btn'
    cartButton.id = 'cartButton'
    cartButton.setAttribute('aria-label', 'Cart')
    cartButton.style.cssText = 'padding:8px 20px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;font-size:16px;font-weight:500;background:#fff;color:#000;text-decoration:none;box-shadow:0 4px 6px rgba(0,0,0,0.2);'
    cartButton.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span id="cartCount">0</span>`
    actions.appendChild(cartButton)

    const raw = localStorage.getItem('historey.session')
    let session = null
    try {
      session = raw ? JSON.parse(raw) : null
    } catch (e) {
      session = null
    }

    if (session && session.token) {
      const accountDropdown = document.createElement('div')
      accountDropdown.className = 'account-dropdown'
      accountDropdown.style.cssText = 'position:relative;display:inline-block;'
      const name = session.name || session.email || 'Customer'
      const avatar = session.profile_photo || '/media/images/profile_pg/placeholder_pfp.png'
      accountDropdown.innerHTML = `<button class="account-btn" id="accountDropdownBtn" type="button" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:999px;font-size:15px;font-weight:500;background:#fff;color:#000;text-decoration:none;box-shadow:0 4px 6px rgba(0,0,0,0.2);border:none;cursor:pointer;"><img src="${escapeHtml(avatar)}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" alt="avatar"><span>${escapeHtml(name)}</span></button><div class="dropdown-content" id="accountDropdownMenu" style="visibility:hidden;opacity:0;transform:translateY(-10px);transition:all 0.25s ease;position:absolute;right:0;top:120%;background:#fff;min-width:160px;border-radius:14px;box-shadow:0 10px 22px rgba(0,0,0,0.24);overflow:hidden;z-index:10;"><a href="/profile" style="display:block;padding:12px 16px;color:#111;text-decoration:none;font-size:14px;">Account</a><a href="#" id="signOutLink" style="display:block;padding:12px 16px;color:#111;text-decoration:none;font-size:14px;">Sign Out</a></div>`
      actions.appendChild(accountDropdown)

      // dropdown hover logic
      const btn = accountDropdown.querySelector('#accountDropdownBtn')
      const menu = accountDropdown.querySelector('#accountDropdownMenu')
      if (btn && menu) {
        accountDropdown.addEventListener('mouseenter', () => {
          menu.style.visibility = 'visible'
          menu.style.opacity = '1'
          menu.style.transform = 'translateY(0)'
        })
        accountDropdown.addEventListener('mouseleave', () => {
          menu.style.visibility = 'hidden'
          menu.style.opacity = '0'
          menu.style.transform = 'translateY(-10px)'
        })
      }

      const signOutLink = accountDropdown.querySelector('#signOutLink')
      signOutLink?.addEventListener('click', function(e) {
        e.preventDefault()
        localStorage.removeItem('historey.session')
        window.location.href = '/login?logout=1'
      })
    } else {
      const signIn = document.createElement('a')
      signIn.className = 'sign-in-btn'
      signIn.href = '/login'
      signIn.textContent = 'Sign In'
      signIn.style.cssText = 'padding:10px 20px;border-radius:999px;font-size:15px;font-weight:500;background:#fff;color:#000;text-decoration:none;box-shadow:0 4px 6px rgba(0,0,0,0.2);'
      actions.appendChild(signIn)
    }

    if (window.updateHeaderCartCount) {
      window.updateHeaderCartCount()
    }
  }

  function setProfile(user) {
    if (!user) return
    document.getElementById('profileName').textContent = user.name || 'User'
    document.getElementById('profileEmail').textContent = user.email || ''
    document.getElementById('nameInput').value = user.name || ''
    document.getElementById('phoneInput').value = user.phone || ''
    document.getElementById('addressInput').value = user.address || ''
    const avatar = user.profile_photo || '/media/images/profile_pg/placeholder_pfp.png'
    document.getElementById('avatarImg').src = avatar
    renderAuthActions()
  }

  async function init() {
    const user = await fetchMe()
    if (!user) {
      // redirect to login
      window.location.href = '/login'
      return
    }
    setProfile(user)
    renderAuthActions()
    
    // load user's transactions
    fetchTransactions()

    // wire custom file chooser UI
    const chooseBtn = document.getElementById('chooseFileBtn')
    const photoInput = document.getElementById('photoInput')
    const fileName = document.getElementById('fileName')
    chooseBtn?.addEventListener('click', function(){ photoInput?.click() })
    photoInput?.addEventListener('change', function(){
      const f = photoInput.files && photoInput.files[0]
      if (!f) {
        if (fileName) fileName.textContent = 'No file chosen'
        return
      }
      if (fileName) fileName.textContent = f.name
      // preview
      const reader = new FileReader()
      reader.onload = function(ev){ document.getElementById('avatarImg').src = ev.target.result }
      reader.readAsDataURL(f)
    })

    const form = document.getElementById('profileForm')
    form.addEventListener('submit', async function(e){
      e.preventDefault()
      const token = getAuthToken()
      if (!token) { window.location.href = '/login'; return }

      const formData = new FormData()
      formData.append('name', document.getElementById('nameInput').value)
      formData.append('phone', document.getElementById('phoneInput').value)
      formData.append('address', document.getElementById('addressInput').value)
      const file = document.getElementById('photoInput').files[0]
      if (file) formData.append('profile_photo', file)

      const res = await fetch(`${apiBase}/auth/me`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) {
        showToast('Could not update profile', true)
        return
      }

      const data = await res.json()
      setProfile(data.user)
      
      const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
      if (session) {
        session.name = data.user.name
        session.profile_photo = data.user.profile_photo
        localStorage.setItem('historey.session', JSON.stringify(session))
      }

      showToast('Profile updated successfully')
    })
  }

  async function fetchTransactions() {
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${apiBase}/transactions/mine`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      renderTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      renderTransactions([])
    }
  }

  function renderTransactions(list) {
    const container = document.getElementById('txList')
    container.innerHTML = ''
    if (!list || !list.length) {
      const el = document.createElement('div')
      el.className = 'no-orders'
      el.innerHTML = '<strong>No orders yet</strong><div style="margin-top:8px;font-style:italic">"Why, Why? Tell him that its human nature"</div>'
      container.appendChild(el)
      return
    }

    list.forEach(tx => {
      const card = document.createElement('div')
      card.className = 'tx-card'

      const header = document.createElement('div')
      header.className = 'tx-header'
      const left = document.createElement('div')
      left.innerHTML = `<div><strong>Order #${tx.id}</strong></div><div style="font-size:13px;color:#666">${new Date(tx.created_at || tx.createdAt || tx.updated_at || tx.updatedAt).toLocaleString()}</div>`
      const right = document.createElement('div')

      const status = String(tx.status || '').toLowerCase()
      let badgeClass = 'status-processing'
      if (status === 'completed' || status === 'shipped') badgeClass = 'status-completed'
      if (status === 'cancelled' || status === 'failed') badgeClass = 'status-cancelled'

      right.innerHTML = `<div style="text-align:right"><div class="tx-badge ${badgeClass}">${(tx.status || '').toUpperCase()}</div><div style="margin-top:6px;font-weight:700">PHP ${Number(tx.total_amount || tx.total || 0).toLocaleString('en-PH', { minimumFractionDigits:2 })}</div></div>`
      header.appendChild(left)
      header.appendChild(right)

      card.appendChild(header)

      const items = Array.isArray(tx.items) ? tx.items : []
      if (items.length) {
        const itemsWrap = document.createElement('div')
        itemsWrap.className = 'tx-items'
        items.forEach(it => {
          const row = document.createElement('div')
          row.style.display = 'flex'
          row.style.justifyContent = 'space-between'
          row.style.padding = '6px 0'
          row.innerHTML = `<div>${(it.name || it.product_name || 'Item')} x${it.quantity || 1}</div><div>PHP ${Number(it.unit_price || it.price || 0).toLocaleString('en-PH', { minimumFractionDigits:2 })}</div>`
          itemsWrap.appendChild(row)
        })
        card.appendChild(itemsWrap)
      }

      container.appendChild(card)
    })
  }

  init()
})()

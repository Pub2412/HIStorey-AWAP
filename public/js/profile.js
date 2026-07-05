(function(){
  const apiBase = '/api/v1'

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

  function setProfile(user) {
    if (!user) return
    document.getElementById('profileName').textContent = user.name || 'User'
    document.getElementById('profileEmail').textContent = user.email || ''
    document.getElementById('nameInput').value = user.name || ''
    document.getElementById('phoneInput').value = user.phone || ''
    document.getElementById('addressInput').value = user.address || ''
    const avatar = user.profile_photo || '/media/images/profile_pg/placeholder_pfp.png'
    document.getElementById('avatarImg').src = avatar
  }

  async function init() {
    const user = await fetchMe()
    if (!user) {
      // redirect to login
      window.location.href = '/login'
      return
    }
    setProfile(user)

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
        alert('Could not update profile')
        return
      }

      const data = await res.json()
      setProfile(data.user)
      alert('Profile updated')
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

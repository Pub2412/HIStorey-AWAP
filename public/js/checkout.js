(function(){
  function formatPrice(v){return `PHP ${Number(v||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`}

  function getCart(){ try { return window.CartStore ? window.CartStore.getCart() : [] } catch(e){ return [] } }

  function showAlert(message, isError = false){
    const alert = document.getElementById('checkoutAlert')
    if (!alert) return
    alert.textContent = message
    alert.className = 'alert' + (isError ? ' alert-error' : ' alert-success')
    alert.style.display = 'block'
  }

  function hideAlert(){
    const alert = document.getElementById('checkoutAlert')
    if (alert) alert.style.display = 'none'
  }

  function renderOrderSummary(){
    const wrap = document.getElementById('orderItems')
    const items = getCart()
    wrap.innerHTML = ''

    if (!items || !items.length) {
      wrap.innerHTML = '<div style="padding:20px;text-align:center;color:#666">Your cart is empty</div>'
      document.getElementById('subtotal').textContent = formatPrice(0)
      document.getElementById('grandTotal').textContent = formatPrice(0)
      document.getElementById('placeOrderBtn').disabled = true
      return
    }

    let total = 0
    items.forEach(it => {
      const subtotal = Number(it.price || 0) * Number(it.qty || 1)
      total += subtotal

      const row = document.createElement('div')
      row.className = 'cart-item'
      row.innerHTML = `
        <div class="item-thumb"><img src="${it.img || '/media/images/cart_pg/cart_placeholder.png'}" alt="${it.name}"></div>
        <div class="item-details">
          <div class="item-name">${it.name}</div>
          <div class="item-qty">Qty: ${it.qty}</div>
        </div>
        <div class="item-price">${formatPrice(subtotal)}</div>
      `
      wrap.appendChild(row)
    })

    document.getElementById('subtotal').textContent = formatPrice(total)
    document.getElementById('grandTotal').textContent = formatPrice(total)
    document.getElementById('placeOrderBtn').disabled = false
  }

  function prefillUserInfo(){
    const raw = localStorage.getItem('historey.session')
    let session = null
    try {
      session = raw ? JSON.parse(raw) : null
    } catch (e) {
      session = null
    }

    if (session && session.email) {
      document.getElementById('email').value = session.email || ''
    }
    if (session && session.name) {
      document.getElementById('fullName').value = session.name || ''
    }
  }

  function renderAuthActions(){
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
      accountDropdown.innerHTML = `<button class="account-btn" id="accountDropdownBtn" type="button" style="padding:10px 20px;border-radius:999px;font-size:15px;font-weight:500;background:#fff;color:#000;text-decoration:none;box-shadow:0 4px 6px rgba(0,0,0,0.2);border:none;cursor:pointer;">${session.name || session.email || 'Customer'}</button><div class="dropdown-content" id="accountDropdownMenu" style="visibility:hidden;opacity:0;transform:translateY(-10px);transition:all 0.25s ease;position:absolute;right:0;top:120%;background:#fff;min-width:160px;border-radius:14px;box-shadow:0 10px 22px rgba(0,0,0,0.24);overflow:hidden;z-index:10;"><a href="/profile" style="display:block;padding:12px 16px;color:#111;text-decoration:none;font-size:14px;">Account</a><a href="#" id="signOutLink" style="display:block;padding:12px 16px;color:#111;text-decoration:none;font-size:14px;">Sign Out</a></div>`
      actions.appendChild(accountDropdown)
    } else {
      const signIn = document.createElement('a')
      signIn.className = 'sign-in-btn'
      signIn.href = '/login'
      signIn.textContent = 'Sign In'
      signIn.style.cssText = 'padding:10px 20px;border-radius:999px;font-size:15px;font-weight:500;background:#fff;color:#000;text-decoration:none;box-shadow:0 4px 6px rgba(0,0,0,0.2);'
      actions.appendChild(signIn)
    }

    updateHeaderCartCount()
  }

  function updateHeaderCartCount(){
    try{
      const c = (window.CartStore && window.CartStore.getCart()) || []
      const el = document.querySelector('#authActions .cart-btn span')
      if (el) el.textContent = String(c.reduce((s,i)=>s+Number(i.qty||1),0) || c.length || 0)
    }catch(e){}
  }

  // initialize header count on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') updateHeaderCartCount()
  else window.addEventListener('DOMContentLoaded', updateHeaderCartCount)

  // update header when cart.updated event fires
  window.addEventListener('cart.updated', updateHeaderCartCount)

  async function placeOrder(){
    hideAlert()
    
    const email = document.getElementById('email').value.trim()
    const fullName = document.getElementById('fullName').value.trim()
    const phone = document.getElementById('phone').value.trim()
    const address = document.getElementById('address').value.trim()
    const paymentMethod = document.getElementById('paymentMethod').value

    if (!email || !fullName || !address) {
      showAlert('Please fill in all required fields', true)
      return
    }

    const items = getCart()
    if (!items || !items.length) {
      showAlert('Your cart is empty', true)
      return
    }

    const btn = document.getElementById('placeOrderBtn')
    btn.disabled = true
    btn.textContent = 'Processing...'

    const raw = localStorage.getItem('historey.session')
    let session = null
    try {
      session = raw ? JSON.parse(raw) : null
    } catch (e) {
      session = null
    }

    const userId = session && session.id ? session.id : null

    const checkoutData = {
      userId,
      email,
      items: items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty || 1
      })),
      shipping_address: address,
      payment_method: paymentMethod,
      phone
    }

    try {
      const response = await fetch('/api/v1/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      })

      const data = await response.json()

      if (response.ok) {
        showAlert('Order placed successfully! Check your email for confirmation.', false)
        
        // Clear cart
        if (window.CartStore) {
          window.CartStore.clear()
        }

        // Redirect to profile after 2 seconds
        setTimeout(() => {
          window.location.href = '/profile'
        }, 2000)
      } else {
        showAlert(data.message || 'Failed to place order. Please try again.', true)
        btn.disabled = false
        btn.textContent = 'Place Order'
      }
    } catch (error) {
      console.error('Checkout error:', error)
      showAlert('An error occurred. Please try again.', true)
      btn.disabled = false
      btn.textContent = 'Place Order'
    }
  }

  // Event listeners
  document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder)
  document.getElementById('backToCart')?.addEventListener('click', () => {
    window.location.href = '/cart'
  })

  // Sign out handler
  document.addEventListener('click', function(e) {
    if (e.target.id === 'signOutLink') {
      e.preventDefault()
      localStorage.removeItem('historey.session')
      window.location.href = '/login?logout=1'
    }
  })

  // Account dropdown toggle
  document.addEventListener('click', function(e) {
    if (e.target.id === 'accountDropdownBtn') {
      e.stopPropagation()
      const menu = document.getElementById('accountDropdownMenu')
      if (menu) {
        menu.style.visibility = menu.style.visibility === 'visible' ? 'hidden' : 'visible'
        menu.style.opacity = menu.style.opacity === '1' ? '0' : '1'
        menu.style.transform = menu.style.transform === 'translateY(0)' ? 'translateY(-10px)' : 'translateY(0)'
      }
    }
  })

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.account-dropdown')) {
      const menu = document.getElementById('accountDropdownMenu')
      if (menu) {
        menu.style.visibility = 'hidden'
        menu.style.opacity = '0'
        menu.style.transform = 'translateY(-10px)'
      }
    }
  })

  // Initialize
  renderOrderSummary()
  prefillUserInfo()
  renderAuthActions()
})()

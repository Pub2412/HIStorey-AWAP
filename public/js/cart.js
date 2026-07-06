(function(){
  // basic cart interactions: render items from localStorage.cart (array of {id,name,price,qty,img})
  function formatPrice(v){return `PHP ${Number(v||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`}

  function getCart(){ try { return window.CartStore ? window.CartStore.getCart() : [] } catch(e){ return [] } }
  function saveCart(c){ try { if (window.CartStore) window.CartStore.saveCart(c) } catch(e){} }

  function render(){
    const wrap = document.getElementById('cartItems')
    const empty = document.getElementById('emptyState')
    const checkoutBar = document.getElementById('checkoutBar')
    wrap.innerHTML = ''
    const items = getCart()
    if (!items || !items.length) { empty.style.display='block'; checkoutBar.style.display='none'; return }
    empty.style.display='none'; checkoutBar.style.display='flex'

    let total = 0
    items.forEach(it=>{
      const row = document.createElement('div')
      row.className='cart-row'
      row.dataset.productId = it.id
      const subtotal = (Number(it.price||0) * Number(it.qty||1))
      total += subtotal

      row.innerHTML = `
        <div class="product-info">
          <a class="product-link" href="/product/${it.id}">
            <div class="cart-thumb"><img src="${it.img || '/media/images/cart_pg/cart_placeholder.png'}" alt="${it.name}"></div>
            <div class="product-meta"><div class="product-title">${it.name}</div><div class="small">${it.description||''}</div></div>
          </a>
        </div>
        <div class="price">${formatPrice(it.price)}</div>
        <div>
          <div class="qty-controls">
            <button class="qty-dec">-</button>
            <span class="qty-val">${it.qty}</span>
            <button class="qty-inc">+</button>
          </div>
        </div>
        <div class="price">${formatPrice(subtotal)}</div>
        <div class="actions-col"><button class="btn remove-btn">Remove</button></div>
      `

      wrap.appendChild(row)
    })

    document.getElementById('grandTotal').textContent = formatPrice(total)

    // wire actions
    wrap.querySelectorAll('.qty-inc').forEach(b=>b.addEventListener('click', function(){
      const row = this.closest('.cart-row'); const id = row.dataset.productId; changeQty(id,1)
    }))
    wrap.querySelectorAll('.qty-dec').forEach(b=>b.addEventListener('click', function(){
      const row = this.closest('.cart-row'); const id = row.dataset.productId; changeQty(id,-1)
    }))
    wrap.querySelectorAll('.remove-btn').forEach(b=>b.addEventListener('click', function(){
      const row = this.closest('.cart-row'); const id = row.dataset.productId; removeItem(id)
    }))
  }

  // re-render when cart changes elsewhere
  window.addEventListener('cart.updated', function(){ render() })

  function changeQty(id,delta){
    const cart = getCart(); const idx = cart.findIndex(x=>String(x.id)===String(id)); if (idx===-1) return
    cart[idx].qty = Math.max(1,(Number(cart[idx].qty||1)+delta))
    saveCart(cart); render()
  }
  function removeItem(id){
    let cart = getCart(); cart = cart.filter(x=>String(x.id)!==String(id)); saveCart(cart); render()
  }

  document.getElementById('continueShopping')?.addEventListener('click', ()=>{ window.location.href='/products' })
  document.getElementById('checkoutBtn')?.addEventListener('click', ()=>{ window.location.href='/checkout' })
  document.getElementById('saveFavs')?.addEventListener('click', ()=>{ alert('Saved to favourites (demo)') })

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

  render()
})()
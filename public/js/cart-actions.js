(function(){
  function formatPriceValue(text){
    if (!text) return 0
    const num = String(text).replace(/[^
0-9.-]+/g,'')
    return Number(num) || 0
  }

  function getCardInfo($el){
    const $card = $el.closest('.product-card')
    const id = $el.data('product-id') || $card.data('product-id')
    const name = $card.find('.product-title').first().text().trim()
    const priceText = $card.find('.product-price').first().text().trim()
    const img = $card.find('.product-image-placeholder img').attr('src') || null
    return { id, name, price: formatPriceValue(priceText), img }
  }

  // delegated add-to-cart for product lists
  document.addEventListener('click', function(e){
    const target = e.target.closest && e.target.closest('.add-to-cart-btn')
    if (!target) return
    e.preventDefault()
    const $btn = $(target)
    const info = getCardInfo($btn)
    if (!info || !info.id) return
    CartStore.addItem({ id: info.id, name: info.name, price: info.price, qty: 1, img: info.img })
    // notify listeners and update header count
    try { window.dispatchEvent(new CustomEvent('cart.updated')) } catch(e){}
    updateHeaderCartCount()
    if (window.showToast) window.showToast('Added to cart', 'success')
    else window.alert('Added to cart')
  }, true)

  // product detail add to cart
  document.addEventListener('click', function(e){
    const target = e.target.closest && e.target.closest('#detailAddToCartBtn')
    if (!target) return
    e.preventDefault()
    try {
      const qty = Number(document.getElementById('qty-val')?.textContent || '1') || 1
      const id = window.currentProduct && window.currentProduct.id
      const name = window.currentProduct && window.currentProduct.name
      const price = window.currentProduct && Number(window.currentProduct.price || 0)
      const img = document.getElementById('mainProductPhoto')?.getAttribute('src') || null
      if (!id) { alert('Product not loaded'); return }
      CartStore.addItem({ id, name, price, qty, img })
      try { window.dispatchEvent(new CustomEvent('cart.updated')) } catch(e){}
      updateHeaderCartCount()
      if (window.setDetailAlert) window.setDetailAlert('Item added to cart')
    } catch(err) {
      console.error(err); alert('Unable to add to cart')
    }
  }, true)

  // related products add-to-cart
  document.addEventListener('click', function(e){
    const target = e.target.closest && e.target.closest('.related-add-to-cart')
    if (!target) return
    e.preventDefault()
    const $btn = $(target)
    const id = $btn.data('product-id')
    const $card = $btn.closest('.product-card')
    const name = $card.find('.product-title').text().trim()
    const price = Number(String($card.find('.product-price').text()||'').replace(/[^0-9.-]+/g,'')) || 0
    const img = $card.find('.product-image-placeholder img').attr('src') || null
    CartStore.addItem({ id, name, price, qty: 1, img })
    try { window.dispatchEvent(new CustomEvent('cart.updated')) } catch(e){}
    updateHeaderCartCount()
    if (window.setDetailAlert) window.setDetailAlert(`Added related product ${id} to cart.`)
  }, true)

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

})()

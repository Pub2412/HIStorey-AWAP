(function(){
  function formatPriceValue(text){
    if (!text) return 0
    const num = String(text).replace(/[^0-9.-]+/g,'')
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
      const count = String(c.reduce((s,i)=>s+Number(i.qty||1),0) || c.length || 0)
      const elements = document.querySelectorAll('#authActions .cart-btn span, #cartButton span, #cartCount')
      elements.forEach(el => {
        el.textContent = count
      })
    }catch(e){}
  }

  // initialize header count on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') updateHeaderCartCount()
  else window.addEventListener('DOMContentLoaded', updateHeaderCartCount)

  // update header when cart.updated event fires
  window.addEventListener('cart.updated', updateHeaderCartCount)

  window.updateHeaderCartCount = updateHeaderCartCount;

})()

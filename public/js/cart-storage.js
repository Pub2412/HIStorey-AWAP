(function(){
  // Simple cookie-backed cart storage. Exposes CartStore globally.
  const NAME = 'historey_cart'
  function getCookie(name){
    const v = document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith(name+'='))
    if(!v) return null
    return decodeURIComponent(v.split('=').slice(1).join('='))
  }
  function setCookie(name,value,days=30){
    const d = new Date(); d.setTime(d.getTime() + (days*24*60*60*1000));
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/`;
  }
  function read(){
    try{
      const raw = getCookie(NAME)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }catch(e){ return [] }
  }
  function write(cart){
    try{ setCookie(NAME, JSON.stringify(cart||[]), 30) }catch(e){ /* noop */ }
  }

  function findIndex(cart,id){ return cart.findIndex(x=>String(x.id)===String(id)) }

  const CartStore = {
    getCart(){ return read() },
    saveCart(cart){ write(cart) },
    addItem(item){
      const cart = read()
      const idx = findIndex(cart,item.id)
      if (idx === -1) {
        cart.push({ id: item.id, name: item.name, price: Number(item.price||0), qty: Number(item.qty||1), img: item.img || null, description: item.description || '' })
      } else {
        cart[idx].qty = Math.max(1, Number(cart[idx].qty||1) + Number(item.qty||1))
      }
      write(cart)
      return cart
    },
    removeItem(id){
      let cart = read(); cart = cart.filter(x=>String(x.id)!==String(id)); write(cart); return cart
    },
    changeQty(id,qty){
      const cart = read(); const idx = findIndex(cart,id); if (idx===-1) return cart; cart[idx].qty = Math.max(1, Number(qty)); write(cart); return cart
    },
    clear(){ write([]) }
  }

  window.CartStore = CartStore
})()

(function() {
	const storageKey = 'historey.session'
	const apiBase = '/api/v1'
	const fallbackImage = '/media/images/prod_pg/landingmerch.png'
	const placeholderReviews = [
		{ name: 'Mika', meta: '2 days ago', rating: 5, text: 'The layout feels premium and the product details are easy to scan.' },
		{ name: 'Jean', meta: '1 week ago', rating: 4, text: 'Good visual hierarchy and the image gallery works well on mobile.' },
		{ name: 'Alex', meta: '3 weeks ago', rating: 5, text: 'The product detail page is clear, polished, and easy to use.' }
	]

	let currentProduct = null
	let currentQty = 1

	function readSession() {
		const raw = localStorage.getItem(storageKey)
		if (!raw) return null
		try { return JSON.parse(raw) } catch (error) { return null }
	}

	function escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
	}

	function formatPrice(value) {
		const numeric = Number(value)
		if (Number.isNaN(numeric)) return 'PHP 0.00'
		return `PHP ${numeric.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
	}

	function getProductId() {
		const match = window.location.pathname.match(/\/product\/(\d+)/)
		return match ? Number(match[1]) : null
	}

	function getSessionName() {
		const session = readSession()
		return session && session.token ? (session.name || session.email || 'Customer') : null
	}

	function setDetailAlert(message, isError = false) {
		const $alert = $('#detailAlert')
		$alert.text(message)
		$alert.toggleClass('show', !!message)
		$alert.css('background', isError ? 'rgba(255, 238, 238, 0.92)' : 'rgba(255,255,255,0.68)')
	}

	function renderAuthActions() {
		const $actions = $('#authActions')
		const sessionName = getSessionName()
		$actions.empty()

		$actions.append(`<a href="/cart" class="cart-btn" id="cartButton" aria-label="Cart"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span>0</span></a>`)
		if (sessionName) {
			$actions.append(`<div class="account-dropdown"><button class="account-btn" id="accountDropdownBtn" type="button">${escapeHtml(sessionName)}</button><div class="dropdown-content" id="accountDropdownMenu"><a href="/profile">Account</a><a href="#" id="signOutLink">Sign Out</a></div></div>`)
		} else {
			$actions.append(`<a class="sign-in-btn" href="/login">Sign In</a>`)
		}
		$actions.append(`<button class="audio-btn" id="audioToggleBtn" type="button" aria-label="Toggle audio" aria-pressed="false"><svg id="icon-vol-on" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><svg id="icon-vol-off" style="display:none;" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line></svg></button>`)
	}

	function renderStars(rating) {
		const stars = Math.round(Number(rating) || 0)
		return Array.from({ length: 5 }, (_, index) => `<svg class="stars-svg" viewBox="0 0 24 24" width="18" height="18" fill="${index < stars ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 2.5l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 18.9l-6.18 3.22L7 14.64 2 9.77l6.91-1.01L12 2.5z"></path></svg>`).join('')
	}

	function getPrimaryImage(product) {
		const images = Array.isArray(product.images) ? product.images : []
		const primary = images.find((image) => image.is_primary) || images[0]
		return primary && primary.url ? primary.url : fallbackImage
	}

	function getImageSet(product) {
		const images = Array.isArray(product.images) ? product.images.map((image) => image.url).filter(Boolean) : []
		if (images.length) return [...new Set(images)]
		return [fallbackImage]
	}

	function renderImages(product) {
		const imageUrls = getImageSet(product)
		const $main = $('#mainProductImage')
		const $thumbRow = $('#thumbRow')
		$main.empty()
		$thumbRow.empty()

		const mainUrl = imageUrls[0]
		$main.append(`<img src="${escapeHtml(mainUrl)}" alt="${escapeHtml(product.name)}" id="mainProductPhoto" loading="eager" onerror="this.onerror=null;this.src='${fallbackImage}';">`)

		imageUrls.slice(0, 4).forEach((url, index) => {
			$thumbRow.append(`<div class="img-placeholder thumb-img ${index === 0 ? 'active' : ''}" data-url="${escapeHtml(url)}"><img src="${escapeHtml(url)}" alt="Thumbnail ${index + 1}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}';"></div>`)
		})

		$(document).off('mouseenter.productDetail').on('mouseenter.productDetail', '.thumb-img', function() {
			const url = $(this).data('url')
			$('.thumb-img').removeClass('active')
			$(this).addClass('active')
			$('#mainProductPhoto').attr('src', url)
		})

		$('#mainProductImage').off('click').on('click', function() {
			window.open($(this).find('img').attr('src'), '_blank', 'noopener,noreferrer')
		})
	}

	function renderDescription(product) {
		const general = [
			`Category: ${product.category || 'General'}`,
			`Condition: ${product.condition || 'Good'}`,
			`Availability: ${Number(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}`,
			`Year: ${product.year || 'N/A'}`
		]

		const care = [
			'Keep away from direct sunlight and excess moisture.',
			'Wipe gently with a soft dry cloth.',
			'Store in a cool, clean place when not in use.'
		]

		$('#generalInfoList').html(general.map((line) => `<li>${escapeHtml(line)}</li>`).join(''))
		$('#careInstructionsList').html(care.map((line) => `<li>${escapeHtml(line)}</li>`).join(''))
	}

	function renderReviews(product) {
		const rating = product.stock ? Math.min(5, Math.max(3, 3 + Math.round(Number(product.stock) / 10))) : 4
		$('#overallRating').text(`${rating}.0`)
		$('#detailRating').html(`${renderStars(rating)}<span>${rating}.0 rating</span>`)

		const cards = placeholderReviews.map((review) => `
			<div class="review-card" data-rating="${review.rating}">
				<div class="review-header">
					<div class="reviewer-name">${escapeHtml(review.name)}</div>
					<div class="review-meta">${escapeHtml(review.meta)}</div>
				</div>
				<div>${renderStars(review.rating)}</div>
				<div class="review-text">${escapeHtml(review.text)}</div>
				<div class="review-interactions">
					<button class="interact-btn like-btn" type="button">Like <span class="cnt">0</span></button>
					<button class="interact-btn dislike-btn" type="button">Dislike <span class="cnt">0</span></button>
				</div>
			</div>
		`).join('')

		$('#reviewList').html(cards)
	}

	function renderRelatedProducts(products, currentId) {
		const related = products.filter((product) => Number(product.id) !== Number(currentId)).slice(0, 4)
		if (!related.length) {
			$('#relatedGrid').html('<div class="product-card" style="flex:1; min-width:0;"><div class="product-info"><span class="product-title" style="animation:none;">No related products found.</span></div></div>')
			return
		}

		$('#relatedGrid').html(related.map((product) => {
			const imageUrl = getPrimaryImage(product)
			return `
				<article class="product-card" data-product-id="${product.id}">
					<a href="/product/${product.id}" class="product-link" aria-label="${escapeHtml(product.name)}">
						<div class="product-image-placeholder"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}';"></div>
						<div class="product-info"><div class="title-marquee-container"><span class="product-title">${escapeHtml(product.name || 'Untitled product')}</span></div><span class="product-price">${formatPrice(product.price)}</span></div>
					</a>
					<div class="card-actions">
						<button class="add-to-cart-btn related-add-to-cart" type="button" data-product-id="${product.id}">Add to Cart</button>
						<button class="heart-btn" type="button" aria-label="Favorite item" data-product-id="${product.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
					</div>
				</article>
			`
		}).join(''))

		if (!readSession()) {
			$('.related-add-to-cart').text('Sign in to buy')
		}
	}

	function setQty(value) {
		currentQty = Math.max(1, value)
		$('#qty-val').text(currentQty)
	}

	function updateAddToCartButtonState() {
		const session = readSession()
		const $button = $('#detailAddToCartBtn')
		if (!session || !session.token) {
			$button.text('Sign in to add')
			return
		}
		$button.text('Add to Cart')
	}

	function bindInteractions() {
		$(document).on('click', '#accountDropdownBtn', function(e) {
			e.stopPropagation()
			$('#accountDropdownMenu').toggleClass('show')
		})

		$(window).on('click', function(event) {
			if (!$(event.target).closest('.account-dropdown').length) {
				$('#accountDropdownMenu').removeClass('show')
			}
		})

		$(document).on('click', '#signOutLink', function(e) {
			e.preventDefault()
			localStorage.removeItem(storageKey)
			window.location.replace('/login?logout=1')
		})

		$(document).on('click', '.heart-btn', function(event) {
			event.stopPropagation()
			$(this).toggleClass('liked')
		})

		$(document).on('click', '.product-link', function(e) {
			const href = $(this).attr('href')
			if (!href || href === '#') e.preventDefault()
		})

		$('#qty-minus').on('click', () => setQty(currentQty - 1))
		$('#qty-plus').on('click', () => setQty(currentQty + 1))

		$('#mainHeartBtn').on('click', function() {
			const isLiked = $(this).toggleClass('liked').hasClass('liked')
			let count = Number($('#mainHeartCount').text() || '0')
			$('#mainHeartCount').text(isLiked ? count + 1 : Math.max(0, count - 1))
		})

		// Detail add-to-cart is handled by /public/js/cart-actions.js (stores cart in cookies)
		$('#detailAddToCartBtn').on('click', function(e) {
			e.preventDefault()
			const session = readSession()
			if (!session || !session.token) {
				window.location.href = '/login'
				return
			}
			
			// Add to cart with selected quantity
			if (currentProduct) {
				const img = document.getElementById('mainProductPhoto')?.getAttribute('src') || null
				CartStore.addItem({ 
					id: currentProduct.id, 
					name: currentProduct.name, 
					price: Number(currentProduct.price || 0), 
					qty: currentQty, 
					img: img 
				})
				try { window.dispatchEvent(new CustomEvent('cart.updated')) } catch(e){}
				updateHeaderCartCount()
				setDetailAlert('Item added to cart')
			}
		})

		$('#buyNowBtn').on('click', function(e) {
			e.preventDefault()
			const session = readSession()
			if (!session || !session.token) {
				window.location.href = '/login'
				return
			}
			
			// Add to cart and redirect to checkout
			if (currentProduct) {
				const img = document.getElementById('mainProductPhoto')?.getAttribute('src') || null
				CartStore.addItem({ 
					id: currentProduct.id, 
					name: currentProduct.name, 
					price: Number(currentProduct.price || 0), 
					qty: currentQty, 
					img: img 
				})
				try { window.dispatchEvent(new CustomEvent('cart.updated')) } catch(e){}
				updateHeaderCartCount()
				window.location.href = '/checkout'
			}
		})

		// Related product add-to-cart handled by /public/js/cart-actions.js

		$(document).on('click', '.rating-bar-row', function() {
			const starVal = $(this).data('star')
			$('.rating-bar-row').removeClass('active-filter')
			$(this).addClass('active-filter')
			$('.review-card').each(function() {
				$(this).toggle($(this).data('rating') === starVal)
			})
		})

		$(document).on('click', '.like-btn, .dislike-btn', function() {
			const $btn = $(this)
			const $card = $btn.closest('.review-card')
			const isLike = $btn.hasClass('like-btn')
			const other = $card.find(isLike ? '.dislike-btn' : '.like-btn')
			$btn.toggleClass('active')
			other.removeClass('active')
			const span = $btn.find('.cnt')
			span.text($btn.hasClass('active') ? 1 : 0)
			other.find('.cnt').text(0)
		})

		$(document).on('click', '.product-card[data-product-id]', function() {
			const id = $(this).data('product-id')
			if (id && Number(id) !== Number(currentProduct && currentProduct.id)) {
				window.location.href = `/product/${id}`
			}
		})
	}

	function loadProduct() {
		const productId = getProductId()
		if (!productId) {
			window.location.replace('/404')
			return
		}

		$.ajax({ url: `${apiBase}/products/${productId}`, method: 'GET' })
			.done((product) => {
				currentProduct = product
				$('#productBadge').text(product.category || 'Product Detail')
				$('#detailTitle').text(product.name || 'Untitled product')
				$('#detailPrice').text(formatPrice(product.price))
				$('#metaCategory').text(product.category || 'General')
				$('#metaCondition').text(product.condition || 'Good')
				$('#metaStock').text(Number(product.stock || 0) > 0 ? `${product.stock} available` : 'Out of stock')
				$('#metaYear').text(product.year || 'N/A')
				setDetailAlert(product.description ? '' : 'This product does not have a description yet.')
				renderAuthActions()
				renderImages(product)
				renderDescription(product)
				renderReviews(product)
				updateAddToCartButtonState()
				setQty(1)

				$.ajax({ url: `${apiBase}/products`, method: 'GET' })
					.done((products) => {
						const list = Array.isArray(products) ? products.filter((item) => !item.is_deleted) : []
						renderRelatedProducts(list, product.id)
					})
					.fail(() => renderRelatedProducts([], product.id))
			})
			.fail(() => {
				window.location.replace('/404')
			})
	}

	bindInteractions()
	loadProduct()

	const mutedPref = localStorage.getItem('landing-muted')
	if (mutedPref === 'true') {
		const iconVolOn = document.getElementById('icon-vol-on')
		const iconVolOff = document.getElementById('icon-vol-off')
		if (iconVolOn) iconVolOn.style.display = 'none'
		if (iconVolOff) iconVolOff.style.display = 'block'
	}
})()
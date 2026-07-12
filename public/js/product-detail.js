(function() {
	const storageKey = 'historey.session'
	const apiBase = '/api/v1'
	const fallbackImage = '/media/images/prod_pg/landingmerch.png'
	let hasPurchasedProduct = false
	let existingUserReview = null

	let currentProduct = null
	let currentQty = 1

	let globalFavorites = []

	function loadFavorites() {
		const session = readSession()
		if (!session || !session.token) return

		$.ajax({
			url: `${apiBase}/auth/me/favorites`,
			method: 'GET',
			headers: { 'Authorization': `Bearer ${session.token}` }
		}).done(function(favorites) {
			globalFavorites = favorites.map(f => f.id)
			applyFavorites()
		})
	}

	function applyFavorites() {
		if (currentProduct && globalFavorites.includes(currentProduct.id)) {
			$('#mainHeartBtn').addClass('liked')
		} else {
			$('#mainHeartBtn').removeClass('liked')
		}

		$('.heart-btn').each(function() {
			const pid = parseInt($(this).data('product-id'))
			if (globalFavorites.includes(pid)) {
				$(this).addClass('liked')
			} else {
				$(this).removeClass('liked')
			}
		})
	}

	function toggleFavoriteApi(productId, $btn) {
		const session = readSession()
		if (!session || !session.token) {
			window.location.href = '/login'
			return
		}

		$.ajax({
			url: `${apiBase}/products/${productId}/favorite`,
			method: 'POST',
			headers: { 'Authorization': `Bearer ${session.token}` }
		}).done(function(res) {
			if (res.favorited) {
				$btn.addClass('liked')
				if (!globalFavorites.includes(productId)) globalFavorites.push(productId)
			} else {
				$btn.removeClass('liked')
				globalFavorites = globalFavorites.filter(id => id !== productId)
			}
		}).fail(function() {
			showCartToast('Failed to update favorite')
		})
	}

	const radioTracks = [
		{ file: 'ABC.mp3', title: 'ABC', album: 'Jackson 5' },
		{ file: "Bad.mp3", title: 'Bad', album: 'Bad' },
		{ file: 'Beat It.mp3', title: 'Beat It', album: 'Thriller' },
		{ file: 'Billie Jean.mp3', title: 'Billie Jean', album: 'Thriller' },
		{ file: 'Black or White.mp3', title: 'Black or White', album: 'Dangerous' },
		{ file: 'Chicago.mp3', title: 'Chicago', album: 'Michael Jackson' },
		{ file: 'Dirty Diana.mp3', title: 'Dirty Diana', album: 'Bad' },
		{ file: "Don't Stop 'Til You Get Enough.mp3", title: "Don't Stop 'Til You Get Enough", album: 'Off the Wall' },
		{ file: 'Earth Song.mp3', title: 'Earth Song', album: 'HIStory' },
		{ file: 'Heal the World.mp3', title: 'Heal the World', album: 'Dangerous' },
		{ file: 'Human Nature.mp3', title: 'Human Nature', album: 'Thriller' },
		{ file: "I'll Be There.mp3", title: "I'll Be There", album: 'Jackson 5' },
		{ file: 'Jam.mp3', title: 'Jam', album: 'Dangerous' },
		{ file: 'Man in the Mirror.mp3', title: 'Man in the Mirror', album: 'Bad' },
		{ file: 'Remember the Time.mp3', title: 'Remember the Time', album: 'Dangerous' },
		{ file: 'Smooth Criminal.mp3', title: 'Smooth Criminal', album: 'Bad' },
		{ file: 'The Way You Make Me Feel.mp3', title: 'The Way You Make Me Feel', album: 'Bad' },
		{ file: "They Don't Care About Us.mp3", title: "They Don't Care About Us", album: 'HIStory' },
		{ file: 'Thriller.mp3', title: 'Thriller', album: 'Thriller' },
		{ file: "Wanna Be Startin' Somethin'.mp3", title: "Wanna Be Startin' Somethin'", album: 'Thriller' },
		{ file: 'You Are Not Alone.mp3', title: 'You Are Not Alone', album: 'HIStory' }
	]
	let currentRadioIndex = -1

	function showCartToast(message) {
		let toast = document.querySelector('.cart-toast')
		if (toast) toast.remove()

		toast = document.createElement('div')
		toast.className = 'cart-toast'
		toast.style.cssText = `
			position: fixed;
			top: 24px;
			left: 50%;
			transform: translateX(-50%);
			background: #2e7d32;
			color: #ffffff;
			padding: 14px 28px;
			border-radius: 999px;
			box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
			z-index: 9999;
			font-family: 'Poppins', Arial, sans-serif;
			font-size: 16px;
			font-weight: 600;
			text-align: center;
			pointer-events: none;
			opacity: 0;
			transition: opacity 0.3s ease, top 0.3s ease;
		`
		toast.textContent = message
		document.body.appendChild(toast)

		// Trigger reflow to apply initial opacity
		toast.offsetHeight

		// Fade in
		toast.style.opacity = '1'

		// Fade out and remove
		setTimeout(() => {
			toast.style.opacity = '0'
			setTimeout(() => toast.remove(), 300)
		}, 2000)
	}

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
		const session = readSession()
		$actions.empty()

		if (session && session.token) {
			$actions.append(`<a href="/cart" class="cart-btn" id="cartButton" aria-label="Cart"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span>0</span></a>`)
			const name = session.name || session.email || 'Customer'
			const avatar = session.profile_photo || '/media/images/profile_pg/placeholder_pfp.png'
			$actions.append(`<div class="account-dropdown"><button class="account-btn" id="accountDropdownBtn" type="button" style="display: inline-flex; align-items: center; gap: 8px;"><img src="${escapeHtml(avatar)}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" alt="avatar"><span>${escapeHtml(name)}</span></button><div class="dropdown-content" id="accountDropdownMenu"><a href="/profile">Account</a><a href="#" id="signOutLink">Sign Out</a></div></div>`)
		} else {
			$actions.append(`<a class="sign-in-btn" href="/login">Sign In</a>`)
		}

		
		if (window.updateHeaderCartCount) {
			window.updateHeaderCartCount()
		}
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

	function renderReviews(reviewsList) {
		const list = reviewsList || []
		const totalRating = list.reduce((sum, r) => sum + r.rating, 0)
		const avgRating = list.length ? (totalRating / list.length) : 0
		const avgRatingStr = avgRating ? avgRating.toFixed(1) : '0.0'

		$('#overallRating').text(avgRatingStr)
		
		const starsHtml = renderStars(Math.round(avgRating))
		$('#detailRating').html(`${starsHtml}<span>${avgRatingStr} rating (${list.length} review${list.length === 1 ? '' : 's'})</span>`)

		// Calculate rating bars dynamically
		const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
		list.forEach((r) => {
			const rating = Math.round(Number(r.rating || 0))
			if (counts[rating] !== undefined) {
				counts[rating]++
			}
		})

		const barsHtml = [5, 4, 3, 2, 1].map((star) => {
			const count = counts[star]
			const pct = list.length ? Math.round((count / list.length) * 100) : 0
			return `
				<div class="rating-bar-row" data-star="${star}">
					<span>${star}</span>
					<div class="bar-track">
						<div class="bar-fill" style="width: ${pct}%;"></div>
					</div>
					<strong>${pct}%</strong>
				</div>
			`
		}).join('')

		$('#ratingBarsContainer').html(barsHtml)

		if (!list.length) {
			$('#reviewList').html('<div style="padding: 20px; text-align: center; color: #555; background: #fff; border-radius: 12px;">No reviews yet. Be the first to purchase and review this product!</div>')
			return
		}

		const cards = list.map((review) => {
			const dateStr = new Date(review.created_at).toLocaleDateString()
			return `
				<div class="review-card" data-rating="${review.rating}">
					<div class="review-header">
						<div class="reviewer-name">${escapeHtml(review.reviewer_name || 'Anonymous')}</div>
						<div class="review-meta">${escapeHtml(dateStr)}</div>
					</div>
					<div>${renderStars(review.rating)}</div>
					<div class="review-text">${escapeHtml(review.comment || '')}</div>
				</div>
			`
		}).join('')

		$('#reviewList').html(cards)
	}

	function loadReviews(productId) {
		$.ajax({ url: `${apiBase}/products/${productId}/reviews`, method: 'GET' })
			.done((reviews) => {
				renderReviews(reviews)
			})
			.fail(() => {
				console.error('Failed to load reviews')
				renderReviews([])
			})
	}

	function checkPurchaseStatus(productId) {
		const session = readSession()
		if (!session || !session.token) {
			$('#reviewCtaBlock').hide()
			return
		}

		$.ajax({
			url: `${apiBase}/products/${productId}/purchase-check`,
			method: 'GET',
			headers: { 'Authorization': `Bearer ${session.token}` }
		})
		.done((res) => {
			hasPurchasedProduct = res.hasPurchased
			existingUserReview = res.existingReview

			if (hasPurchasedProduct) {
				$('#reviewCtaBlock').show()
				if (existingUserReview) {
					$('#reviewCtaTitle').text('Edit your review')
					$('#reviewCtaDesc').text('You have already reviewed this product. You can update your rating and comment.')
					$('#openReviewModalBtn').text('Edit Review')
				} else {
					$('#reviewCtaTitle').text('Share your thoughts')
					$('#reviewCtaDesc').text('If you purchased this item, you can leave a review.')
					$('#openReviewModalBtn').text('Write Review')
				}
			} else {
				$('#reviewCtaBlock').hide()
			}
		})
		.fail(() => {
			$('#reviewCtaBlock').hide()
		})
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

		const session = readSession()
		if (!session || !session.token) {
			$('.related-add-to-cart').text('Sign in to buy')
		}
		applyFavorites()
	}

	function setQty(value) {
		const maxStock = currentProduct ? Number(currentProduct.stock || 0) : 999
		currentQty = Math.max(1, Math.min(maxStock, value))
		$('#qty-val').text(currentQty)
	}

	function updateAddToCartButtonState() {
		const session = readSession()
		const $button = $('#detailAddToCartBtn')
		const $buyButton = $('#buyNowBtn')

		const isOutOfStock = currentProduct && Number(currentProduct.stock || 0) <= 0
		if (isOutOfStock) {
			$button.text('Out of Stock').prop('disabled', true).css({ background: '#888', color: '#ccc', cursor: 'not-allowed' })
			$buyButton.text('Out of Stock').prop('disabled', true).css({ background: '#888', color: '#ccc', cursor: 'not-allowed' })
			return
		}

		if (!session || !session.token) {
			$button.text('Sign in to add').prop('disabled', false).css({ background: '', color: '', cursor: '' })
			$buyButton.text('Sign in to buy').prop('disabled', false).css({ background: '', color: '', cursor: '' })
			return
		}
		$button.text('Add to Cart').prop('disabled', false).css({ background: '', color: '', cursor: '' })
		$buyButton.text('Buy now').prop('disabled', false).css({ background: '', color: '', cursor: '' })
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
			event.preventDefault()
			const pid = parseInt($(this).data('product-id'))
			toggleFavoriteApi(pid, $(this))
		})

		$(document).on('click', '.product-link', function(e) {
			const href = $(this).attr('href')
			if (!href || href === '#') e.preventDefault()
		})

		$('#qty-minus').on('click', () => setQty(currentQty - 1))
		$('#qty-plus').on('click', () => setQty(currentQty + 1))

		$('#mainHeartBtn').on('click', function(e) {
			e.preventDefault()
			if (currentProduct) {
				toggleFavoriteApi(currentProduct.id, $(this))
			}
		})

		// Detail add-to-cart is handled here using local storage session
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
				if (window.updateHeaderCartCount) window.updateHeaderCartCount()
				setDetailAlert('Item added to cart successfully')
				showCartToast('Item added to cart successfully')
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
				if (window.updateHeaderCartCount) window.updateHeaderCartCount()
				window.location.href = '/checkout'
			}
		})

		// Related product add-to-cart handled by /public/js/cart-actions.js

		$(document).on('click', '.rating-bar-row', function() {
			const starVal = Number($(this).data('star'))
			const isAlreadyActive = $(this).hasClass('active-filter')
			
			$('.rating-bar-row').removeClass('active-filter')
			
			if (isAlreadyActive) {
				$('.review-card').show()
			} else {
				$(this).addClass('active-filter')
				$('.review-card').each(function() {
					$(this).toggle(Number($(this).data('rating')) === starVal)
				})
			}
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

		// Open Review Modal
		$(document).on('click', '#openReviewModalBtn', function() {
			const $modal = $('#reviewModal')
			const ratingVal = existingUserReview ? existingUserReview.rating : 5
			$('#reviewRatingInput').val(ratingVal)
			highlightReviewStars(ratingVal)
			$('#reviewComment').val(existingUserReview ? existingUserReview.comment || '' : '')
			
			if (existingUserReview) {
				$('#reviewModalTitle').text('Edit your Review')
				$modal.find('button[type="submit"]').text('Update Review')
			} else {
				$('#reviewModalTitle').text('Write a Review')
				$modal.find('button[type="submit"]').text('Submit Review')
			}
			$modal.css('display', 'flex')
		})

		// Close Review Modal
		$(document).on('click', '#closeReviewModal', function() {
			$('#reviewModal').hide()
		})

		// Star click interaction
		$(document).on('click', '.review-star', function() {
			const value = Number($(this).data('value'))
			$('#reviewRatingInput').val(value)
			highlightReviewStars(value)
		})

		function highlightReviewStars(value) {
			$('.review-star').each(function() {
				const starVal = Number($(this).data('value'))
				if (starVal <= value) {
					$(this).css('color', 'var(--accent)')
				} else {
					$(this).css('color', '#ccc')
				}
			})
		}

		// Submit review form
		$(document).on('submit', '#reviewForm', function(e) {
			e.preventDefault()
			const session = readSession()
			if (!session || !session.token) {
				window.location.href = '/login'
				return
			}
			
			const productId = getProductId()
			const rating = Number($('#reviewRatingInput').val())
			const comment = $('#reviewComment').val()

			$.ajax({
				url: `${apiBase}/products/${productId}/reviews`,
				method: 'POST',
				headers: { 'Authorization': `Bearer ${session.token}` },
				contentType: 'application/json',
				data: JSON.stringify({ rating, comment })
			})
			.done((response) => {
				showCartToast(existingUserReview ? 'Review updated successfully' : 'Review submitted successfully')
				$('#reviewModal').hide()
				loadReviews(productId)
				checkPurchaseStatus(productId)
			})
			.fail((xhr) => {
				const msg = xhr.responseJSON && xhr.responseJSON.message || 'Failed to submit review'
				showCartToast(msg)
			})
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
				window.currentProduct = product
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
				loadReviews(product.id)
				checkPurchaseStatus(product.id)
				updateAddToCartButtonState()
				setQty(1)

				$.ajax({ url: `${apiBase}/products`, method: 'GET' })
					.done((products) => {
						const list = Array.isArray(products) ? products.filter((item) => !item.is_deleted) : []
						renderRelatedProducts(list, product.id)
					})
					.fail(() => renderRelatedProducts([], product.id))
				
				applyFavorites()
			})
			.fail(() => {
				window.location.replace('/404')
			})
	}

	function encodeRadioFile(fileName) {
		return `/media/songs/radio/${encodeURIComponent(fileName)}`
	}

	function getRandomRadioIndex(excludeIndex) {
		if (!radioTracks.length) return -1
		if (radioTracks.length === 1) return 0

		let nextIndex = Math.floor(Math.random() * radioTracks.length)
		while (nextIndex === excludeIndex) {
			nextIndex = Math.floor(Math.random() * radioTracks.length)
		}
		return nextIndex
	}

	function showRadioAlert(reason, track) {
		const $alert = $('#radioAlert')
		const $label = $('#radioAlertLabel')
		const $title = $('#radioAlertTitle')
		const $meta = $('#radioAlertMeta')

		if (!$alert.length || !track) return
		$label.text(reason)
		$title.text(track.title)
		$meta.text(track.album)
		$alert.addClass('show')
		clearTimeout(showRadioAlert.timer)
		showRadioAlert.timer = setTimeout(() => {
			$alert.removeClass('show')
		}, 4200)
	}

	function playRadioTrack(nextIndex, reason) {
		const audio = document.getElementById('bg-audio')
		if (!audio || nextIndex < 0 || !radioTracks[nextIndex]) return

		currentRadioIndex = nextIndex
		const track = radioTracks[currentRadioIndex]
		audio.src = encodeRadioFile(track.file)
		audio.loop = false
		audio.load()
		showRadioAlert(reason, track)

		const playPromise = audio.play()
		if (playPromise && playPromise.catch) {
			playPromise.catch(() => setMuteState(true))
		}
	}

	function startRadio() {
		const nextIndex = getRandomRadioIndex(-1)
		playRadioTrack(nextIndex, 'Now Playing')
	}

	function playNextRadioTrack() {
		const nextIndex = getRandomRadioIndex(currentRadioIndex)
		playRadioTrack(nextIndex, 'Switching Tracks')
	}

	function setMuteState(muted) {
		const audio = document.getElementById('bg-audio')
		const muteBtn = document.getElementById('audioToggleBtn')
		const iconVolOn = document.getElementById('icon-vol-on')
		const iconVolOff = document.getElementById('icon-vol-off')

		if (!audio || !muteBtn) return
		audio.muted = muted
		muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false')
		if (iconVolOn) iconVolOn.style.display = muted ? 'none' : 'block'
		if (iconVolOff) iconVolOff.style.display = muted ? 'block' : 'none'
		localStorage.setItem('home-radio-muted', muted ? 'true' : 'false')
	}

	function setAudioVolume(value) {
		const audio = document.getElementById('bg-audio')
		const volumeValue = document.getElementById('volumeValue')
		if (!audio || !volumeValue) return

		audio.volume = value
		volumeValue.textContent = Math.round(value * 100) + '%'
		localStorage.setItem('home-radio-volume', audio.volume.toString())
	}

	function restoreAudioSettings() {
		const savedVolume = localStorage.getItem('home-radio-volume')
		if (savedVolume !== null) {
			setAudioVolume(savedVolume)
			const slider = document.getElementById('volumeSlider')
			if (slider) slider.value = savedVolume
		}

		const savedMuted = localStorage.getItem('home-radio-muted') === 'true'
		setMuteState(savedMuted)
	}

	$(document).on('click', '#audioToggleBtn', function() {
		const audio = document.getElementById('bg-audio')
		if (!audio) return
		const muted = !audio.muted
		setMuteState(muted)
		if (!muted) audio.play().catch(() => {})
	})

	$(document).on('input', '#volumeSlider', function(e) {
		setAudioVolume(e.target.value)
		if (document.getElementById('bg-audio').muted) {
			setMuteState(false)
		}
	})

	bindInteractions()
	loadProduct()
	loadFavorites()
	
	const radioAudio = document.getElementById('bg-audio')
	if (radioAudio) {
		radioAudio.addEventListener('ended', playNextRadioTrack)
	}
	
	restoreAudioSettings()
	startRadio()
})()
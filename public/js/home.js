$(function() {
	const storageKey = 'historey.session'
	const apiBase = '/api/v1'
	const fallbackImage = '/media/images/home_pg/landingmerch.png'
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
	let searchTimer = null

	function readSession() {
		const raw = localStorage.getItem(storageKey)
		if (!raw) return null
		try {
			return JSON.parse(raw)
		} catch (error) {
			return null
		}
	}

	function clearSession() {
		localStorage.removeItem(storageKey)
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

	function getPrimaryImage(product) {
		const images = Array.isArray(product.images) ? product.images : []
		const primary = images.find(image => image.is_primary) || images[0]
		return primary && primary.url ? primary.url : fallbackImage
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
	}

	function renderAuthActions(session) {
		const $actions = $('#authActions')
		$actions.empty()

		$actions.append(
			`<button type="button" class="cart-btn" id="cartButton" aria-label="Cart"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span>0</span></button>`
		)

		if (session && session.token) {
			const name = session.name || session.email || 'Customer'
			$actions.append(
				`<div class="account-dropdown"><button class="account-btn" id="accountDropdownBtn" type="button">${escapeHtml(name)}</button><div class="dropdown-content" id="accountDropdownMenu"><a href="/home">Account</a><a href="#" id="signOutLink">Sign Out</a></div></div>`
			)
		} else {
			$actions.append(`<a class="sign-in-btn" href="/login">Sign In</a>`)
		}

		$actions.append(
			`<button class="audio-btn" id="audioToggleBtn" type="button" aria-label="Toggle audio" aria-pressed="false"><svg id="icon-vol-on" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><svg id="icon-vol-off" style="display:none;" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line></svg></button>`
		)
	}

	function logoutCustomer() {
		const session = readSession()
		const request = session && session.token
			? $.ajax({
				url: `${apiBase}/auth/logout`,
				method: 'POST',
				headers: { Authorization: `Bearer ${session.token}` }
			})
			: $.Deferred().resolve()

		request.always(function() {
			clearSession()
			window.location.replace('/')
		})
	}

	function renderProducts(products) {
		const $grid = $('#productGrid')
		const $status = $('#productStatus')

		if (!products.length) {
			$grid.html(
				`<div class="product-card" style="grid-column:1/-1; text-align:center; min-height: 220px; justify-content:center;">
					<div class="product-image-placeholder" style="aspect-ratio:auto; min-height: 120px; background: linear-gradient(180deg, #b8ae95, #95866b); color:#fff; font-weight:600; letter-spacing:1px;">NO PRODUCTS AVAILABLE</div>
					<div class="product-info"><span class="product-title" style="animation:none;">Check back soon for new database products.</span></div>
				</div>`
			)
			$status.text('No active products found in the database.')
			return
		}

		$status.text(`Showing ${products.length} active product${products.length === 1 ? '' : 's'} from the database.`)
		$grid.html(products.map((product, index) => {
			const imageUrl = getPrimaryImage(product)
			const title = escapeHtml(product.name || 'Untitled product')
			const price = formatPrice(product.price)
			const imageAlt = escapeHtml(product.name || `Product ${index + 1}`)

			return `
				<article class="product-card" data-product-id="${product.id}">
					<a href="#" class="product-link" aria-label="${title}">
						<div class="product-image-placeholder">
							<img src="${escapeHtml(imageUrl)}" alt="${imageAlt}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}';">
						</div>
						<div class="product-info">
							<div class="title-marquee-container">
								<span class="product-title">${title}</span>
							</div>
							<span class="product-price">${price}</span>
						</div>
					</a>
					<div class="card-actions">
						<button class="add-to-cart-btn" type="button" data-product-id="${product.id}" ${product.is_deleted ? 'disabled' : ''}>Add to Cart</button>
						<button class="heart-btn" type="button" aria-label="Favorite item" data-product-id="${product.id}">
							<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
						</button>
					</div>
				</article>`
		}).join(''))
	}

	function loadProducts(query) {
		const params = {}
		const search = typeof query === 'string' ? query.trim() : ''
		if (search) params.q = search

		$('#productStatus').text(search ? `Searching for "${search}"...` : 'Loading products from the database...')

		return $.ajax({
			url: `${apiBase}/products`,
			method: 'GET',
			data: params
		}).done(function(response) {
			const products = Array.isArray(response) ? response.filter(product => !product.is_deleted) : []
			renderProducts(products)
		}).fail(function() {
			$('#productGrid').html('')
			$('#productStatus').text('Could not load products from the database right now.')
		})
	}

	function loadAuthState() {
		const session = readSession()
		if (!session || !session.token) {
			renderAuthActions(null)
			return
		}

		$.ajax({
			url: `${apiBase}/auth/me`,
			method: 'GET',
			headers: { Authorization: `Bearer ${session.token}` }
		}).done(function(response) {
			const updatedSession = {
				...session,
				name: response.user.name,
				email: response.user.email,
				role: response.user.role
			}
			localStorage.setItem(storageKey, JSON.stringify(updatedSession))
			renderAuthActions(updatedSession)
		}).fail(function() {
			clearSession()
			renderAuthActions(null)
		})
	}

	loadAuthState()
	startRadio()
	loadProducts()

	const radioAudio = document.getElementById('bg-audio')
	if (radioAudio) {
		radioAudio.addEventListener('ended', playNextRadioTrack)
	}

	$(document).on('click', '#audioToggleBtn', function() {
		const audio = document.getElementById('bg-audio')
		if (!audio) return

		if (audio.paused) {
			audio.play().catch(() => {})
		}

		const muted = !audio.muted
		setMuteState(muted)
		if (!muted && audio.paused) {
			audio.play().catch(() => {})
		}
		localStorage.setItem('landing-muted', muted ? 'true' : 'false')
	})

	$(document).on('input', '.search-input', function() {
		clearTimeout(searchTimer)
		const query = $(this).val()
		searchTimer = setTimeout(() => loadProducts(query), 250)
	})

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
		logoutCustomer()
	})

	$(document).on('click', '.heart-btn', function() {
		$(this).toggleClass('liked')
	})

	$(document).on('click', '.product-link', function(e) {
		e.preventDefault()
	})

	$(document).on('click', '.add-to-cart-btn', function() {
		const productId = $(this).data('product-id')
		window.alert(`Add to cart is ready for product ${productId}.`)
	})

	const mutedPref = localStorage.getItem('landing-muted')
	if (mutedPref === 'true') {
		setMuteState(true)
	}
})
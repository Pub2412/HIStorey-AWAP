$(function(){
	const storageKey = 'historey.session'
	const apiBase = '/api/v1'

	function readSession() {
		const raw = localStorage.getItem(storageKey)
		if (!raw) return null
		try {
			return JSON.parse(raw)
		} catch (error) {
			return null
		}
	}

	function saveSession(session) {
		localStorage.setItem(storageKey, JSON.stringify(session))
	}

	function clearSession() {
		localStorage.removeItem(storageKey)
	}

	function isAdminUser(session) {
		return !!(session && session.role === 'admin')
	}

	let isAdmin = false
	let table = null

	function renderAuthActions(session) {
		const $actions = $('#authActions')
		$actions.empty()

		if (session && session.token) {
			const name = session.name || session.email || 'User'
			$actions.append($('<span class="user-greeting">').text(name))
			$actions.append(
				`<button type="button" class="header-button primary" id="logoutButton">Log out</button>`
			)
			return
		}

		$actions.append(
			`<a class="header-button" href="/login">Sign In</a>` +
			`<a class="header-button primary" href="/register">Register</a>`
		)
	}

	function loadAuthState() {
		const session = readSession()
		if (!session || !session.token) {
			renderAuthActions(null)
			startApp(null)
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
			saveSession(updatedSession)
			renderAuthActions(updatedSession)
			if (updatedSession.role === 'admin') {
				window.location.href = '/admin'
				return
			}
			startApp(updatedSession)
		}).fail(function() {
			clearSession()
			renderAuthActions(null)
			startApp(null)
		})
	}

	$('#authActions').on('click', '#logoutButton', function() {
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
			renderAuthActions(null)
			if (typeof resetProductsTable === 'function') {
				resetProductsTable(null)
			}
			window.location.replace('/login?logout=1')
		})
	})

	loadAuthState()

	function updateAdminUI() {
		$('#addProduct').toggle(isAdmin)
		$('#productsTable thead th').last().toggle(isAdmin)
	}

	function initProductsTable() {
		const columns = [
			{ data: 'id' },
			{ data: 'name' },
			{ data: 'price' }
		]

		if (isAdmin) {
			columns.push({
				data: null,
				orderable: false,
				render: (row) =>
					`<button class="edit" data-id="${row.id}">Edit</button> ` +
					`<button class="del" data-id="${row.id}">Delete</button>`
			})
		}

		table = $('#productsTable').DataTable({ columns })
	}

	function loadProducts() {
		if (!table) return
		$.get('/api/v1/products', function(data) {
			table.clear()
			table.rows.add(data)
			table.draw()
		})
	}

	function resetProductsTable(session) {
		isAdmin = isAdminUser(session)
		updateAdminUI()
		if (table) {
			table.destroy()
			table = null
			$('#productsTable tbody').empty()
		}
		initProductsTable()
		loadProducts()
	}

	function startApp(session) {
		resetProductsTable(session)
	}

	// Autocomplete
	let timer = null
	$('#search').on('input', function(){
		clearTimeout(timer)
		const q = $(this).val()
		if (!q) { $('#suggestions').empty(); return }
		timer = setTimeout(() => {
			$.get('/api/v1/products', { q }, function(data){
				const html = data.slice(0,10).map(p => `<div>${p.name} - ${p.price}</div>`).join('')
				$('#suggestions').html(html)
			})
		}, 200)
	})

	$('#addProduct').on('click', function() {
		const name = prompt('Name')
		const price = prompt('Price')
		if (!name) return alert('name required')
		// default header requires admin role
		$.ajax({ url: '/api/v1/products', method: 'POST', headers: { 'x-user-role': 'admin' }, contentType: 'application/json', data: JSON.stringify({ name, price }) }).done(loadProducts).fail((xhr)=>alert(xhr.responseJSON?.message || 'error'))
	})

	$('#productsTable').on('click', '.del', function(){
		const id = $(this).data('id')
		if (!confirm('Delete?')) return
		$.ajax({ url: `/api/v1/products/${id}`, method: 'DELETE', headers: { 'x-user-role': 'admin' } }).done(loadProducts).fail(e=>alert('error'))
	})

	$('#productsTable').on('click', '.edit', function(){
		const id = $(this).data('id')
		const name = prompt('New name')
		const price = prompt('New price')
		if (!name) return
		$.ajax({ url: `/api/v1/products/${id}`, method: 'PUT', headers: { 'x-user-role': 'admin' }, contentType: 'application/json', data: JSON.stringify({ name, price }) }).done(loadProducts).fail(e=>alert('error'))
	})

	// Transactions create
	$('#txForm').on('submit', function(e){
		e.preventDefault()
		const data = { email: $(this).find('[name=email]').val(), total: Number($(this).find('[name=total]').val()), items: [] }
		$.ajax({ url: '/api/v1/transactions', method: 'POST', contentType: 'application/json', data: JSON.stringify(data) }).done(function(tx){
			$('#txResult').text('Created transaction id: ' + tx.id)
		}).fail(()=>alert('error'))
	})
})

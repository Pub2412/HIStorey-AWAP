(function() {
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

	function clearSession() {
		localStorage.removeItem(storageKey)
	}

	function redirectToNotFound() {
		window.location.replace('/404')
	}

	const session = readSession()
	if (!session || !session.token || String(session.role).toLowerCase() !== 'admin') {
		redirectToNotFound()
		return
	}

	function logoutAdmin() {
		const request = $.ajax({
			url: `${apiBase}/auth/logout`,
			method: 'POST',
			headers: { Authorization: `Bearer ${session.token}` }
		})

		request.always(function() {
			clearSession()
			window.location.replace('/')
		})
	}

	$(document).on('click', '[data-admin-logout]', function(event) {
		event.preventDefault()
		logoutAdmin()
	})
})()
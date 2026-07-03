$(function() {
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

	function logoutAdmin() {
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

	$(document).on('click', '[data-admin-logout]', function(event) {
		event.preventDefault()
		logoutAdmin()
	})
})
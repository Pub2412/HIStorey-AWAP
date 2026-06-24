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

	function saveSession(session) {
		localStorage.setItem(storageKey, JSON.stringify(session))
	}

	function clearSession() {
		localStorage.removeItem(storageKey)
	}

	function setAlert(message, type) {
		$('#authAlert')
			.removeClass('is-error is-success')
			.addClass(type === 'success' ? 'is-success' : 'is-error')
			.text(message)
	}

	function setActiveForm(targetId) {
		$('.tab-button').removeClass('active')
		$('.auth-form').removeClass('active')
		$(`.tab-button[data-target="${targetId}"]`).addClass('active')
		$(`#${targetId}`).addClass('active')
	}

	function setPasswordVisibility($button, show) {
		const $input = $button.closest('.input-row').find('input')
		$input.attr('type', show ? 'text' : 'password')
		$button.text(show ? 'Hide' : 'Show')
	}

	function renderSession(session) {
		if (!session) {
			$('#sessionView').addClass('hidden')
			$('#loginForm, #registerForm').removeClass('hidden')
			return
		}

		$('#sessionTitle').text(`Welcome, ${session.name}`)
		$('#sessionEmail').text(session.email)
		$('#sessionMode').text(session.mode === 'register' ? 'Account created just now' : 'Active session')
		$('#loginForm, #registerForm').addClass('hidden')
		$('#sessionView').removeClass('hidden')
		setAlert(`Signed in successfully as ${session.email}.`, 'success')
	}

	function setSubmitting($form, isSubmitting) {
		const $button = $form.find('button[type="submit"]')
		$button.prop('disabled', isSubmitting)
		if (isSubmitting) {
			$button.data('original-text', $button.text())
			$button.text('Please wait...')
		} else if ($button.data('original-text')) {
			$button.text($button.data('original-text'))
		}
	}

	function handleAuthResponse(response, mode, redirectTo) {
		const session = {
			id: response.user.id,
			name: response.user.name,
			email: response.user.email,
			role: response.user.role,
			token: response.token,
			mode,
			loggedInAt: new Date().toISOString()
		}
		saveSession(session)

		if (redirectTo) {
			window.location.href = redirectTo
			return
		}

		renderSession(session)
	}

	function loadSession() {
		const session = readSession()
		if (!session || !session.token) {
			renderSession(null)
			return
		}

		$.ajax({
			url: `${apiBase}/auth/me`,
			method: 'GET',
			headers: { Authorization: `Bearer ${session.token}` }
		}).done(function(response) {
			saveSession({
				...session,
				id: response.user.id,
				name: response.user.name,
				email: response.user.email,
				role: response.user.role
			})
			window.location.href = '/'
		}).fail(function() {
			clearSession()
			renderSession(null)
		})
	}

	loadSession()

	$('.tab-button').on('click', function() {
		setActiveForm($(this).data('target'))
	})

	$('.toggle-password').on('click', function() {
		const $input = $(this).closest('.input-row').find('input')
		const isHidden = $input.attr('type') === 'password'
		setPasswordVisibility($(this), isHidden)
	})

	$('#loginForm').on('submit', function(event) {
		event.preventDefault()
		const $form = $(this)
		const email = $.trim($form.find('[name="email"]').val())
		const password = $form.find('[name="password"]').val()

		setSubmitting($form, true)

		$.ajax({
			url: `${apiBase}/auth/login`,
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ email, password })
		}).done(function(response) {
			handleAuthResponse(response, 'login', '/')
		}).fail(function(xhr) {
			const message = xhr.responseJSON && xhr.responseJSON.message
				? xhr.responseJSON.message
				: 'Could not sign in. Please try again.'
			setAlert(message, 'error')
		}).always(function() {
			setSubmitting($form, false)
		})
	})

	$('#registerForm').on('submit', function(event) {
		event.preventDefault()
		const $form = $(this)
		const name = $.trim($form.find('[name="name"]').val())
		const email = $.trim($form.find('[name="email"]').val())
		const password = $form.find('[name="password"]').val()
		const confirmPassword = $form.find('[name="confirmPassword"]').val()
		const termsAccepted = $form.find('[name="terms"]').is(':checked')

		if (name.length < 2) {
			setAlert('Enter a valid name to create your account.', 'error')
			return
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setAlert('Enter a valid email address.', 'error')
			return
		}

		if (password.length < 8) {
			setAlert('Password must be at least 8 characters long.', 'error')
			return
		}

		if (password !== confirmPassword) {
			setAlert('Passwords do not match.', 'error')
			return
		}

		if (!termsAccepted) {
			setAlert('Please agree to the terms before continuing.', 'error')
			return
		}

		setSubmitting($form, true)

		$.ajax({
			url: `${apiBase}/auth/register`,
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ name, email, password })
		}).done(function(response) {
			handleAuthResponse(response, 'register')
		}).fail(function(xhr) {
			const message = xhr.responseJSON && xhr.responseJSON.message
				? xhr.responseJSON.message
				: 'Could not create account. Please try again.'
			setAlert(message, 'error')
		}).always(function() {
			setSubmitting($form, false)
		})
	})

	$('#logoutButton').on('click', function() {
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
			$('#loginForm').trigger('reset')
			$('#registerForm').trigger('reset')
			$('#loginForm, #registerForm').removeClass('hidden')
			$('#sessionView').addClass('hidden')
			setActiveForm('loginForm')
			setAlert('You have been signed out.', 'success')
		})
	})

	if (!readSession()) {
		setActiveForm('loginForm')
	}
})

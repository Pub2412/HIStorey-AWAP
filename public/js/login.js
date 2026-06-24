$(function() {
	const storageKeys = {
		users: 'historey.mockUsers',
		session: 'historey.session'
	}

	const demoUser = {
		id: 1,
		name: 'Demo User',
		email: 'demo@historey.com',
		password: 'Demo@1234'
	}

	function seedUsers() {
		localStorage.setItem(storageKeys.users, JSON.stringify([demoUser]))
		return [demoUser]
	}

	function readUsers() {
		const raw = localStorage.getItem(storageKeys.users)
		if (!raw) {
			return seedUsers()
		}

		try {
			const users = JSON.parse(raw)
			if (!Array.isArray(users) || !users.length) {
				return seedUsers()
			}
			return users
		} catch (error) {
			return seedUsers()
		}
	}

	function saveUsers(users) {
		localStorage.setItem(storageKeys.users, JSON.stringify(users))
	}

	function readSession() {
		const raw = localStorage.getItem(storageKeys.session)
		if (!raw) return null
		try {
			return JSON.parse(raw)
		} catch (error) {
			return null
		}
	}

	function saveSession(session) {
		localStorage.setItem(storageKeys.session, JSON.stringify(session))
	}

	function clearSession() {
		localStorage.removeItem(storageKeys.session)
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

	readUsers()
	renderSession(readSession())

	$('.tab-button').on('click', function() {
		setActiveForm($(this).data('target'))
	})

	$('.toggle-password').on('click', function() {
		const $input = $(this).closest('.input-row').find('input')
		const isHidden = $input.attr('type') === 'password'
		setPasswordVisibility($(this), isHidden)
	})

	$('#fillDemoLogin').on('click', function() {
		setActiveForm('loginForm')
		$('#loginForm [name="email"]').val(demoUser.email)
		$('#loginForm [name="password"]').val(demoUser.password)
		setAlert('Demo credentials loaded. Submit the login form to continue.', 'success')
	})

	$('#loginForm').on('submit', function(event) {
		event.preventDefault()
		const email = $.trim($(this).find('[name="email"]').val())
		const password = $(this).find('[name="password"]').val()
		const users = readUsers()
		const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())

		if (!user) {
			setAlert('No account matches that email address.', 'error')
			return
		}

		if (user.password !== password) {
			setAlert('Password is incorrect. Try the demo account or register a new one.', 'error')
			return
		}

		saveSession({
			id: user.id,
			name: user.name,
			email: user.email,
			mode: 'login',
			loggedInAt: new Date().toISOString()
		})
		renderSession(readSession())
	})

	$('#registerForm').on('submit', function(event) {
		event.preventDefault()
		const name = $.trim($(this).find('[name="name"]').val())
		const email = $.trim($(this).find('[name="email"]').val())
		const password = $(this).find('[name="password"]').val()
		const confirmPassword = $(this).find('[name="confirmPassword"]').val()
		const termsAccepted = $(this).find('[name="terms"]').is(':checked')
		const users = readUsers()

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
			setAlert('Please agree to the demo terms before continuing.', 'error')
			return
		}

		if (users.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) {
			setAlert('An account already exists for that email address.', 'error')
			return
		}

		const nextUser = {
			id: users.length ? Math.max(...users.map((entry) => entry.id || 0)) + 1 : 1,
			name,
			email,
			password
		}

		const nextUsers = [...users, nextUser]
		saveUsers(nextUsers)
		saveSession({
			id: nextUser.id,
			name: nextUser.name,
			email: nextUser.email,
			mode: 'register',
			loggedInAt: new Date().toISOString()
		})
		renderSession(readSession())
	})

	$('#logoutButton').on('click', function() {
		clearSession()
		$('#loginForm').trigger('reset')
		$('#registerForm').trigger('reset')
		$('#loginForm, #registerForm').removeClass('hidden')
		$('#sessionView').addClass('hidden')
		setActiveForm('loginForm')
		setAlert('You have been signed out.', 'success')
	})

	$('#resetDemoButton').on('click', function() {
		seedUsers()
		clearSession()
		$('#loginForm').trigger('reset')
		$('#registerForm').trigger('reset')
		$('#loginForm, #registerForm').removeClass('hidden')
		$('#sessionView').addClass('hidden')
		setActiveForm('loginForm')
		setAlert('Demo users were reset. The demo account is available again.', 'success')
	})

	if (!readSession()) {
		setActiveForm('loginForm')
	}
})
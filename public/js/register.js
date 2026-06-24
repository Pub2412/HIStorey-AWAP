$(function() {
	const storageKeys = {
		users: 'historey.mockUsers'
	}

	const sampleUser = {
		name: 'Demo User',
		email: 'demo@historey.com',
		password: 'Demo@1234'
	}

	function readUsers() {
		const raw = localStorage.getItem(storageKeys.users)
		if (!raw) {
			return []
		}

		try {
			const users = JSON.parse(raw)
			return Array.isArray(users) ? users : []
		} catch (error) {
			return []
		}
	}

	function saveUsers(users) {
		localStorage.setItem(storageKeys.users, JSON.stringify(users))
	}

	function setAlert(message, type) {
		$('#registerAlert')
			.removeClass('is-error is-success')
			.addClass(type === 'success' ? 'is-success' : 'is-error')
			.text(message)
	}

	function togglePassword($button, show) {
		const $input = $button.closest('.input-row').find('input')
		$input.attr('type', show ? 'text' : 'password')
		$button.text(show ? 'Hide' : 'Show')
	}

	$('.toggle-password').on('click', function() {
		const $input = $(this).closest('.input-row').find('input')
		const isHidden = $input.attr('type') === 'password'
		togglePassword($(this), isHidden)
	})

	$('#fillDemoRegister').on('click', function() {
		$('#registerForm [name="name"]').val(sampleUser.name)
		$('#registerForm [name="email"]').val(sampleUser.email)
		$('#registerForm [name="password"]').val(sampleUser.password)
		$('#registerForm [name="confirmPassword"]').val(sampleUser.password)
		$('#registerForm [name="terms"]').prop('checked', true)
		setAlert('Sample values loaded. Submit the form to create the account.', 'success')
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
			setAlert('Enter a valid name.', 'error')
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
			setAlert('You must agree to the terms to continue.', 'error')
			return
		}

		if (users.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) {
			setAlert('An account already exists for that email address.', 'error')
			return
		}

		const nextUsers = [...users, {
			id: users.length ? Math.max(...users.map((entry) => entry.id || 0)) + 1 : 1,
			name,
			email,
			password
		}]

		saveUsers(nextUsers)
		$('#registerForm').trigger('reset')
		$('#registerForm').addClass('hidden')
		$('#successEmail').text(email)
		$('#successTitle').text(`Account created for ${name}`)
		$('#successView').removeClass('hidden')
		setAlert('Account created successfully. You can sign in now.', 'success')
	})
})
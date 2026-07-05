$(function() {
	const apiBase = '/api/v1'

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

	$('.toggle-password').on('click', function() {
		const $input = $(this).closest('.input-row').find('input')
		const isHidden = $input.attr('type') === 'password'
		togglePassword($(this), isHidden)
	})

	initRegisterValidator('#registerForm', function(form) {
		const $form = $(form)
		const name = $.trim($form.find('[name="name"]').val())
		const email = $.trim($form.find('[name="email"]').val())
		const password = $form.find('[name="password"]').val()
		const phone = $.trim($form.find('[name="phone"]').val())
		const address = $.trim($form.find('[name="address"]').val())
		const fileInput = $form.find('[name="profile_photo"]')[0]
		const formData = new FormData()
		formData.append('name', name)
		formData.append('email', email)
		formData.append('password', password)
		if (phone) formData.append('phone', phone)
		if (address) formData.append('address', address)
		if (fileInput && fileInput.files && fileInput.files[0]) formData.append('profile_photo', fileInput.files[0])

		setSubmitting($form, true)

		$.ajax({
			url: `${apiBase}/auth/register`,
			method: 'POST',
			processData: false,
			contentType: false,
			data: formData
		}).done(function() {
			$form.trigger('reset')
			$form.addClass('hidden')
			$('#successEmail').text(email)
			$('#successTitle').text(`Account created for ${name}`)
			$('#successView').removeClass('hidden')
			setAlert('Account created successfully. You can sign in now.', 'success')
		}).fail(function(xhr) {
			const message = xhr.responseJSON && xhr.responseJSON.message
				? xhr.responseJSON.message
				: 'Could not create account. Please try again.'
			setAlert(message, 'error')
		}).always(function() {
			setSubmitting($form, false)
		})
	})
})

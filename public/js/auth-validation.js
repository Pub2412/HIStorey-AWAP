$(function() {
	$.validator.setDefaults({
		errorClass: 'field-error',
		validClass: 'field-valid',
		errorElement: 'span',
		errorPlacement: function(error, element) {
			if (element.attr('type') === 'checkbox') {
				error.insertAfter(element.closest('label'))
				return
			}

			const $row = element.closest('.input-row')
			if ($row.length) {
				error.insertAfter($row)
				return
			}

			error.insertAfter(element)
		},
		highlight: function(element) {
			$(element).addClass('input-error')
		},
		unhighlight: function(element) {
			$(element).removeClass('input-error')
		}
	})

	const registerRules = {
		name: {
			required: true,
			minlength: 2
		},
		email: {
			required: true,
			email: true
		},
		password: {
			required: true,
			minlength: 8
		},
		confirmPassword: {
			required: true,
			equalTo: "#registerForm [name='password']"
		},
		terms: {
			required: true
		}
	}

	const registerMessages = {
		name: {
			required: 'Enter your full name.',
			minlength: 'Enter a valid name.'
		},
		email: {
			required: 'Enter your email address.',
			email: 'Enter a valid email address.'
		},
		password: {
			required: 'Enter a password.',
			minlength: 'Password must be at least 8 characters long.'
		},
		confirmPassword: {
			required: 'Confirm your password.',
			equalTo: 'Passwords do not match.'
		},
		terms: {
			required: 'You must agree to the terms to continue.'
		}
	}

	window.initLoginValidator = function(submitHandler) {
		return $('#loginForm').validate({
			rules: {
				email: {
					required: true,
					email: true
				},
				password: {
					required: true,
					minlength: 8
				}
			},
			messages: {
				email: {
					required: 'Enter your email address.',
					email: 'Enter a valid email address.'
				},
				password: {
					required: 'Enter your password.',
					minlength: 'Password must be at least 8 characters long.'
				}
			},
			submitHandler
		})
	}

	window.initRegisterValidator = function(formSelector, submitHandler) {
		return $(formSelector).validate({
			rules: registerRules,
			messages: registerMessages,
			submitHandler
		})
	}
})

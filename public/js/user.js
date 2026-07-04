let users = []
let usersTable = null

function showToast(message) {
  $('.toast').remove()
  $('body').append(`<div class="toast">${message}</div>`)
  setTimeout(() => $('.toast').fadeOut(250), 1800)
}

function getSessionHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
    return session && session.token ? { Authorization: `Bearer ${session.token}` } : {}
  } catch (error) {
    return {}
  }
}

function renderUsers(filter = '') {
  const term = filter.toLowerCase()
  const filtered = users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term))
  initUsersTable()
  usersTable.clear().rows.add(filtered).draw()
}

function renderUserActions(user) {
  return `
    <div class="actions">
      <button class="action-btn toggle toggle-user" data-id="${user.id}">${user.is_active !== false ? 'Deactivate' : 'Activate'}</button>
    </div>
  `
}

function initUsersTable() {
  if (usersTable) return usersTable

  usersTable = $('#usersTable').DataTable({
    data: [],
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'email' },
      {
        data: 'role',
        render: function(data, type) {
          const role = String(data || 'customer').toUpperCase()
          return type === 'display' ? role : role
        }
      },
      {
        data: 'is_active',
        render: function(data, type) {
          const active = data !== false
          if (type !== 'display') return active ? 1 : 0
          return `<span class="pill ${active ? 'active' : 'suspended'}">${active ? 'Active' : 'Suspended'}</span>`
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') return ''
          return renderUserActions(row)
        }
      }
    ],
    paging: true,
    lengthChange: true,
    searching: false,
    info: true,
    autoWidth: false,
    scrollX: true,
    order: [[0, 'desc']],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    language: {
      emptyTable: 'No users matched this search.'
    },
    dom: 'rt<"dt-footer"lip>'
  })

  return usersTable
}

function openUserModal() {
  $('#userModal').removeClass('hidden')
  if ($('#addUserForm').data('validator')) {
    $('#addUserForm').validate().resetForm()
  }
  $('#addUserForm').find('.input-error').removeClass('input-error')
  $('#userName').focus()
}

function closeUserModal() {
  $('#userModal').addClass('hidden')
  $('#addUserForm')[0].reset()
  if ($('#addUserForm').data('validator')) {
    $('#addUserForm').validate().resetForm()
  }
  $('#addUserForm').find('.input-error').removeClass('input-error')
}

function loadUsers() {
  $.ajax({ url: '/api/v1/users', method: 'GET', headers: getSessionHeaders() })
    .done((data) => {
      users = Array.isArray(data) ? data : []
      renderUsers($('#userSearch').val())
    })
    .fail((xhr) => {
      users = []
      renderUsers($('#userSearch').val())
      showToast(xhr.responseJSON?.message || 'Unable to load users from the database.')
    })
}

function initUserValidator() {
  return $('#addUserForm').validate({
    rules: {
      userName: {
        required: true,
        minlength: 2
      },
      userEmail: {
        required: true,
        email: true
      },
      userPassword: {
        required: true,
        minlength: 8
      }
    },
    messages: {
      userName: {
        required: 'Enter a name.',
        minlength: 'Name must be at least 2 characters long.'
      },
      userEmail: {
        required: 'Enter an email address.',
        email: 'Enter a valid email address.'
      },
      userPassword: {
        required: 'Enter a temporary password.',
        minlength: 'Password must be at least 8 characters long.'
      }
    },
    errorClass: 'field-error',
    errorElement: 'span',
    highlight: function(element) {
      $(element).addClass('input-error')
    },
    unhighlight: function(element) {
      $(element).removeClass('input-error')
    },
    errorPlacement: function(error, element) {
      error.insertAfter(element)
    }
  })
}

$(function () {
  initUserValidator()
  initUsersTable()
  loadUsers()

  $('#openUserModal').on('click', openUserModal)
  $('#cancelUserModal').on('click', closeUserModal)
  $('#userModal').on('click', function (event) {
    if (event.target.id === 'userModal') closeUserModal()
  })

  $('#userSearch').on('input', function () {
    renderUsers($(this).val())
  })

  $('#addUserForm').on('submit', function (event) {
    event.preventDefault()
    if (!$(this).valid()) return

    const payload = {
      name: $('#userName').val().trim(),
      email: $('#userEmail').val().trim(),
      password: $('#userPassword').val(),
      role: 'admin'
    }

    $.ajax({
      url: '/api/v1/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      headers: getSessionHeaders()
    }).done(() => {
      closeUserModal()
      showToast('Admin account created')
      loadUsers()
    }).fail((xhr) => {
      showToast(xhr.responseJSON?.message || 'Could not create admin account.')
    })
  })

  $('#usersTable tbody').on('click', '.toggle-user', function () {
    const id = Number($(this).data('id'))
    const user = users.find((item) => Number(item.id) === id)
    if (!user) return

    const endpoint = user.is_active !== false ? `/api/v1/users/${id}/deactivate` : `/api/v1/users/${id}/reactivate`
    $.ajax({ url: endpoint, method: 'PATCH', headers: getSessionHeaders() })
      .done(() => {
        showToast(`${user.name} ${user.is_active !== false ? 'deactivated' : 'reactivated'}`)
        loadUsers()
      })
      .fail(() => {
        showToast('Could not update user status.')
      })
  })
})

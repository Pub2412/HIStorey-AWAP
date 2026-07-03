let users = []

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
  const rows = users
    .filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term))
    .map((user) => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${String(user.role || 'customer').toUpperCase()}</td>
        <td><span class="pill ${user.is_active !== false ? 'active' : 'suspended'}">${user.is_active !== false ? 'Active' : 'Suspended'}</span></td>
        <td>
          <div class="actions">
            <button class="action-btn toggle toggle-user" data-id="${user.id}">${user.is_active !== false ? 'Deactivate' : 'Activate'}</button>
          </div>
        </td>
      </tr>
    `)
    .join('')

  $('#usersBody').html(rows || '<tr><td colspan="6">No users matched this search.</td></tr>')
}

function openUserModal() {
  $('#userModal').removeClass('hidden')
  $('#userName').focus()
}

function closeUserModal() {
  $('#userModal').addClass('hidden')
  $('#addUserForm')[0].reset()
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

$(function () {
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

  $('#usersBody').on('click', '.toggle-user', function () {
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

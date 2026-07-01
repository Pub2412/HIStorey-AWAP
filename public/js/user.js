function getToken() {
    const session = JSON.parse(localStorage.getItem("historey.session") || "null");
    return session?.token;
}

function changeRole(id, role) {
    $.ajax({
        url: `/api/v1/users/${id}/role`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
        contentType: 'application/json',
        data: JSON.stringify({ role }),
        success: function () {
            $('#userTable').DataTable().ajax.reload(null, false);
            showToast('Role updated', 'success');
        },
        error: function (xhr) {
            showToast(xhr.responseJSON?.message || 'Something went wrong', 'error');
        }
    });
}

function showToast(message, type = 'info') {
    let $toast = $('#toast');
    if (!$toast.length) {
        $('body').append('<div id="toast" style="position:fixed;bottom:20px;right:20px;padding:12px 16px;border-radius:6px;color:white;font-family:sans-serif;display:none;z-index:9999"></div>');
        $toast = $('#toast');
    }
    $toast.text(message).css('background', type === 'error' ? '#e74c3c' : '#2ecc71').fadeIn(200);
    setTimeout(() => $toast.fadeOut(300), 2500);
}

function deactivateUser(id) {
    $.ajax({
        url: `/api/v1/users/${id}/deactivate`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
        success: function () {
            $('#userTable').DataTable().ajax.reload(null, false);
            showToast('User deactivated', 'success');
        }
    })
}

function reactivateUser(id) {
    $.ajax({
        url: `/api/v1/users/${id}/reactivate`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
        success: function () {
            $('#userTable').DataTable().ajax.reload(null, false);
            showToast('User reactivated', 'success');
        }
    })
}

$(document).ready(function () {
    $('#userTable').DataTable({
        ajax: {
            url: '/api/v1/users',
            dataSrc: '',
            headers: { Authorization: `Bearer ${getToken()}` }
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' },
            {
                data: 'role',
                render: function (data, type, row) {
                    return `
                        <select onchange="changeRole(${row.id}, this.value)">
                            <option value="customer" ${data === 'customer' ? 'selected' : ''}>Customer</option>
                            <option value="admin" ${data === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    `
                }
            },
            { data: 'phone' },
            {
                data: 'is_active',
                render: d => d ? '<span style="color:green;">Active</span>' : '<span style="color:red;">Inactive</span>'
            },
            {
                data: 'created_at',
                render: d => new Date(d).toLocaleDateString()
            },
            {
                data: null,
                render: function (data) {
                    return data.is_active
                        ? `<button onclick="deactivateUser(${data.id})">Deactivate</button>`
                        : `<button onclick="reactivateUser(${data.id})">Reactivate</button>`
                }
            }
        ]
    })

    $('#toggleUserForm').on('click', function () {
        $('#userForm').toggleClass('hidden')
        if (!$('#userForm').hasClass('hidden')) {
            $('#userForm')[0].reset()
            $('#userName').focus()
        }
    })

    $('#userForm').on('submit', function (e) {
        e.preventDefault()
        $.ajax({
            url: '/api/v1/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: $('#userName').val(),
                email: $('#userEmail').val(),
                password: $('#userPassword').val(),
                role: $('#userRole').val()
            })
        }).done(() => {
            showToast('User created', 'success')
            $('#userForm').addClass('hidden')
            $('#userForm')[0].reset()
            $('#userTable').DataTable().ajax.reload(null, false)
        }).fail((xhr) => showToast(xhr.responseJSON?.message || 'Could not create user', 'error'))
    })
});
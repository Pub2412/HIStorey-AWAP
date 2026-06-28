function getToken() {
    const session = JSON.parse(localStorage.getItem("historey.session"));
    return session?.token;
}

function changeRole(id, role) {
    $.ajax({
        url: `/api/v1/users/${id}/role`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${getToken()}`
        },
        contentType: 'application/json',
        data: JSON.stringify({ role }),

        success: function () {
            const table = $('#userTable').DataTable();
            table.ajax.reload(null, false);
        },

        error: function (xhr) {
            const message = xhr.responseJSON?.message || "Something went wrong";

            showToast(message, "error");
        }
    });
}

function showToast(message, type = "info") {
    let $toast = $('#toast');

    if (!$toast.length) {
        $('body').append(`
            <div id="toast" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 16px;
                border-radius: 6px;
                color: white;
                font-family: sans-serif;
                display: none;
                z-index: 9999;
            "></div>
        `);

        $toast = $('#toast');
    }

    $toast
        .text(message)
        .css("background", type === "error" ? "#e74c3c" : "#2ecc71")
        .fadeIn(200);

    setTimeout(() => {
        $toast.fadeOut(300);
    }, 2500);
}

function deactivateUser(id) {
    $.ajax({
        url: `/api/v1/users/${id}/deactivate`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${getToken()}`
        },
        success: function () {
            $('#userTable').DataTable().ajax.reload(null, false)
        }
    })
}

function reactivateUser(id) {
    $.ajax({
        url: `/api/v1/users/${id}/reactivate`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${getToken()}`
        },
        success: function () {
            $('#userTable').DataTable().ajax.reload(null, false)
        }
    })
}
$(document).ready(function () {

    $('#userTable').DataTable({
    ajax: {
        url: '/api/v1/users',
        dataSrc: '',
        headers: {
             Authorization: `Bearer ${getToken()}`
        }
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
                        <option value="customer" ${data === 'customer' ? 'selected' : ''}>
                            Customer
                        </option>
                        <option value="admin" ${data === 'admin' ? 'selected' : ''}>
                            Admin
                        </option>
                    </select>
                `
            }
        },
        { data: 'phone' },
        {
            data: 'is_active',
            render: d => d
                ? '<span style="color:green;">Active</span>'
                : '<span style="color:red;">Inactive</span>'
        },
        {
            data: 'created_at',
            render: d => new Date(d).toLocaleDateString()
        },
        {
            data: null,
            render: function (data) {

                if (data.is_active) {
                    return `
                        <button onclick="deactivateUser(${data.id})">
                            Deactivate
                        </button>
                    `
                } else {
                    return `
                        <button onclick="reactivateUser(${data.id})">
                            Reactivate
                        </button>
                    `
                }
            }
        }
    ]
});

});
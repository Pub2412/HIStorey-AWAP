function getToken() {
  const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
  return session?.token
}

$(function () {
  $('#ordersTable').DataTable({
    ajax: {
      url: '/api/v1/transactions',
      dataSrc: '',
      headers: { Authorization: `Bearer ${getToken()}` }
    },
    columns: [
      { data: 'id' },
      { data: 'email' },
      { data: 'total' },
      { data: 'status' },
      { data: 'updatedAt', render: (value) => new Date(value).toLocaleString() }
    ]
  })
})

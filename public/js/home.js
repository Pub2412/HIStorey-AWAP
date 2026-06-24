$(function(){
	// Autocomplete
	let timer = null
	$('#search').on('input', function(){
		clearTimeout(timer)
		const q = $(this).val()
		if (!q) { $('#suggestions').empty(); return }
		timer = setTimeout(() => {
			$.get('/api/v1/products', { q }, function(data){
				const html = data.slice(0,10).map(p => `<div>${p.name} - ${p.price}</div>`).join('')
				$('#suggestions').html(html)
			})
		}, 200)
	})

	// DataTable for products
	const table = $('#productsTable').DataTable({
		columns: [
			{ data: 'id' },
			{ data: 'name' },
			{ data: 'price' },
			{ data: null, orderable: false, render: (v) => `<button class="edit" data-id="${v.id}">Edit</button> <button class="del" data-id="${v.id}">Delete</button>` }
		]
	})

	function loadProducts(){
		$.get('/api/v1/products', function(data){ table.clear(); table.rows.add(data); table.draw(); })
	}
	loadProducts()

	$('#addProduct').on('click', function(){
		const name = prompt('Name')
		const price = prompt('Price')
		if (!name) return alert('name required')
		// default header requires admin role
		$.ajax({ url: '/api/v1/products', method: 'POST', headers: { 'x-user-role': 'admin' }, contentType: 'application/json', data: JSON.stringify({ name, price }) }).done(loadProducts).fail((xhr)=>alert(xhr.responseJSON?.message || 'error'))
	})

	$('#productsTable').on('click', '.del', function(){
		const id = $(this).data('id')
		if (!confirm('Delete?')) return
		$.ajax({ url: `/api/v1/products/${id}`, method: 'DELETE', headers: { 'x-user-role': 'admin' } }).done(loadProducts).fail(e=>alert('error'))
	})

	$('#productsTable').on('click', '.edit', function(){
		const id = $(this).data('id')
		const name = prompt('New name')
		const price = prompt('New price')
		if (!name) return
		$.ajax({ url: `/api/v1/products/${id}`, method: 'PUT', headers: { 'x-user-role': 'admin' }, contentType: 'application/json', data: JSON.stringify({ name, price }) }).done(loadProducts).fail(e=>alert('error'))
	})

	// Transactions create
	$('#txForm').on('submit', function(e){
		e.preventDefault()
		const data = { email: $(this).find('[name=email]').val(), total: Number($(this).find('[name=total]').val()), items: [] }
		$.ajax({ url: '/api/v1/transactions', method: 'POST', contentType: 'application/json', data: JSON.stringify(data) }).done(function(tx){
			$('#txResult').text('Created transaction id: ' + tx.id)
		}).fail(()=>alert('error'))
	})
})

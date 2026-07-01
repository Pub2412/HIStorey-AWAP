function getToken() {
  const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
  return session?.token
}

function showMessage(message, isError) {
  const existing = $('#adminToast')
  if (existing.length) existing.remove()
  $('body').append(`<div id="adminToast" style="position:fixed;right:16px;bottom:16px;padding:12px 16px;border-radius:8px;color:#fff;background:${isError ? '#c0392b' : '#2e7d32'};z-index:9999">${message}</div>`)
  setTimeout(() => $('#adminToast').fadeOut(300), 2000)
}

function loadProducts() {
  const table = $('#productsTable').DataTable()
  table.ajax.reload(null, false)
}

function deactivateProduct(id) {
  $.ajax({
    url: `/api/v1/products/${id}/deactivate`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` }
  }).done(() => {
    showMessage('Product deactivated', false)
    loadProducts()
  }).fail(() => showMessage('Could not deactivate product', true))
}

function reactivateProduct(id) {
  $.ajax({
    url: `/api/v1/products/${id}/reactivate`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` }
  }).done(() => {
    showMessage('Product reactivated', false)
    loadProducts()
  }).fail(() => showMessage('Could not reactivate product', true))
}

function editProduct(id) {
  $.get(`/api/v1/products/${id}`).done((product) => {
    $('#productId').val(product.id)
    $('#productName').val(product.name)
    $('#productPrice').val(product.price)
    $('#productCategory').val(product.category || 'General')
    $('#productDescription').val(product.description || '')
    $('#productStock').val(product.stock || 0)
    $('#productForm').removeClass('hidden')
    $('#productName').focus()
    renderProductImages(product)
  })
}

function deleteProductImage(productId, imageId) {
  $.ajax({
    url: `/api/v1/products/${productId}/images/${imageId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` }
  }).done(() => {
    showMessage('Image deleted', false)
    editProduct(productId) // refresh images in the edit form
    loadProducts()
  }).fail(() => showMessage('Could not delete image', true))
}

function renderProductImages(product) {
  const $c = $('#productImagesPreview').empty()
  if (!product.images || !product.images.length) return
  product.images.forEach(img => {
    const primaryBadge = img.is_primary ? '<div style="font-size:12px;color:#fff;background:#007bff;padding:2px 6px;border-radius:4px;position:absolute;right:6px;top:6px">Primary</div>' : ''
    const makePrimaryBtn = img.is_primary ? '' : `<button type="button" style="font-size:12px;padding:6px;border-radius:6px;margin-top:6px" onclick="makePrimaryImage(${product.id}, ${img.id})">Make Primary</button>`
    const $item = $(`
      <div style="text-align:center;position:relative">
        ${primaryBadge}
        <img src="${img.url}" style="width:96px;height:96px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px" />
        ${makePrimaryBtn}
        <button type="button" style="font-size:12px;padding:6px;border-radius:6px;margin-top:6px" onclick="deleteProductImage(${product.id}, ${img.id})">Delete</button>
      </div>
    `)
    $c.append($item)
  })
}

// close modal and clear image
function closeImageModal() {
  $('#imageModal img').attr('src', '')
  $('#imageModal').hide()
}

// wire close controls
$('body').on('click', '#imageModal .close', closeImageModal)
// click backdrop (outside image) closes modal
$('body').on('click', '#imageModal', function (e) {
  if (e.target.id === 'imageModal') closeImageModal()
})
// Escape key closes modal
$(document).on('keydown', function (e) {
  if (e.key === 'Escape') closeImageModal()
})

// open image modal (robust + debug)
$('body').on('click', '.prod-thumb', function (e) {
  e.preventDefault()
  e.stopPropagation()
  const $img = $(this)
  const url = $img.data('url') || $img.attr('src') || $img.attr('data-url')
  console.log('prod-thumb clicked, url=', url)
  if (!url) return alert('Image URL missing — check console for details')
  $('#imageModal img').attr('src', url)
  $('#imageModal').css('display', 'flex').show()
})

function makePrimaryImage(productId, imageId) {
  $.ajax({
    url: `/api/v1/products/${productId}/images/${imageId}/primary`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` }
  }).done(() => {
    showMessage('Primary image updated', false)
    editProduct(productId) // refresh images in the edit form
    loadProducts() // refresh table thumbnails
  }).fail(() => showMessage('Could not set primary image', true))
}

$(function () {
  $('#productsTable').DataTable({
    ajax: {
      url: '/api/v1/products',
      dataSrc: '',
      headers: { Authorization: `Bearer ${getToken()}` }
    },
    columns: [
      { data: 'id' },
      { data: 'name' },
      {
        data: 'images',
        orderable: false,
        searchable: false,
        render: function (images, type, row) {
          if (!images || !images.length) return '<span style="color:#999">—</span>'
          const primaryIdx = images.findIndex(i => i.is_primary)
          const ordered = primaryIdx > -1 ? [images[primaryIdx], ...images.filter((_,idx)=>idx!==primaryIdx)] : images
          return ordered.slice(0,3).map(img =>
            `<img src="${img.url}" class="prod-thumb" data-pid="${row.id}" data-imgid="${img.id}" data-url="${img.url}" title="${img.file_path || ''}" />`
          ).join('')
        }
      },
      { data: 'price' },
      { data: 'category' },
      { data: 'stock' },
      {
        data: 'is_deleted',
        render: (value) => value ? '<span style="color:#c0392b">Inactive</span>' : '<span style="color:#2e7d32">Active</span>'
      },
      {
        data: null,
        render: (row) => `
          <button onclick="editProduct(${row.id})">Edit</button>
          ${row.is_deleted ? `<button onclick="reactivateProduct(${row.id})">Reactivate</button>` : `<button onclick="deactivateProduct(${row.id})">Deactivate</button>`}
        `
      }
    ]
  })

  $('#toggleForm').on('click', function () {
    $('#productForm').toggleClass('hidden')
    if (!$('#productForm').hasClass('hidden')) {
      $('#productId').val('')
      $('#productForm')[0].reset()
      $('#productCategory').val('General')
      $('#productStock').val('0')
      $('#productName').focus()
    }
  })

  $('#productForm').on('submit', function (e) {
    e.preventDefault()
    const id = $('#productId').val()
    const files = $('#productImages')[0]?.files
    const payload = {
      name: $('#productName').val(),
      price: Number($('#productPrice').val()),
      category: $('#productCategory').val(),
      description: $('#productDescription').val(),
      stock: Number($('#productStock').val() || 0)
    }

    const saveRequest = id
      ? $.ajax({ url: `/api/v1/products/${id}`, method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }, contentType: 'application/json', data: JSON.stringify(payload) })
      : $.ajax({ url: '/api/v1/products', method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, contentType: 'application/json', data: JSON.stringify(payload) })

    saveRequest.done((product) => {
      // if files present, upload them
      if (files && files.length) {
        const fd = new FormData()
        for (let i = 0; i < files.length; i++) fd.append('images', files[i])
        $.ajax({
          url: `/api/v1/products/${product.id}/images`,
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          data: fd,
          processData: false,
          contentType: false
        }).always(() => {
          showMessage(id ? 'Product updated' : 'Product created', false)
          $('#productForm').addClass('hidden')
          $('#productForm')[0].reset()
          $('#productImagesPreview').empty()
          $('#productImages').val('')
          loadProducts()
        })
      } else {
        showMessage(id ? 'Product updated' : 'Product created', false)
        $('#productForm').addClass('hidden')
        $('#productForm')[0].reset()
        $('#productImagesPreview').empty()
        $('#productImages').val('')
        loadProducts()
      }
    }).fail(() => showMessage('Could not save product', true))
  })

  $('#productImages').on('change', function () {
    const files = this.files
    const formData = new FormData()
    formData.append('images', files)
    formData.append('productId', id)

    $.ajax({
      url: '/api/v1/products',
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      contentType: false,
      processData: false,
      data: formData
    }).done(() => {
      showMessage('Product images uploaded', false)
    }).fail(() => showMessage('Could not upload product images', true))
  })
})

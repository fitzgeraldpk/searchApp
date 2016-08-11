$(function() {
		$('#searchBtn').on('click', function () {
					var $btn = $(this).button('loading')
					console.log('search submitted');
					var searchText = $('#search').val();
					window.location.replace("/search/"+searchText.replace(/\//g,'%5c'));
		})
	}
)
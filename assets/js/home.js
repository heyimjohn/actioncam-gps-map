function Home() {
	var pub = {};

	pub.init = function() {
		$('#logfile').bind('change', submitUpload);
		$('#fakeBtn').bind('click', onClickSelectFile);
	}

	function onClickSelectFile(event) {
		event.preventDefault();

		$('#logfile').trigger('click');
	}

	function submitUpload(event) {
		this.form.submit();
	}

	return pub;
}

var home = new Home();
$(document).ready(home.init);
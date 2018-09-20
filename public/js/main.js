'use strict';

function getUrl(link) {
	document.getElementById('result').innerHTML = '';
	let xmlhttp = new XMLHttpRequest();
	xmlhttp.open('POST',`http://localhost:8086/url/${link}`, true);
	xmlhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			console.log(this.response);
			document.getElementById('result').innerHTML = this.response;
		}
	};
	xmlhttp.send();
	event.preventDefault();
}
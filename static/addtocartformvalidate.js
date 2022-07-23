function validform() {
	var product_name = 
		document.forms["addtocartformvalidate"]["product_name"];
		var product_price = 
		document.forms["addtocartformvalidate"]["product_price"];
		var product_quantity = 
		document.forms["addtocartformvalidate"]["product_quantity"];
		var product_stock = 
		document.forms["addtocartformvalidate"]["product_stock"];
		var product_category = 
		document.forms["addtocartformvalidate"]["product_category"];

	if (product_name.value == "") {
		window.alert("Please enter product name.");
		product_name.focus();
		return false;
	}

	if (product_price.value == "") {
		window.alert("Please enter product price.");
		product_price.focus();
		return false;
	}

	if (product_quantity.value == "") {
		window.alert(
		  "Please enter a valid product_quantity.");
		  product_quantity.focus();
		return false;
	}
	if (product_stock.value == "") {
		window.alert(
		  "Please enter a valid product_stock.");
		  product_stock.focus();
		return false;
	}if (product_category.value == "") {
		window.alert(
		  "Please select a valid product_category.");
		  product_category.focus();
		return false;
	}
	return true;
}
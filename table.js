/*
	Copyright (C) 2015  Johannes Giere

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
*/

Table.prototype.Elements = [];
Table.prototype.ElementKeys = [];
Table.prototype.Template = null;

Table.prototype.View = null;

function Table(elementKeys, options) {

	if(elementKeys != null) {
		if(options['elements'] != null && options['templateUrl'] != null) {
			// Will be executed when elements get passed through the options.
			Table.prototype.Elements = options['elements'];
			Table.prototype.ElementKeys = elementKeys;

			this.loadTemplate(options['templateUrl']);
		} else if(options['elements'] == null && options['templateUrl'] == null) {
			// Will be executed when the elements exist as a ready table or list.
			Table.prototype.ElementKeys = elementKeys;

			this.loadHtml();

			Table.prototype.parseTemplate(Table.prototype.Template, Table.prototype.Elements, Table.prototype.ElementKeys);
		} else {
			console.log('Cannot load template url, parse template or find your specified template.');
		}
	} else {
		console.log('No element keys specified');
	}
}

/* Loads the table or ul from parent html file
 */
Table.prototype.loadHtml = function() {
	var section = document.getElementsByClassName('repeat')[0];

	var collection = [];
	var template = '';
	if(section.tagName == 'TABLE') {
		var rows = section.getElementsByTagName('tr');

		//Create template
		var template = '<table class=\"repeat\">';
		template += '<tr>';
		for(var i = 0; i < this.ElementKeys.length; i++) {
			template += '<td>';
			template += '{$' + this.ElementKeys[i] + '$}';
			template += '</td>';
		}
		template += '</tr>';
		template += '</table>';


		//Read all elements
		for(var i = 0; i < rows.length; i++) {

			var element = {};
			for(var u = 0; u < this.ElementKeys.length; u++) {
				if(rows[i].getElementsByClassName(this.ElementKeys[u]).length == 1) {
					element[this.ElementKeys[u]] = rows[i].getElementsByClassName(this.ElementKeys[u])[0].textContent;
				}
			}

			collection[i] = element;
		}
	} else if(section.tagName == 'UL') {
		var rows = section.getElementsByTagName('li');

		//Create template
		template = '<ul class=\"repeat ';

		//Add used classes in the template.
		for(var i = 0; i < section.classList.length; i++) {
			template += section.classList[i] + ' ';
		}

		template += '\">';

		for(var i = 0; i < this.ElementKeys.length; i++) {
			template += '<li>';
			template += '{$' + this.ElementKeys[i] + '$}';
			template += '</li>';
		}
		template += '</ul>';


		//Read all elements
		for(var i = 0; i < rows.length; i++) {

			var element = {};
			for(var u = 0; u < this.ElementKeys.length; u++) {
					element[this.ElementKeys[u]] = rows[i].children[0].textContent;
			}

			collection[i] = element;
		}
	}

	Table.prototype.Template = template;
	Table.prototype.Elements = collection;
}

/* Loads template from specified url with http get call (ajax).
 *
 */
Table.prototype.loadTemplate = function (url) {
	var httpRequest;
	if (window.XMLHttpRequest) {
		httpRequest = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	}

	//Parsing template after fetching it.
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState === 4) {
			Table.prototype.Template = httpRequest.responseText;

			Table.prototype.parseTemplate(Table.prototype.Template, Table.prototype.Elements, Table.prototype.ElementKeys);
		} else {

		}
	};

	//Request the specified template via HTTP-GET call.
    httpRequest.open("GET", url, false);
	httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	httpRequest.send(null);
}

/* Parse the template, create a view, analyse template.
 */
Table.prototype.parseTemplate = function(template, elements, elementKeys) {

	//Find keys in template
	var pos, lastpos;
	var types = [];
	for(var i = 0; i < template.length; i) {
		//Search template after all keys
		pos = template.indexOf('{$', i);

		if (pos != -1) {
			//Increase position with 2, so that '{$' will not be used in keyword.
			pos += 2;
			lastpos = template.indexOf('$}', i);

			//Get key and put into array.
			types.push(template.substr(pos, template.length - pos - (template.length - lastpos)));

			//Increase position with 2, so that searching continues after key.
			i = lastpos + 2;
		} else {
			i = template.length;
		}
	}

	//Load repeat section
	var classType, repeatSection;
	for(var i = 0; i < template.length; i) {
		pos = template.indexOf('class="');

		if (pos != -1) {
			pos += 7;
			lastpos = template.indexOf('"', pos);

			var cssClasses = template.substr(pos, template.length - pos - (template.length - lastpos));
			var index = cssClasses.indexOf('repeat');

			//If index is -1, we have found the repeat section
			if (index != -1) {

				//Delete repeat-Class
				template = template.substr(0, pos) + cssClasses.replace('repeat', '') + template.substr(pos + cssClasses.length);

				//Get HTML tag inside of repeat section.
				var beginn = template.substr(0, pos).lastIndexOf('<') + 1;
				var laenge = template.substr(beginn, template.length - beginn).indexOf(' ');
				var tag = template.substr(beginn, laenge);

				//Find out the closing tag and get the length of the repeat section.
				laenge = template.substr(beginn, template.length - beginn).indexOf('</' + tag + '>') + 4 + tag.length;

				//Build repeat section as object with text as content
				repeatSection = {
					'start' : beginn - 1,
					'length' : laenge,
					'text' : template.substr(beginn - 1, laenge)
				};


				i += lastpos.length;
			}
		} else {
			i = template.length;
		}
	}

	//Fill view
	var view;
	if(repeatSection != null) {
		//Delete repeat section from template.
		view = template.substr(0, repeatSection.start) + template.substr(repeatSection.start + repeatSection.length);

		var pos = repeatSection.start;
		for(var i = 0; i < elements.length; i++) {
			//Replace placeholder with value
			var part = repeatSection.text;

			//Iterate every placeholder
			for(var index = 0; index < elementKeys.length; index++) {
				part = part.replace('{$' + elementKeys[index] + '$}', elements[i][elementKeys[index]]);
			}

			//Add new part to view.
			view = view.substr(0, pos) + part + view.substr(pos);

			pos += part.length;
		}
	}

	//Deploy view.
	Table.prototype.View = view;

	return Table.prototype.View;
}

/* Perform a search
 */
Table.prototype.search = function (phrase, property) {
	var result = [];

	if (property != null) {

		//Perform a search for a specific property only.
		for(var i = 0; i < Table.prototype.Elements.length; i++) {
			var index = Table.prototype.Elements[i][property].search(phrase);

			if (index != -1) {
				result.push(Table.prototype.Elements[i]);
			}
		}
	} else {

		//Search every element
		for(var i = 0; i < Table.prototype.Elements.length; i++) {
			//Iterate every property.
			for(var u = 0; u < Table.prototype.ElementKeys.length; u++) {
				if (typeof Table.prototype.Elements[i][Table.prototype.ElementKeys[u]] === "undefined") {

				} else {

					var index = Table.prototype.Elements[i][Table.prototype.ElementKeys[u]].toLowerCase().search(phrase.toLowerCase());

					if(index != -1) {
						//A property has been found, so the loop can be stopped.
						result.push(Table.prototype.Elements[i]);

						u += Table.prototype.ElementKeys.length;
					}
				}
			}
		}
	}

	return result;
}

/* Accepts a new array with elements and redraws the view.
 *
 */
Table.prototype.redrawView = function (elements) {
	return Table.prototype.parseTemplate(Table.prototype.Template, elements, Table.prototype.ElementKeys);
}

/* Sorts every element and returns a view
 */
Table.prototype.sort = function (elements, property, options) {
	//Check if specific options has been set.
	if(property != null && options.hasOwnProperty('asc') && options.hasOwnProperty('type')) {
		//Check which type has been set.
		if(options.type == 'date' || options.type == 'time' || options.type == 'datetime') {
			options.type = 'datetime';
		} else if(options.type == 'string') {

		} else {
			options.type = false;
		}

		if(options.type) {
			//Because elements could be a pointer to Table.prototype.Elements and their elemtent's position can be altered through this process, the object will be cloned.
			var collection = JSON.parse(JSON.stringify(elements));
			var item;
			var sortFinished = false;

			while(!sortFinished) {
				//This Value is set on true at every iteration. If something different occurres, it will be set on false.
				sortFinished = true;

				for(var i = 0; i < collection.length && i + 1 < collection.length; i++) {
					if(options.type == 'datetime') {
						if(options.asc) {
							//If first value is greater than second value, switch them.
							if(collection[i][property] > collection[i + 1][property]) {
								item = collection[i];
								collection[i] = collection[i + 1];
								collection[i + 1] = item;
								sortFinished = false;
							}
						} else {
							//If first value is smaller that second value, switch them.
							if(collection[i][property] < collection[i + 1][property]) {
								item = collection[i];
								collection[i] = collection[i + 1];
								collection[i + 1] = item;
								sortFinished = false;
							}
						}
					}
				}
			}

			return collection;
		}
	}
}

/* Provide your own filterFuntion to filter on your own.
 */
Table.prototype.filter = function (filterFunction, keyType) {
	var collection = [];
	for(var i = 0; i < Table.prototype.Elements.length; i++) {
		if(filterFunction(Table.prototype.Elements[i][keyType])) {
			collection.push(Table.prototype.Elements[i]);
		}
	}
	return collection;
}

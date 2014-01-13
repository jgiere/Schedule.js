/*
	Developed by Johannes Giere, jogiere AT gmail DOT com
*/

Schedule.prototype.Elements = [];
Schedule.prototype.ElementKeys = [];
Schedule.prototype.Template = null;

Schedule.prototype.View = null;

function Schedule(elements, elementKeys, templateUrl) {
	
	Schedule.prototype.Elements = elements;
	Schedule.prototype.ElementKeys = elementKeys;
	
	this.loadTemplate(templateUrl);
}

Schedule.prototype.loadTemplate = function (url) {
	var httpRequest;
	if (window.XMLHttpRequest) { // Mozilla, Safari, ...
		httpRequest = new XMLHttpRequest();
	} else if (window.ActiveXObject) { // IE 8 and older
		httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState === 4) {
			Schedule.prototype.Template = httpRequest.responseText;
			
			Schedule.prototype.parseTemplate(Schedule.prototype.Template, Schedule.prototype.Elements, Schedule.prototype.ElementKeys);
		} else {
			
		}
	};
	
    httpRequest.open("GET", url, false);
	httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	httpRequest.send(null);
}

Schedule.prototype.parseTemplate = function(template, elements, elementKeys) {
	
	//Lade alle Klassen aus dem Template.
	var pos, lastpos;
	var types = [];
	for(var i = 0; i < template.length; i) {
		//Durchsuche das Template nach allen Verweisen.
		pos = template.indexOf('{{', i);
		
		if (pos != -1) {
			//Erhöhe die Position um 2, damit die Klammern nicht miteinbezogen werden.
			pos += 2;
			lastpos = template.indexOf('}}', i);
			
			//Hole die Klasse raus und pushe sie in das Array.
			types.push(template.substr(pos, template.length - pos - (template.length - lastpos)));
			
			//Lege i auf eine Position hinter der gefunden Klasse.
			i = lastpos + 2;
		} else {
			i = template.length;
		}
	}
	
	//Lade den repeat Bereich.
	var classType, repeatSection;
	for(var i = 0; i < template.length; i) {
		pos = template.indexOf('class="')
		
		if (pos != -1) {
			pos += 7;
			lastpos = template.indexOf('"', pos);
			
			var cssClasses = template.substr(pos, template.length - pos - (template.length - lastpos));
			var index = cssClasses.indexOf('repeat');
			
			//Wenn der index -1 ist, haben wir den repeat-Teil gefunden.
			if (index != -1) {
				
				//Lösche repeat-Klasse raus.
				template = template.substr(0, pos) + cssClasses.replace('repeat', '') + template.substr(pos + cssClasses.length);
				
				//Hole den HTML-Tag, indem der Repeatbereich sich befindet.
				var beginn = template.substr(0, pos).lastIndexOf('<') + 1;
				var laenge = template.substr(beginn, template.length - beginn).indexOf(' ');
				var tag = template.substr(beginn, laenge);
				
				//Ermittel den zugehörigen Endtag aus dem Tag und hole dadurch die Länge des Repeatbereichs.
				laenge = template.substr(beginn, template.length - beginn).indexOf('</' + tag + '>') + 4 + tag.length;
				
				//Bilde den Repeatbereich als String.
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
	
	//Fülle das View.
	var view;
	if(repeatSection != null) {
		//Lösche den Repeatbereich aus dem Template.
		view = template.substr(0, repeatSection.start) + template.substr(repeatSection.start + repeatSection.length);
		
		var pos = repeatSection.start;
		for(var i = 0; i < elements.length; i++) {
			//Ersetze alle Platzhalter durch die Werte.
			var part = repeatSection.text;
			
			//Gehe alle Platzhalter durch.
			for(var index = 0; index < elementKeys.length; index++) {
				part = part.replace('{{' + elementKeys[index] + '}}', elements[i][elementKeys[index]]);
			}
			
			//Füge den Part dem View hinzu.
			view = view.substr(0, pos) + part + view.substr(pos);
			
			pos += part.length;
		}
	}
	
	//Füge den View ins Objekt.
	Schedule.prototype.View = view;
	
	return Schedule.prototype.View;
}

Schedule.prototype.search = function (phrase, property) {
	var result = [];
	
	if (property != null) {
		
		//Suche nur innerhalb dieser einen Eigenschaft.
		for(var i = 0; i < Schedule.prototype.Elements.length; i++) {
			var index = Schedule.prototype.Elements[i][property].search(phrase);
			
			if (index != -1) {
				result.push(Schedule.prototype.Elements[i]);
			}
		}
	} else {
		
		//Suche durch alle Elemente.
		for(var i = 0; i < Schedule.prototype.Elements.length; i++) {
			//Da alle Eigenschaften berücksichtigt werden sollen, werden nun alle Eigenschaften durchgegangen.
			for(var u = 0; u < Schedule.prototype.ElementKeys.length; u++) {
				var index = Schedule.prototype.Elements[i][Schedule.prototype.ElementKeys[u]].search(phrase);
				
				if(index != -1) {
					//Eine Eigenschaft wurde gefunden, diese Schleife wird nun beendet, da eine weitere Ausführung nicht notwendig ist.
					result.push(Schedule.prototype.Elements[i]);
					
					u += Schedule.prototype.ElementKeys.length;
				}
			}
		}
	}
	
	return result;
}

/* Accepts a new array with elements and redraws the view.
 *	
 */
Schedule.prototype.redrawView = function (elements) {
	
	
	return Schedule.prototype.parseTemplate(Schedule.prototype.Template, elements, Schedule.prototype.ElementKeys);
}

Schedule.prototype.sort = function (elements, property, options) {
	//Bestimmte options müssen gesetzt worden sein.
	if(property != null && options.hasOwnProperty('asc') && options.hasOwnProperty('type')) {
		//Kontrollieren welcher Typ gesetzt wurde.
		if(options.type == 'date' || options.type == 'time' || options.type == 'datetime') {
			options.type = 'datetime';
		} else if(options.type == 'string') {
			
		} else {
			options.type = false;
		}
		
		if(options.type) {
			//Da es sein kann, dass elements ein Verweis auf Schedule.prototype.Elements ist und sich durch die Sortierung auch deren Sortierung ändern kann, wird
			//das Objekt hier geklont.
			var collection = JSON.parse(JSON.stringify(elements));
			var item;
			var sortFinished = false;
			
			while(!sortFinished) {
				//Dieser Wert bei jedem Durchgang auf true gesetzt. Wird etwas geändert, wird er auf false gesetzt.
				sortFinished = true;
				
				for(var i = 0; i < collection.length && i + 1 < collection.length; i++) {
					if(options.type == 'datetime') {				
						if(options.asc) {
							//Wenn der erste Werte groesser als der zweite Wert ist, wird getauscht.
							if(collection[i][property] > collection[i + 1][property]) {
								item = collection[i];
								collection[i] = collection[i + 1];
								collection[i + 1] = item;
								sortFinished = false;
							}
						} else {
							//Wenn der erste Werte kleiner als der zweite Wert ist, wird getauscht.
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

Schedule.prototype.filter = function (filterFunction, keyType) {
	var collection = [];
	for(var i = 0; i < Schedule.prototype.Elements.length; i++) {
		if(filterFunction(Schedule.prototype.Elements[i][keyType])) {
			collection.push(Schedule.prototype.Elements[i]);
		}
	}
	return collection;
}
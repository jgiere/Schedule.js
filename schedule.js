Schedule.prototype.Elements = [];
Schedule.prototype.ElementKeys = [];
Schedule.prototype.Template = null;

Schedule.prototype.View = null;

function Schedule(elements, elementKeys, templateUrl) {
	
	Schedule.prototype.Elements = elements;
	Schedule.prototype.ElementKeys = elementKeys;
	
	
	
	this.loadTemplate(templateUrl);
}

Schedule.prototype.loadTemplate = function (url)
{
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
			
			// everything is good, the response is received
			/*
			if (httpRequest.status === 200) {
				var toit=true;
			} else {
				
			}
			*/
		} else {
			// still not ready
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
			
			classType = template.substr(pos, template.length - pos - (template.length - lastpos));
			
			if (classType == 'repeat') {
				
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

Schedule.prototype.search = function (value, phrase) {
	var result = [];
	
	for(var i = 0; i < Schedule.prototype.Elements.length; i++) {
		var index = Schedule.prototype.Elements[i][value].search(phrase);
		
		if (index != -1) {
			result.push(Schedule.prototype.Elements[i]);
		}
	}
	
	return result;
}

/*
 *	Accepts a new array with elements a redraws the view.
 */
Schedule.prototype.redrawView = function (elements) {
	
	
	return Schedule.prototype.parseTemplate(Schedule.prototype.Template, elements, Schedule.prototype.ElementKeys);
}
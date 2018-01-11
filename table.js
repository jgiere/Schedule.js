/*
	Copyright (C) 2018  Johannes Giere

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
*/
'use strict';

class Table {
    /**
     * Constructor for the object
     *
     * @param elementKeys
     *  The property keys of the elements to handle.
     *
     * @param options
     *  Options:
     *      elements: The element content for the list as an array
     *      templateUrl: The url for the template.
     *
     * @param callback
     *  The callback function, which will be executed when all loading has finished and the view has been created.
     */
    constructor(elementKeys = [], options = {}, callback) {
        this._Elements = [];
        this._ElementKeys = elementKeys;
        this._Template = null;
        this._View = null;

        if (options['elements'] !== undefined && options['templateUrl'] !== undefined) {
            // Will be executed when elements get passed through the options.
            this._Elements = options['elements'];

            this.loadTemplate(options['templateUrl'], callback);
        } else if (options['elements'] == null && options['templateUrl'] == null) {

            // Will be executed when the elements exist as a ready table or list.
            this.loadHtml();

            this.parseTemplate();

            if (callback !== undefined) {
                callback(this);
            }
        } else {
            console.error('Cannot load template url, parse template or find your specified template.');
        }
    }

    get Elements() {
        return this._Elements;
    }

    get ElementKeys() {
        return this._ElementKeys;
    }

    get Template() {
        return this._Template;
    }

    get View() {
        return this._View;
    }

    /**
     * Loads the table or ul from parent html file
     */
    loadHtml () {
        let section = document.getElementsByClassName('repeat')[0];

        let collection = [];
        let template = '';
        let rows;
        if (section.tagName === 'TABLE') {
            rows = section.getElementsByTagName('tr');

            //Create template
            template = '<table class=\"repeat\">';
            template += '<tr>';
            for (let i = 0; i < this.ElementKeys.length; i++) {
                template += '<td>';
                template += '{$' + this.ElementKeys[i] + '$}';
                template += '</td>';
            }
            template += '</tr>';
            template += '</table>';

            //Read all elements
            for (let i = 0; i < rows.length; i++) {

                let element = {};
                for (let u = 0; u < this.ElementKeys.length; u++) {
                    if (rows[i].getElementsByClassName(this.ElementKeys[u]).length === 1) {
                        element[this.ElementKeys[u]] = rows[i].getElementsByClassName(this.ElementKeys[u])[0].textContent;
                    }
                }

                collection[i] = element;
            }
        } else if (section.tagName === 'UL') {
            rows = section.getElementsByTagName('li');

            //Create template
            template = '<ul class=\"repeat ';

            //Add used classes in the template.
            for (let i = 0; i < section.classList.length; i++) {
                template += section.classList[i] + ' ';
            }

            template += '\">';

            for (let i = 0; i < this.ElementKeys.length; i++) {
                template += '<li>';
                template += '{$' + this.ElementKeys[i] + '$}';
                template += '</li>';
            }
            template += '</ul>';


            //Read all elements
            for (let i = 0; i < rows.length; i++) {

                let element = {};
                for (let u = 0; u < this.ElementKeys.length; u++) {
                    element[this.ElementKeys[u]] = rows[i].children[0].textContent;
                }

                collection[i] = element;
            }
        }

        this._Template = template;
        this._Elements = collection;
    }

    /**
     * Loads template from specified url with http get call (ajax).
     *
     * @param url
     *  The template's url.
     *
     * @param callback
     *  Callback function. Needs to take one parameter: The this scope.
     */
    loadTemplate (url, callback) {
        let httpRequest;
        if (window.XMLHttpRequest) {
            httpRequest = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
        }

        let self = this;
        //Parsing template after fetching it.
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                self._Template = httpRequest.responseText;

                self.parseTemplate();

                if (callback !== undefined) {
                    callback(self);
                }
            }
        };

        //Request the specified template via HTTP-GET call.
        httpRequest.open("GET", url, true);
        httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        httpRequest.send(null);
    }

    /**
     * Parse the template, create a view, analyse template.
     *
     * @returns {*}
     */
    parseTemplate (elements = null) {

        if(elements === null) {
            elements = this.Elements;
        }

        //Find keys in template
        let pos;
        let lastpos;
        let types = [];
        for (let i = 0; i < this.Template.length; i) {
            //Search template after all keys
            pos = this.Template.indexOf('{$', i);

            if (pos !== -1) {
                //Increase position with 2, so that '{$' will not be used in keyword.
                pos += 2;
                lastpos = this.Template.indexOf('$}', i);

                //Get key and put into array.
                types.push(this.Template.substr(pos, this.Template.length - pos - (this.Template.length - lastpos)));

                //Increase position with 2, so that searching continues after key.
                i = lastpos + 2;
            } else {
                i = this.Template.length;
            }
        }

        //Load repeat section
        let repeatSection;
        for (let i = 0; i < this.Template.length; i) {
            pos = this.Template.indexOf('class="');

            if (pos !== -1) {
                pos += 7;
                lastpos = this.Template.indexOf('"', pos);

                let cssClasses = this.Template.substr(pos, this.Template.length - pos - (this.Template.length - lastpos));
                let index = cssClasses.indexOf('repeat');

                //If index is -1, we have found the repeat section
                if (index !== -1) {

                    //Delete repeat-Class
                    const templateShort = this.Template.substr(0, pos) + cssClasses.replace('repeat', '') + this.Template.substr(pos + cssClasses.length);

                    //Get HTML tag inside of repeat section.
                    let beginn = templateShort.substr(0, pos).lastIndexOf('<') + 1;
                    let laenge = templateShort.substr(beginn, templateShort.length - beginn).indexOf(' ');
                    let tag = templateShort.substr(beginn, laenge);

                    //Find out the closing tag and get the length of the repeat section.
                    laenge = templateShort.substr(beginn, templateShort.length - beginn).indexOf('</' + tag + '>') + 4 + tag.length;

                    //Build repeat section as object with text as content
                    repeatSection = {
                        'start': beginn - 1,
                        'length': laenge,
                        'text': templateShort.substr(beginn - 1, laenge)
                    };

                    i += lastpos.length;
                }
            } else {
                i = this.Template.length;
            }
        }

        //Fill view
        let view;
        if (repeatSection != null) {
            //Delete repeat section from template.
            view = this.Template.substr(0, repeatSection.start) + this.Template.substr(repeatSection.start + repeatSection.length);

            let pos = repeatSection.start;
            for (let i = 0; i < elements.length; i++) {
                //Replace placeholder with value
                let part = repeatSection.text;

                //Iterate every placeholder
                for (let index = 0; index < this.ElementKeys.length; index++) {
                    part = part.replace('{$' + this.ElementKeys[index] + '$}', elements[i][this.ElementKeys[index]]);
                }

                //Add new part to view.
                view = view.substr(0, pos) + part + view.substr(pos);
                pos += part.length;
            }
        }

        //Deploy view.
        this._View = view;

        return this.View;
    }

    /**
     * Perform a search
     *
     * @param phrase
     *  The search phrase to look out for.
     *
     * @param property
     *  The property in which the phrase is searched. Is optional.
     *
     * @returns {Array}
     *  Found elements
     */
    search(phrase, property) {
        let result = [];

        if (property != null) {
            //Perform a search for a specific property only.
            for (let i = 0; i < this.Elements.length; i++) {
                let index = this.Elements[i][property].search(phrase);

                if (index !== -1) {
                    result.push(this.Elements[i]);
                }
            }
        } else {
            //Search every element
            for (let i = 0; i < this.Elements.length; i++) {
                const element = this.Elements[i];

                //Iterate every property of that element.
                for (let u = 0; u < this.ElementKeys.length; u++) {

                    if (typeof element[this.ElementKeys[u]] !== "undefined") {
                        let index = element[this.ElementKeys[u]].toLowerCase().search(phrase.toLowerCase());

                        if (index !== -1) {
                            //A property has been found, so the loop can be stopped.
                            result.push(element);

                            u += this.ElementKeys.length;
                        }
                    }
                }
            }
        }

        return result;
    }

    /**
     * Accepts a new array with elements and redraws the view.
     *
     * @param elements
     * @returns {*}
     */
    redrawView(elements = null) {
        if(elements === null) {
            elements = this.Elements;
        }
        return this.parseTemplate(elements);
    }

    /**
     * Sorts every element and returns a view
     *
     * @param elements
     *  The elements to fill. If left null, all elements will be used.
     * @param property
     *  The property to sort on.
     * @param options
     *  Possible keys:
     *      asc: If true, sorting is made in asc. If false, sorting is made in desc.
     *      type: The type of property: date, time, datetime or string.
     *
     * @returns {*}
     *  Returns an array.
     */
    sort(elements = null, property, options) {
        if(elements === null) {
            elements = this.Elements;
        }

        //Check if specific options has been set.
        if (property != null && options.hasOwnProperty('asc') && options.hasOwnProperty('type')) {
            //Check which type has been set.
            if (options.type === 'date' || options.type === 'time' || options.type === 'datetime') {
                options.type = 'datetime';
            } else if (options.type === 'string') {

            } else {
                options.type = false;
            }

            if (options.type) {
                //Because elements could be a pointer to Table.prototype.Elements and their elemtent's position can be altered through this process, the object will be cloned.
                let collection = JSON.parse(JSON.stringify(elements));
                let item;
                let sortFinished = false;

                while (!sortFinished) {
                    //This Value is set on true at every iteration. If something different occurres, it will be set on false.
                    sortFinished = true;

                    for (let i = 0; i < collection.length && i + 1 < collection.length; i++) {
                        if (options.type === 'datetime') {
                            if (options.asc) {
                                //If first value is greater than second value, switch them.
                                if (collection[i][property] > collection[i + 1][property]) {
                                    item = collection[i];
                                    collection[i] = collection[i + 1];
                                    collection[i + 1] = item;
                                    sortFinished = false;
                                }
                            } else {
                                //If first value is smaller that second value, switch them.
                                if (collection[i][property] < collection[i + 1][property]) {
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
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    /**
     * Provide your own filterFunction to filter on your own.
     *
     * @param filterFunction
     * @param keyType
     * @returns {Array}
     */
    filter(filterFunction, keyType) {
        // TODO: Prüfen, ob filterFunction eine Funktion ist und keyType nicht leer und der Key wirklich existiert, ansonsten ---> Error schmeißen
        // TODO: Wenn der keyType leer ist, so wird das gesamte Objekt zurückgegeben.
        let collection = [];
        for (let i = 0; i < this.Elements.length; i++) {
            if (filterFunction(this.Elements[i][keyType])) {
                collection.push(this.Elements[i]);
            }
        }
        return collection;
    }
}

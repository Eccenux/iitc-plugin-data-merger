// ==UserScript==
// @id             iitc-plugin-data-merger@eccenux
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @name           IITC plugin: Uniques merger (data sync)
// @category       Misc
// @version        0.0.4
// @description    [0.0.4] Allows to merge (sync) data across devices and even accounts. For now handles merging uniques (captures and visits).
// @include        https://intel.ingress.com/*
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://intel.ingress.com/*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @grant          none
// @updateURL      https://github.com/Eccenux/iitc-plugin-data-merger/raw/master/data-merger.meta.js
// @downloadURL    https://github.com/Eccenux/iitc-plugin-data-merger/raw/master/data-merger.user.js
// ==/UserScript==

// GM_info only available in top context
//console.log('[data-merger] ', 'GM_info.script: ', GM_info.script);

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN START ////////////////////////////////////////////////////////
const myVersion = (typeof plugin_info.script == 'object') ? plugin_info.script.version : '0';

// namespace
window.plugin.dataMerger = function() {};

/**
 * Very simple logger.
 */
function LOG() {
	var args = Array.prototype.slice.call(arguments); // Make real array from arguments
	args.unshift("[data-merger] ");
	console.log.apply(console, args);
}
function LOGwarn() {
	var args = Array.prototype.slice.call(arguments); // Make real array from arguments
	args.unshift("[data-merger] ");
	console.warn.apply(console, args);
}

/**
 * Merger class
 */
class Merger {
	constructor (merger) {
		/**
		 * @type {string}
		 */
		this.key = merger.key;
		/**
		 * @type {string}
		 */
		this.exportLabel = merger.exportLabel;
		/**
		 * @type {function}
		 */
		this.import = merger.import;
		/**
		 * @type {function}
		 */
		this.export = merger.export;
	}

	static isValid(merger) {
		return true
			&& typeof merger.key == 'string'
			&& typeof merger.exportLabel == 'string'
			&& typeof merger.import == 'function'
			&& typeof merger.export == 'function'
		;
	}
}

/**
 * Mergers config (importers and exporters).
 */
let mergers = {};

function appendMerger(mergerDefinition) {
	if (!Merger.isValid(mergerDefinition)) {
		LOGwarn('invalid merger definition', mergerDefinition);
		return;
	}
	let merger = new Merger(mergerDefinition);
	if (merger.key in mergers) {
		LOGwarn('duplicate merger definition', `(key ${merger.key} already exists)`);
		return;
	}
	mergers[merger.key] = merger;
}
// export
window.plugin.dataMerger.appendMerger = appendMerger;

/**
 * Uniques merger.
 */
appendMerger({
	'key' : 'uniques',
	'exportLabel' : 'Export uniques',

	// imports a string as was returned by the exporter
	'import' : function(dataString) {
		localStorage['plugin-uniques-data']=dataString;
		window.plugin.uniques.loadLocal('plugin-uniques-data');
		location.reload();
	},

	// returns a string that can be exported
	'export' : function() {
		return localStorage["plugin-uniques-data"];
	},
});

/**
 * CSS.
 */
let pluginCss = `
.ui-data-merger-dialog textarea {
	width: 100%;
	height: 10em;
	box-sizing: border-box;
}
.ui-data-merger-dialog a {
	box-sizing: border-box;
	display: block;
	color: #ffce00;
	border: 1px solid #ffce00;
	padding: 3px 0;
	margin: 10px auto;
	width: 80%;
	text-align: center;
	background: rgba(8,48,78,.9);
}
.ui-data-merger-dialog a.running {
	color: grey;
	border-color: grey;
}
`;

/**
 * Build HTML for the menu.
 */
function buildMenu() {
	let html = `
		<a class="import" tabindex="0">Merge (import)</a>
	`;
	for (const key in mergers) {
		if (!mergers.hasOwnProperty(key)) {
			continue;
		}
		const merger = mergers[key];
		html += `<a class="export" data-merger="${key}" tabindex="0">${merger.exportLabel}</a>`;
	}

	return html;
}

/**
 * Export data using merger and show it.
 * @param {String} mergerKey Key for merger.
 */
function exportData(mergerKey) {
	if (!(mergerKey in mergers)) {
		alert(`Not implemented ${mergerKey}`);
		return;
	}
	let merger = mergers[mergerKey];
	let mergerData = merger.export();
	let exportString = JSON.stringify({
		mergerKey : mergerKey,
		mergerData : mergerData
	}, null, "\t");

	openExport(exportString, merger);
}

/**
 * Open menu/options dialog.
 */
function openExport(exportString, merger) {
	let html = `<textarea>${exportString}</textarea>`;
	
	let box = dialog({
		html: html,
		id: 'plugin-data-merger-export',
		dialogClass: 'ui-data-merger-dialog',
		title: merger.exportLabel
	});

	// enable re-export
	$(`.export[data-merger="${merger.key}"]`).removeClass('running');

	/*
	$('.export-file', box).click(()=>{
		alert('Not implemented yet.');
	});
	*/
}

/**
 * Open menu/options dialog.
 */
function openOptions() {
	let html = buildMenu();

	let box = dialog({
		html: html,
		id: 'plugin-data-merger-options',
		dialogClass: 'ui-data-merger-dialog',
		title: `Merge Options (v. ${myVersion})`
	});

	$('.import', box).click(()=>{
		alert('Not implemented yet.');
	});
	$('.export', box).click(function(){
		LOG('export-click');
		if (!this.classList.contains('running')) {
			LOG('run (not running)');
			this.classList.add('running');
			exportData(this.getAttribute('data-merger'));
		}
	});
}

//PLUGIN SETUP //////////////////////////////////////////////////////////

var setup = function() {
	// css
	var css = document.createElement("style");
	css.type = "text/css";
	css.innerHTML = pluginCss;
	document.body.appendChild(css);

	// add menu/options button
	$('<a>Merge</a>').appendTo('#toolbox').click(()=>{
		openOptions();
	});
};

//PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);



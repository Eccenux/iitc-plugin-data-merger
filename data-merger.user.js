// ==UserScript==
// @id             iitc-plugin-data-merger@eccenux
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @name           IITC plugin: Uniques merger (data sync)
// @category       Misc
// @version        0.0.6
// @description    [0.0.6] Allows to merge (sync) data across devices and even accounts. For now handles merging uniques (captures and visits).
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
	// note, can return string when an import error occures
	'import' : function(dataString) {
		return 'Not ready';
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
.ui-data-merger-dialog .ui-dialog-buttonset button {
	margin-left: 1em;
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
 * Export data using merger.
 * @param {String} mergerKey Key for merger.
 */
function exportData(mergerKey) {
	if (!(mergerKey in mergers)) {
		alert(`Not implemented ${mergerKey}`);
		return false;
	}
	let merger = mergers[mergerKey];
	let mergerData = merger.export();
	let exportString = JSON.stringify({
		mergerKey : mergerKey,
		mergerData : mergerData
	}, null, "\t");

	return [exportString, merger];
}

/**
 * Import data using merger.
 * @param {String} exportString Exported data (must contain data from `exportData`).
 */
function importData(exportString) {
	// parse and validate
	let data = {};
	try {
		data = JSON.parse(exportString);
	} catch (error) {
		LOGwarn(error);
		data = {};
	}
	LOG(data);
	if (!('mergerKey' in data) || !('mergerData' in data)) {
		return 'invalid';
	}
	let {mergerKey, mergerData} = data;
	// has merger?
	if (!(mergerKey in mergers)) {
		return 'missing merger';
	}

	let merger = mergers[mergerKey];
	return merger.import(mergerData);
}

/**
 * Open export dialog.
 */
function openExport(exportString, merger) {
	let html = `<textarea>${exportString}</textarea>`;
	
	let box = dialog({
		html: html,
		id: 'plugin-data-merger-export',
		dialogClass: 'ui-data-merger-dialog',
		width: '50%',
		title: merger.exportLabel
	});

	/*
	$('.export-file', box).click(()=>{
		alert('Not implemented yet.');
	});
	*/
}

/**
 * 
 * @param {jQuery} box IITC dialog box (returned by dialog function).
 */
function removeOkButton(box) {
	// note `box` is actually content of the dialog, not the whole dialog
	$('.ui-dialog-buttonset button', box.parent()).each(function() {
		if (this.textContent === 'OK') {
			this.style.display = 'none';
		}
	});
}

/**
 * Open import dialog.
 */
function openImport() {
	let html = `<textarea></textarea>`;
	
	let box = dialog({
		html: html,
		id: 'plugin-data-merger-import',
		dialogClass: 'ui-data-merger-dialog',
		width: '50%',
		title: 'Import (merge)',
		buttons: {
			'Merge' : function() {
				LOG('import Merge', 'this: ', this);
				const textarea = this.querySelector('textarea');
				if (!textarea || !textarea.value.length) {
					alert('Data is empty');
					return;
				}
				const result = importData(textarea.value);
				if (typeof result === 'string') {
					switch (result) {
						case 'invalid':
							alert(`Error!

								The data you try to import is invalid.
								Please try to paste again or to export again.

								When you copy export, make sure to copy the whole thing.
							`.replace(/\n\t+/g, '\n'));
						break;
						case 'missing merger':
							alert(`Error!

								Merger does not exists. You seem to be missing some plugin.

								Make sure you have the same plugins on both devices.
							`.replace(/\n\t+/g, '\n'));
						break;
						// other? => assume merger.import() returned some own error
						default:
							alert(`Import error!

								${result}
							`.replace(/\n\t+/g, '\n'));
						break;
					}
				}
			},
			'Cancel' : function() {
				LOG('import Cancel', 'this: ', this);
				$(this).dialog('close');
			},
		}
	});
	removeOkButton(box);
	//LOG(box);
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
		openImport();
	});
	$('.export', box).click(function(){
		LOG('export-click');
		if (!this.classList.contains('running')) {
			LOG('run (not running)');
			// disable/indicate progress
			this.classList.add('running');
			// run
			// note that set timeout is used only to allow browsers to update DOM
			// (at least on FF 65 class was not be applied when setTimeout was not used)
			setTimeout(()=>{
				const mergerKey = this.getAttribute('data-merger');
				const result = exportData(mergerKey);
				if (result !== false) {
					let [exportString, merger] = result;
					openExport(exportString, merger);
				}
				// re-enable
				this.classList.remove('running');
			}, 100);
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



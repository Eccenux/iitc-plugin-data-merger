// ==UserScript==
// @id             iitc-plugin-data-merger@eccenux
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @name           IITC plugin: Uniques merger (data sync)
// @category       Misc
// @version        0.0.2
// @description    [0.0.2] Allows to merge (sync) data across devices and even accounts. For now handles merging uniques (captures and visits).
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

// plugin_info.version and .name available
//console.log('[data-merger] ', 'plugin_info: ', plugin_info);

const myVersion = (typeof plugin_info.script == 'object') ? plugin_info.script.version : '0';

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

//PLUGIN START ////////////////////////////////////////////////////////
/**
 * Mergers config (importers and exporters).
 * 
 * @todo allow extending this from other plugins... 
 * 	plugin.appendMerger(key, label, import, export)? or 
 * 	plugin.appendMerger(key, merger) with Merger class?
 */
let mergers = {
	'uniques' : {
		'exportLabel' : 'Export uniques',
		'import' : function() {

		},
		'export' : function() {

		},
	}
}

/**
 * CSS.
 */
let pluginCss = `
.ui-data-merger-dialog a {
	display: block;
	color: #ffce00;
	border: 1px solid #ffce00;
	padding: 3px 0;
	margin: 10px auto;
	width: 80%;
	text-align: center;
	background: rgba(8,48,78,.9);
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
	alert(`Not implemented ${mergerKey}`);
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
	$('.export', box).click(()=>{
		exportData($this.prop('data-merger'));
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


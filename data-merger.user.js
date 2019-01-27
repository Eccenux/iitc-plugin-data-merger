// ==UserScript==
// @id             iitc-plugin-data-merger@eccenux
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @name           IITC plugin: Uniques merger (data sync)
// @category       Misc
// @version        0.0.1
// @description    [0.0.1] Allows to merge (sync) data across devices and even accounts. For now handles merging uniques (captures and visits).
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

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


//PLUGIN START ////////////////////////////////////////////////////////
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

function openOptions() {
	let html = `
		<a class="import" tabindex="0">Merge (import)</a>
		<a class="export" tabindex="0">Export uniques</a>
	`;

	let box = dialog({
		html: html,
		id: 'plugin-data-merger-options',
		dialogClass: 'ui-data-merger-dialog',
		title: 'Merge Options'
	});

	$('.import', box).click(()=>{
		alert('Not implemented yet.');
	});
	$('.export', box).click(()=>{
		alert('Not implemented');
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



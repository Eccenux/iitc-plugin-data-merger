# IITC plugin: Uniques merger (sync)

Allows to merge (sync) data across devices and even accounts. For now handles merging uniques (captures and visits).

Unlike sync plugin it is built to last and is not depended on any external service. You don't have to worry to synchronize your data immediately. Merge can be done at any point and all conflicts will be resolved properly so that you won't miss any of your captures. 

See also: [my other IITC plugins](https://github.com/search?q=user%3AEccenux+iitc-plugin&type=Repositories).

Installation
------------

Note! This is a beta version (still experimental). Might not be ready for use yet.

Assuming you already have IITC just &rarr; **[install the script](https://github.com/Eccenux/iitc-plugin-data-merger/raw/master/data-merger.user.js)**.

Note. When you open the user script URL the installation dialog should be shown by Tampermonkey. If it doesn't show then just try to refresh the page or re-visit the URL again.

Technical notes
---------------

### Conflict resolution ###

Merge for uniques will assume you will never want to un-capture some portal. So if in either source or destination the portal was captured then it will be captured after merge (visited status works the same). In IT terms: merger just does `or` operation when resolving conflicts.

### Extending this plugin ###

Like Sync plugin this plugin can also be extended. You can look at the `uniquesMerger` object and treat it as an example. Note however that this is not the simplest example. Merging process might be more verbose then you need...

#### Defining basic export / import (replace) ####

The simplest version to export and import uniques would be something like this:
```javascript
window.plugin.dataMerger.appendMerger({
	'key' : 'uniques',	// this simply must be uniqe among mergers (so can be plugin name) 
	'exportLabel' : 'Export uniques',	// this is label for export button (and title for export window)

	// imports a string as was returned by the exporter
	'import' : function(dataString) {
		localStorage['plugin-uniques-data'] = dataString; // this replaces data
		window.plugin.uniques.loadLocal('plugin-uniques-data'); // this loads data to internal objects
		location.reload();	// this reloads the page (to e.g. update highlights)
	},

	// returns a string that can be exported
	'export' : function() {
		return localStorage["plugin-uniques-data"];
	},
});
```

This might be fine in for some types of data. User will be warned that he/she should do backup... But users don't do backups ;-). 

#### Exporting objects in your plugin ####

Note that you can export objects if you want. So this should be fine too:
```javascript
	'export' : function() {
		return JSON.parse(localStorage["plugin-uniques-data"]);
	},
```

And then in import you could simply do `var dataString = JSON.stringify(mergerData)`.

You may want operate on objects for two main reasons:

1. Objects look better when you export it. This is because I add new lines when I stringify `mergerData`.
2. It's easier to operate on objects (e.g. validate them).

#### Simple merging of data in a plugin ####

The easiest merge for uniques would probably be by using `$.extend`. Something like this:
```javascript
	'import' : function(mergerData) {
		const current = JSON.parse(localStorage['plugin-uniques-data']);

		// add or replace all data into current
		$.extend(current, mergerData);

		// stringify
		var dataString = JSON.stringify(current)

		localStorage['plugin-uniques-data'] = dataString; // this replaces data
		window.plugin.uniques.loadLocal('plugin-uniques-data'); // this loads data to internal objects
		location.reload();	// this reloads the page (to e.g. update highlights)
	},
	/**
	 * Returns data that can be imported.
	 */
	'export' : function() {
		return JSON.parse(localStorage["plugin-uniques-data"]);
	},
```

Problem is `$.extend` just replaces everything and you might not want to do that. That might have worked for `Sync` because update was quick and you wouldn't loose too much data. When you merge you might want to do some more intelligent conflict resolution.

#### How to resolve conflicts in a plugin ####

So first use `this.removeIdentical` function to remove things you already have. And then use `this.removeByFunction` to resolve conflicts and maybe remove some more data.

```javascript
	'import' : function(mergerData) {
		const current = JSON.parse(localStorage['plugin-uniques-data']);

		// remove data same in both
		this.removeIdentical(mergerData, current);

		// resolve conflicts
		this.removeByFunction(mergerData, current, (newItem, currentItem)=>{
			// replace new item with computed state
			newItem.captured = (newItem.captured || currentItem.captured);
			newItem.visited = (newItem.visited || currentItem.visited);
			if (newItem.captured) {
				newItem.visited = true;
			}

			// check (note that this only works if order of keys is kept the same)
			if (JSON.stringify(newItem) === JSON.stringify(currentItem)) {
				return true; // remove
			}
			return false; // keep
		});

		// add or replace all data into current
		$.extend(current, mergerData);

		// ...
	},
```

You might have noticed that you didn't define `this.removeIdentical`. That function is defined in `Merger` class. Note that `this` context is replaced with `Merger` class context.

The rest is yours to command ;-). You can for example add dates of last change to items and resolve conflicts by using newer version. Note that two devices might have different times setup and that might be problem. You could allow users to decide which version is better, but that might be too complicated...
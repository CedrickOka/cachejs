![CacheJs Logo](./images/logo.png)

# CacheJs
> javascript, cache system, SessionStorage, LocalStorage

Cachejs is a library that will allow you to set up a private and powerful cache system in your javascript application.

[![GitHub version](https://badge.fury.io/gh/CedrickOka%2Fcachejs.svg)](https://badge.fury.io/gh/CedrickOka%2Fcachejs)
[![GitHub issues](https://img.shields.io/github/issues/CedrickOka/cachejs.svg)](https://github.com/CedrickOka/cachejs/issues)
[![GitHub forks](https://img.shields.io/github/forks/CedrickOka/cachejs.svg)](https://github.com/CedrickOka/cachejs/network)
[![GitHub stars](https://img.shields.io/github/stars/CedrickOka/cachejs.svg)](https://github.com/CedrickOka/cachejs/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/CedrickOka/cachejs/master/LICENSE)

## Installing / Getting started

Source can be loaded via bower or downloaded from this [repo](https://github.com/CedrickOka/cachejs).
If you don't use a module loader it will be added to window.Cache

```bash
# bower
$ bower install coka-cachejs
```

If you want to try the sample codes below, just open your browser's console and enter them.

### Browser

```html
<script type="text/javascript" src="cache.js"></script>
<script>
    var cache = new Cache.Memory(25, 300, 'default');

    cache.onWrite(function(key, data){
    	console.log('An entry has been added to the cache with the key "' + key + '" : ');
    	console.log(data);
    });

    cache.onRead(function(key, data){
    	console.log('An entry was read in the cache with the key "' + key + '" : ');
    	console.log(data);
    });

    cache.write('cachejs', {foo: 'foo'});

    if (cache.has('cachejs')) {
    	var data = cache.read('cachejs');
    	console.log(data);
    }
</script>
```

### Require.js

```javascript
require.config({
	paths: {
		cache: 'cache.js',
	}
});

define(['cache'], function (Cache) {
    var cache = new Cache.Memory(25, 300, 'default');

    cache.onWrite(function(key, data){
    	console.log('An entry has been added to the cache with the key "' + key + '" : ');
    	console.log(data);
    });

    cache.onRead(function(key, data){
    	console.log('An entry was read in the cache with the key "' + key + '" : ');
    	console.log(data);
    });

    cache.write('cachejs', {foo: 'foo'});

    if (cache.has('cachejs')) {
    	var data = cache.read('cachejs');
    	console.log(data);
    }
});
```
## Latest updates
For notes about latest changes please read [CHANGELOG](CHANGELOG.md).

## Versioning

For the versions available, see the [tags on this repository](/tags).

## Licensing

This library is under the MIT license. See the complete license [in the library](LICENSE).

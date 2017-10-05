![CacheJs Logo](./images/logo.png)

# CacheJs
> javascript, cache system, SessionStorage, LocalStorage

Cachejs is a library that will allow you to set up a private and powerful cache system in your javascript application.

[![GitHub version](https://badge.fury.io/gh/CedrickOka%2Fcachejs@2x.png)](https://badge.fury.io/gh/CedrickOka%2Fcachejs)

## Installing / Getting started

If you want to try the sample codes below, just open your browser's console and enter them.

Cache.js is available on [github.com](https://github.com/CedrickOka/cachejs).

### Browser

```html
<script type="text/javascript" src="cache.js"></script>
<script>
    var cache = new Cache.Memory(25, 300);

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

define(['cache'], function (cache) {
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

## Versioning

For the versions available, see the [tags on this repository](/tags).

## Licensing

This library is under the MIT license. See the complete license [in the library](LICENSE).
![CacheJs Logo](./images/logo.png)

# CacheJs
> javascript, cache system, SessionStorage, LocalStorage

Cachejs is a library that will allow you to set up a private and powerful cache system in your javascript application.

## Installing / Getting started

If you want to try the sample codes below, just open your browser's console and enter them.
Cache.js is available on [github.com](https://github.com/CedrickOka/cachejs).

### Browser

```html
<script type="text/javascript" src="cache.js"></script>
<script>
    moment().format();
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
    var data = cache.read('cachejs');
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
    var data = cache.read('cachejs');
});
```

## Versioning

For the versions available, see the [tags on this repository](https://github.com/CedrickOka/cachejs/releases).

## Licensing

This library is under the MIT license. See the complete license [in the library](LICENSE).
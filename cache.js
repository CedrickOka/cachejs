//! cache.js
//! version : 1.1.1
//! authors : Cedrick Oka Baidai <okacedrick@gmail.com>
//! license : MIT
//! https://github.com/CedrickOka/cachejs
(function(root, factory){
	'use strict';
	
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.Cache = factory();
    }
})(this, function(){
	'use strict';

	var EVENT_READ = 'cache:read';
	var EVENT_WRITE = 'cache:write';
	var EVENT_WRITE_CREATE = 'cache:write:create';
	var EVENT_WRITE_UPDATE = 'cache:write:update';
	var EVENT_REMOVE = 'cache:remove';
	var EVENT_PURGE = 'cache:purge';
	var EVENT_GARBAGE = 'cache:garbage';
	
	/**
	 * @var number LIFETIME_UNITS in milliseconds
	 */
	var LIFETIME_UNITS = 1000;
	
	/**
	 * Abstract Cache
	 * 
	 * @param number size | Cache size
	 * @param number lifetime | Cache time to live in seconds
	 * @param string namespace | Cache key namespace
	 */
	var Cache = function(size, lifetime, namespace){
		/**
		 * @var number _size
		 */
		var _size = (typeof size === 'number' && size > 1) ? size : 5;
		
		/**
		 * @var number _lifetime secondes
		 */
		var _lifetime = (typeof lifetime === 'number' && lifetime > 0) ? (lifetime * LIFETIME_UNITS) : 0;
		
		/**
		 * @var string _namespace
		 */
		var _namespace = namespace || '';

		var STORE_KEY_PATTERN = '^' + _namespace + '\\.?(.+)$';
		
		/**
		 * @var array Events handler collection
		 */
		var _callbacks = {};
		_callbacks[EVENT_READ] = [];
		_callbacks[EVENT_WRITE] = [];
		_callbacks[EVENT_WRITE_CREATE] = [];
		_callbacks[EVENT_WRITE_UPDATE] = [];
		_callbacks[EVENT_REMOVE] = [];
		_callbacks[EVENT_PURGE] = [];
		_callbacks[EVENT_GARBAGE] = [];
		
		/**
		 * Get cache size
		 * 
		 * @return number
		 */
		this.getSize = function(){
			return _size;
		};
		
		/**
		 * Set cache size
		 * 
		 * @param number size
		 * @return Cache
		 */
		this.setSize = function(size){
			_size = size;
			return this;
		};
		
		/**
		 * Get cache lifetime
		 * 
		 * @return number 
		 */
		this.getLifetime = function(){
			return _lifetime;
		};
		
		/**
		 * Set cache lifetime
		 * 
		 * @param number lifetime in seconds
		 * @return Cache
		 */
		this.setLifetime = function(lifetime){
			_lifetime = lifetime * LIFETIME_UNITS;
			return this;
		};
		
		/**
		 * Convert the life time
		 * 
		 * @param number lifetime in seconds
		 * @return number
		 */
		this.convertLifetime = function(lifetime){
			return (typeof lifetime === 'number') ? (lifetime * LIFETIME_UNITS) : this.getLifetime();
		};

		/**
		 * Get cache keys namespace
		 * 
		 * @return string The keys namespace
		 */
		this.getNamespace = function(){
			return _namespace;
		};

		/**
		 * @return boolean
		 */
		this.isInNamespace = function(storeKey){
			return '' === _namespace ? true : (new RegExp(STORE_KEY_PATTERN)).test(storeKey);
		};

		/**
		 * Get cache store keys namespace
		 * 
		 * @return string The keys namespace
		 */
		this.generateStoreKey = function(key){
			return '' === _namespace ? key : _namespace + '.' + key;
		};

		this.retrieveKeyFromStoreKey = function(storeKey){
			return '' === _namespace ? storeKey : (storeKey.match(new RegExp(STORE_KEY_PATTERN)))[1];
		};

		this.getDefaultsOptions = function(options){
			options || (options = {});

			if (typeof options.silent === 'undefined') {
				options.silent = false;
			}

			return options;
		};
		
		/**
		 * Schedule the garbage of key cache with cache limit time
		 * 
		 * @param string storeKey
		 * @param number lifetime in milliseconds
		 * @return number
		 */
		this.scheduleStorageGarbage = function(key, value, lifetime){
			var self = this;
			var timeoutID = undefined;
			
			if (lifetime > 0) {
				timeoutID = setTimeout(function(){
					self.remove(self.generateStoreKey(key), {silent: true});
					self.trigger(EVENT_GARBAGE, key, value);
				}, lifetime);
			}
			
			return timeoutID;
		};
		
		/**
		 * Cancel the garbage of key cache with
		 * 
		 * @param number timeoutID
		 */
		this.cancelStorageGarbage = function(timeoutID){
			if (typeof timeoutID === 'number') {
				window.clearTimeout(timeoutID);
			}
		};
		
		/**
		 * Trigger an event
		 * 
		 * @param string eventName
		 * @param string key
		 * @param mixed data
		 */
		this.trigger = function(eventName, key, data){
			if (eventName in _callbacks) {
				for (var i = 0; i < _callbacks[eventName].length; i++) {
					(function(callback, context){
						if (typeof callback === 'function') {
							setTimeout(function(callback, context, key, data){
								callback.call(context, key, data);
							}, 0, callback, context, key, data);
						}
					})(_callbacks[eventName][i][0], _callbacks[eventName][i][1]);
				}
			}
		};
		
		/**
		 * Register handler on event
		 * 
		 * @param string eventName
		 * @param Function callback
		 * @param Object context
		 */
		this.on = function(eventName, callback, context){
			if (eventName in _callbacks) {
				_callbacks[eventName].push([callback, context || this]);
			}
			return this;
		};
		
		/**
		 * Unregister handler on event
		 * 
		 * @param string eventName
		 * @param Function callback
		 */
		this.off = function(eventName, callback){
			if (eventName in _callbacks) {
				if (typeof callback === 'undefined') {
					_callbacks[eventName] = [];
				} else {
					for (var i = 0; i < _callbacks[eventName].length; i++) {
						if (_callbacks[eventName][i][0] === callback) {
							_callbacks[eventName].splice(i, 1);
						}
					}
				}
			}
			return this;
		};
		
		/**
		 * Helper for register handler on read event
		 * 
		 * @param Function callback
		 * @param Object context
		 */
		this.onRead = function(callback, context){
			this.on(EVENT_READ, callback, context);
			return this;
		};

		/**
		 * Helper for unregister handler on read event
		 * 
		 * @param Function callback
		 */
		this.offRead = function(callback){
			this.off(EVENT_READ, callback);
			return this;
		};

		/**
		 * Helper for register handler on write event
		 * 
		 * @param Function callback
		 * @param Object context
		 */
		this.onWrite = function(callback, context){
			this.on(EVENT_WRITE, callback, context);
			return this;
		};

		/**
		 * Helper for unregister handler on write event
		 * 
		 * @param Function callback
		 */
		this.offWrite = function(callback){
			this.off(EVENT_WRITE, callback);
			return this;
		};

		/**
		 * Helper for register handler on remove event
		 * 
		 * @param Function callback
		 * @param Object context
		 */
		this.onRemove = function(callback, context){
			this.on(EVENT_REMOVE, callback, context);
			return this;
		};

		/**
		 * Helper for unregister handler on remove event
		 * 
		 * @param Function callback
		 */
		this.offRemove = function(callback){
			this.off(EVENT_REMOVE, callback);
			return this;
		};

		/**
		 * Helper for register handler on garbage event
		 * 
		 * @param Function callback
		 * @param Object context
		 */
		this.onGarbage = function(callback, context){
			this.on(EVENT_GARBAGE, callback, context);
			return this;
		};

		/**
		 * Helper for unregister handler on garbage event
		 * 
		 * @param Function callback
		 */
		this.offGarbage = function(callback){
			this.off(EVENT_GARBAGE, callback);
			return this;
		};
		
		/**
		 * Counts the number of stored items in cache storage unit
		 * 
		 * @return number
		 */
		this.count = function(){
			throw 'This method must be defined.';
		};
		
		/**
		 * Has key in cache storage unit
		 * 
		 * @param string key
		 * @return boolean
		 */
		this.has = function(key){
			throw 'This method must be defined.';
		};
		
		/**
		 * Has value in cache storage unit
		 * 
		 * @param mixed value
		 * @return boolean
		 */
		this.hasValue = function(value){
			throw 'This method must be defined.';
		};

		/**
		 * Read value of key in cache storage unit
		 * 
		 * @param string key
		 * @param mixed defaultValue
		 * @return mixed
		 */
		this.read = function(key, defaultValue, options){
			throw 'This method must be defined.';
		};
		
		/**
		 * Read all data
		 * 
		 * @return Object
		 */
		this.readAll = function(){
			throw 'This method must be defined.';
		};

		/**
		 * Write in cache storage
		 * 
		 * @param string key
		 * @param mixed value
		 * @param number lifetime
		 * @return Cache
		 */
		this.write = function(key, value, lifetime, options){
			throw 'This method must be defined.';
		};
		
		/**
		 * Remove key of cache storage
		 * 
		 * @param string key
		 * @return Cache
		 */
		this.remove = function(key, options){
			throw 'This method must be defined.';
		};
		
		/**
		 * Purge cache storage
		 * 
		 * @return Cache
		 */
		this.purge = function(options){
			throw 'This method must be defined.';
		};
		
		/**
		 * Set lifetime for cache entry
		 * 
		 * @param string key
		 * @param number lifetime in seconds
		 */
		this.setCacheLifetime = function(key, lifetime){
			throw 'This method must be defined.';
		};
	};
		
	/**
	 * Memory Cache
	 * Permit of store data in Array
	 * 
	 * @param number size | Cache size
	 * @param number lifetime | Cache time to live in seconds
	 */
	var MemoryCache = function(size, lifetime){		
		// Constructor
		Cache.call(this, size, lifetime);
		
		/**
		 * @var array _storage
		 */
		var _storage = [];

		this.count = function(){
			return _storage.length;
		};
		
		this.has = function(key){
			for (var i = 0; i < _storage.length; i++) {
				if (key === _storage[i].key) {
					return true;
				}
			}
			return false;
		};
		
		this.hasValue = function(value){			
			for (var i = 0; i < _storage.length; i++) {
				if (_storage[i].value === value) {
					return true;
				}
			}
			return false;
		};
		
		this.read = function(key, defaultValue, options){
			for (var i = 0; i < _storage.length; i++) {
				if (key === _storage[i].key) {
					if (false === this.getDefaultsOptions(options).silent) {
						this.trigger(EVENT_READ, key, _storage[i].value);
					}

					return _storage[i].value;
				}
			}

			return defaultValue;
		};
		
		this.readAll = function(){
			var values = {};

			for (var i = 0; i < _storage.length; i++) {
				values[_storage[i].key] = _storage[i].value;
			}
			
			return values;
		};
		
		this.write = function(key, value, lifetime, options){
			// Update previews cache entry
			for (var i = 0; i < _storage.length; i++) {
				if (key === _storage[i].key) {
					this.cancelStorageGarbage(_storage[i].timeoutID);
					
					_storage[i].value = value;
					_storage[i].lifetime = this.convertLifetime(lifetime);
					_storage[i].timeoutID = this.scheduleStorageGarbage(key, value, _storage[i].lifetime);
					
					if (false === this.getDefaultsOptions(options).silent) {
						this.trigger(EVENT_WRITE, key, value);
						this.trigger(EVENT_WRITE_UPDATE, key, value);
					}
					
					return this;					
				}
			}
			
			// Cache time to live
			lifetime = this.convertLifetime(lifetime);
			
			// pop last cache entry if cache size is exceded
			while (_storage.length >= this.getSize()) {
				_storage.pop();
			}
			
			// store key in cache
			_storage.unshift({
				key: key,
				value: value,
				lifetime: lifetime,
				timeoutID: this.scheduleStorageGarbage(key, value, lifetime)
			});
			
			if (false === this.getDefaultsOptions(options).silent) {
				this.trigger(EVENT_WRITE, key, value);
				this.trigger(EVENT_WRITE_CREATE, key, value);
			}
			
			return this;
		};
		
		this.remove = function(key, options){
			for (var i = 0; i < _storage.length; i++) {
				if (key === _storage[i].key) {
					var value = _storage[i].value;
					_storage.splice(i, 1);
					
					if (false === this.getDefaultsOptions(options).silent) {
						this.trigger(EVENT_REMOVE, key, value);
					}
				}
			}
			
			return this;
		};
		
		this.purge = function(options){
			_storage = [];
			
			if (false === this.getDefaultsOptions(options).silent) {
				this.trigger(EVENT_PURGE);
			}

			return this;
		};
		
		this.setCacheLifetime = function(key, lifetime){
			for (var i = 0; i < _storage.length; i++) {
				if (key === _storage[i].key) {
					this.cancelStorageGarbage(_storage[i].timeoutID);

					_storage[i].lifetime = this.convertLifetime(lifetime);
					_storage[i].timeoutID = this.scheduleStorageGarbage(key, _storage[i].value, _storage[i].lifetime);
					break;
				}
			}
			
			return this;
		};
	};
	
	/**
	 * Storage Cache
	 * 
	 * Permit of store data in SessionStorage
	 * 
	 * @param number size | Cache size
	 * @param number lifetime | Cache time to live in seconds
	 * @param string namespace | Cache namespace
	 * @param Storage _storage | Cache storage
	 */
	var StorageCache = function(size, lifetime, namespace, _storage){
		Cache.call(this, size, lifetime, namespace);

		var __get = function(storeKey) {
			var data = _storage.getItem(storeKey);
			return data !== null ? JSON.parse(data) : null;
		};

		var __set = function(storeKey, value) {
			_storage.setItem(storeKey, JSON.stringify(value));
		};
		
		if (typeof _storage !== 'undefined') {
			(function(self){
				var storeKey, item, 
					currentTime = (new Date()).getTime();
				
				for (var i = 0; i < _storage.length; i++) {
					if (true === self.isInNamespace((storeKey = _storage.key(i)))) {
						item = __get(storeKey);

						if (item.lifetime > 0) {
							if (currentTime >= (item.createdAt + item.lifetime)) {
								_storage.removeItem(storeKey);
							} else {
								item.timeoutID = self.scheduleStorageGarbage(item.originalKey, item.value, (currentTime <= item.createdAt ? item.lifetime : item.lifetime - (currentTime - item.createdAt)));
								__set(storeKey, item);
							}
						}
					}
				}
			})(this);
		}
		
		this.count = function(){
			return _storage.length;
		};
		
		this.has = function(key){
			var storeKey = this.generateStoreKey(key);

			for (var i = 0; i < _storage.length; i++) {
				if (storeKey === _storage.key(i)) {
					return true;
				}
			}
			return false;
		};
		
		this.hasValue = function(value){
			for (var i = 0; i < _storage.length; i++) {
				if (value === __get(_storage.key(i)).value) {
					return true;
				}
			}
			return false;
		};
		
		this.read = function(key, defaultValue, options){
			var item = _storage.getItem(this.generateStoreKey(key));
			
			if (null === item) {
				return defaultValue;
			}

			item = JSON.parse(item);
			
			if (false === this.getDefaultsOptions(options).silent) {
				this.trigger(EVENT_READ, key, item.value);
			}
			
			return item.value;
		};
		
		this.readAll = function(){
			var attributes = {};
			
			for (var i = 0; i < _storage.length; i++) {
				(function(self, storeKey){
					if (true === self.isInNamespace(storeKey)) {
						var item = __get(storeKey);
						attributes[item.originalKey] = item.value;
					}
				})(this, _storage.key(i));
			}
			
			return attributes;
		};
		
		this.write = function(key, value, lifetime, options){
			var storeKey = this.generateStoreKey(key);

			// Update previews cache entry
			for (var i = 0; i < _storage.length; i++) {
				if (storeKey === _storage.key(i)) {
					var item = __get(storeKey);
					this.cancelStorageGarbage(item.timeoutID);
					
					item.value = value;
					item.createdAt = (new Date()).getTime();
					item.lifetime = this.convertLifetime(lifetime);
					item.timeoutID = this.scheduleStorageGarbage(key, value, item.lifetime);

					__set(storeKey, item);
					
					if (false === this.getDefaultsOptions(options).silent) {
						this.trigger(EVENT_WRITE, key, value);
						this.trigger(EVENT_WRITE_UPDATE, key, value);
					}

					return this;
				}
			}
			
			// Cache time to live
			lifetime = this.convertLifetime(lifetime);
			
			// pop last cache entry if cache size is exceded
			while (_storage.length >= this.getSize()) {
				_storage.removeItem(_storage.key(_storage.length - 1));
			}
			
			// store key in cache
			__set(storeKey, {
				value: value,
				originalKey: key,
				lifetime: lifetime,
				createdAt: (new Date()).getTime(),
				timeoutID: this.scheduleStorageGarbage(key, value, lifetime)
			});
			
			if (false === this.getDefaultsOptions(options).silent) {
				this.trigger(EVENT_WRITE, key, value);
				this.trigger(EVENT_WRITE_CREATE, key, value);
			}
			
			return this;
		};
		
		this.remove = function(key, options){
			var value = this.read(key, undefined, {silent: true});
			
			if (undefined !== value) {
				_storage.removeItem(this.generateStoreKey(key));
				
				if (false === this.getDefaultsOptions(options).silent) {
					this.trigger(EVENT_REMOVE, key, value);
				}
			}
			
			return this;
		};
		
		this.purge = function(options){
			_storage.clear();
			
			if (false === this.getDefaultsOptions(options).silent) {
				this.trigger(EVENT_PURGE);
			}
			
			return this;
		};
		
		this.setCacheLifetime = function(key, lifetime){
			var storeKey = this.generateStoreKey(key);

			for (var i = 0; i < _storage.length; i++) {
				if (storeKey === _storage.key(i)) {
					var item = __get(storeKey);
					this.cancelStorageGarbage(item.timeoutID);

					item.createdAt = (new Date()).getTime();
					item.lifetime = this.convertLifetime(lifetime);
					item.timeoutID = this.scheduleStorageGarbage(key, item.value, item.lifetime);

					__set(storeKey, item);
					break;
				}
			}

			return this;
		};
	};
	
	/**
	 * SessionStorage Cache
	 * 
	 * Permit of store data in SessionStorage
	 * 
	 * @param number size | Cache size
	 * @param number lifetime | Cache time to live in seconds
	 * @param string namespace | Cache namespace
	 */
	var SessionStorageCache = function(size, lifetime, namespace){
		StorageCache.call(this, size, lifetime, namespace, window.sessionStorage);
	};
	
	/**
	 * LocalStorage Cache
	 * 
	 * Permit of store data in LocalStorage
	 * 
	 * @param number size | Cache size
	 * @param number lifetime | Cache time to live in seconds
	 * @param string namespace | Cache namespace
	 */
	var LocalStorageCache = function(size, lifetime, namespace){
		StorageCache.call(this, size, lifetime, namespace, window.localStorage);
	};
	
	MemoryCache.prototype = new Cache;
	SessionStorageCache.prototype = new StorageCache;
	LocalStorageCache.prototype = new StorageCache;
	
	return {
		Memory: MemoryCache,
		SessionStorage: SessionStorageCache,
		LocalStorage: LocalStorageCache
	};
});

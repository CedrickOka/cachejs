//! cache.js
//! version : 1.0.0
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
	 */
	var Cache = function(size, lifetime){
		/**
		 * @var number _size
		 */
		var _size = (typeof size == 'number' && size > 1) ? size : 5;
		
		/**
		 * @var number _lifetime secondes
		 */
		var _lifetime = (typeof lifetime == 'number' && lifetime > 0) ? (lifetime * LIFETIME_UNITS) : 0;
		
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
			return (typeof lifetime == 'number') ? (lifetime * LIFETIME_UNITS) : this.getLifetime();
		};
		
		/**
		 * Schedule the garbage of key cache with cache limit time
		 * 
		 * @param string key
		 * @param number lifetime in milliseconds
		 * @return number
		 */
		this.scheduleStorageGarbage = function(key, value, lifetime){
			var self = this;
			var timeoutID = undefined;
			
			if (lifetime > 0) {
				timeoutID = setTimeout(function(){
					self.remove(key);
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
					(function(fn, context){
						if (typeof fn == 'function') {
							setTimeout(function(fn, context, key, data){
								fn.call(context, key, data);
							}, 0, fn, context, key, data);
						}
					})(_callbacks[eventName][i][0], _callbacks[eventName][i][1]);
				}
			}
		};
		
		/**
		 * Register handler on event
		 * 
		 * @param string eventName
		 * @param Function fn
		 * @param Object context
		 */
		this.on = function(eventName, fn, context){
			if (eventName in _callbacks) {
				_callbacks[eventName].push([fn, context]);
			}
			return this;
		};
		
		/**
		 * Unregister handler on event
		 * 
		 * @param string eventName
		 * @param Function fn
		 */
		this.off = function(eventName, fn){
			if (eventName in _callbacks) {
				if (!fn) {
					_callbacks[eventName] = [];
				} else {
					for (var i = 0; i < _callbacks[eventName].length; i++) {
						if (_callbacks[eventName][i][0] === fn) {
							delete _callbacks[eventName][i];
						}
					}
				}
			}
			return this;
		};
		
		/**
		 * Helper for register handler on read event
		 * 
		 * @param Function fn
		 * @param Object context
		 */
		this.onRead = function(fn, context){
			this.on(EVENT_READ, fn, context || this);
			return this;
		};

		/**
		 * Helper for unregister handler on read event
		 * 
		 * @param Function fn
		 */
		this.offRead = function(fn){
			this.off(EVENT_READ, fn);
			return this;
		};

		/**
		 * Helper for register handler on write event
		 * 
		 * @param Function fn
		 * @param Object context
		 */
		this.onWrite = function(fn, context){
			this.on(EVENT_WRITE, fn, context || this);
			return this;
		};

		/**
		 * Helper for unregister handler on write event
		 * 
		 * @param Function fn
		 */
		this.offWrite = function(fn){
			this.off(EVENT_WRITE, fn);
			return this;
		};

		/**
		 * Helper for register handler on remove event
		 * 
		 * @param Function fn
		 * @param Object context
		 */
		this.onRemove = function(fn, context){
			this.on(EVENT_REMOVE, fn, context || this);
			return this;
		};

		/**
		 * Helper for unregister handler on remove event
		 * 
		 * @param Function fn
		 */
		this.offRemove = function(fn){
			this.off(EVENT_REMOVE, fn);
			return this;
		};

		/**
		 * Helper for register handler on garbage event
		 * 
		 * @param Function fn
		 * @param Object context
		 */
		this.onGarbage = function(fn, context){
			this.on(EVENT_GARBAGE, fn, context || this);
			return this;
		};

		/**
		 * Helper for unregister handler on garbage event
		 * 
		 * @param Function fn
		 */
		this.offGarbage = function(fn){
			this.off(EVENT_GARBAGE, fn);
			return this;
		};
		
		/**
		 * Counts the number of stored items in cache storage unit
		 * 
		 * @return number
		 */
		this.count = function(){};
		
		/**
		 * Has key in cache storage unit
		 * 
		 * @param string key
		 * @return boolean
		 */
		this.has = function(key){};
		
		/**
		 * Has value in cache storage unit
		 * 
		 * @param mixed value
		 * @return boolean
		 */
		this.hasValue = function(value){};

		/**
		 * Read value of key in cache storage unit
		 * 
		 * @param string key
		 * @param mixed defaultValue
		 * @return mixed
		 */
		this.read = function(key, defaultValue, options){};
		
		/**
		 * Read all data
		 * 
		 * @return Object
		 */
		this.readAll = function(){};

		/**
		 * Write in cache storage
		 * 
		 * @param string key
		 * @param mixed value
		 * @param number lifetime
		 * @return Cache
		 */
		this.write = function(key, value, lifetime, options){};
		
		/**
		 * Remove key of cache storage
		 * 
		 * @param string key
		 * @return Cache
		 */
		this.remove = function(key, options){};
		
		/**
		 * Purge cache storage
		 * 
		 * @return Cache
		 */
		this.purge = function(options){};
		
		/**
		 * Set lifetime for cache entry
		 * 
		 * @param string key
		 * @param number lifetime in seconds
		 */
		this.setCacheLifetime = function(key, lifetime){};
	};
		
	/**
	 * Memory Cache
	 * 
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
				if (_storage[i].key === key) {
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
			options || (options = {});
			
			for (var i = 0; i < _storage.length; i++) {
				if (_storage[i].key === key) {
					if (typeof options.silent == 'undefined' || options.silent == false) {
						this.trigger(EVENT_READ, key, _storage[i].value);
					}
					
					return _storage[i].value;
				}
			}
			return (typeof defaultValue == 'undefined') ? null : defaultValue;
		};
		
		this.readAll = function(){
			var attributes = {};
			
			for (var i = 0; i < _storage.length; i++) {
				attributes[_storage[i].key] = _storage[i].value;
			}
			
			return attributes;
		};
		
		this.write = function(key, value, lifetime, options){
			options || (options = {});
			
			// Update previews cache entry
			for (var i = 0; i < _storage.length; i++) {
				if (_storage[i].key === key) {
					this.cancelStorageGarbage(_storage[i].timeoutID);
					
					// refresh key in cache
					if (typeof lifetime == 'number') {
						_storage[i].lifetime = this.convertLifetime(lifetime);
					}
					
					_storage[i].value = value;
					_storage[i].timeoutID = this.scheduleStorageGarbage(key, value, _storage[i].lifetime);
					
					if (typeof options.silent == 'undefined' || options.silent == false) {
						// execute register callback
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
			
			if (typeof options.silent == 'undefined' || options.silent == false) {
				// execute register callback
				this.trigger(EVENT_WRITE, key, value);
				this.trigger(EVENT_WRITE_CREATE, key, value);
			}
			
			return this;
		};
		
		this.remove = function(key, options){
			options || (options = {});
			
			for (var i = 0; i < _storage.length; i++) {
				if (_storage[i].key === key) {
					var value = _storage[i].value;
					delete _storage[i];
					
					if (typeof options.silent == 'undefined' || options.silent == false) {
						this.trigger(EVENT_REMOVE, key, value);
					}
				}
			}
			
			return this;
		};
		
		this.purge = function(options){
			_storage = [];
			options || (options = {});
			
			if (typeof options.silent == 'undefined' || options.silent == false) {
				this.trigger(EVENT_PURGE);
			}
			
			return this;
		};
		
		this.setCacheLifetime = function(key, lifetime){
			lifetime = this.convertLifetime(lifetime);
			
			for (var i = 0; i < _storage.length; i++) {
				if (_storage[i].key === key) {
					this.cancelStorageGarbage(_storage[i].timeoutID);
					
					// refresh key in cache
					_storage[i].lifetime = lifetime;
					_storage[i].timeoutID = this.scheduleStorageGarbage(key, _storage[i].value, lifetime);
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
	 */
	var StorageCache = function(size, lifetime, _storage){
		Cache.call(this, size, lifetime);
		
//		/**
//		 * @var Storage _storage
//		 */
//		var _storage = storage;
		
		this.initialize = function(){
			var self = this;
			var currentTime = (new Date()).getTime();
			
			for (var i = 0; i < _storage.length; i++) {
				(function(key){
					var item = JSON.parse(_storage.getItem(key));
					
					if (item.lifetime > 0) {
						if (currentTime >= (item.createdAt + item.lifetime)) {
							_storage.removeItem(key);
							
						} else {
							item.createdAt = currentTime;
							item.timeoutID = self.scheduleStorageGarbage(key, item.value, (item.lifetime - (currentTime - item.createdAt)));
							_storage.setItem(key, JSON.stringify(item));
						}
					}
				})(_storage.key(i));
			}			
		};
		
		// Initialze Cache Context
		if (arguments.length == 3) {
			this.initialize();
		}
		
		this.count = function(){
			return _storage.length;
		};
		
		this.has = function(key){			
			for (var i = 0; i < _storage.length; i++) {
				if ((function(itemKey){
					return key === itemKey;
				})(_storage.key(i))) {
					return true;
				}
			}
			
			return false;
		};
		
		this.hasValue = function(value){
			for (var i = 0; i < _storage.length; i++) {
				if ((function(key){					
					return value === JSON.parse(_storage.getItem(key)).value;
				})(_storage.key(i))) {
					return true;
				}
			}
			
			return false;
		};
		
		this.read = function(key, defaultValue, options){
			options || (options = {});
			var item = _storage.getItem(key);
			
			if (item) {
				item = JSON.parse(item);
				
				if (typeof options.silent == 'undefined' || options.silent == false) {
					this.trigger(EVENT_READ, key, item.value);
				}
				
				return item.value;
			}
			return (typeof defaultValue == 'undefined') ? null : defaultValue;
		};
		
		this.readAll = function(){
			var attributes = {};
			
			for (var i = 0; i < _storage.length; i++) {
				(function(key){
					attributes[key] = JSON.parse(_storage.getItem(key)).value;
				})(_storage.key(i));
			}
			
			return attributes;
		};
		
		this.write = function(key, value, lifetime, options){
			var self = this;
			options || (options = {});
			
			// update previews cache entry
			for (var i = 0; i < _storage.length; i++) {
				if ((function(itemKey){
					if (key === itemKey) {
						var item = JSON.parse(_storage.getItem(key));
						self.cancelStorageGarbage(item.timeoutID);
						
						// refresh key in cache
						if (typeof lifetime == 'number') {
							item.lifetime = self.convertLifetime(lifetime);
						}
						
						item.value = value;
						item.createdAt = (new Date()).getTime();
						item.timeoutID = self.scheduleStorageGarbage(key, value, item.lifetime);
						_storage.setItem(key, JSON.stringify(item));
						
						if (typeof options.silent == 'undefined' || options.silent == false) {
							// execute register callback
							self.trigger(EVENT_WRITE, key, value);
							self.trigger(EVENT_WRITE_UPDATE, key, value);
						}
						
						return true;
					}
					return false;
				})(_storage.key(i)) === true) {
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
			_storage.setItem(key, JSON.stringify({
				value: value,
				lifetime: lifetime,
				createdAt: (new Date()).getTime(),
				timeoutID: self.scheduleStorageGarbage(key, value, lifetime)
			}));
			
			if (typeof options.silent == 'undefined' || options.silent == false) {
				// execute register callback
				this.trigger(EVENT_WRITE, key, value);
				this.trigger(EVENT_WRITE_CREATE, key, value);
			}
			
			return this;
		};
		
		this.remove = function(key, options){
			options || (options = {});
			var value = this.read(key, undefined, true);
			
			if (value) {
				_storage.removeItem(key);
				
				if (typeof options.silent == 'undefined' || options.silent == false) {
					this.trigger(EVENT_REMOVE, key, value);
				}
			}
			
			return this;
		};
		
		this.purge = function(options){
			options || (options = {});
			_storage.clear();
			
			if (typeof options.silent == 'undefined' || options.silent == false) {
				this.trigger(EVENT_PURGE);
			}
			
			return this;
		};
		
		this.setCacheLifetime = function(key, lifetime){
			lifetime = this.convertLifetime(lifetime);
			
			for (var i = 0; i < _storage.length; i++) {
				if ((function(self, itemKey){					
					if (key === itemKey) {
						var item = JSON.parse(_storage.getItem(key));
						self.cancelStorageGarbage(item.timeoutID);
						
						// refresh key in cache
						item.lifetime = lifetime;
						item.createdAt = (new Date()).getTime();
						item.timeoutID = self.scheduleStorageGarbage(key, item.value, lifetime);
						_storage.setItem(key, JSON.stringify(item));
						
						return true;
					}
					return false;
				})(this, _storage.key(i)) === true) {
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
	 */
	var SessionStorageCache = function(size, lifetime){
		StorageCache.call(this, size, lifetime, window.sessionStorage);
	};
	
	/**
	 * LocalStorage Cache
	 * 
	 * Permit of store data in LocalStorage
	 * 
	 * @param number size | Cache size
	 * @param number lifetime | Cache time to live in seconds
	 */
	var LocalStorageCache = function(size, lifetime){
		StorageCache.call(this, size, lifetime, window.localStorage);
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
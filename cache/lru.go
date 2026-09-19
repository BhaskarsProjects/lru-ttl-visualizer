package cache

import (
	"container/list"
	"fmt"
	"log"
	"sync"
	"time"
)

type EvictCallback func(key string, value interface{})

type Config struct {
	withLogs      bool
	evictCallback EvictCallback
}

type Item struct {
	key    string
	value  interface{}
	expiry time.Time
}

type LRU struct {
	keyMap   map[string]*list.Element
	list     *list.List
	capacity int
	config   Config
	sync.RWMutex
}

type CacheItemState struct {
    Key    string
    Value  interface{}
    Expiry time.Time
}

type CacheState struct {
    Capacity int
    Size     int
    Items    []CacheItemState
}

func NewLRU(capacity int, config Config) *LRU {
	if capacity <= 0 {
		return nil
	}

	return &LRU{
		keyMap:   make(map[string]*list.Element),
		list:     list.New(),
		capacity: capacity,
		config:   config,
	}
}

func (l *LRU) Set(key string, value interface{}, ttl time.Duration) bool {
	if ttl <= 0 {
		return false
	}

	expiry := time.Now().Add(ttl)

	l.Lock()

	if elem, ok := l.keyMap[key]; ok {
		item := elem.Value.(*Item)

		item.value = value
		item.expiry = expiry

		l.list.MoveToFront(elem)

		if l.config.withLogs {
			log.Printf("Elem %s updated to the front", key)
			l.printList()
		}

		l.Unlock()

		l.scheduleExpiration(key, ttl)

		return false
	}

	item := &Item{
		key:    key,
		value:  value,
		expiry: expiry,
	}

	elem := l.list.PushFront(item)
	l.keyMap[key] = elem

	var evicted *Item

	if l.list.Len() > l.capacity {
		evicted = l.removeLastElement()
	}

	if l.config.withLogs {
		log.Printf("Elem %s added to the front", key)
		l.printList()
	}

	l.Unlock()

	if evicted != nil {
		l.handleEviction(evicted)
	}

	l.scheduleExpiration(key, ttl)

	return true
}

func (l *LRU) scheduleExpiration(key string, ttl time.Duration) {
	time.AfterFunc(ttl, func() {
		if l.config.withLogs {
			log.Printf("Expiring: %s", key)
		}

		l.Lock()

		elem, ok := l.keyMap[key]
		if !ok {
			l.Unlock()
			return
		}

		item := elem.Value.(*Item)

		if time.Now().Before(item.expiry) {
			l.Unlock()
			return
		}

		removed := l.removeElement(elem)

		l.Unlock()

		if l.config.withLogs {
			log.Printf("Elem expired and was removed: %s", key)
		}

		l.handleEviction(removed)
	})
}

func (l *LRU) Get(key string) (interface{}, bool) {
	l.Lock()

	elem, ok := l.keyMap[key]
	if !ok {
		l.Unlock()
		return nil, false
	}

	item := elem.Value.(*Item)

	if time.Now().After(item.expiry) {
		removed := l.removeElement(elem)

		l.Unlock()

		l.handleEviction(removed)

		return item.value, true
	}

	l.list.MoveToFront(elem)

	value := item.value

	l.Unlock()

	return value, false
}

func (l *LRU) printList() {
	for elem := l.list.Front(); elem != nil; elem = elem.Next() {
		item := elem.Value.(*Item)

		fmt.Printf(
			"key: %s, value: %v\n",
			item.key,
			item.value,
		)
	}
}

func (l *LRU) removeElement(e *list.Element) *Item {
	if e == nil {
		return nil
	}

	item := e.Value.(*Item)

	l.list.Remove(e)
	delete(l.keyMap, item.key)

	return item
}

func (l *LRU) removeLastElement() *Item {
	return l.removeElement(l.list.Back())
}

func (l *LRU) handleEviction(item *Item) {
	if item == nil {
		return
	}

	if l.config.evictCallback != nil {
		l.config.evictCallback(item.key, item.value)
	}
}

func (l *LRU) State() CacheState {
	l.RLock()
	defer l.RUnlock()

	state := CacheState{
		Capacity: l.capacity,
		Size:     l.list.Len(),
		Items:    make([]CacheItemState, 0, l.list.Len()),
	}

	for elem := l.list.Front(); elem != nil; elem = elem.Next() {
		item := elem.Value.(*Item)

		state.Items = append(state.Items, CacheItemState{
			Key:    item.key,
			Value:  item.value,
			Expiry: item.expiry,
		})
	}

	return state
}

func (l *LRU) Delete(key string) bool {
	l.Lock()

	elem, ok := l.keyMap[key]

	if !ok {
		l.Unlock()
		return false
	}

	removed := l.removeElement(elem)

	l.Unlock()

	l.handleEviction(removed)

	return true
}

func (l *LRU) Clear() {
	l.Lock()

	items := make([]*Item, 0, l.list.Len())

	for elem := l.list.Front(); elem != nil; elem = elem.Next() {
		item := elem.Value.(*Item)
		items = append(items, item)
	}

	l.keyMap = make(map[string]*list.Element)
	l.list.Init()

	l.Unlock()

	for _, item := range items {
		l.handleEviction(item)
	}
}
package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/bhaskarvb28/lru-ttl-visualizer/cache"
)

type API struct {
	cache *cache.LRU
}

func NewAPI(c *cache.LRU) *API {
	return &API{
		cache: c,
	}
}

type SetRequest struct {
	Key   string        `json:"key"`
	Value interface{}   `json:"value"`
	TTL   time.Duration `json:"ttl"`
}

type GetRequest struct {
	Key string `json:"key"`
}

type DeleteRequest struct {
	Key string `json:"key"`
}

func (a *API) Set(w http.ResponseWriter, r *http.Request) {
	var req SetRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}

	if req.TTL <= 0 {
		http.Error(w, "ttl must be greater than zero", http.StatusBadRequest)
		return
	}

	created := a.cache.Set(
		req.Key,
		req.Value,
		req.TTL,
	)

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"created": created,
		"updated": !created,
	})
}

func (a *API) Get(w http.ResponseWriter, r *http.Request) {
	var req GetRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}

	value, expired := a.cache.Get(req.Key)

	w.Header().Set("Content-Type", "application/json")

	// No value and not expired means the key wasn't found.
	if value == nil && !expired {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"found": false,
		})
		return
	}

	// The key existed but its TTL had expired.
	if expired {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"found":   false,
			"expired": true,
			"value":   value,
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"found":   true,
		"expired": false,
		"value":   value,
	})
}

func (a *API) Delete(w http.ResponseWriter, r *http.Request) {
	var req DeleteRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}

	deleted := a.cache.Delete(req.Key)

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"deleted": deleted,
	})
}

func (a *API) Clear(w http.ResponseWriter, r *http.Request) {
	a.cache.Clear()

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"cleared": true,
	})
}

func (a *API) State(w http.ResponseWriter, r *http.Request) {
	state := a.cache.State()

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(state)
}
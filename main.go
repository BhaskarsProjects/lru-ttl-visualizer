package main

import (
	"net/http"

	"github.com/bhaskarvb28/lru-ttl-visualizer/api"
	"github.com/bhaskarvb28/lru-ttl-visualizer/cache"
)

func ServeIndexHTML(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./web/index.html")
}

func main() {
	config := cache.Config{}

	lru := cache.NewLRU(10, config)

	http.HandleFunc("/", ServeIndexHTML)

	http.Handle(
		"/assets/",
		http.FileServer(http.Dir("./web")),
	)

	api := api.NewAPI(lru)

	http.HandleFunc("/api/cache/set", api.Set)
	http.HandleFunc("/api/cache/get", api.Get)
	http.HandleFunc("/api/cache/delete", api.Delete)
	http.HandleFunc("/api/cache/clear", api.Clear)
	http.HandleFunc("/api/cache/state", api.State)

	http.ListenAndServe(":8080", nil)
}
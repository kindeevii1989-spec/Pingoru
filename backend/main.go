package main

import (
	"crypto/rand"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/ping", withCORS(handlePing))
	mux.HandleFunc("/download", withCORS(handleDownload))
	mux.HandleFunc("/upload", withCORS(handleUpload))

	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Println("Pingoru backend started on :8080")
	log.Fatal(server.ListenAndServe())
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" || strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
			if origin == "" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Cache-Control")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func handlePing(w http.ResponseWriter, r *http.Request) {
	noCache(w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{
		"ok": true,
	})
}

func handleDownload(w http.ResponseWriter, r *http.Request) {
	noCache(w)
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Transfer-Encoding", "chunked")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	buf := make([]byte, 64*1024)

	for {
		select {
		case <-r.Context().Done():
			return
		default:
			_, err := rand.Read(buf)
			if err != nil {
				http.Error(w, "failed to generate data", http.StatusInternalServerError)
				return
			}

			_, err = w.Write(buf)
			if err != nil {
				return
			}

			flusher.Flush()
		}
	}
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	noCache(w)

	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	n, err := io.Copy(io.Discard, r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"receivedBytes": strconv.FormatInt(n, 10),
	})
}

func noCache(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
}

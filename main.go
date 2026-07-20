package main

import (
	"bytes"
	"embed"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

//go:embed all:out
var embeddedFiles embed.FS

// Custom SPA HTTP handler for Next.js static export
type spaHandler struct {
	fileSystem http.FileSystem
	isDev      bool
	devDir     string
}

// Next.js rewrites configuration from next.config.js
var rewrites = map[string]string{
	"/other-requests":            "/my-requests/other.html",
	"/other-requests-management": "/other-requests-management/requests.html",
	"/request-types":             "/other-requests-management/types.html",
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	urlPath := filepath.Clean(r.URL.Path)

	// Apply Next.js rewrites if configured
	if dest, ok := rewrites[urlPath]; ok {
		urlPath = dest
	}

	// 1. Check if exact path exists
	if h.fileExists(urlPath) {
		h.serveFile(w, r, urlPath)
		return
	}

	// 2. Check path + .html (Next.js static page export)
	if !strings.HasSuffix(urlPath, ".html") && h.fileExists(urlPath+".html") {
		h.serveFile(w, r, urlPath+".html")
		return
	}

	// 3. Check path / index.html
	indexPath := filepath.Join(urlPath, "index.html")
	if h.fileExists(indexPath) {
		h.serveFile(w, r, indexPath)
		return
	}

	// 4. Check dynamic route template fallbacks for static export
	if strings.HasPrefix(urlPath, "/employees/") && h.fileExists("/employees/1.html") {
		h.serveFile(w, r, "/employees/1.html")
		return
	}
	if strings.HasPrefix(urlPath, "/candidates/") && h.fileExists("/candidates/1.html") {
		h.serveFile(w, r, "/candidates/1.html")
		return
	}
	if strings.HasPrefix(urlPath, "/job-management/") && strings.HasSuffix(urlPath, "/history") && h.fileExists("/job-management/1/history.html") {
		h.serveFile(w, r, "/job-management/1/history.html")
		return
	}

	// 5. Fallback to root index.html for SPA client-side routing
	if h.fileExists("/index.html") {
		h.serveFile(w, r, "/index.html")
		return
	}

	// 5. Fallback 404
	if h.fileExists("/404.html") {
		w.WriteHeader(http.StatusNotFound)
		h.serveFile(w, r, "/404.html")
		return
	}

	http.NotFound(w, r)
}

func (h *spaHandler) fileExists(path string) bool {
	cleanPath := strings.TrimPrefix(path, "/")
	if cleanPath == "" {
		cleanPath = "."
	}

	if h.isDev {
		fullPath := filepath.Join(h.devDir, cleanPath)
		info, err := os.Stat(fullPath)
		return err == nil && !info.IsDir()
	}

	f, err := h.fileSystem.Open(cleanPath)
	if err != nil {
		return false
	}
	defer f.Close()

	info, err := f.Stat()
	return err == nil && !info.IsDir()
}

func (h *spaHandler) serveFile(w http.ResponseWriter, r *http.Request, path string) {
	cleanPath := strings.TrimPrefix(path, "/")

	ext := filepath.Ext(cleanPath)
	if mimeType := mime.TypeByExtension(ext); mimeType != "" {
		w.Header().Set("Content-Type", mimeType)
	}

	if h.isDev {
		fullPath := filepath.Join(h.devDir, cleanPath)
		http.ServeFile(w, r, fullPath)
		return
	}

	f, err := h.fileSystem.Open(cleanPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Set caching strategies
	if strings.HasPrefix(cleanPath, "_next/static/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else if ext == ".html" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	if rs, ok := f.(io.ReadSeeker); ok {
		http.ServeContent(w, r, stat.Name(), stat.ModTime(), rs)
	} else {
		content, err := io.ReadAll(f)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		http.ServeContent(w, r, stat.Name(), stat.ModTime(), bytes.NewReader(content))
	}
}

func main() {
	defaultPort := os.Getenv("PORT")
	if defaultPort == "" {
		defaultPort = "8080"
	}

	devFlag := flag.Bool("dev", false, "Run in development mode using local ./out directory")
	portFlag := flag.String("port", defaultPort, "Port to run the HTTP server on")
	flag.Parse()

	var fileSys http.FileSystem
	isDev := *devFlag

	if !isDev {
		subFS, err := fs.Sub(embeddedFiles, "out")
		if err != nil {
			log.Fatalf("Failed to initialize embedded filesystem: %v", err)
		}
		fileSys = http.FS(subFS)
		log.Println("Serving embedded production frontend assets")
	} else {
		fileSys = http.Dir("./out")
		log.Println("Serving local ./out frontend assets in DEV mode")
	}

	handler := &spaHandler{
		fileSystem: fileSys,
		isDev:      isDev,
		devDir:     "./out",
	}

	http.Handle("/", handler)

	addr := fmt.Sprintf(":%s", *portFlag)
	log.Printf("Kartezya HR FE Server started on http://localhost%s (Dev mode: %v)", addr, isDev)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

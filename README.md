# Kartezya HR Frontend (Go Web Server)

Bu proje Next.js (App Router) ile geliştirilmiş ve Go (Golang) web sunucusu ile tek bir executable binary veya Docker container olarak sunulabilen frontend uygulamasıdır.

---

## 1. Lokalde Geliştirme (Local Development)

### A. Next.js Dev Server (Frontend Dev Modu)
Hot-Module Reloading (HMR) avantajı ile geliştirmek için standart Next.js dev sunucusunu kullanabilirsiniz:

```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

### B. Go Server ile Lokal Test
Go sunucusunun yerel çıktıları nasıl servis ettiğini test etmek için:

```bash
# 1. Statik export çıktısını ve Go sunucusunu derle:
npm run build:go

# 2. Go sunucusunu 3000 portunda çalıştır:
npm run start:go
# veya doğrudan:
./server -port 3000
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 2. Docker ile Çalıştırma (Production / Server)

### A. Docker Container (Port 3000 Mapping)

```bash
# 1. Docker imajını derle:
npm run docker:build

# 2. Container'ı 3000 portunda başlat:
npm run docker:run
# veya doğrudan:
docker run -p 3000:8080 --name kartezya-fe --rm kartezya-hr-fe:latest
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

# API Crawl TruyenQQ

## Crawl thông tin truyện mới (POST)

```bash
curl -X POST http://localhost:3000/api/truyenqq/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "mangaUrl": "https://truyenqqto.com/truyen-tranh/ten-truyen-12345"
  }'
```

Response thành công:
```json
{
  "message": "Crawl dữ liệu thành công",
  "data": {
    // Thông tin truyện đã lưu
  }
}
```

## Crawl chapter mới (PUT)

```bash
curl -X PUT http://localhost:3000/api/truyenqq/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "mangaId": "manga_id_123",
    "chapterUrl": "https://truyenqqto.com/truyen-tranh/ten-truyen-12345/chap-1"
  }'
```

Response thành công:
```json
{
  "message": "Cập nhật chapter thành công",
  "data": {
    // Thông tin chapter đã lưu
  }
}
```

## Lỗi thường gặp

### 1. URL trống
```json
{
  "error": "URL truyện không được để trống"
}
```

### 2. Thiếu thông tin chapter
```json
{
  "error": "ID truyện và URL chapter không được để trống"
}
```

### 3. Lỗi hệ thống
```json
{
  "error": "Đã có lỗi xảy ra khi crawl dữ liệu"
}
```
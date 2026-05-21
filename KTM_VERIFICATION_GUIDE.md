# 🎯 Panduan KTM Verification Integration - Backend Ready

Tanggal: May 21, 2026  
Status: ✅ **READY FOR TESTING**

---

## 📋 Summary Perbaikan yang Dilakukan

### 1. **Install Dependencies** ✅
- Tambahkan `tesseract.js` ke backend `package.json` 
- Tambahkan `sharp` untuk image processing
- Semua dependencies sudah ter-install

### 2. **Fix OCR Implementation** ✅
- **Sebelum**: OCR error "Internal OCR processing error" karena Tesseract tidak properly initialized
- **Sesudah**: 
  - Update Tesseract API ke versi terbaru (v7.0.0)
  - Proper error handling dengan try-catch
  - Worker cleanup yang benar
  - Logging untuk debugging

### 3. **Validasi yang Ditambahkan** ✅
- File size validation (max 10MB)
- Image format checking
- Confidence threshold configuration
- NIM extraction dengan regex pattern

### 4. **Testing** ✅
- Created `test-ocr.mjs` script untuk memverifikasi OCR setup
- Output: ✅ Tesseract.js properly configured

---

## 🔄 How It Works Now

### Flow Backend KTM Verification:

```
1. User Upload KTM Image
   ↓
2. Backend menerima file via POST /api/membership/affiliate/verify
   ↓
3. Validasi file (size, format)
   ↓
4. Save file ke /apps/backend/uploads
   ↓
5. Run Tesseract OCR Recognition
   ↓
6. Extract Text & Calculate Confidence
   ↓
7. Match detected NIM dengan registered NIM
   ↓
8. Auto-approve atau masuk queue review
   ↓
9. Return verification result & status
```

### Input yang Dibutuhkan:

```json
{
  "user_id": "USR-xxx-yyy",
  "user_id": "registered_NIM dari user profile",
  "file": "KTM image (JPG/PNG)"
}
```

### Response Verification:

```json
{
  "success": true,
  "message": "Akun berhasil diverifikasi sebagai affiliate.",
  "data": {
    "verification_id": "VERIFICATION-xxx",
    "user": {
      "user_id": "USR-xxx",
      "username": "username",
      "is_ktm": true,
      "role": "MEMBER_AFFILIATE",
      "status": "ACTIVE"
    },
    "verification": {
      "registered_nim": "12345678",
      "detected_nim": "12345678",
      "ai_is_telkom": true,
      "ai_confidence": 0.95,
      "status": "APPROVED"
    },
    "ocr": {
      "detectedNim": "12345678",
      "registeredNim": "12345678",
      "containsTelkom": true,
      "avgConfidence": 0.95,
      "autoApproved": true
    }
  }
}
```

---

## 🎮 Testing Setup

### Test Backend OCR:
```bash
cd apps/backend
npm run dev
```

### Test OCR Configuration:
```bash
cd apps/backend
node scripts/test-ocr.mjs
```

Expected output:
```
✅ Tesseract.js is properly configured!
✓ Tesseract.js worker: Ready
✓ English language: Ready
✓ Image processing: Ready
✓ Backend: Ready for KTM verification
```

---

## 🚀 Untuk Tim Membership

### Endpoint yang Ready:

#### 1. Register dengan KTM (User Side)
```
POST /api/membership/register
Body: {
  "username": "user123",
  "email": "user@telkom.ac.id",
  "password": "xxx",
  "phone_number": "08xxx",
  "nim": "12345678",
  "profile_picture": "url_atau_base64",
  "ktm_picture": "url_atau_base64"
}
```

#### 2. Verify Affiliate dengan OCR (Affiliate Verification)
```
POST /api/membership/affiliate/verify
Content-Type: multipart/form-data
Body:
  - user_id: "USR-xxx-yyy"
  - ktm_image: [FILE]
```

#### 3. Get All Verifications (Admin)
```
GET /api/membership/admin/affiliate-verifications
```

#### 4. Review Verification (Admin)
```
PATCH /api/membership/admin/affiliate-verifications/:verification_id/status
Body: {
  "status": "APPROVED",
  "review_notes": "KTM terverifikasi sebagai Telkom University"
}
```

---

## 🔧 Configuration (.env)

```env
# OCR Configuration
AFFILIATE_OCR_CONFIDENCE_THRESHOLD=0.9
AUTO_APPROVE_CONFIDENCE=0.9

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=ngolab_user
DB_PASSWORD=xxx
DB_NAME=ngolab_db
```

---

## ✅ Checklist untuk Tim

- [ ] Test backend OCR dengan `node scripts/test-ocr.mjs`
- [ ] Setup frontend UI untuk KTM upload (user app)
- [ ] Test end-to-end: Register → Upload KTM → Verify
- [ ] Setup admin dashboard untuk review verifications
- [ ] Configure OCR confidence threshold sesuai kebutuhan
- [ ] Test dengan berbagai format KTM (JPEG, PNG)
- [ ] Monitor logs untuk debugging jika ada error
- [ ] Setup database verifications tracking

---

## 📊 OCR Confidence Threshold

| Threshold | Behavior | Recommendation |
|-----------|----------|-----------------|
| 0.8 | Lebih lenient, faster approval | Testing/Development |
| 0.85 | Balanced | Production standard |
| 0.9 | Strict, better accuracy | High security |
| 0.95+ | Very strict | Minimal false positives |

Set di environment variable: `AFFILIATE_OCR_CONFIDENCE_THRESHOLD`

---

## 🐛 Debugging

### Cek Logs:
```bash
# Terminal 1 - Backend
cd apps/backend && npm run dev

# Terminal 2 - Check logs
tail -f apps/backend/uploads/*.log
```

### Common Issues & Solutions:

| Issue | Cause | Solution |
|-------|-------|----------|
| "Worker not ready" | Tesseract loading | Tunggu load selesai (5-10s) |
| "NIM not detected" | Image quality rendah | Use clearer KTM photo |
| "File too large" | Image > 10MB | Compress image atau resize |
| "Not Telkom" | Text OCR salah | Pastikan "Telkom" visible di KTM |

---

## 📝 Notes

- OCR processing membutuhkan 5-30 detik tergantung image quality
- Tesseract.js akan auto-cache trained data setelah first use
- Frontend harus support image compression sebelum upload
- Database verifications bisa di-review kemudian jika auto-approve fail

---

## 📞 Support

Jika ada issue:
1. Check logs di backend console
2. Verify image quality & format
3. Ensure NIM di user profile sudah diisi
4. Test dengan `node scripts/test-ocr.mjs`
5. Check database `affiliate_verifications` table

---

**Status**: ✅ Ready for Integration Testing  
**Last Updated**: May 21, 2026

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function uploadVoucherImage(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'File gambar tidak ditemukan.' });
    }

    const uploadsDir = path.join(process.cwd(), 'apps', 'backend', 'uploads', 'vouchers');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `vch-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, req.file.buffer);

    res.json({ success: true, imageUrl: `/uploads/vouchers/${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

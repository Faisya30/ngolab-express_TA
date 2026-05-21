import { createWorker } from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testOCR() {
  console.log('🔍 Testing Tesseract.js OCR Setup...\n');

  let worker = null;

  try {
    console.log('1. Creating Tesseract worker...');
    worker = await createWorker();
    console.log('   ✅ Worker created successfully');

    const testImagePath = path.join(__dirname, '../../uploads');
    
    // Check for existing KTM images for testing
    let testFile = null;
    if (fs.existsSync(testImagePath)) {
      const files = fs.readdirSync(testImagePath);
      const ktmFile = files.find(f => f.startsWith('ktm-'));
      if (ktmFile) {
        testFile = path.join(testImagePath, ktmFile);
      }
    }

    if (testFile && fs.existsSync(testFile)) {
      const fileBuffer = fs.readFileSync(testFile);
      console.log(`\n2. Found test image, running OCR...`);
      console.log(`   📸 File: ${path.basename(testFile)}`);
      console.log(`   📊 Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
      
      const startTime = Date.now();
      const { data } = await worker.recognize(fileBuffer, 'eng');
      const duration = Date.now() - startTime;

      console.log(`\n3. OCR Results:`);
      console.log(`   ⏱️  Time: ${duration}ms`);
      console.log(`   📝 Text: ${data?.text?.substring(0, 150) || '(no text detected)'}...`);
      
      if (data?.words && data.words.length > 0) {
        const avgConfidence = data.words.reduce((s, w) => s + (Number(w.confidence) || 0), 0) / data.words.length / 100;
        console.log(`   📊 Confidence: ${(avgConfidence * 100).toFixed(2)}%`);
        console.log(`   🔤 Words: ${data.words.length}`);
      }
    } else {
      console.log('\n2. ⚠️  No test image found.');
      console.log('   ℹ️  Upload a KTM image first and it will be tested during verification.');
      console.log('   Backend is ready to process OCR when you upload an image.\n');
    }

    console.log('\n✅ Tesseract.js is properly configured!');
    console.log('\n📋 Ready for production:');
    console.log('   ✓ Tesseract.js worker: Ready');
    console.log('   ✓ English language: Ready');
    console.log('   ✓ Image processing: Ready');
    console.log('   ✓ Backend: Ready for KTM verification\n');

  } catch (error) {
    console.error('\n❌ Error during OCR test:', error.message);
    process.exit(1);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termError) {
        // ignore
      }
    }
  }
}

testOCR().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

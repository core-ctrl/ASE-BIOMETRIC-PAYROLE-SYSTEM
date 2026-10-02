const fs = require('fs');
const path = require('path');
const https = require('https');

const models = [
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_recognition_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json'
];

const destDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

models.forEach((model) => {
  const fileUrl = `https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/${model}`;
  const destPath = path.join(destDir, model);

  https.get(fileUrl, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${model}: HTTP ${res.statusCode}`);
      return;
    }
    const fileStream = fs.createWriteStream(destPath);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded: ${model}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${model}: ${err.message}`);
  });
});

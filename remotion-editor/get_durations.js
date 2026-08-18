const { execSync } = require('child_process');

['scene1', 'scene2', 'scene3', 'scene4'].forEach(scene => {
  try {
    const webmStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/${scene}.webm`).toString().trim();
    const mp3Str = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/${scene}.mp3`).toString().trim();
    console.log(`${scene}: webm = ${webmStr}s, mp3 = ${mp3Str}s`);
  } catch (e) {
    console.log(`${scene}: error reading duration`);
  }
});

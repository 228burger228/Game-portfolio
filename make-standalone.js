import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const assetsDir = path.join(distDir, 'assets');

const htmlFile = path.join(distDir, 'index.html');
let html = fs.readFileSync(htmlFile, 'utf-8');

const files = fs.readdirSync(assetsDir);
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');

// Replace external stylesheet and module script with inline tags so file:// works by double-click!
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]+\.css"[^>]*>/, () => `<style>\n${cssContent}\n</style>`);
html = html.replace(/<script type="module"[^>]*src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/, () => `<script type="module">\n${jsContent}\n</script>`);
html = html.replace(/\.\/assets\/mefoto-[^"]+\.jpg/g, './assets/mefoto.jpg');

// 1. Save in dist/ЗАПУСТИТЬ_ИГРУ.html AND dist/index.html (so Netlify always has CSS & JS inline!)
fs.writeFileSync(path.join(distDir, 'ЗАПУСТИТЬ_ИГРУ.html'), html, 'utf-8');
fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');

// 2. Also save in project root (copying assets to root ./assets so relative ./assets/ works from root too)
fs.cpSync(path.resolve('public/assets'), path.resolve('assets'), { recursive: true, force: true });
fs.writeFileSync(path.resolve('ЗАПУСТИТЬ_ИГРУ.html'), html, 'utf-8');

console.log('Standalone ЗАПУСТИТЬ_ИГРУ.html and dist/index.html created successfully!');
